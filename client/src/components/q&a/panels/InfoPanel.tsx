'use client';

import { QAMode } from '@/types/qa';
import { StoredFileMeta } from '@/types';
import { fileExtension, extColourClass } from '@/lib/storage';

const MODE_BULLETS: Record<QAMode, string[]> = {
  default: [
    'Ask anything about the content of your documents',
    'Get summaries, explanations, and comparisons',
    'Follow-up questions maintain conversation context',
  ],
  resume: [
    'AI reads your resume and job description together',
    'Identify skill gaps and missing keywords',
    'Get a tailored cover letter on request',
  ],
  compare: [
    'Side-by-side structured breakdown of your documents',
    'Compare arguments, style, scope, and conclusions',
    'Ask follow-up questions about specific differences',
  ],
  glossary: [
    'All technical terms extracted and defined',
    'Alphabetical, searchable, and collapsible',
    'Ask the AI to expand on any term',
  ],
};

const MODE_LABEL: Record<QAMode, string> = {
  default: 'Default Q&A',
  resume: 'Resume Mode',
  compare: 'Compare Mode',
  glossary: 'Glossary Mode',
};

interface InfoPanelProps {
  mode: QAMode;
  selectedFiles: StoredFileMeta[];
}

export default function InfoPanel({ mode, selectedFiles }: InfoPanelProps) {
  const bullets = MODE_BULLETS[mode];

  return (
    <div className='flex flex-col gap-6 min-h-[calc(170px-100vh)]'>
      {/* Heading */}
      <div>
        <h2 className='text-3xl font-light text-app-text leading-tight'>
          Ask anything
          <strong className='block font-bold'>about your docs.</strong>
        </h2>
        <p className='text-app-text-secondary text-sm mt-2 italic leading-relaxed'>
          Your questions are answered using context pulled directly from your uploaded documents.
        </p>
      </div>

      {/* What you can ask */}
      <div>
        <p className='text-xs font-semibold uppercase tracking-widest text-app-text-secondary mb-3'>
          What you can do
        </p>
        <ul className='flex flex-col gap-2.5'>
          {bullets.map((b, i) => (
            <li key={i} className='flex items-start gap-2.5 text-sm text-app-text-secondary leading-relaxed'>
              <span className='w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0' />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Active files */}
      {/* <div>
        <p className='text-xs font-semibold uppercase tracking-widest text-app-text-secondary mb-3'>
          Querying
        </p>
        <div className='flex flex-col gap-2'>
          {selectedFiles.map((f) => (
            <div key={f.name} className='flex items-center gap-3 bg-app-bg/50 rounded-xl px-3 py-2.5'>
              <span className={`text-[11px] font-bold ${extColourClass(f.name)}`}>
                {fileExtension(f.name)}
              </span>
              <span className='text-app-text text-sm truncate'>{f.name}</span>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
}
