import {
  QuizQuestion,
  AIFeedback,
  EvaluateResponse,
  QuizAnswerState,
} from '@/types/quiz';
import { BASE_URL } from './api';

// Generate questions
export interface GenerateParams {
  collectionId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'mcq' | 'theory';
  count: number;
}

export async function generateQuizApi(
  params: GenerateParams,
): Promise<QuizQuestion[]> {
  const res = await fetch(`${BASE_URL}/api/quiz/generate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collection_id: params.collectionId,
      difficulty: params.difficulty,
      question_type: params.questionType,
      question_count: params.count,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail ?? `Generation failed (${res.status})`);
  }

  const data = await res.json();
  return data.questions as QuizQuestion[];
}

// Evaluate all answers
export interface AnswerPayload {
  question: string;
  user_answer: string; // option text for MCQ; typed/spoken text for theory
  correct_answer: string; // correct option text for MCQ; "" for theory
  question_type: 'mcq' | 'theory';
}

/**
 * Build the answer payload array from questions + answer states.
 * Called on the feedback page before sending to /api/quiz/evaluate/.
 */
export function buildAnswerPayloads(
  questions: QuizQuestion[],
  answers: QuizAnswerState[],
  questionType: 'mcq' | 'theory',
): AnswerPayload[] {
  return questions.map((q, i) => {
    const ans = answers[i];

    if (questionType === 'mcq') {
      const userText =
        typeof ans?.answer === 'number'
          ? (q.options?.[ans.answer]?.text ?? '')
          : '';
      const correctText =
        q.correctIndex !== undefined
          ? (q.options?.[q.correctIndex]?.text ?? '')
          : '';
      return {
        question: q.text,
        user_answer: userText,
        correct_answer: correctText,
        question_type: 'mcq',
      };
    }

    // Theory — answer is always the string the user typed or said
    const userAnswer = typeof ans?.answer === 'string' ? ans.answer.trim() : '';
    return {
      question: q.text,
      user_answer: userAnswer,
      correct_answer: '',
      question_type: 'theory',
    };
  });
}

/**
 * POST /api/quiz/evaluate/
 * Sends all answers to the backend grader and returns per-question feedback.
 * Never throws — returns a zero-score fallback if the request fails.
 */
export async function evaluateQuizApi(
  answers: AnswerPayload[],
  collectionId: string | null,
): Promise<EvaluateResponse> {
  const fallback: EvaluateResponse = {
    feedbacks: answers.map(() => ({
      correct: false,
      score_pct: 0,
      explanation: 'Could not evaluate this answer automatically.',
      tip: '',
    })),
    overall_pct: 0,
  };

  try {
    const res = await fetch(`${BASE_URL}/api/quiz/evaluate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collection_id: collectionId,
        answers,
      }),
    });

    if (!res.ok) {
      console.error('evaluateQuizApi: HTTP error', res.status);
      return fallback;
    }

    return (await res.json()) as EvaluateResponse;
  } catch (err) {
    console.error('evaluateQuizApi: network error', err);
    return fallback;
  }
}
