export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuizQuestionType = 'mcq' | 'theory';
export type TheoryInputMode = 'written' | 'oral';
export type QuizQuestionCount = 10 | 20 | 30;

// Options chosen during the setup flow
export interface QuizFlowOptions {
  difficulty: QuizDifficulty | null;
  questionCount: QuizQuestionCount | null;
  questionType: QuizQuestionType | null;
  inputMode: TheoryInputMode | null;
}

// Question shapes
export interface MCQOption {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuizQuestion {
  id: number;
  text: string;
  options?: MCQOption[]; // MCQ only
  correctIndex?: number; // 0-based index of the correct option (MCQ only)
}

// Per-question answer state tracked during the quiz
export interface QuizAnswerState {
  answer: number | string | null; // selected index (MCQ) or typed/spoken text
  submitted: boolean;
  correct: boolean | null; // null = not yet evaluated client-side
  transcript?: string; // oral mode only
}

// AI feedback returned by the Answer Grader agent
export interface AIFeedback {
  correct: boolean;
  // Percentage 0-100 for both MCQ and theory:
  //   MCQ:    100 (correct) or 0 (wrong)
  //   Theory: 0-100 based on accuracy and completeness
  score_pct: number;
  explanation: string;
  tip: string;
}

// Evaluate API response shape
export interface EvaluateResponse {
  feedbacks: AIFeedback[];
  overall_pct: number; // average score across all questions
}
