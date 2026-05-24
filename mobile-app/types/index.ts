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
  options?: MCQOption[];
  correctIndex?: number;
}

export interface QuizAnswerState {
  answer: number | string | null;
  submitted: boolean;
  correct: boolean | null;
  transcript?: string;
}

export interface AIFeedback {
  correct: boolean;
  score_pct: number;
  explanation: string;
  tip: string;
}

export interface EvaluateResponse {
  feedbacks: AIFeedback[];
  overall_pct: number;
}

// File / upload types
export interface StoredFileMeta {
  name: string;
  size: number;
  type: string;
  uri: string;
  source?: 'upload';
}

// Feature types
export type FeatureKey = 'view-summary' | 'ask-questions' | 'quiz-time';

export interface FeatureMeta {
  key: FeatureKey;
  label: string;
  icon: string;
  bgColor: string;
  iconColor: string;
  route: string;
  description: string;
}

// Summary types
export type SummaryLength = 'short' | 'medium' | 'long';
export type SummaryStyle = 'combined' | 'doc-by-doc';
