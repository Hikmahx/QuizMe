'use client';

import { useState } from "react";
import { renderMarkdown } from "@/utils/helpers";

interface SummaryCardProps {
  title: string;
  paragraphs: string[];
}

export default function SummaryCard({ title, paragraphs }: SummaryCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = paragraphs.filter(Boolean).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch {
        /* */
      }
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='dark-bg rounded-2xl p-8 pt-0 text-app-text-secondary leading-relaxed text-[15px] h-full bg-app-card max-h-[80vh] overflow-y-scroll'>
      <div className='flex items-center justify-between gap-3 sticky top-0 py-4 bg-app-card z-10'>
        <h3 className='text-app-text text-lg font-semibold'>{title}</h3>
        <button
          onClick={handleCopy}
          disabled={paragraphs.filter(Boolean).length === 0}
          className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-app-text-secondary/20 text-app-text-secondary hover:bg-app-text-secondary/7 hover:border-app-text-secondary/40 hover:text-app-text transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0'
        >
          <ion-icon
            name={copied ? 'checkmark-outline' : 'copy-outline'}
            style={{ fontSize: '14px' }}
          />
          <span className='hidden md:block'>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      {paragraphs.filter(Boolean).map((p, i) => (
        <p key={i} className={'leading-relaxed text-sm ' + (i < paragraphs.length - 1 ? 'mb-4' : '')}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(p) }}>
        </p>
      ))}
    </div>
  );
}
