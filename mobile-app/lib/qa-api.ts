import { BASE_URL } from './api';
import { StoredFileMeta } from '../types';

export type QAMode = 'default' | 'resume' | 'compare' | 'glossary';

export interface QAChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
  timestamp: number;
  modeChange?: QAMode;
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

let _counter = 0;
export const uid = () => `msg-${++_counter}-${Date.now()}`;

/**
 * Streaming RAG chat. Calls each chunk via onChunk as it arrives.
 * Returns the full accumulated text.
 */
export async function fetchChatStream(
  collectionId: string,
  mode: QAMode,
  files: StoredFileMeta[],
  messages: ChatHistoryItem[],
  onChunk: (chunk: string) => void,
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
