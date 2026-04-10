'use client';

import { useState } from 'react';
import FileNamingModal, { detectExtension } from './FileNamingModal';

const MAX_WORDS = 2000;

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

interface PasteTextInputProps {
  hasFiles: boolean; // True when at least one file already exists in the session
  onSave: (text: string, filename: string) => void; // Called with the raw text and the full filename (e.g. "jd.txt") once the user confirms the naming modal
  onTextChange?: (hasText: boolean) => void; // Fires whenever the textarea content changes so the parent can track unsaved state
  showDivider?: boolean; // Whether to render the "or paste text / or paste more text" divider above (default: true)
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
      {/* Optional divider */}
      {showDivider && (
        <div className='flex items-center gap-3'>
          <div className='flex-1 h-px bg-app-text-secondary/12' />
          <span className='text-app-text-secondary text-xs'>
            {hasFiles ? 'or paste more text' : 'or paste text'}
          </span>
          <div className='flex-1 h-px bg-app-text-secondary/12' />
        </div>
      )}

      {/* Paste area card */}
      <div
        className={`rounded-2xl border transition-colors overflow-hidden ${
          hasContent ? 'border-purple-500/60' : 'border-app-text-secondary/20'
        } bg-app-card`}
      >
        {/* Header row */}
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

        {/* Footer row */}
        <div className='flex items-center justify-between px-4 py-3 border-t border-app-text-secondary/10'>
          {hasContent && !isOverLimit ? (
            <span className='flex items-center gap-1.5 text-xs text-green-400'>
              <ion-icon
                  name='checkmark-outline'
                  style={{ fontSize: '13px' }}
                />
              {wordCount} words · will save as .{ext}
            </span>
          ) : (
            <span className='flex items-center gap-1.5 text-xs text-app-text-secondary'>
              <ion-icon
                name='information-circle-outline'
                style={{ fontSize: '13px' }}
              />
              Plain text → .txt · README → .md
            </span>
          )}

          {hasContent && (
            <button
              onClick={handleSaveClick}
              disabled={isOverLimit}
              className='px-4 py-1.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg font-medium transition-colors'
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Naming modal (portal-like via fixed positioning) */}
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
