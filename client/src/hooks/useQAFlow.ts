'use client';

/**
 * useQAFlow.ts — Core hook for the Q&A chat feature.
 *
 * Phase 4 changes vs the original:
 *   1. fetchChat and fetchAnalyze now call FastAPI (via NEXT_PUBLIC_API_URL)
 *      instead of the temporary Next.js API routes. FastAPI uses RAG to retrieve
 *      relevant chunks — no more sending the entire file on every message.
 *
 *   2. Auto mode detection (fetchDetect) is called once on initChat.
 *      If the AI detects a resume+JD pair or similar docs, it posts a friendly
 *      suggestion message with yes/no buttons before the greeting.
 *
 *   3. Quiz redirect: when the LLM returns [QUIZ_REDIRECT] (user asked to be tested),
 *      the message shows a "Go to Quiz →" card instead of the normal Quiz CTA.
 *
 *   4. ensureCollectionId: if no collection_id is in localStorage (user came to Q&A
 *      without going through the summary flow), we call POST /api/upload/ to index
 *      the files and store the returned collection_id.
 */

import { useState, useCallback, useRef } from 'react';
import { StoredFileMeta } from '@/types';
import {
  QAMode,
  QAChatMessage,
  LeftPanelScreen,
  LeftScreenType,
  AnalysisStep,
  CompareRow,
  GlossaryEntry,
} from '@/types/qa';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

let _counter = 0;
const uid = () => `msg-${++_counter}-${Date.now()}`;
const screenUid = () => `scr-${++_counter}-${Date.now()}`;

const MODE_SCREEN_TYPE: Partial<Record<QAMode, LeftScreenType>> = {
  resume: 'analysis-steps',
  compare: 'compare-table',
  glossary: 'glossary',
};

function findModeScreenIdx(screens: LeftPanelScreen[], mode: QAMode): number {
  const type = MODE_SCREEN_TYPE[mode];
  if (!type) return -1;
  return screens.findIndex((s) => s.type === type);
}

function buildScreenPatch(
  mode: QAMode,
  analysis: {
    analysisSteps?: AnalysisStep[];
    compareRows?: CompareRow[];
    glossaryEntries?: GlossaryEntry[];
  },
  files: StoredFileMeta[],
): Partial<LeftPanelScreen> {
  if (mode === 'resume' && analysis.analysisSteps)
    return {
      type: 'analysis-steps',
      label: 'Resume analysis',
      analysisSteps: analysis.analysisSteps,
    };
  if (mode === 'compare' && analysis.compareRows)
    return {
      type: 'compare-table',
      label: 'Comparison',
      compareFiles: files.map((f) => f.name),
      compareRows: analysis.compareRows,
    };
  if (mode === 'glossary' && analysis.glossaryEntries)
    return {
      type: 'glossary',
      label: 'Glossary',
      glossaryEntries: analysis.glossaryEntries,
    };
  return {};
}

// localStorage helpers

function getStoredCollectionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const s = JSON.parse(localStorage.getItem('quizme:summary-flow') ?? '{}');
    const id = s.collectionId ?? s.collection_id ?? '';
    return typeof id === 'string' ? id : '';
  } catch {
    return '';
  }
}

function saveCollectionId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const current = JSON.parse(
      localStorage.getItem('quizme:summary-flow') ?? '{}',
    );
    localStorage.setItem(
      'quizme:summary-flow',
      JSON.stringify({
        ...current,
        collectionId: id,
        collection_id: id,
      }),
    );
  } catch {
    /* quota — non-fatal */
  }
}

// API helpers

/**
 * Ensure a collection_id exists for the uploaded files.
 * If the user went through the summary flow first, collection_id is already in localStorage.
 * If not (user opened Q&A directly), we call POST /api/upload/ to index the files.
 */
async function ensureCollectionId(files: StoredFileMeta[]): Promise<string> {
  const existing = getStoredCollectionId();
  if (existing) return existing;

  const res = await fetch(`${BASE_URL}/api/upload/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: files.map((f) => ({
        name: f.name,
        type: f.type,
        dataUrl: f.dataUrl,
      })),
    }),
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const data = await res.json();
  const id = data.collection_id as string;
  saveCollectionId(id);
  return id;
}

/**
 * Streaming RAG chat — calls FastAPI.
 * Reads the response body as a stream of UTF-8 text chunks.
 */
async function fetchChat(
  collectionId: string,
  mode: QAMode,
  files: StoredFileMeta[],
  messages: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (text: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/qa/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collection_id: collectionId,
      mode,
      messages,
      file_names: files.map((f) => f.name),
    }),
    signal,
  });
  if (!res.ok) throw new Error(`Chat API error ${res.status}`);
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

/**
 * Mode-specific analysis — calls FastAPI.
 * Returns analysisSteps, compareRows, or glossaryEntries depending on mode.
 */
async function fetchAnalyze(
  collectionId: string,
  mode: QAMode,
  files: StoredFileMeta[],
): Promise<{
  analysisSteps?: AnalysisStep[];
  compareRows?: CompareRow[];
  glossaryEntries?: GlossaryEntry[];
  mismatch?: boolean;
  suggestions?: QAMode[];
}> {
  const res = await fetch(`${BASE_URL}/api/qa/analyze/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collection_id: collectionId,
      mode,
      file_names: files.map((f) => f.name),
    }),
  });
  if (!res.ok) throw new Error(`Analyze error ${res.status}`);
  return res.json();
}

