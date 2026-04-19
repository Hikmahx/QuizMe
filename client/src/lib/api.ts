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
