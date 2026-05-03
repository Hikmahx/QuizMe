'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/global/Header';
import TwoColumnLayout from '@/components/global/TwoColumnLayout';
import Breadcrumb from '@/components/global/Breadcrumb';
import InfoList from '@/components/global/InfoList';
import QuizCTA from '@/components/global/QuizCTA';
import SummaryCard from '@/components/summary/SummaryCard';
import DocNavigator from '@/components/summary/DocNavigator';
import { FEATURE_MAP } from '@/lib/features';
import { useSummaryFlow } from '@/hooks/useSummaryFlow';

const feature = FEATURE_MAP['view-summary'];

function summaryToParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean);
}

export default function ViewSummaryPage() {
  const router = useRouter();
  const {
    files,
    length,
    style,
    hydrated,
    clearFlow,
    summary,
    summaryLoading,
    summaryError,
    generateSummary,
  } = useSummaryFlow();

  const [docIdx, setDocIdx] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    if (files.length === 0 || !length) {
      if (!summaryLoading) {
        router.replace('/?selected=view-summary/upload');
      }
      return;
    }

    if (!summary && !summaryLoading && !summaryError) {
      generateSummary();
    }
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated) return null;

  // Show the error state even if we can't redirect — don't leave a blank page
  if (!summaryLoading && summaryError && (files.length === 0 || !length)) {
    return (
      <div className='relative z-10 flex flex-col min-h-screen animate-fade-in'>
        <Header />
        <div className='flex flex-col items-center justify-center flex-1 px-6 gap-6'>
          <div className='max-w-md w-full flex flex-col gap-4 p-6 bg-red-500/10 border border-red-400/30 rounded-2xl'>
            <p className='text-red-500 text-sm leading-relaxed'>
              <strong className='text-app-text'>Something went wrong.</strong>{' '}
              {summaryError}
            </p>
            {/* <button
              onClick={() => router.push('/?selected=view-summary/upload')}
              className='self-start px-4 py-2 bg-purple-500 text-white text-sm rounded-xl hover:bg-purple-600 transition-colors'
            >
              Upload files again
            </button> */}
            <p className='text-red-500 text-sm leading-relaxed'>
              Please try refreshing the page. If the issue persists, upload
              files again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (files.length === 0 || !length) return null;

  const isMulti = files.length > 1;
  const lenLabel = length.charAt(0).toUpperCase() + length.slice(1);

  // Use the style the backend actually used (it may have fallen back from combined → doc-by-doc).
  // For single-doc flows, always treat as "default" — the backend should never send doc-by-doc
  // for a single file, but guard here too so stale state never bleeds through.
  const resolvedStyle = isMulti ? (summary?.style ?? style) : 'default';
  const isDocByDoc = resolvedStyle === 'doc-by-doc';
  const isCombined = resolvedStyle === 'combined';

  const styleLabel = isMulti
    ? isDocByDoc
      ? 'Doc-by-doc'
      : isCombined
        ? 'Combined'
        : null
    : null;

  const crumbs = [
    { label: lenLabel, href: '/view-summary/options?step=length' },
    ...(styleLabel
      ? [
          {
            label: styleLabel,
            href: isMulti ? '/view-summary/options?step=style' : undefined,
          },
        ]
      : []),
  ];

  const handleUploadDifferent = () => {
    clearFlow();
    router.push('/?selected=view-summary/upload');
  };

  const rightContent = (() => {
    if (summaryLoading) {
      return (
        <div className='flex flex-col items-center justify-center h-64 gap-4'>
          <div className='w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin' />
          <p className='text-app-text-secondary text-sm text-center leading-relaxed'>
            Generating your summary…
            <br />
            <span className='text-app-text-secondary/60 text-xs'>
              This might take a while for large files.
            </span>
          </p>
        </div>
      );
    }

    if (summaryError) {
      return (
        <div className='flex flex-col gap-4 p-6 bg-red-500/10 border border-red-400/30 rounded-2xl'>
          <p className='text-red-300 text-sm leading-relaxed'>
            <strong className='text-app-text'>Something went wrong.</strong>{' '}
            {summaryError}
          </p>
          <button
            onClick={() => generateSummary()}
            className='self-start px-4 py-2 bg-purple-500 text-white text-sm rounded-xl hover:bg-purple-600 transition-colors'
          >
            Try again
          </button>
        </div>
      );
    }

    if (!summary) return null;

    if (isDocByDoc) {
      const current = summary.summaries[docIdx];
      if (!current) return null;
      return (
        <SummaryCard
          title={current.doc_name}
          paragraphs={summaryToParagraphs(current.summary)}
        />
      );
    }

    const first = summary.summaries[0];
    if (!first) return null;
    return (
      <SummaryCard
        title={isCombined ? 'Combined Summary' : first.doc_name}
        paragraphs={summaryToParagraphs(first.summary)}
      />
    );
  })();

  const leftContent = (
    <div className='flex flex-col h-full gap-8'>
      <div>
        <span className='inline-flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 rounded-full px-4 py-1.5 text-sm text-purple-400 font-medium mb-6'>
          <span className='w-1.5 h-1.5 rounded-full bg-purple-500' />
          {isDocByDoc
            ? 'Doc-by-doc'
            : isCombined
              ? 'Combined Summary'
              : 'Summary'}
        </span>
        <h1 className='text-4xl font-light text-app-text leading-tight mb-2'>
          Here's your
          <strong className='block font-bold'>
            {lenLabel.toLowerCase()} summary.
          </strong>
        </h1>
        <p className='text-app-text-secondary italic text-sm mb-9 leading-relaxed'>
          {isDocByDoc
            ? `Browsing ${files.length} documents one at a time.`
            : isCombined
              ? `A unified summary drawn from all ${files.length} documents you uploaded.`
              : 'Your document has been summarised below.'}
        </p>

        {summary?.fallback && (
          <div className='flex items-start gap-3 bg-amber-500/10 border border-amber-400/30 rounded-xl p-4 mb-6'>
            <p className='text-app-text-secondary text-sm leading-relaxed'>
              <strong className='text-app-text'>
                Documents appear unrelated.
              </strong>{' '}
              Combined mode isn't available — switched to Doc-by-doc
              automatically.
            </p>
          </div>
        )}

        <InfoList
          items={[
            `<strong>${files.length} document${files.length > 1 ? 's' : ''}</strong> processed`,
            `<strong>${lenLabel}</strong> detail level`,
            isDocByDoc
              ? 'Use the arrows to browse each document'
              : isCombined
                ? 'Unified view across all files'
                : 'Ready to quiz when you are',
          ]}
        />
      </div>

      <div className='flex flex-col gap-3 mt-auto'>
        {isDocByDoc && summary && (
          <DocNavigator
            currentIndex={docIdx}
            total={summary.summaries.length}
            currentName={summary.summaries[docIdx]?.doc_name ?? ''}
            prevName={
              docIdx > 0 ? summary.summaries[docIdx - 1].doc_name : undefined
            }
            nextName={
              docIdx < summary.summaries.length - 1
                ? summary.summaries[docIdx + 1].doc_name
                : undefined
            }
            onPrev={() => setDocIdx((i) => Math.max(0, i - 1))}
            onNext={() =>
              setDocIdx((i) =>
                Math.min((summary?.summaries.length ?? 1) - 1, i + 1),
              )
            }
          />
        )}

        <QuizCTA variant='compact' />

        <button
          onClick={handleUploadDifferent}
          className='w-full flex items-center justify-center gap-2 border border-app-text-secondary/20 rounded-xl py-3 text-app-text-secondary text-sm hover:bg-app-text-secondary/7 hover:border-app-text-secondary/40 hover:text-app-text transition-all'
        >
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
          >
            <polyline points='1 4 1 10 7 10' />
            <path d='M3.51 15a9 9 0 1 0 .49-3.36' />
          </svg>
          Use different files
        </button>
      </div>
    </div>
  );

  return (
    <div className='relative z-10 flex flex-col min-h-screen animate-fade-in'>
      <Header />
      <Breadcrumb feature={feature} crumbs={crumbs} />
      <TwoColumnLayout left={leftContent} right={rightContent} />
    </div>
  );
}