/**
 * Auto mode detection — calls FastAPI once on init.
 * Returns a suggestion ("resume" | "compare" | null) and a reason string.
 */
async function fetchDetect(
  collectionId: string,
  files: StoredFileMeta[],
): Promise<{ suggestion: QAMode | null; reason: string }> {
  const res = await fetch(`${BASE_URL}/api/qa/detect/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collection_id: collectionId,
      file_names: files.map((f) => f.name),
    }),
  });
  if (!res.ok) return { suggestion: null, reason: '' };
  return res.json();
}

// Token parsing

function parseTokens(text: string): {
  clean: string;
  hasQuizCta: boolean;
  hasQuizRedirect: boolean;
} {
  const hasQuizCta = text.includes('[QUIZ_CTA]');
  const hasQuizRedirect = text.includes('[QUIZ_REDIRECT]');
  const clean = text
    .replace('[QUIZ_CTA]', '')
    .replace('[QUIZ_REDIRECT]', '')
    .trim();
  return { clean, hasQuizCta, hasQuizRedirect };
}

// Hook

export function useQAFlow(allFiles: StoredFileMeta[], initialMode: QAMode) {
  const [mode, setModeState] = useState<QAMode>(initialMode);
  const [selectedFiles, setSelectedFiles] =
    useState<StoredFileMeta[]>(allFiles);
  const [collectionId, setCollectionId] = useState<string>('');
  const [messages, setMessages] = useState<QAChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  // Max 4 screens: [0] = landing, [1-3] = one per non-default mode
  const [leftScreens, setLeftScreens] = useState<LeftPanelScreen[]>([
    { id: screenUid(), type: 'info', mode: initialMode, label: 'Overview' },
  ]);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  // Stores the resolved collectionId for use inside async callbacks
  const collectionIdRef = useRef<string>('');

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
      colId: string,
    ) => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setIsStreaming(true);
      let fullText = '';

      try {
        await fetchChat(
          colId,
          mode,
          files,
          history,
          (chunk) => {
            fullText += chunk;
            const { clean } = parseTokens(fullText);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === msgId ? { ...m, content: clean, isLoading: false } : m,
              ),
            );
          },
          ctrl.signal,
        );

        const { clean, hasQuizCta, hasQuizRedirect } = parseTokens(fullText);
        const userAskedForQuiz = /quiz|test|practice/i.test(
          history[history.length - 1]?.content || '',
        );
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  content: clean,
                  isLoading: false,
                  showQuizCta:
                    hasQuizCta && userAskedForQuiz && !hasQuizRedirect,
                  showQuizRedirect: hasQuizRedirect,
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

  //  Greeting helper

  const greetForMode = useCallback(
    async (
      targetMode: QAMode,
      files: StoredFileMeta[],
      historySnapshot: QAChatMessage[],
      greetingPrompt: string,
      colId: string,
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

      await streamIntoMessage(greetId, targetMode, files, history, colId);
    },
    [streamIntoMessage],
  );

  // Mode change

  const changeMode = useCallback(
    async (newMode: QAMode) => {
      if (isAnalysing || isStreaming) return;
      setModeState(newMode);

      const historySnapshot = messages;
      addMessage({ role: 'user', content: '', modeChange: newMode });
      const colId = collectionIdRef.current;

      if (newMode === 'compare' && selectedFiles.length !== 2) {
        const count = selectedFiles.length;
        addMessage({
          role: 'assistant',
          content:
            count < 2
              ? `Compare Mode requires exactly **2 documents**, but you only have **${count}** selected. Please add another document and try again.`
              : `Compare Mode requires exactly **2 documents**, but you have **${count}** selected. Please deselect some files, then try again.`,
        });
        return;
      }

      if (newMode === 'default') {
        setCurrentScreenIndex(0);
        await greetForMode(
          newMode,
          selectedFiles,
          historySnapshot,
          "I've switched back to Default Q&A. What would you like to know?",
          colId,
        );
        return;
      }

      const existingIdx = findModeScreenIdx(leftScreens, newMode);
      if (existingIdx !== -1) setCurrentScreenIndex(existingIdx);

      setIsAnalysing(true);
      try {
        const analysis = await fetchAnalyze(colId, newMode, selectedFiles);

        if (analysis.mismatch) {
          if (existingIdx === -1) setCurrentScreenIndex(0);
          addMessage({
            role: 'assistant',
            content: `The documents you uploaded don't seem to fit **${newMode} mode**. Perhaps try one of the other modes?`,
            modeSuggestions:
              (analysis.suggestions as QAMode[]) ??
              (['default', 'resume', 'compare', 'glossary'] as QAMode[]).filter(
                (m) => m !== newMode,
              ),
          });
          return;
        }

        const patch = buildScreenPatch(newMode, analysis, selectedFiles);
        if (existingIdx !== -1) {
          setLeftScreens((prev) =>
            prev.map((s, i) =>
              i === existingIdx ? { ...s, mode: newMode, ...patch } : s,
            ),
          );
        } else {
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
          colId,
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

  // ── File change ──────────────────────────────────────────────────────────────

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

      // Re-index the new file set to get a collection_id
      let colId = collectionIdRef.current;
      try {
        const res = await fetch(`${BASE_URL}/api/upload/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: newFiles.map((f) => ({
              name: f.name,
              type: f.type,
              dataUrl: f.dataUrl,
            })),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          colId = data.collection_id;
          collectionIdRef.current = colId;
          setCollectionId(colId);
          saveCollectionId(colId);
        }
      } catch {
        /* use existing colId */
      }

      if (mode === 'default') {
        await greetForMode(
          mode,
          newFiles,
          historySnapshot,
          `I've updated the selected documents to: ${newFiles.map((f) => f.name).join(', ')}. Please acknowledge.`,
          colId,
        );
        return;
      }

      if (mode === 'compare' && newFiles.length !== 2) {
        const count = newFiles.length;
        addMessage({
          role: 'assistant',
          content:
            count < 2
              ? `Compare Mode requires exactly **2 documents**, but you now have **${count}** selected.`
              : `Compare Mode requires exactly **2 documents**, but you now have **${count}** selected. Please deselect until exactly 2 remain.`,
        });
        return;
      }

      const existingIdx = findModeScreenIdx(leftScreens, mode);
      if (existingIdx === -1) return;

      setCurrentScreenIndex(existingIdx);
      setIsAnalysing(true);
      try {
        const analysis = await fetchAnalyze(colId, mode, newFiles);
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
          colId,
        );
      } catch (err) {
        if ((err as Error).name !== 'AbortError')
          addMessage({
            role: 'assistant',
            content: 'Something went wrong updating files. Please try again.',
          });
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
        await streamIntoMessage(
          assistantId,
          mode,
          selectedFiles,
          history,
          collectionIdRef.current,
        );
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

  // Initial chat

  const initChat = useCallback(async () => {
    if (messages.length > 0) return;

    const MODE_GREETINGS: Record<QAMode, string> = {
      default: "I've reviewed your documents. What would you like to know?",
      resume:
        "I've analysed your resume and job description. I can help identify skill gaps, suggest rewrites, and draft a cover letter. Where would you like to start?",
      compare:
        "I've compared your documents and prepared a structured breakdown on the left. Feel free to ask any questions.",
      glossary:
        "I've extracted the key technical terminology from your documents — you can browse the glossary on the left. Ask me about any term.",
    };

    // Step 1: ensure we have a collection_id
    let colId = '';
    try {
      colId = await ensureCollectionId(selectedFiles);
      collectionIdRef.current = colId;
      setCollectionId(colId);
    } catch (err) {
      console.error('Could not index files:', err);
      // Proceed without collection_id — chat will still work via general knowledge
    }

    // Step 2: auto mode detection (only in default mode on first load)
    if (mode === 'default' && colId && selectedFiles.length > 0) {
      try {
        const detect = await fetchDetect(colId, selectedFiles);
        if (
          detect.suggestion &&
          (['resume', 'compare'] as QAMode[]).includes(detect.suggestion)
        ) {
          // Add a suggestion message before the greeting
          setMessages([
            {
              id: uid(),
              role: 'assistant',
              content:
                detect.reason ||
                `These documents look like they suit **${detect.suggestion} mode**.`,
              isLoading: false,
              timestamp: Date.now(),
              autoModeSuggestion: {
                mode: detect.suggestion as QAMode,
                reason: detect.reason,
              },
            },
          ]);
        }
      } catch {
        /* detection failed silently — proceed normally */
      }
    }

    // Step 3: for non-default initial modes, run analysis first
    if (mode !== 'default' && colId) {
      setIsAnalysing(true);
      try {
        const analysis = await fetchAnalyze(colId, mode, selectedFiles);

        if (analysis.mismatch) {
          setIsAnalysing(false);
          addMessage({
            role: 'assistant',
            content: `The documents you uploaded don't seem to fit **${mode} mode**. Perhaps try a different mode?`,
            modeSuggestions:
              (analysis.suggestions as QAMode[]) ??
              (['default', 'resume', 'compare', 'glossary'] as QAMode[]).filter(
                (m) => m !== mode,
              ),
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
        /* silent — greet anyway */
      } finally {
        setIsAnalysing(false);
      }
    }

    // Step 4: greeting
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

    try {
      await streamIntoMessage(
        greetId,
        mode,
        selectedFiles,
        [
          {
            role: 'user',
            content: `Greet the user for ${mode} mode. Start with: "${MODE_GREETINGS[mode]}"`,
          },
        ],
        colId,
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === greetId
            ? { ...m, content: MODE_GREETINGS[mode], isLoading: false }
            : m,
        ),
      );
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
    collectionId,
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
