'use client';

import { StoredFileMeta } from '@/types';
import { fileExtension, extColourClass, formatFileSize } from '@/lib/storage';

interface DefaultResultPanelProps {
  selectedFiles: StoredFileMeta[];
}

export default function DefaultResultPanel({ selectedFiles }: DefaultResultPanelProps) {
  return (
    <div className='flex flex-col gap-5 h-full'>
      <div>
        <div className='flex items-center gap-2 mb-1'>
          <ion-icon name='chatbubbles-outline' style={{ fontSize: '18px', color: '#A729F5' }} />
          <h3 className='text-base font-bold text-app-text'>Q&A — Default</h3>
        </div>
        <p className='text-app-text-secondary text-xs leading-relaxed'>
          Ask anything. The AI answers using the full content of your selected documents.
        </p>
      </div>

      {/* Active docs */}
      <div>
        <p className='text-[10px] font-semibold uppercase tracking-widest text-app-text-secondary mb-2'>
          Active context
        </p>
        <div className='flex flex-col gap-2'>
          {selectedFiles.map((f) => (
            <div
              key={f.name}
              className='flex items-center gap-3 bg-app-card rounded-xl px-3 py-2.5 border border-app-text-secondary/10'
            >
              <span className={`text-[11px] font-bold ${extColourClass(f.name)} w-8 text-center flex-shrink-0`}>
                {fileExtension(f.name)}
              </span>
              <div className='flex-1 min-w-0'>
                <p className='text-app-text text-sm truncate'>{f.name}</p>
                <p className='text-app-text-secondary text-xs'>
                  {f.source === 'paste' && f.wordCount != null
                    ? `${f.wordCount} words · pasted`
                    : formatFileSize(f.size)}
                </p>
              </div>
              <ion-icon name='checkmark-circle' style={{ fontSize: '16px', color: '#26d782', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Quick tips */}
      <div className='mt-auto'>
        <p className='text-[10px] font-semibold uppercase tracking-widest text-app-text-secondary mb-2'>
          Tips
        </p>
        <ul className='flex flex-col gap-2'>
          {[
            'Ask for a summary of any section',
            'Request specific data or statistics',
            'Ask the AI to clarify complex passages',
          ].map((tip, i) => (
            <li key={i} className='flex items-start gap-2 text-xs text-app-text-secondary leading-relaxed'>
              <ion-icon name='bulb-outline' style={{ fontSize: '12px', marginTop: '2px', flexShrink: 0, color: '#A729F5' }} />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
