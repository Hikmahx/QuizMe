'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { StoredFileMeta } from '@/types';
import { fileExtension, extColourClass, formatFileSize } from '@/lib/storage';

// Helpers

function getExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function isTextType(name: string) {
  const ext = getExt(name);
  return ext === 'txt' || ext === 'md';
}

function dataUrlToText(dataUrl: string): string {
  const base64 = dataUrl.split(',')[1] ?? '';
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
  } catch {
    return atob(base64);
  }
}

function extractDocxText(dataUrl: string): string {
  const binary = atob(dataUrl.split(',')[1] ?? '');
  const bodyMatch = binary.match(/<w:body>([\s\S]*?)<\/w:body>/);
  if (bodyMatch) {
    return (
      bodyMatch[1]
        .replace(/<w:p[ >][^>]*>/g, '\n')
        .replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) =>
          String.fromCharCode(parseInt(h, 16)),
        )
        .replace(/\r\n|\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim() || '(Document appears to be empty)'
    );
  }
  return '__COMPRESSED__';
}

/** Very minimal Markdown → safe HTML (no external parser needed) */
function mdToHtml(md: string): string {
  const esc = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const html = esc
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^\s*[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .split(/\n\n+/)
    .map((b) =>
      /^<(h[1-3]|ul|hr|li)/.test(b.trim())
        ? b
        : `<p>${b.replace(/\n/g, '<br/>')}</p>`,
    )
    .join('\n');
  return html;
}

// Copy button 

function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
      setTimeout(() => setState('idle'), 2200);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  };

  const label =
    state === 'copied' ? 'Copied!' : state === 'error' ? 'Failed' : 'Copy text';
  const icon =
    state === 'copied'
      ? 'checkmark-outline'
      : state === 'error'
        ? 'close-outline'
        : 'copy-outline';

  return (
    <button
      onClick={handleCopy}
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
        state === 'copied'
          ? 'bg-green-500/15 border-green-400/40 text-green-400'
          : state === 'error'
            ? 'bg-red-500/15 border-red-400/40 text-red-400'
            : 'bg-app-card border-app-text-secondary/20 text-app-text-secondary hover:text-app-text hover:border-purple-400/50 hover:bg-purple-500/8',
      ].join(' ')}
      title='Copy to clipboard'
    >
      <ion-icon name={icon} style={{ fontSize: '13px' }} />
      {label}
    </button>
  );
}

// Content renderers

function PlainTextPreview({ text }: { text: string }) {
  return (
    <pre className='whitespace-pre-wrap break-words text-sm text-app-text leading-relaxed font-mono p-6 select-text'>
      {text}
    </pre>
  );
}

