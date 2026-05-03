'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/global/Header';
import Breadcrumb from '@/components/global/Breadcrumb';
import ProgressBar from '@/components/global/ProgressBar';
import StepBadge from '@/components/global/StepBadge';
import TwoColumnLayout from '@/components/global/TwoColumnLayout';
import OptionCard from '@/components/global/OptionCard';
import { FEATURE_MAP } from '@/lib/features';
import { useSummaryFlow } from '@/hooks/useSummaryFlow';
import { QAMode } from '@/types/qa';

const feature = FEATURE_MAP['ask-questions'];

interface ModeOption {
  mode: QAMode;
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  description: string;
}

const MODES: ModeOption[] = [
  {
    mode: 'default',
    icon: 'chatbubble-ellipses-outline',
    iconBg: 'bg-green-400/15',
    iconColor: 'text-green-400',
    label: 'Default Q&A',
    description:
      'Ask anything. The AI answers grounded in your document content.',
  },
  {
    mode: 'resume',
    icon: 'document-text-outline',
    iconBg: 'bg-orange-400/15',
    iconColor: 'text-orange-400',
    label: 'Resume Mode',
    description:
      'Skill gap analysis, resume rewrites, and cover letter — from your resume + JD.',
  },
  {
    mode: 'compare',
    icon: 'git-compare-outline',
    iconBg: 'bg-blue-400/15',
    iconColor: 'text-blue-400',
    label: 'Compare Mode',
    description: 'Side-by-side structured breakdown of two or more documents.',
  },
  {
    mode: 'glossary',
    icon: 'book-outline',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    label: 'Glossary Mode',
    description:
      'Extract and define all technical terms. Searchable, alphabetical, exportable.',
  },
];

const LEFT_INFO: Record<
  QAMode,
  { headline: string; sub: string; bullets: string[] }
> = {
  default: {
    headline: 'Ask anything about your documents.',
    sub: 'Answers are pulled directly from your uploaded content.',
    bullets: [
      'Works with any document type or topic',
      'Follow-up questions keep full conversation context',
      'Switch modes at any point in the chat',
    ],
  },
  resume: {
    headline: 'Supercharge your job application.',
    sub: 'The agent reads your resume and JD together.',
    bullets: [
      'Identifies skill gaps and missing keywords',
      'Suggests specific resume rewrites',
      'Drafts a tailored cover letter on request',
    ],
  },
  compare: {
    headline: 'Understand how your docs differ.',
    sub: 'Multi-step agent processes each doc independently.',
    bullets: [
      'Synthesises findings into a structured comparison table',
      'Compare arguments, style, scope, and conclusions',
      'Works best with 2 or more documents',
    ],
  },
  glossary: {
    headline: 'Master the terminology.',
    sub: 'All jargon extracted and defined in one place.',
    bullets: [
      'Alphabetical, searchable, and collapsible',
      'Ask the AI to expand on any term',
      'Export the full glossary as a PDF',
    ],
  },
};

export default function QAndAModePage() {
  const router = useRouter();
  const { files } = useSummaryFlow();
  const [selected, setSelected] = useState<QAMode>('default');

  const info = LEFT_INFO[selected];

  return (
    <div className='relative z-10 flex flex-col min-h-screen'>
      <Header />
      <Breadcrumb feature={feature} crumbs={[{ label: 'Choose Mode' }]} />
      <div className='px-6 md:px-12 max-w-[1200px] mx-auto w-full'>
        <ProgressBar value={66} />
      </div>

      <TwoColumnLayout
        left={
          <div className='flex flex-col gap-6'>
            <div>
              <StepBadge current={2} total={3} />
              <h1 className='text-4xl font-light text-app-text leading-tight mb-2'>
                Choose a<strong className='block font-bold'>mode.</strong>
              </h1>
              <p className='text-app-text-secondary italic text-sm mb-1 leading-relaxed'>
                {info.headline}
              </p>
              <p className='text-app-text-secondary text-sm mb-5 leading-relaxed'>
                {info.sub}
              </p>
              <ul className='flex flex-col gap-2.5'>
                {info.bullets.map((b, i) => (
                  <li
                    key={i}
                    className='flex items-start gap-2.5 text-sm text-app-text-secondary leading-relaxed'
                  >
                    <span className='w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0' />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className='inline-flex items-center gap-2 bg-app-card border border-app-text-secondary/15 rounded-xl px-3 py-2 w-fit'>
              <ion-icon
                name='documents-outline'
                style={{
                  fontSize: '15px',
                  color: 'var(--color-app-text-secondary)',
                }}
              />
              <span className='text-app-text-secondary text-sm'>
                {files.length} document{files.length !== 1 ? 's' : ''} ready
              </span>
            </div>
          </div>
        }
        right={
          <div className='dark-bg rounded-2xl flex flex-col lg:max-h-[calc(100vh-200px)]'>
            <div className='lg:flex-1 lg:overflow-y-auto p-5 flex flex-col gap-3'>
              {MODES.map((m) => (
                <OptionCard
                  key={m.mode}
                  icon={m.icon}
                  iconBg={m.iconBg}
                  iconColor={m.iconColor}
                  label={m.label}
                  description={m.description}
                  selected={selected === m.mode}
                  onClick={() => setSelected(m.mode)}
                />
              ))}
            </div>

            <div className='px-5 pb-5 pt-3 border-t border-app-text-secondary/10 flex flex-col gap-3'>
              <button
                onClick={() => router.push(`/q-and-a/chat?mode=${selected}`)}
                className='w-full bg-purple-500 hover:bg-purple-600 text-white font-medium text-base rounded-2xl py-4 active:scale-[0.99] transition-all duration-200'
              >
                Continue with {MODES.find((m) => m.mode === selected)?.label} →
              </button>
              <p className='flex items-center justify-center gap-1.5 text-xs text-app-text-secondary'>
                <ion-icon
                  name='information-circle-outline'
                  style={{ fontSize: '13px' }}
                />
                You can switch modes at any time in the chat
              </p>
            </div>
          </div>
        }
      />
    </div>
  );
}
