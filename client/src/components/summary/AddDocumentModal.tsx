'use client';

import {
  useRef,
  useState,
  DragEvent,
  ChangeEvent,
} from 'react';
import { ACCEPTED_TYPES } from '@/lib/features';
import { fileToStoredMeta, pasteTextToStoredMeta, MAX_FILES } from '@/lib/storage';
import { StoredFileMeta } from '@/types';
import PasteTextInput from './PasteTextInput';

type Tab = 'upload' | 'paste';

interface AddDocumentModalProps {
  currentFileCount: number;
  onClose: () => void;
  onAddFiles: (files: StoredFileMeta[]) => void;
  onPasteText: (text: string, filename: string) => void;
}

export default function AddDocumentModal({
  currentFileCount,
  onClose,
  onAddFiles,
  onPasteText,
}: AddDocumentModalProps) {
  const [tab, setTab] = useState<Tab>('upload');
  const [dragging, setDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = MAX_FILES - currentFileCount;

  const processFiles = async (raw: FileList | null) => {
    if (!raw || raw.length === 0) return;
    setIsProcessing(true);
    setError(null);
    try {
      const list = Array.from(raw).slice(0, remaining);
      const stored = await Promise.all(list.map(fileToStoredMeta));
      onAddFiles(stored);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to process file.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };
  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handlePasteSave = (text: string, filename: string) => {
    onPasteText(text, filename);
    onClose();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='relative bg-app-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 pt-6 pb-4'>
          <h2 className='text-lg font-bold text-app-text'>Add a document</h2>
          <button
            onClick={onClose}
            className='w-8 h-8 flex items-center justify-center rounded-lg text-app-text-secondary hover:text-app-text hover:bg-app-text-secondary/10 transition-colors'
            aria-label='Close'
          >
            <ion-icon name="close-outline" 
            style={{fontSize: '16px'}}
            ></ion-icon>
          </button>
        </div>

        {/* Tab switcher */}
        <div className='mx-6 mb-5 bg-app-bg rounded-xl p-1 flex gap-1'>
          {(['upload', 'paste'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                tab === t
                  ? 'bg-app-card text-app-text shadow-sm'
                  : 'text-app-text-secondary hover:text-app-text'
              }`}
            >
              {t === 'upload' ? 'Upload file' : 'Paste text'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className='px-6 pb-6'>
          {/* Upload tab */}
          {tab === 'upload' && (
            <>
              <input
                ref={inputRef}
                type='file'
                multiple
                accept={ACCEPTED_TYPES}
                className='hidden'
                onChange={onInputChange}
                disabled={isProcessing}
              />

              {error && (
                <p className='text-red-400 text-sm mb-4 bg-red-500/10 border border-red-400/25 rounded-xl px-4 py-3'>
                  {error}
                </p>
              )}

              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() =>
                  !isProcessing && inputRef.current?.click()
                }
                className={[
                  'flex flex-col items-center gap-3 px-8 py-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200',
                  dragging
                    ? 'border-purple-500 bg-purple-500/6'
                    : 'border-app-text-secondary/25 hover:border-purple-500 hover:bg-purple-500/5',
                  isProcessing && 'opacity-50 cursor-not-allowed',
                ].join(' ')}
              >
                <div className='w-12 h-12 bg-purple-500/15 rounded-[12px] flex items-center justify-center'>
                  {isProcessing ? (
                    <div className='w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin' />
                  ) : (
                    <svg
                      width='24'
                      height='24'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='#A729F5'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
                      <polyline points='14 2 14 8 20 8' />
                      <line x1='12' y1='18' x2='12' y2='12' />
                      <line x1='9' y1='15' x2='15' y2='15' />
                    </svg>
                  )}
                </div>

                <p className='text-app-text font-medium text-sm'>
                  {isProcessing ? 'Processing…' : 'Drop file here'}
                </p>
                <p className='text-app-text-secondary text-xs text-center leading-relaxed'>
                  Drag & drop, or{' '}
                  <span className='text-purple-400 font-medium'>
                    browse files
                  </span>
                </p>
                <p className='text-app-text-secondary text-xs'>
                  PDF · DOCX · TXT · up to 20 MB each
                </p>
              </div>
            </>
          )}

          {/* Paste tab */}
          {tab === 'paste' && (
            <PasteTextInput
              hasFiles={true}
              showDivider={false}
              onSave={handlePasteSave}
            />
          )}
        </div>
      </div>
    </div>
  );
}
