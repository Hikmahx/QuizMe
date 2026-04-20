import { StoredFileMeta } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface SummaryApiRequest {
  files: { name: string; type: string; dataUrl: string }[];
  length: 'short' | 'medium' | 'long';
  style: 'default' | 'combined' | 'doc-by-doc';
}

export interface SummaryApiResponse {
  collection_id: string;
  style: string;
  summaries: { doc_name: string; summary: string }[];
  fallback: boolean;
}

export async function generateSummaryApi(
  files: StoredFileMeta[],
  length: 'short' | 'medium' | 'long',
  style: 'default' | 'combined' | 'doc-by-doc',
): Promise<SummaryApiResponse> {
  const body: SummaryApiRequest = {
    files: files.map((f) => ({
      name: f.name,
      type: f.type,
      dataUrl: f.dataUrl,
    })),
    length,
    style,
  };

  const res = await fetch(`${BASE_URL}/api/summary/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail ?? `Request failed with status ${res.status}`);
  }

  return res.json();
}

// Voice API
/**
 * POST /api/voice/speak/
 * Sends text to the backend TTS endpoint, returns a blob URL you can pass to new Audio().
 * Caller must call URL.revokeObjectURL() when done to free memory.
 */
export async function speakText(text: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/voice/speak/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail ?? `TTS failed (${res.status})`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * POST /api/voice/transcribe/
 * Sends a recorded audio Blob to the backend STT endpoint, returns the transcript string.
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const form = new FormData();
  form.append('audio', audioBlob, 'recording.webm');
  const res = await fetch(`${BASE_URL}/api/voice/transcribe/`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail ?? `Transcription failed (${res.status})`);
  }
  const data = await res.json();
  return data.transcript as string;
}