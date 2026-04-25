export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuizQuestionType = 'mcq' | 'theory';
export type TheoryInputMode = 'written' | 'oral';
export type QuizQuestionCount = 10 | 20 | 30;

export interface QuizFlowOptions {
  difficulty: QuizDifficulty | null;
  questionCount: QuizQuestionCount | null;
  questionType: QuizQuestionType | null;
  inputMode: TheoryInputMode | null;
}

export interface MCQOption {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuizQuestion {
  id: number;
  text: string;
  options?: MCQOption[]; // MCQ only
  correctIndex?: number; // 0-based index of correct option (MCQ only)
}

/** Per-question answer state tracked during the quiz */
export interface QuizAnswerState {
  answer: number | string | null; // selected index (MCQ) or typed/spoken text
  submitted: boolean;
  correct: boolean | null; // null = not yet evaluated client-side
  transcript?: string; // oral mode only
}

/** AI feedback returned by the grader agent per question */
export interface AIFeedback {
  correct: boolean;
  score_pct: number; // 0-100; MCQ = 100 or 0; theory = 0-100
  explanation: string;
  tip: string;
}

/** /api/quiz/evaluate/ response */
export interface EvaluateResponse {
  feedbacks: AIFeedback[];
  overall_pct: number; // average score_pct across all questions
}
