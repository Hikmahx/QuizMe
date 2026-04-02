'use client';

import { useRef, useState, DragEvent, ChangeEvent, useEffect } from 'react';
import { formatFileSize, fileExtension, extColourClass } from '@/lib/storage';
import { MAX_FILES, ACCEPTED_TYPES } from '@/lib/features';
import { useSummaryFlow } from '@/hooks/useSummaryFlow';

// Add max file size constant (20MB as mentioned in UI)
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

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
  const { files, addFiles, removeFile } = useSummaryFlow();

  // Debug logging
  useEffect(() => {
    console.log('FileDropzone - files changed:', files.length);
  }, [files]);

  // Auto-dismiss errors after 3 seconds
  useEffect(() => {
    if (errors.length > 0) {
      const timers = errors.map((error) => {
        return setTimeout(() => {
          setErrors((prev) => prev.filter((e) => e.id !== error.id));
        }, 3000);
      });

      return () => {
        timers.forEach((timer) => clearTimeout(timer));
      };
    }
  }, [errors]);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `exceeds the 20MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`;
    }

    // Check file type
    const ext = file.name.split('.').pop()?.toLowerCase();
    const acceptedExts = ACCEPTED_TYPES.split(',').map((t) =>
      t.trim().replace('.', ''),
    );
    if (!acceptedExts.includes(ext || '')) {
      return `unsupported file type (.${ext})`;
    }

    return null;
  };

  const addFileError = (fileName: string, errorMessage: string) => {
    const newError: FileError = {
      id: `${fileName}-${Date.now()}-${Math.random()}`,
      name: fileName,
      error: errorMessage,
    };
    setErrors((prev) => [...prev, newError]);
  };

  const handleFiles = async (raw: FileList | null) => {
    if (!raw) return;

    setIsProcessing(true);

    try {
      const remaining = MAX_FILES - files.length;
      const toProcess = Array.from(raw).slice(0, remaining);

      // Validate files first
      const validFiles: File[] = [];

      for (const file of toProcess) {
        const error = validateFile(file);
        if (error) {
          addFileError(file.name, error);
          // Don't add this file to validFiles
        } else {
          validFiles.push(file);
        }
      }

      // Process only valid files
      if (validFiles.length > 0) {
        const { fileToStoredMeta } = await import('@/lib/storage');
        const stored = await Promise.all(validFiles.map(fileToStoredMeta));
        console.log('Calling addFiles with:', stored.length, 'files');
        addFiles(stored);
      }
    } catch (error) {
      console.error('Error processing files:', error);
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
    // Clear the input value to allow re-uploading the same file
    if (inputRef.current) {
      inputRef.current.value = '';
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
    handleFiles(e.dataTransfer.files);
  };

  const handleBrowseClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (inputRef.current && !isProcessing) {
      inputRef.current.click();
    }
  };

  const handleAddMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (inputRef.current && !isProcessing) {
      inputRef.current.click();
    }
  };

  const hasFiles = files.length > 0;

  return (
    <div className='flex flex-col gap-4'>
      {/* Error display - auto dismisses after 3 seconds */}
      {errors.length > 0 && (
        <div className='flex flex-col gap-2 mb-2'>
          {errors.map((err) => (
            <div
              key={err.id}
              className='flex items-start gap-3 bg-red-500/12 border border-red-400/30 rounded-xl p-4 animate-slide-in'
            >
              <svg
                className='flex-shrink-0 mt-0.5'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='#fca5a5'
                strokeWidth='2'
                strokeLinecap='round'
              >
                <circle cx='12' cy='12' r='10' />
                <line x1='12' y1='8' x2='12' y2='12' />
                <line x1='12' y1='16' x2='12.01' y2='16' />
              </svg>
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
                <svg
                  width='14'
                  height='14'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <line x1='18' y1='6' x2='6' y2='18' />
                  <line x1='6' y1='6' x2='18' y2='18' />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone — hidden once files are added */}
      {!hasFiles && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
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
          <div
            className='w-14 h-14 bg-purple-500/15 rounded-[14px] flex items-center justify-center'
            onClick={handleBrowseClick}
          >
            {isProcessing ? (
              <div className='w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin' />
            ) : (
              <svg
                width='28'
                height='28'
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
          <p
            className='text-app-text font-medium text-base'
            onClick={handleBrowseClick}
          >
            {isProcessing ? 'Processing files...' : 'Drop files here'}
          </p>
          <p
            className='text-app-text-secondary text-sm text-center leading-relaxed'
            onClick={handleBrowseClick}
          >
            Drag & drop, or{' '}
            <span className='text-purple-400 font-medium hover:text-purple-300 transition-colors'>
              browse files
            </span>
          </p>
          <p className='text-app-text-secondary text-xs'>
            PDF · DOCX · TXT · up to 20 MB each
          </p>
        </div>
      )}

      {/* File list - only shows successfully uploaded files */}
      {hasFiles && (
        <div className='flex flex-col gap-2.5'>
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className='flex items-center gap-3 bg-app-card rounded-xl px-4 py-3.5 animate-fade-in'
            >
              <div className='w-9 h-9 flex-shrink-0 bg-purple-500/15 rounded-[10px] flex items-center justify-center'>
                <span
                  className={`text-[11px] font-bold ${extColourClass(f.name)}`}
                >
                  {fileExtension(f.name)}
                </span>
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-app-text text-sm font-medium truncate'>
                  {f.name}
                </p>
                <p className='text-app-text-secondary text-xs mt-0.5'>
                  {formatFileSize(f.size)}
                </p>
                <div className='mt-1.5 h-0.5 bg-white/10 rounded-full overflow-hidden'>
                  <div className='h-full w-full bg-purple-500 rounded-full' />
                </div>
              </div>
              <button
                onClick={() => removeFile(i)}
                disabled={isProcessing}
                className='w-7 h-7 flex items-center justify-center rounded-md text-app-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                aria-label={`Remove ${f.name}`}
              >
                <svg
                  width='14'
                  height='14'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2.5'
                  strokeLinecap='round'
                >
                  <line x1='18' y1='6' x2='6' y2='18' />
                  <line x1='6' y1='6' x2='18' y2='18' />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Divider + add more */}
      {hasFiles && files.length < MAX_FILES && !isProcessing && (
        <>
          <div className='flex items-center gap-3'>
            <div className='flex-1 h-px bg-app-text-secondary/12' />
            <span className='text-app-text-secondary text-xs'>or add more</span>
            <div className='flex-1 h-px bg-app-text-secondary/12' />
          </div>
          <button
            onClick={handleAddMoreClick}
            disabled={isProcessing}
            className='w-full flex items-center justify-center gap-2 border border-app-text-secondary/20 rounded-xl py-3.5 text-app-text-secondary text-sm hover:bg-app-text-secondary/7 hover:border-app-text-secondary/40 hover:text-app-text transition-all disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
            >
              <line x1='12' y1='5' x2='12' y2='19' />
              <line x1='5' y1='12' x2='19' y2='12' />
            </svg>
            Add another document
          </button>
          <input
            ref={inputRef}
            type='file'
            multiple
            accept={ACCEPTED_TYPES}
            className='hidden'
            onChange={onInputChange}
            disabled={isProcessing}
          />
        </>
      )}
    </div>
  );
}
