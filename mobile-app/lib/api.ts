import { StoredFileMeta, EvaluateResponse } from '@/types';
import { QuizQuestion } from '@/types';

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

const toPayload = (file: StoredFileMeta) => ({
  name: file.name,
  type: file.type,
  uri: file.uri,
});

// Upload & index

export interface UploadResponse {
  collection_id: string;
  files_indexed: number;
  message: string;
}

export async function uploadFiles(
  files: StoredFileMeta[],
): Promise<UploadResponse> {
  const response = await fetch(`${BASE_URL}/api/upload/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: files.map(toPayload) }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail ?? `Upload failed (${response.status})`);
  }

  return response.json();
}

// Summary

export interface SummaryApiResponse {
  collection_id: string;
  style: string;
  summaries: { doc_name: string; summary: string }[];
  fallback: boolean;
}

export async function generateSummaryApi(
  files: StoredFileMeta[],
  length: string,
  style: string,
): Promise<SummaryApiResponse> {
  const response = await fetch(`${BASE_URL}/api/summary/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: files.map(toPayload), length, style }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail ?? `Summary failed (${response.status})`);
  }

  return response.json();
}

// Quiz generate

export async function generateQuizApi(params: {
  collectionId: string;
  difficulty: string;
  count: number;
  questionType: string;
}): Promise<QuizQuestion[]> {
  const response = await fetch(`${BASE_URL}/api/quiz/generate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collection_id: params.collectionId,
      difficulty: params.difficulty,
      question_type: params.questionType,
      question_count: params.count,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail ?? `Generation failed (${response.status})`);
  }

  const data = await response.json();
  return data.questions as QuizQuestion[];
}

// Quiz evaluate

export interface AnswerPayload {
  question: string;
  user_answer: string;
  correct_answer: string;
  question_type: 'mcq' | 'theory';
}

export async function evaluateQuizApi(
  answers: AnswerPayload[],
  collectionId: string | null,
): Promise<EvaluateResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/quiz/evaluate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection_id: collectionId, answers }),
    });

    if (!response.ok) throw new Error();
    return response.json();
  } catch {
    return {
      feedbacks: answers.map(() => ({
        correct: false,
        score_pct: 0,
        explanation: 'Could not evaluate.',
        tip: '',
      })),
      overall_pct: 0,
    };
  }
}
