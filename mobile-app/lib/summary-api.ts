import { BASE_URL } from './api';
import { StoredFileMeta } from '../types';

export interface SummaryApiResponse {
  collection_id: string;
  style: string;
  summaries: { doc_name: string; summary: string }[];
  fallback: boolean;
}

export async function generateSummaryApi(
  files: StoredFileMeta[],
  length: 'short' | 'medium' | 'long',
  style: 'combined' | 'doc-by-doc',
): Promise<SummaryApiResponse> {
  const filePayloads = files.map(({ name, type, uri }) => ({
    name,
    type,
    uri,
  }));

  const res = await fetch(`${BASE_URL}/api/summary/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: filePayloads, length, style }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail ?? `Request failed (${res.status})`);
  }

  return res.json();
}
