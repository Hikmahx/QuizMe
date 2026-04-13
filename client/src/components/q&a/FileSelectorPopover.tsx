'use client';

import { useState, useRef, useEffect } from 'react';
import { StoredFileMeta } from '@/types';
import { fileExtension, extColourClass } from '@/lib/storage';

interface FileSelectorPopoverProps {
  allFiles: StoredFileMeta[];
  selectedFiles: StoredFileMeta[];
  /** Called with the full new selection when user confirms the modal */
  onRequestSave: (newSelection: StoredFileMeta[]) => void;
}

export default function FileSelectorPopover({
  allFiles,
  selectedFiles,
  onRequestSave,
}: FileSelectorPopoverProps) {
  const [open, setOpen] = useState(false);
  // Local pending state — user toggles freely without side effects
  const [pendingNames, setPendingNames] = useState<Set<string>>(
    new Set(selectedFiles.map((f) => f.name)),
  );
  const ref = useRef<HTMLDivElement>(null);

  // Reset pending state when popover opens (sync with current selection)
  useEffect(() => {
    if (open) {
      setPendingNames(new Set(selectedFiles.map((f) => f.name)));
    }
  }, [open, selectedFiles]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (name: string) => {
    setPendingNames((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const currentNames = new Set(selectedFiles.map((f) => f.name));
  const hasChanges =
    pendingNames.size !== currentNames.size ||
    [...pendingNames].some((n) => !currentNames.has(n));

  const handleUpdate = () => {
    const newSelection = allFiles.filter((f) => pendingNames.has(f.name));
    setOpen(false);
    onRequestSave(newSelection);
  };

  const selectedCount = pendingNames.size;

  return (
    <div ref={ref} className='relative'>
      <button
        onClick={() => setOpen((v) => !v)}
        className='flex items-center gap-2 bg-app-card border border-app-text-secondary/20 rounded-xl px-3 py-2 text-sm text-app-text-secondary hover:text-app-text hover:border-app-text-secondary/40 transition-all'
      >
        <ion-icon name='documents-outline' style={{ fontSize: '15px' }} />
        <span>
          {selectedFiles.length}/{allFiles.length} file{allFiles.length !== 1 ? 's' : ''}
        </span>
        <ion-icon
          name={open ? 'chevron-up-outline' : 'chevron-down-outline'}
          style={{ fontSize: '12px' }}
        />
      </button>

      {open && (
        <div className='absolute right-0 top-full mt-2 w-72 bg-app-card border border-app-text-secondary/15 rounded-2xl shadow-xl z-40 overflow-hidden'>
          {/* Header */}
          <div className='px-4 py-3 border-b border-app-text-secondary/10'>
            <p className='text-xs font-semibold text-app-text-secondary uppercase tracking-wide'>
              Select active documents
            </p>
            <p className='text-[11px] text-app-text-secondary mt-0.5'>
              Toggle files, then click Update to apply
            </p>
          </div>

          {/* File list */}
          <ul className='py-1 max-h-56 overflow-y-auto'>
            {allFiles.map((f) => {
              const active = pendingNames.has(f.name);
              return (
                <li key={f.name}>
                  <button
                    onClick={() => toggle(f.name)}
                    className='w-full flex items-center gap-3 px-4 py-3 hover:bg-app-text-secondary/8 transition-colors text-left'
                  >
                    {/* Checkbox */}
                    <span
                      className={[
                        'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all',
                        active ? 'bg-purple-500 border-purple-500' : 'border-app-text-secondary/30',
                      ].join(' ')}
                    >
                      {active && (
                        <svg width='9' height='7' viewBox='0 0 9 7' fill='none'>
                          <path
                            d='M1 3.5L3.5 6L8 1'
                            stroke='white'
                            strokeWidth='1.5'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className={`text-[10px] font-bold w-8 text-center flex-shrink-0 ${extColourClass(f.name)}`}
                    >
                      {fileExtension(f.name)}
                    </span>
                    <span className='text-app-text text-sm truncate flex-1'>{f.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Footer — Update button */}
          <div className='px-4 py-3 border-t border-app-text-secondary/10 flex items-center justify-between gap-3'>
            <span className='text-xs text-app-text-secondary'>
              {selectedCount} selected
            </span>
            <div className='flex gap-2'>
              <button
                onClick={() => setOpen(false)}
                className='text-xs text-app-text-secondary hover:text-app-text px-3 py-1.5 rounded-lg border border-app-text-secondary/20 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={!hasChanges || selectedCount === 0}
                className='text-xs font-semibold bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg transition-colors'
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
