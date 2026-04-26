'use client';

import { useState } from 'react';
import FileNamingModal, { detectExtension } from './FileNamingModal';

const MAX_WORDS = 2000;

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

interface PasteTextInputProps {
  hasFiles: boolean;
  onSave: (text: string, filename: string) => void;
  onTextChange?: (hasText: boolean) => void;
  showDivider?: boolean;
}

export default function PasteTextInput({
  hasFiles,
  onSave,
  onTextChange,
  showDivider = true,
}: PasteTextInputProps) {
  const [text, setText] = useState('');
  const [showModal, setShowModal] = useState(false);

  const wordCount = countWords(text);
  const isOverLimit = wordCount > MAX_WORDS;
  const hasContent = text.trim().length > 0;
  const ext = detectExtension(text);

  const handleChange = (value: string) => {
    setText(value);
    onTextChange?.(value.trim().length > 0);
  };

  const handleSaveClick = () => {
    if (hasContent && !isOverLimit) setShowModal(true);
  };

  const handleConfirm = (name: string, resolvedExt: 'md' | 'txt') => {
    onSave(text, `${name}.${resolvedExt}`);
    setText('');
    onTextChange?.(false);
    setShowModal(false);
  };

  return (
    <>
      {showDivider && (
        <div className='flex items-center gap-3'>
          <div className='flex-1 h-px bg-app-text-secondary/12' />
          <span className='text-app-text-secondary text-xs'>
            {hasFiles ? 'or paste more text' : 'or paste text'}
          </span>
          <div className='flex-1 h-px bg-app-text-secondary/12' />
        </div>
      )}

      <div
        className={`relative rounded-2xl border transition-colors overflow-hidden ${
          hasContent ? 'border-purple-500/60' : 'border-app-text-secondary/20'
        } bg-app-card`}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-4 pt-3 pb-2'>
          <span className='text-app-text-secondary text-sm'>Paste text</span>
          <span
            className={`text-sm tabular-nums ${
              isOverLimit
                ? 'text-red-400'
                : hasContent
                  ? 'text-green-400'
                  : 'text-app-text-secondary'
            }`}
          >
            {wordCount} / {MAX_WORDS} words
          </span>
        </div>
        <div className='relative'>
          {/* Textarea */}
          <textarea
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={
              hasFiles
                ? 'Paste another text to add a second text file…'
                : 'Paste or type up to 2,000 words here…'
            }
            className='w-full bg-transparent px-4 py-2 text-app-text text-sm placeholder:text-app-text-secondary/45 resize-none focus:outline-none'
            rows={5}
          />
          {/* Always rendered — disabled when nothing is typed yet */}
          <button
            onClick={handleSaveClick}
            disabled={!hasContent || isOverLimit}
            className='absolute bottom-4 right-4 px-4 py-1.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs rounded-lg font-medium transition-colors'
          >
            Save
          </button>
        </div>
        <div className='flex items-center justify-between px-4 py-3 border-t border-app-text-secondary/10'>
          {hasContent && !isOverLimit ? (
            <span className='flex items-center gap-1.5 text-xs text-green-400'>
              <ion-icon name='checkmark-outline' style={{ fontSize: '13px' }} />
              {wordCount} words · will save as .{ext}
            </span>
          ) : (
            <span className='flex items-center gap-1.5 text-xs text-app-text-secondary'>
              <ion-icon
                name='information-circle-outline'
                style={{ fontSize: '13px' }}
              />
              {isOverLimit
                ? `Over ${MAX_WORDS} word limit`
                : 'Plain text → .txt · README → .md'}
            </span>
          )}
        </div>
      </div>

      {showModal && (
        <FileNamingModal
          text={text}
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
}
