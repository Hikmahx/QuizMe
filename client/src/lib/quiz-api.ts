import {
  QuizQuestion,
  AIFeedback,
  EvaluateResponse,
  QuizAnswerState,
} from '@/types/quiz';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

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
  // data = { questions: [...], source: "ai" }
  return data.questions as QuizQuestion[];
}

// Evaluate all answers
export interface AnswerPayload {
  question: string;
  user_answer: string;
  correct_answer: string; // option text for MCQ, "" for theory
  question_type: 'mcq' | 'theory';
}

export function buildAnswerPayloads(
  questions: QuizQuestion[],
  answers: QuizAnswerState[],
  questionType: 'mcq' | 'theory',
): AnswerPayload[] {
  return questions.map((q, i) => {
    const ans = answers[i];

    if (questionType === 'mcq') {
      // For MCQ, pass the text of what the user selected and what was correct
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

    // Theory/oral: the answer is already a string
    return {
      question: q.text,
      user_answer: typeof ans?.answer === 'string' ? ans.answer : '',
      correct_answer: '',
      question_type: 'theory',
    };
  });
}

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
      console.error('Evaluate API error:', res.status);
      return fallback;
    }

    return (await res.json()) as EvaluateResponse;
  } catch (err) {
    console.error('evaluateQuizApi failed:', err);
    return fallback;
  }
}
