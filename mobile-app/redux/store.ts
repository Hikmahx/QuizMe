import { configureStore } from '@reduxjs/toolkit';
import uploadReducer from '@/redux/slices/uploadSlice';
import quizReducer from '@/redux/slices/quizSlice';

export const store = configureStore({
  reducer: {
    upload: uploadReducer,
    quiz: quizReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