function MarkdownPreview({ html }: { html: string }) {
  return (
    <div
      className='p-6 text-app-text text-sm leading-relaxed
        [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-purple-400 [&_h1]:mb-3 [&_h1]:mt-5
        [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-purple-300 [&_h2]:mb-2 [&_h2]:mt-4
        [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3
        [&_p]:mb-3 [&_p]:leading-relaxed
        [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1
        [&_code]:bg-app-text-secondary/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
        [&_hr]:border-app-text-secondary/20 [&_hr]:my-4'
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function DocxCompressedFallback() {
  return (
    <div className='flex flex-col items-center justify-center h-full gap-4 p-8 text-center'>
      <div className='w-14 h-14 rounded-2xl bg-yellow-500/12 flex items-center justify-center'>
        <ion-icon
          name='warning-outline'
          style={{ fontSize: '26px', color: '#fbbf24' }}
        />
      </div>
      <p className='text-app-text font-medium'>Preview unavailable</p>
      <p className='text-app-text-secondary text-sm leading-relaxed max-w-xs'>
        This DOCX uses compressed content that can't be rendered in the browser.
        Your file is still valid and will be indexed correctly.
      </p>
    </div>
  );
}

// Modal

interface FilePreviewModalProps {
  file: StoredFileMeta;
  onClose: () => void;
}

export default function FilePreviewModal({
  file,
  onClose,
}: FilePreviewModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 180);
  }, [onClose]);

  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) handleClose();
  };

  // Derive content from dataUrl
  const ext = getExt(file.name);
  const isPdf = ext === 'pdf';
  const isDocx = ext === 'docx' || ext === 'doc';
  const isMd = ext === 'md';
  const isTxt = isTextType(file.name);

  const rawText = isTxt
    ? dataUrlToText(file.dataUrl)
    : isDocx
      ? extractDocxText(file.dataUrl)
      : null;

  const isDocxCompressed = rawText === '__COMPRESSED__';
  const mdHtml = isMd && rawText ? mdToHtml(rawText) : null;

  return (
    <div
      ref={backdropRef}
      onClick={onBackdropClick}
      className={[
        'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4',
        'bg-black/60 backdrop-blur-sm transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <div
        className={[
          'relative flex flex-col bg-app-bg rounded-t-3xl sm:rounded-2xl',
          'w-full sm:max-w-2xl h-[90dvh] sm:h-[82vh]',
          'shadow-2xl overflow-hidden transition-transform duration-200',
          visible ? 'translate-y-0' : 'translate-y-8 sm:translate-y-4',
        ].join(' ')}
      >
        {/* Header */}
        <div className='flex items-center gap-3 px-5 py-4 border-b border-app-text-secondary/12 bg-app-card flex-shrink-0'>
          {/* File type badge */}
          <div className='w-9 h-9 flex-shrink-0 bg-purple-500/12 rounded-[10px] flex items-center justify-center'>
            <span
              className={`text-[11px] font-bold ${extColourClass(file.name)}`}
            >
              {fileExtension(file.name)}
            </span>
          </div>

          {/* File name + size */}
          <div className='flex-1 min-w-0'>
            <p className='text-app-text text-sm font-medium truncate'>
              {file.name}
            </p>
            <p className='text-app-text-secondary text-xs mt-0.5'>
              {file.source === 'paste' && file.wordCount != null
                ? `${file.wordCount} words · pasted text`
                : formatFileSize(file.size)}
            </p>
          </div>

          {/* Copy button — TXT and MD only */}
          {isTxt && rawText && !isDocxCompressed && (
            <CopyButton text={rawText} />
          )}

          {/* Close */}
          <button
            onClick={handleClose}
            className='w-8 h-8 flex items-center justify-center rounded-lg text-app-text-secondary hover:text-app-text hover:bg-app-text-secondary/10 transition-all'
            aria-label='Close preview'
          >
            <ion-icon name='close-outline' style={{ fontSize: '20px' }} />
          </button>
        </div>

        {/* Body */}
        <div className='flex-1 overflow-y-auto scrollbar-thin'>
          {isPdf ? (
            <iframe
              src={file.dataUrl}
              className='w-full h-full border-none'
              title='PDF Preview'
            />
          ) : isDocx && isDocxCompressed ? (
            <DocxCompressedFallback />
          ) : isDocx && rawText ? (
            <PlainTextPreview text={rawText} />
          ) : isMd && mdHtml ? (
            <MarkdownPreview html={mdHtml} />
          ) : isTxt && rawText ? (
            <PlainTextPreview text={rawText} />
          ) : (
            <div className='flex flex-col items-center justify-center h-full gap-3 p-8 text-center'>
              <div className='w-12 h-12 rounded-xl bg-app-text-secondary/8 flex items-center justify-center'>
                <ion-icon
                  name='alert-circle-outline'
                  style={{
                    fontSize: '24px',
                    color: 'var(--color-app-text-secondary)',
                  }}
                />
              </div>
              <p className='text-app-text font-medium'>Preview unavailable</p>
              <p className='text-app-text-secondary text-sm'>
                This file type can't be rendered in the browser.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
