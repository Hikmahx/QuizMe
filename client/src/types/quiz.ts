// ─── Quiz flow ────────────────────────────────────────────────────────────────

export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuizQuestionType = 'mcq' | 'theory';
export type TheoryInputMode = 'written' | 'oral';
export type QuizQuestionCount = 10 | 20 | 30;

// Options chosen during the setup flow
export interface QuizFlowOptions {
  difficulty: QuizDifficulty | null;
  questionCount: QuizQuestionCount | null;
  questionType: QuizQuestionType | null;
  inputMode: TheoryInputMode | null; // Only set when questionType === 'theory'
}

// A single MCQ option
export interface MCQOption {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
}

// A single quiz question (MCQ or theory)
export interface QuizQuestion {
  id: number;
  text: string;
  options?: MCQOption[]; // MCQ only
  correctIndex?: number; // Index into options[] of the correct answer (MCQ)
}

// State tracked per question during a quiz session
export interface QuizAnswerState {
  answer: number | string | null; // Index selected (MCQ) or text entered (theory/oral)
  submitted: boolean;
  correct: boolean | null; // null = not yet evaluated
  transcript?: string; // Raw transcript including pauses/uhms (oral only)
}

// Full in-memory quiz session state (not persisted — lost on refresh by design)
export interface QuizSession {
  questions: QuizQuestion[];
  answers: QuizAnswerState[];
  currentIndex: number;
  finished: boolean;
}

// Per-question feedback from the AI
export interface QuestionFeedback {
  questionIndex: number;
  correct: boolean;
  explanation: string;
  tip: string;
}

// Final score + feedback
export interface QuizResult {
  score: number;
  total: number;
  feedbacks: QuestionFeedback[];
}
