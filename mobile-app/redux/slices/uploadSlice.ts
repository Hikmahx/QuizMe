import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StoredFileMeta } from '@/types';

interface UploadState {
  files: StoredFileMeta[];
  collectionId: string | null;
  status: 'idle' | 'uploading' | 'done' | 'error';
  error: string | null;
}

const initialState: UploadState = {
  files: [],
  collectionId: null,
  status: 'idle',
  error: null,
};

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    addFile(state, { payload }: PayloadAction<StoredFileMeta>) {
      if (state.files.length < 2) {
        state.files.push(payload);
        state.collectionId = null;
        state.status = 'idle';
      }
    },

    removeFile(state, { payload }: PayloadAction<number>) {
      state.files.splice(payload, 1);
      state.collectionId = null;
      state.status = 'idle';
    },

    clearFiles(state) {
      Object.assign(state, initialState);
    },

    setCollectionId(state, { payload }: PayloadAction<string>) {
      state.collectionId = payload;
    },

    setUploadStatus(state, { payload }: PayloadAction<UploadState['status']>) {
      state.status = payload;
    },

    setUploadError(state, { payload }: PayloadAction<string | null>) {
      state.error = payload;
    },
  },
});

export const {
  addFile,
  removeFile,
  clearFiles,
  setCollectionId,
  setUploadStatus,
  setUploadError,
} = uploadSlice.actions;

export default uploadSlice.reducer;
