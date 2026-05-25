export type QuizDifficulty    = 'easy' | 'medium' | 'hard';
export type QuizQuestionType  = 'mcq' | 'theory';
export type TheoryInputMode   = 'written' | 'oral';
export type QuizQuestionCount = 10 | 20 | 30;

export interface MCQOption { letter: 'A'|'B'|'C'|'D'; text: string }
export interface QuizQuestion {
  id: number; text: string;
  options?: MCQOption[]; correctIndex?: number;
}
export interface QuizAnswerState {
  answer: number | string | null; submitted: boolean; correct: boolean | null;
}
export interface AIFeedback {
  correct: boolean; score_pct: number; explanation: string; tip: string;
}
export interface EvaluateResponse { feedbacks: AIFeedback[]; overall_pct: number }
