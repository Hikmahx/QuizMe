'use client';

import { useState } from 'react';
import { renderMarkdown } from "@/utils/helpers";
import CopyButton from "@/components/global/CopyButton";
import ShareDropdown from "@/components/global/ShareDropdown";
import EmailShareModal from "@/components/summary/EmailShareModal";

interface SummaryCardProps {
  title: string;
  paragraphs: string[];
}

export default function SummaryCard({ title, paragraphs }: SummaryCardProps) {
  const text = paragraphs.filter(Boolean).join('\n\n');
  const [showEmailModal, setShowEmailModal] = useState(false);

  return (
    <div className='dark-bg rounded-2xl p-8 pt-0 text-app-text-secondary leading-relaxed text-[15px] h-full bg-app-card max-h-[80vh] overflow-y-scroll'>
      <div className='flex items-center justify-between gap-3 sticky top-0 py-4 bg-app-card z-10'>
        <h3 className='text-app-text text-lg font-semibold'>{title}</h3>
        <div className='flex items-center gap-2'>
          <CopyButton text={text} />
          <ShareDropdown onEmail={() => setShowEmailModal(true)} />
        </div>
      </div>
      {paragraphs.filter(Boolean).map((p, i) => (
        <p key={i} className={'leading-relaxed text-sm ' + (i < paragraphs.length - 1 ? 'mb-4' : '')}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(p) }}>
        </p>
      ))}

      {showEmailModal && (
        <EmailShareModal
          summary={text}
          docName={title}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
}
