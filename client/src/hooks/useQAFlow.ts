'use client';

import { useState, useCallback, useRef } from 'react';
import { StoredFileMeta } from '@/types';
import {
  QAMode,
  QAChatMessage,
  LeftPanelScreen,
  LeftScreenType,
  AgentStep,
  CompareRow,
  GlossaryEntry,
} from '@/types/qa';

let _counter = 0;
const uid = () => `msg-${++_counter}-${Date.now()}`;
const screenUid = () => `scr-${++_counter}-${Date.now()}`;

// Which screen type belongs to each non-default mode
const MODE_SCREEN_TYPE: Partial<Record<QAMode, LeftScreenType>> = {
  resume: 'agent-steps',
  compare: 'compare-table',
  glossary: 'glossary',
};

function findModeScreenIdx(screens: LeftPanelScreen[], mode: QAMode): number {
  const type = MODE_SCREEN_TYPE[mode];
  if (!type) return -1;
  return screens.findIndex((s) => s.type === type);
}

// Build screen patch from analysis result
function buildScreenPatch(
  mode: QAMode,
  analysis: {
    agentSteps?: AgentStep[];
    compareRows?: CompareRow[];
    glossaryEntries?: GlossaryEntry[];
  },
  files: StoredFileMeta[],
): Partial<LeftPanelScreen> {
  if (mode === 'resume' && analysis.agentSteps) {
    return {
      type: 'agent-steps',
      label: 'Resume analysis',
      agentSteps: analysis.agentSteps,
    };
  }
  if (mode === 'compare' && analysis.compareRows) {
    return {
      type: 'compare-table',
      label: 'Comparison',
      compareFiles: files.map((f) => f.name),
      compareRows: analysis.compareRows,
    };
  }
  if (mode === 'glossary' && analysis.glossaryEntries) {
    return {
      type: 'glossary',
      label: 'Glossary',
      glossaryEntries: analysis.glossaryEntries,
    };
  }
  return {};
}

// API helpers

async function fetchChat(
  mode: QAMode,
  files: StoredFileMeta[],
  messages: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (text: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode,
      files: files.map((f) => ({
        name: f.name,
        dataUrl: f.dataUrl,
        type: f.type,
      })),
      messages,
    }),
    signal,
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (!res.body) throw new Error('No response body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onChunk(chunk);
  }

  return full;
}

async function fetchAnalyze(
  mode: QAMode,
  files: StoredFileMeta[],
): Promise<{
  agentSteps?: AgentStep[];
  compareRows?: CompareRow[];
  glossaryEntries?: GlossaryEntry[];
  mismatch?: boolean;
  suggestions?: QAMode[];
}> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode,
      files: files.map((f) => ({
        name: f.name,
        dataUrl: f.dataUrl,
        type: f.type,
      })),
    }),
  });
  if (!res.ok) throw new Error(`Analyze error ${res.status}`);
  return res.json();
}

// Streaming helper

function stripQuizToken(text: string) {
  return text.replace('[QUIZ_CTA]', '').trim();
}

// Hook

