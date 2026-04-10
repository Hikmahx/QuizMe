'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';

const PREVIEW_CHARS = 160;

/** Returns 'md' if the text looks like a Markdown README, otherwise 'txt'. */
export function detectExtension(text: string): 'md' | 'txt' {
  const firstLine = text.trim().split('\n')[0];
  return /^#{1,6}\s/.test(firstLine) ? 'md' : 'txt';
}

interface FileNamingModalProps {
  text: string;
  onConfirm: (name: string, ext: 'md' | 'txt') => void;
  onCancel: () => void;
}

export default function FileNamingModal({
  text,
  onConfirm,
  onCancel,
}: FileNamingModalProps) {
  const ext = detectExtension(text);
  const isMarkdown = ext === 'md';
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const preview =
    text.slice(0, PREVIEW_CHARS) +
    (text.length > PREVIEW_CHARS ? '…' : '');
  const canSave = name.trim().length > 0;

  const handleConfirm = () => {
    if (canSave) onConfirm(name.trim(), ext);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onCancel}
      />

      {/* Modal card */}
      <div className='relative bg-app-card rounded-2xl p-7 w-full max-w-md shadow-2xl'>
        <h2 className='text-xl font-bold text-app-text mb-1'>Name your file</h2>
        <p className='text-app-text-secondary text-sm mb-5 leading-relaxed'>
          Give this pasted text a filename. It will be added to your document
          list.
        </p>

        {/* Preview */}
        <div className='bg-app-bg rounded-xl p-4 mb-5'>
          <p className='text-[10px] font-semibold text-app-text-secondary uppercase tracking-widest mb-2'>
            Preview
          </p>
          <p className='text-app-text text-sm leading-relaxed'>{preview}</p>
        </div>

        {/* Filename input */}
        <label className='block text-app-text text-sm font-medium mb-2'>
          File name
        </label>
        <div
          className={`flex rounded-xl border-2 overflow-hidden transition-colors ${
            name.trim()
              ? 'border-purple-500'
              : 'border-app-text-secondary/25'
          }`}
        >
          <input
            ref={inputRef}
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='e.g. my-document'
            className='flex-1 bg-app-card px-4 py-3 text-app-text text-sm focus:outline-none'
          />
          <div className='px-3 flex items-center bg-app-text-secondary/10'>
            <span className='text-app-text-secondary font-medium text-sm'>
              .{ext}
            </span>
          </div>
        </div>

        {/* Extension hint */}
        <p
          className={`flex items-center flex-wrap gap-1.5 text-xs mt-2 ${
            isMarkdown ? 'text-green-400' : 'text-app-text-secondary'
          }`}
        >
          {isMarkdown ? (
            <>
              <svg
                width='12'
                height='12'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
              >
                <polyline points='20 6 9 17 4 12' />
              </svg>
              Markdown README detected — saving as
              <span className='bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded text-[11px] font-semibold'>
                .md
              </span>
            </>
          ) : (
            <>
              <svg
                width='12'
                height='12'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <circle cx='12' cy='12' r='10' />
                <line x1='12' y1='8' x2='12' y2='12' />
                <line x1='12' y1='16' x2='12.01' y2='16' />
              </svg>
              Plain text detected — saving as
              <span className='bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded text-[11px] font-semibold'>
                .txt
              </span>
            </>
          )}
        </p>

        {/* Actions */}
        <div className='flex gap-3 mt-6'>
          <button
            onClick={onCancel}
            className='flex-1 py-3 rounded-xl border border-app-text-secondary/25 text-app-text text-sm font-medium hover:bg-app-text-secondary/8 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canSave}
            className='flex-1 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors'
          >
            Save file
          </button>
        </div>
      </div>
    </div>
  );
}
