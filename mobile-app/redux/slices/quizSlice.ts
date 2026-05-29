import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  QuizDifficulty,
  QuizQuestionCount,
  QuizQuestionType,
  TheoryInputMode,
  QuizQuestion,
  QuizAnswerState,
  AIFeedback,
} from '@/types';

interface QuizState {
  difficulty: QuizDifficulty | null;
  questionCount: QuizQuestionCount | null;
  questionType: QuizQuestionType | null;
  inputMode: TheoryInputMode | null;
  questions: QuizQuestion[];
  answers: QuizAnswerState[];
  currentIndex: number;
  loadState: 'idle' | 'uploading' | 'generating' | 'ready' | 'error';
  loadError: string | null;
  collectionId: string | null;
  feedbacks: AIFeedback[];
  overallPct: number | null;
}

const initialState: QuizState = {
  difficulty: 'easy',
  questionCount: 10,
  questionType: 'mcq',
  inputMode: 'written',
  questions: [],
  answers: [],
  currentIndex: 0,
  loadState: 'idle',
  loadError: null,
  collectionId: null,
  feedbacks: [],
  overallPct: null,
};

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setDifficulty(state, { payload }: PayloadAction<QuizDifficulty>) {
      state.difficulty = payload;
    },

    setQuestionCount(state, { payload }: PayloadAction<QuizQuestionCount>) {
      state.questionCount = payload;
    },

    setQuestionType(state, { payload }: PayloadAction<QuizQuestionType>) {
      state.questionType = payload;
      state.inputMode = null;
    },

    setInputMode(state, { payload }: PayloadAction<TheoryInputMode>) {
      state.inputMode = payload;
    },

    setQuestions(state, { payload }: PayloadAction<QuizQuestion[]>) {
      state.questions = payload;
      state.answers = payload.map(() => ({
        answer: null,
        submitted: false,
        correct: null,
      }));
      state.currentIndex = 0;
    },

    updateAnswer(
      state,
      {
        payload,
      }: PayloadAction<{ index: number; patch: Partial<QuizAnswerState> }>,
    ) {
      const existing = state.answers[payload.index];
      if (existing) {
        state.answers[payload.index] = { ...existing, ...payload.patch };
      }
    },

    setCurrentIndex(state, { payload }: PayloadAction<number>) {
      state.currentIndex = payload;
    },

    setLoadState(state, { payload }: PayloadAction<QuizState['loadState']>) {
      state.loadState = payload;
    },

    setLoadError(state, { payload }: PayloadAction<string | null>) {
      state.loadError = payload;
    },

    setQuizCollectionId(state, { payload }: PayloadAction<string>) {
      state.collectionId = payload;
    },

    setFeedbacks(state, { payload }: PayloadAction<AIFeedback[]>) {
      state.feedbacks = payload;
    },

    setOverallPct(state, { payload }: PayloadAction<number>) {
      state.overallPct = payload;
    },

    resetQuiz(state) {
      state.questions = [];
      state.answers = [];
      state.currentIndex = 0;
      state.loadState = 'idle';
      state.loadError = null;
      state.feedbacks = [];
      state.overallPct = null;
    },
  },
});

export const {
  setDifficulty,
  setQuestionCount,
  setQuestionType,
  setInputMode,
  setQuestions,
  updateAnswer,
  setCurrentIndex,
  setLoadState,
  setLoadError,
  setQuizCollectionId,
  setFeedbacks,
  setOverallPct,
  resetQuiz,
} = quizSlice.actions;

export default quizSlice.reducer;
