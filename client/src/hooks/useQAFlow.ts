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

import { useState, useCallback, useRef, useEffect } from 'react';
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
import { getStoredCollectionId, setSummaryFlow, toFilePayloads } from '@/lib/storage';
import { BASE_URL, uploadFiles } from '@/lib/api';


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

function getStoredSelectedFileNames(): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('quizme:selected-files');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveSelectedFileNames(names: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('quizme:selected-files', JSON.stringify(names));
  } catch {
    /* quota — non-fatal */
  }
}

// API helpers

/**
 * Always re-index files and get a fresh collection_id for the current session.
 * We cannot reuse a stored collection_id (ie exisiting (commented out)) because:
 *   1. The user may have uploaded different files than the previous session.
 *   2. The backend collection may have expired or been evicted.
 * A stored collection_id from the summary flow is only valid if the files are
 * identical — which we cannot guarantee across page loads. Always re-uploading
 * is the only safe way to ensure the RAG context matches what the user sees.
 */
async function ensureCollectionId(files: StoredFileMeta[]): Promise<string> {
  // const existing = getStoredCollectionId();
  // if (existing) return existing;

  const data = await uploadFiles(files);
  const id = data.collection_id;
  setSummaryFlow({ collectionId: id });
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

  // selectedFiles is derived from allFiles + stored names each time allFiles
  // changes (i.e. after hydration). We use a ref to detect the first real
  // population so we don't overwrite a user's mid-session selection.
  const filesInitialised = useRef(false);
  const [selectedFiles, setSelectedFiles] = useState<StoredFileMeta[]>([]);

  // Once allFiles arrives (after hydration), resolve the correct selection.
  // We only do this once — after that, user changes drive the state directly.
  if (!filesInitialised.current && allFiles.length > 0) {
    filesInitialised.current = true;
    const storedNames = getStoredSelectedFileNames();
    let resolved: StoredFileMeta[];
    if (storedNames && storedNames.length > 0) {
      const fromStore = allFiles.filter((f) => storedNames.includes(f.name));
      resolved = fromStore.length > 0 ? fromStore : allFiles;
    } else {
      resolved = allFiles;
      // Persist the default (all files) so future reloads remember it
      saveSelectedFileNames(allFiles.map((f) => f.name));
    }
    // Synchronously set state during render — safe because filesInitialised
    // ensures this only runs once, before the component has painted with files.
    setSelectedFiles(resolved);
  }

  const [collectionId, setCollectionId] = useState<string>('');
  const [messages, setMessages] = useState<QAChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  // Max 4 screens: [0] = landing, [1-3] = one per non-default mode
  const [leftScreens, setLeftScreens] = useState<LeftPanelScreen[]>([
    { id: screenUid(), type: initialMode === 'default' ? 'default-result' : 'info', mode: initialMode, label: 'Overview' },
  ]);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);

  // Ref-based guard so initChat can never run twice regardless of closure staleness
  const initDone = useRef(false);

  const abortRef = useRef<AbortController | null>(null);
  // Stores the resolved collectionId for use inside async callbacks
  const collectionIdRef = useRef<string>('');
  // Keep a live ref to selectedFiles for use inside initChat AND sendMessage without stale closure
  const selectedFilesRef = useRef<StoredFileMeta[]>(selectedFiles);
  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  // Persist selection and update state together
  const updateSelectedFiles = useCallback((files: StoredFileMeta[]) => {
    saveSelectedFileNames(files.map((f) => f.name));
    setSelectedFiles(files);
  }, []);

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
      } catch (err) {
        // Always clear the loading bubble — even if the stream dies mid-flight
        const isAbort = (err as Error).name === 'AbortError';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  content: isAbort
                    ? ''
                    : fullText.trim() ||
                      'Something went wrong. Please try again.',
                  isLoading: false,
                }
              : m,
          ),
        );
        if (!isAbort) throw err; // re-throw so callers can show their own error UI
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

      if ((newMode === 'compare' || newMode === 'resume') && selectedFiles.length !== 2) {
        const count = selectedFiles.length;
        const modeLabel = newMode.charAt(0).toUpperCase() + newMode.slice(1);
        addMessage({
          role: 'assistant',
          content:
            count < 2
              ? newMode === 'resume'
                ? `**Resume Mode** requires **2 documents** — a **resume** and a **job description**. You only have **${count}** selected. Please add your ${count === 0 ? 'resume and job description' : 'job description'} and try again.`
                : `**Compare Mode** requires exactly **2 documents**, but you only have **${count}** selected. Please add another document and try again.`
              : `**${modeLabel} Mode** requires exactly **2 documents**, but you have **${count}**. Please deselect some files, then try again.`,
        });
        return;
      }

      if (newMode === 'default') {
        // Update the first screen to show DefaultResultPanel instead of empty InfoPanel
        setLeftScreens((prev) =>
          prev.map((s, i) =>
            i === 0 ? { ...s, type: 'default-result' as const } : s,
          ),
        );
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

      const SWITCH_GREETINGS: Record<QAMode, string> = {
        default:
          "I've switched back to Default Q&A. What would you like to know?",
        resume:
          "I've switched to Resume Mode and the analysis panel on the left is ready. Greet me briefly — mention the panel and offer to help with specific questions, cover letter drafting, or bullet point rewrites. Do not reproduce the full analysis.",
        compare:
          "I've switched to Compare Mode and the comparison table is on the left. Greet me briefly — mention the table and offer to answer specific follow-up questions.",
        glossary:
          "I've switched to Glossary Mode and the searchable glossary panel on the left has all extracted terms. Greet me briefly — mention the panel and offer to explain any specific term in more depth. Do not list or re-extract terms.",
      };
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
          setCurrentScreenIndex(existingIdx);
        } else {
          const newScreen: LeftPanelScreen = {
            id: screenUid(),
            type: 'info',
            mode: newMode,
            label: 'New',
            ...patch,
          };
          setLeftScreens((prev) => [...prev, newScreen]);
          // Use functional update to get the latest length without racing
          setCurrentScreenIndex((prev) => {
            // We just added one screen, so new index = current length
            // But we can't read leftScreens here, so use a ref trick below
            return prev + 1;
          });
        }
      } catch (err) {
        // Analysis failed — panel couldn't be built.
        if ((err as Error).name !== 'AbortError') {
          if (existingIdx === -1) {
            const placeholderScreen: LeftPanelScreen = {
              id: screenUid(),
              type: 'info',
              mode: newMode,
              label: newMode,
            };
            setLeftScreens((prev) => [...prev, placeholderScreen]);
            setCurrentScreenIndex((prev) => prev + 1);
          }
          addMessage({
            role: 'assistant',
            content: `There was a problem loading the **${newMode} panel** — the AI service may be temporarily unavailable. You can still ask questions in chat, or try switching modes again.`,
          });
          setIsAnalysing(false);
          return;
        }
      } finally {
        setIsAnalysing(false);
      }

      // Greeting runs OUTSIDE the analysis try/catch — a greeting stream
      // failure won't incorrectly show the "panel failed" error message.
      try {
        await greetForMode(
          newMode,
          selectedFiles,
          historySnapshot,
          SWITCH_GREETINGS[newMode],
          colId,
        );
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('changeMode greeting error:', err);
        }
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

  // File change

  const confirmFileChange = useCallback(
    async (newFiles: StoredFileMeta[]) => {
      if (isAnalysing || isStreaming) return;
      updateSelectedFiles(newFiles);

      const historySnapshot = messages;
      addMessage({
        role: 'user',
        content: '',
        fileChange: newFiles.map((f) => f.name),
      });

      // Re-index the new file set to get a collection_id
      let colId = collectionIdRef.current;
      try {
        const data = await uploadFiles(newFiles);
        colId = data.collection_id;
        collectionIdRef.current = colId;
        setCollectionId(colId);
        setSummaryFlow({ collectionId: colId });
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
      updateSelectedFiles,
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

      // streamIntoMessage handles its own error state — it always resolves
      // the loading bubble before re-throwing. Catch here only to silence
      // AbortError; all other errors are already visible in the chat.
      // Always read from the ref so we get the latest file selection even if
      // the sendMessage closure was captured before the user changed files.
      try {
        await streamIntoMessage(
          assistantId,
          mode,
          selectedFilesRef.current,
          history,
          collectionIdRef.current,
        );
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('sendMessage stream error:', err);
        }
      }
    },
    [
      mode,
      messages,
      isStreaming,
      isAnalysing,
      addMessage,
      streamIntoMessage,
    ],
  );

  // Initial chat

  const initChat = useCallback(async (filesOverride?: StoredFileMeta[]) => {
    // Ref-based guard — the messages.length check is unreliable because
    // initChat captures a stale closure where messages is always [].
    if (initDone.current) return;
    initDone.current = true;

    // Always read the live selection from the ref, not a stale closure value.
    // If the caller passes filesOverride (e.g. from the hydration effect), use
    // that directly — it is guaranteed to be up-to-date regardless of ref timing.
    const currentFiles = filesOverride ?? selectedFilesRef.current;

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
      colId = await ensureCollectionId(currentFiles);
      collectionIdRef.current = colId;
      setCollectionId(colId);
    } catch (err) {
      console.error('Could not index files:', err);
    }

    // Step 2: auto mode detection (only in default mode on first load)
    if (mode === 'default' && colId && currentFiles.length > 0) {
      try {
        const detect = await fetchDetect(colId, currentFiles);
        if (
          detect.suggestion &&
          (['resume', 'compare', 'glossary'] as QAMode[]).includes(
            detect.suggestion,
          )
        ) {
          const suggestedMode = detect.suggestion as QAMode;

          // Show the suggestion card in chat
          setMessages([
            {
              id: uid(),
              role: 'assistant',
              content:
                detect.reason ||
                `These documents look like they suit **${suggestedMode} mode**.`,
              isLoading: false,
              timestamp: Date.now(),
              autoModeSuggestion: {
                mode: suggestedMode,
                reason: detect.reason,
              },
            },
          ]);
        }
      } catch {
        /* detection failed silently — proceed normally */
      }
    }

    // Step 2b: resume/compare require exactly 2 files — show a clear message immediately,
    // mirroring the Compare Mode behaviour that already exists in changeMode.
    if ((mode === 'resume' || mode === 'compare') && currentFiles.length !== 2) {
      const count = currentFiles.length;
      const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
      addMessage({
        role: 'assistant',
        content:
          count < 2
            ? mode === 'resume'
              ? `**Resume Mode** needs **2 documents** — a **resume** and a **job description**. You only have **${count}** document uploaded. Please go back, add your ${count === 0 ? 'resume and job description' : 'job description'}, and try again.`
              : `**Compare Mode** requires exactly **2 documents**, but you only have **${count}** selected. Please add another document and try again.`
            : `**${modeLabel} Mode** requires exactly **2 documents**, but you have **${count}** selected. Please deselect some files, then try again.`,
        modeSuggestions: (['default', 'glossary'] as QAMode[]),
      });
      return;
    }

    // Step 3: for non-default initial modes, run analysis first
    if (mode !== 'default' && colId) {
      setIsAnalysing(true);
      try {
        const analysis = await fetchAnalyze(colId, mode, currentFiles);

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

        const patch = buildScreenPatch(mode, analysis, currentFiles);
        const newScreen: LeftPanelScreen = {
          id: screenUid(),
          type: 'info',
          mode,
          label: 'Overview',
          ...patch,
        };
        setLeftScreens((prev) => [...prev, newScreen]);
        setCurrentScreenIndex((prev) => prev + 1);
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

    const PANEL_HINTS: Partial<Record<QAMode, string>> = {
      resume:
        ' The analysis panel on the left is populated — do not reproduce it. Offer to answer specific questions, help with cover letter drafting, or rewrite bullet points.',
      compare:
        ' The comparison table is on the left — do not reproduce it. Offer to answer follow-up questions.',
      glossary:
        ' The searchable glossary panel on the left has all extracted terms — do not list them in chat. Offer to explain any specific term in more depth.',
    };
    const panelHint = PANEL_HINTS[mode] ?? '';

    try {
      await streamIntoMessage(
        greetId,
        mode,
        currentFiles,
        [
          {
            role: 'user',
            content: `Greet the user for ${mode} mode. Start with: "${MODE_GREETINGS[mode]}"${panelHint}`,
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