export function useQAFlow(allFiles: StoredFileMeta[], initialMode: QAMode) {
  const [mode, setModeState] = useState<QAMode>(initialMode);
  const [selectedFiles, setSelectedFiles] =
    useState<StoredFileMeta[]>(allFiles);
  const [messages, setMessages] = useState<QAChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);

  // Max 4 screens: [0] = landing, [1-3] = one per non-default mode
  const [leftScreens, setLeftScreens] = useState<LeftPanelScreen[]>([
    { id: screenUid(), type: 'info', mode: initialMode, label: 'Overview' },
  ]);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  // Message helpers

  const addMessage = useCallback(
    (msg: Omit<QAChatMessage, 'id' | 'timestamp'>) => {
      const full: QAChatMessage = { ...msg, id: uid(), timestamp: Date.now() };
      setMessages((prev) => [...prev, full]);
      return full.id;
    },
    [],
  );

  const streamIntoMessage = useCallback(
    async (
      msgId: string,
      mode: QAMode,
      files: StoredFileMeta[],
      history: { role: 'user' | 'assistant'; content: string }[],
    ) => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setIsStreaming(true);
      let fullText = '';
      try {
        await fetchChat(
          mode,
          files,
          history,
          (chunk) => {
            fullText += chunk;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === msgId
                  ? {
                      ...m,
                      content: stripQuizToken(fullText),
                      isLoading: false,
                    }
                  : m,
              ),
            );
          },
          ctrl.signal,
        );

        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  content: stripQuizToken(fullText),
                  isLoading: false,
                  showQuizCta: fullText.includes('[QUIZ_CTA]'),
                }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [],
  );

  // Greeting after mode/file change

  const greetForMode = useCallback(
    async (
      targetMode: QAMode,
      files: StoredFileMeta[],
      historySnapshot: QAChatMessage[],
      greetingPrompt: string,
    ) => {
      const greetId = uid();
      setMessages((prev) => [
        ...prev,
        {
          id: greetId,
          role: 'assistant',
          content: '',
          isLoading: true,
          timestamp: Date.now(),
        },
      ]);

      const history = historySnapshot
        .filter((m) => !m.isLoading)
        .map((m) => ({
          role: m.role,
          content: m.modeChange
            ? `Mode: ${m.modeChange}`
            : m.fileChange
              ? `Selected files: ${m.fileChange.join(', ')}`
              : m.content,
        }));
      history.push({ role: 'user', content: greetingPrompt });

      await streamIntoMessage(greetId, targetMode, files, history);
    },
    [streamIntoMessage],
  );

  // Mode change

  const changeMode = useCallback(
    async (newMode: QAMode) => {
      if (isAnalysing || isStreaming) return;
      setModeState(newMode);

      // Snapshot messages BEFORE adding the mode-change chip
      const historySnapshot = messages;
      addMessage({ role: 'user', content: '', modeChange: newMode });

      // Compare mode: exactly 2 files required
      if (newMode === 'compare' && selectedFiles.length !== 2) {
        const count = selectedFiles.length;
        const msg =
          count < 2
            ? `Compare Mode requires exactly **2 documents**, but you only have **${count}** selected. Please add another document and try again.`
            : `Compare Mode requires exactly **2 documents**, but you have **${count}** selected. Please deselect some files using the file selector above, then try again.`;
        addMessage({ role: 'assistant', content: msg });
        return;
      }

      // Default mode: just navigate to landing screen + greet
      if (newMode === 'default') {
        setCurrentScreenIndex(0);
        await greetForMode(
          newMode,
          selectedFiles,
          historySnapshot,
          "I've switched back to Default Q&A. What would you like to know?",
        );
        return;
      }

      // Non-default: find or create the screen for this mode
      const existingIdx = findModeScreenIdx(leftScreens, newMode);
      if (existingIdx !== -1) {
        setCurrentScreenIndex(existingIdx);
      }

      setIsAnalysing(true);
      try {
        const analysis = await fetchAnalyze(newMode, selectedFiles);

        if (analysis.mismatch) {
          // Error path: no screen created/changed
          if (existingIdx === -1) setCurrentScreenIndex(0);
          const otherModes = (
            ['default', 'resume', 'compare', 'glossary'] as QAMode[]
          ).filter((m) => m !== newMode);
          addMessage({
            role: 'assistant',
            content: `The documents you uploaded don't seem to fit **${newMode} mode**. Perhaps try one of the other modes?`,
            modeSuggestions: analysis.suggestions ?? otherModes,
          });
          return;
        }

        const patch = buildScreenPatch(newMode, analysis, selectedFiles);

        if (existingIdx !== -1) {
          // Update existing screen in-place
          setLeftScreens((prev) =>
            prev.map((s, i) =>
              i === existingIdx ? { ...s, mode: newMode, ...patch } : s,
            ),
          );
        } else {
          // Create new screen — max 4 total
          const newScreen: LeftPanelScreen = {
            id: screenUid(),
            type: 'info',
            mode: newMode,
            label: 'New',
            ...patch,
          };
          setLeftScreens((prev) => {
            const next = [...prev, newScreen];
            setCurrentScreenIndex(next.length - 1);
            return next;
          });
        }

        await greetForMode(
          newMode,
          selectedFiles,
          historySnapshot,
          `I've switched to ${newMode} mode. Please greet me appropriately.`,
        );
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          if (existingIdx === -1) setCurrentScreenIndex(0);
          addMessage({
            role: 'assistant',
            content: 'Something went wrong switching modes. Please try again.',
          });
        }
      } finally {
        setIsAnalysing(false);
      }
    },
    [
      isAnalysing,
      isStreaming,
      messages,
      selectedFiles,
      leftScreens,
      addMessage,
      greetForMode,
    ],
  );

  // File change (called after modal confirm)

  const confirmFileChange = useCallback(
    async (newFiles: StoredFileMeta[]) => {
      if (isAnalysing || isStreaming) return;
      setSelectedFiles(newFiles);

      const historySnapshot = messages;
      addMessage({
        role: 'user',
        content: '',
        fileChange: newFiles.map((f) => f.name),
      });

      if (mode === 'default') {
        await greetForMode(
          mode,
          newFiles,
          historySnapshot,
          `I've updated the selected documents to: ${newFiles.map((f) => f.name).join(', ')}. Please acknowledge.`,
        );
        return;
      }

      // Compare mode: exactly 2 files required
      if (mode === 'compare' && newFiles.length !== 2) {
        const count = newFiles.length;
        const msg =
          count < 2
            ? `Compare Mode requires exactly **2 documents**, but you now have **${count}** selected. Please add another file to continue comparing.`
            : `Compare Mode requires exactly **2 documents**, but you now have **${count}** selected. Please deselect files until exactly 2 remain.`;
        addMessage({ role: 'assistant', content: msg });
        return;
      }

      // Non-default: update the existing mode screen
      const existingIdx = findModeScreenIdx(leftScreens, mode);
      if (existingIdx === -1) return;

      setCurrentScreenIndex(existingIdx);
      setIsAnalysing(true);

      try {
        const analysis = await fetchAnalyze(mode, newFiles);
        if (!analysis.mismatch) {
          const patch = buildScreenPatch(mode, analysis, newFiles);
          setLeftScreens((prev) =>
            prev.map((s, i) => (i === existingIdx ? { ...s, ...patch } : s)),
          );
        }
        await greetForMode(
          mode,
          newFiles,
          historySnapshot,
          `The user has updated their file selection to: ${newFiles.map((f) => f.name).join(', ')}. Acknowledge and continue.`,
        );
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          addMessage({
            role: 'assistant',
            content: 'Something went wrong updating files. Please try again.',
          });
        }
      } finally {
        setIsAnalysing(false);
      }
    },
    [
      isAnalysing,
      isStreaming,
      messages,
      mode,
      leftScreens,
      addMessage,
      greetForMode,
    ],
  );

  // Send message

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming || isAnalysing) return;

      const historySnapshot = messages;
      addMessage({ role: 'user', content });

      const assistantId = uid();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          isLoading: true,
          timestamp: Date.now(),
        },
      ]);

      const history = historySnapshot
        .filter((m) => !m.isLoading)
        .map((m) => ({
          role: m.role,
          content: m.modeChange
            ? `Mode: ${m.modeChange}`
            : m.fileChange
              ? `Selected files: ${m.fileChange.join(', ')}`
              : m.content,
        }));
      history.push({ role: 'user', content });

      try {
        await streamIntoMessage(assistantId, mode, selectedFiles, history);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: 'Something went wrong. Please try again.',
                    isLoading: false,
                  }
                : m,
            ),
          );
        }
      }
    },
    [
      mode,
      selectedFiles,
      messages,
      isStreaming,
      isAnalysing,
      addMessage,
      streamIntoMessage,
    ],
  );

  // Initial greeting

  const initChat = useCallback(async () => {
    if (messages.length > 0) return;

    const MODE_GREETINGS: Record<QAMode, string> = {
      default: "I've reviewed your documents. What would you like to know?",
      resume:
        "I've analysed your resume and job description. I can help identify skill gaps, suggest rewrites, and draft a cover letter. Where would you like to start?",
      compare:
        "I've compared your documents and prepared a structured breakdown on the left. Feel free to ask any questions.",
      glossary:
        "I've extracted the key terminology from your documents — you can browse the glossary on the left. Ask me about any term.",
    };

    // For non-default initial modes, run analysis first
    if (mode !== 'default') {
      setIsAnalysing(true);
      try {
        const analysis = await fetchAnalyze(mode, selectedFiles);

        if (analysis.mismatch) {
          setIsAnalysing(false);
          const otherModes = (
            ['default', 'resume', 'compare', 'glossary'] as QAMode[]
          ).filter((m) => m !== mode);
          addMessage({
            role: 'assistant',
            content: `The documents you uploaded don't seem to fit **${mode} mode**. Perhaps try a different mode?`,
            modeSuggestions: analysis.suggestions ?? otherModes,
          });
          return;
        }

        const patch = buildScreenPatch(mode, analysis, selectedFiles);
        const newScreen: LeftPanelScreen = {
          id: screenUid(),
          type: 'info',
          mode,
          label: 'Overview',
          ...patch,
        };
        setLeftScreens((prev) => {
          const next = [...prev, newScreen];
          setCurrentScreenIndex(next.length - 1);
          return next;
        });
      } catch {
        // Silently fall through — greet anyway
      } finally {
        setIsAnalysing(false);
      }
    }

    // Greet
    const greetId = uid();
    setMessages([
      {
        id: greetId,
        role: 'assistant',
        content: '',
        isLoading: true,
        timestamp: Date.now(),
      },
    ]);

    try {
      await streamIntoMessage(greetId, mode, selectedFiles, [
        {
          role: 'user',
          content: `Greet the user for ${mode} mode. Start with: "${MODE_GREETINGS[mode]}"`,
        },
      ]);
    } catch {
      setMessages([
        {
          id: greetId,
          role: 'assistant',
          content: MODE_GREETINGS[mode],
          isLoading: false,
          timestamp: Date.now(),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Screen navigation

  const navigateScreen = useCallback(
    (dir: 'prev' | 'next') => {
      setCurrentScreenIndex((i) =>
        dir === 'prev'
          ? Math.max(0, i - 1)
          : Math.min(leftScreens.length - 1, i + 1),
      );
    },
    [leftScreens.length],
  );

  return {
    mode,
    changeMode,
    selectedFiles,
    allFiles,
    confirmFileChange,
    messages,
    isStreaming,
    isAnalysing,
    sendMessage,
    leftScreens,
    currentScreenIndex,
    navigateScreen,
    initChat,
  };
}
