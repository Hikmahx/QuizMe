'use client';

import { useRef, useState, useEffect, DragEvent, ChangeEvent } from 'react';
import {
  formatFileSize,
  fileExtension,
  extColourClass,
  MAX_FILE_SIZE,
  MAX_FILES,
} from '@/lib/storage';
import { ACCEPTED_TYPES } from '@/lib/features';
import { useSummaryFlow } from '@/hooks/useSummaryFlow';
import { StoredFileMeta } from '@/types';
import FilePreviewModal from '@/components/summary/FilePreviewModal';

interface FileError {
  id: string;
  name: string;
  error: string;
}

export default function FileDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<FileError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewFile, setPreviewFile] = useState<StoredFileMeta | null>(null);
  const { files, addFiles, removeFile } = useSummaryFlow();

  useEffect(() => {
    if (errors.length === 0) return;
    const timers = errors.map((err) =>
      setTimeout(
        () => setErrors((prev) => prev.filter((e) => e.id !== err.id)),
        3000,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [errors]);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE)
      return `exceeds the 20 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
    const ext = file.name.split('.').pop()?.toLowerCase();
    const accepted = ACCEPTED_TYPES.split(',').map((t) =>
      t.trim().replace('.', ''),
    );
    if (!accepted.includes(ext ?? '')) return `unsupported file type (.${ext})`;
    return null;
  };

  const addFileError = (name: string, error: string) =>
    setErrors((prev) => [
      ...prev,
      { id: `${name}-${Date.now()}-${Math.random()}`, name, error },
    ]);

  const handleFiles = async (raw: FileList | null) => {
    if (!raw) return;
    setIsProcessing(true);
    try {
      const remaining = MAX_FILES - files.length;
      const toProcess = Array.from(raw).slice(0, remaining);
      const valid: File[] = [];
      for (const file of toProcess) {
        const err = validateFile(file);
        if (err) addFileError(file.name, err);
        else valid.push(file);
      }
      if (valid.length > 0) {
        const { fileToStoredMeta } = await import('@/lib/storage');
        const stored = await Promise.all(valid.map(fileToStoredMeta));
        addFiles(stored);
      }
    } catch (err) {
      console.error('Error processing files:', err);
      addFileError(
        'System Error',
        'Failed to process files. Please try again.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const hasFiles = files.length > 0;

  return (
    <>
      <div className='flex flex-col gap-4'>
        {/* Error toasts */}
        {errors.length > 0 && (
          <div className='flex flex-col gap-2'>
            {errors.map((err) => (
              <div
                key={err.id}
                className='flex items-start gap-3 bg-red-500/12 border border-red-400/30 rounded-xl p-4'
              >
                <ion-icon
                  name='alert-circle-outline'
                  style={{
                    fontSize: '16px',
                    color: '#fca5a5',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                />
                <p className='text-red-300 text-sm leading-relaxed flex-1'>
                  <strong className='text-app-text'>{err.name}</strong>{' '}
                  {err.error}
                </p>
                <button
                  onClick={() =>
                    setErrors((prev) => prev.filter((e) => e.id !== err.id))
                  }
                  className='text-red-400 hover:text-red-300 transition-colors'
                  aria-label='Dismiss error'
                >
                  <ion-icon name='close-outline' style={{ fontSize: '16px' }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone */}
        {!hasFiles && (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !isProcessing && inputRef.current?.click()}
            className={[
              'relative flex flex-col items-center gap-3.5 px-8 py-11 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200',
              dragging
                ? 'border-purple-500 bg-purple-500/6'
                : 'border-app-text-secondary/25 bg-white/[0.02] hover:border-purple-500 hover:bg-purple-500/5',
              isProcessing && 'opacity-50 cursor-not-allowed',
            ].join(' ')}
          >
            <input
              ref={inputRef}
              type='file'
              multiple
              accept={ACCEPTED_TYPES}
              className='hidden'
              onChange={onInputChange}
              disabled={isProcessing}
            />

            <div className='w-14 h-14 bg-purple-500/15 rounded-[14px] flex items-center justify-center'>
              {isProcessing ? (
                <div className='w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin' />
              ) : (
                <ion-icon
                  name='cloud-upload-outline'
                  style={{ fontSize: '28px', color: '#A729F5' }}
                />
              )}
            </div>

            <p className='text-app-text font-medium text-base'>
              {isProcessing ? 'Processing files…' : 'Drop files here'}
            </p>
            <p className='text-app-text-secondary text-sm text-center leading-relaxed'>
              Drag & drop, or{' '}
              <span className='text-purple-400 font-medium hover:text-purple-300 transition-colors'>
                browse files
              </span>
            </p>
            <p className='text-app-text-secondary text-xs'>
              PDF · DOCX · TXT · MD · up to 20 MB each
            </p>
          </div>
        )}

        {/* File list */}
        {hasFiles && (
          <div className='flex flex-col gap-2.5'>
            {files.map((f, i) => (
              <FileRow
                key={`${f.name}-${i}`}
                file={f}
                isProcessing={isProcessing}
                onPreview={() => setPreviewFile(f)}
                onRemove={() => removeFile(i)}
              />
            ))}

            <p className='flex items-center justify-center gap-1.5 text-xs text-app-text-secondary/50 pt-0.5'>
              <ion-icon
                name='information-circle-outline'
                style={{ fontSize: '13px' }}
              />
              Click a file to preview its contents
            </p>
          </div>
        )}
      </div>

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
}

// File row


interface FileRowProps {
  file: StoredFileMeta;
  isProcessing: boolean;
  onPreview: () => void;
  onRemove: () => void;
}

function FileRow({ file, isProcessing, onPreview, onRemove }: FileRowProps) {
  return (
    <button
      type='button'
      onClick={onPreview}
      className='group relative w-full flex items-center gap-3 bg-app-card rounded-xl px-4 py-3.5 text-left border border-transparent hover:border-purple-400/30 transition-all duration-150'
    >
      {/* File type badge */}
      <div className='w-9 h-9 flex-shrink-0 bg-purple-500/15 rounded-[10px] flex items-center justify-center'>
        <span className={`text-[11px] font-bold ${extColourClass(file.name)}`}>
          {fileExtension(file.name)}
        </span>
      </div>

      {/* Name + meta — fills remaining space */}
      <div className='flex-1 min-w-0'>
        <p className='text-app-text text-sm font-medium truncate'>
          {file.name}
        </p>
        <p className='text-app-text-secondary text-xs mt-0.5'>
          {file.source === 'paste' && file.wordCount != null
            ? `${file.wordCount} words · pasted text`
            : formatFileSize(file.size)}
        </p>
        <div className='mt-1.5 h-0.5 bg-white/10 rounded-full overflow-hidden'>
          <div className='h-full w-full bg-purple-500 rounded-full' />
        </div>
      </div>

      <span
        aria-hidden
        className='absolute inset-0 flex items-center justify-center gap-1.5 text-xs text-purple-400 font-medium rounded-xl bg-purple-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none'
      >
        <ion-icon name='eye-outline' style={{ fontSize: '15px' }} />
        Preview
      </span>

      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        disabled={isProcessing}
        className='relative z-10 w-7 h-7 flex items-center justify-center rounded-md text-app-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
        aria-label={`Remove ${file.name}`}
      >
        <ion-icon name='close-outline' style={{ fontSize: '16px' }} />
      </button>
    </button>
  );
}
