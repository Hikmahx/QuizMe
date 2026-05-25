import {
  QuizDifficulty,
  QuizQuestionType,
  TheoryInputMode,
  QuizQuestionCount,
  QuizQuestion,
  QuizAnswerState,
  AIFeedback,
  StoredFileMeta,
} from '@/types';

export interface QuizState {
  // Flow options
  difficulty: QuizDifficulty | null;
  questionCount: QuizQuestionCount | null;
  questionType: QuizQuestionType | null;
  inputMode: TheoryInputMode | null;

  // Play state
  questions: QuizQuestion[];
  answers: QuizAnswerState[];
  currentIndex: number;
  loadState: 'idle' | 'uploading' | 'generating' | 'ready' | 'error';
  loadError: string | null;

  // Results
  feedbacks: AIFeedback[];
  overallPct: number | null;
  collectionId: string | null;
}

export interface UploadState {
  files: StoredFileMeta[];
  collectionId: string | null;
  uploadState: 'idle' | 'uploading' | 'done' | 'error';
  uploadError: string | null;
}
