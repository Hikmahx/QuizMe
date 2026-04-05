'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/global/Header';
import TwoColumnLayout from '@/components/global/TwoColumnLayout';
import Breadcrumb from '@/components/global/Breadcrumb';
import StepBadge from '@/components/global/StepBadge';
import ProgressBar from '@/components/global/ProgressBar';
import OptionCard from '@/components/global/OptionCard';
import InfoList from '@/components/global/InfoList';
import { FEATURE_MAP } from '@/lib/features';
import {
  SUMMARY_LENGTH_OPTIONS,
  SUMMARY_STYLE_OPTIONS,
} from '@/lib/summary-options';
import { useSummaryFlow } from '@/hooks/useSummaryFlow';
import { SummaryLength, SummaryStyle } from '@/types';

const feature = FEATURE_MAP['view-summary'];

// Length step

function LengthStep() {
  const router = useRouter();
  const { length, selectLength, files } = useSummaryFlow();

  const handleContinue = () => {
    if (!length) return;
    // multi-doc: go to style step; single doc: go straight to result
    if (files.length > 1) {
      router.push('/view-summary/options?step=style');
    } else {
      router.push('/view-summary');
    }
  };

  return (
    <>
      <Breadcrumb feature={feature} crumbs={[{ label: 'Summary Length' }]} />
      <div className='px-6 md:px-12 max-w-[1200px] mx-auto w-full'>
        <ProgressBar value={66} />
      </div>
      <TwoColumnLayout
        left={
          <div>
            <StepBadge current={2} total={files.length > 1 ? 3 : 2} />
            <h1 className='text-4xl font-light text-app-text leading-tight mb-2'>
              How detailed
              <strong className='block font-bold'>should it be?</strong>
            </h1>
            <p className='text-app-text-secondary italic text-sm mb-9 leading-relaxed'>
              Choose the level of detail for your summary. You can always
              generate another.
            </p>
            <InfoList
              items={[
                '<strong>Short</strong> summaries are great for a quick refresher before a meeting or exam.',
                '<strong>Medium</strong> strikes the right balance — key arguments without the noise.',
                '<strong>Long</strong> summaries break down every key argument, example, and conclusion.',
              ]}
            />
          </div>
        }
        right={
          <div className='dark-bg rounded-2xl p-8 flex flex-col gap-4'>
            <div className='flex flex-col gap-3'>
              {SUMMARY_LENGTH_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  icon={opt.icon}
                  iconBg={opt.iconBg}
                  iconColor={opt.iconColor}
                  label={opt.label}
                  description={opt.description}
                  selected={length === opt.value}
                  onClick={() => selectLength(opt.value as SummaryLength)}
                />
              ))}
            </div>
            <button
              onClick={handleContinue}
              disabled={!length}
              className='w-full bg-purple-500 text-app-text font-medium text-base rounded-2xl py-4 hover:bg-purple-600 active:scale-[0.99] disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-200 mt-1'
            >
              {files.length > 1 ? 'Continue' : 'Generate Summary'}
            </button>
          </div>
        }
      />
    </>
  );
}

// Style step (multi-doc only)

function StyleStep() {
  const router = useRouter();
  const { style, selectStyle, length, files } = useSummaryFlow();
  const [showWarning, setShowWarning] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const lenLabel = length
    ? length.charAt(0).toUpperCase() + length.slice(1)
    : '';

  const handleContinue = () => {
    if (!style) return;

    // Simulate AI detecting unrelated docs when 3+ files (demo logic)
    if (style === 'combined' && files.length >= 3) {
      setShowWarning(true);
      setIsRedirecting(true);
      setTimeout(() => {
        selectStyle('doc-by-doc');
        router.push('/view-summary');
      }, 2400);
      return;
    }

    router.push('/view-summary');
  };

  return (
    <>
      <Breadcrumb
        feature={feature}
        crumbs={[
          { label: lenLabel, href: '/view-summary/options?step=length' },
          { label: 'Summary Style' },
        ]}
      />
      <div className='px-6 md:px-12 max-w-[1200px] mx-auto w-full'>
        <ProgressBar value={83} />
      </div>
      <TwoColumnLayout
        left={
          <div>
            <StepBadge current={3} total={3} />
            <h1 className='text-4xl font-light text-app-text leading-tight mb-2'>
              How should we
              <strong className='block font-bold'>present it?</strong>
            </h1>
            <p className='text-app-text-secondary italic text-sm mb-9 leading-relaxed'>
              You've uploaded {files.length} documents. Choose how you'd like
              the summary laid out.
            </p>
            <InfoList
              items={[
                '<strong>Combined</strong> weaves all documents into one coherent summary — best when docs share a theme.',
                '<strong>Doc-by-doc</strong> gives each document its own summary you can browse one at a time.',
                'If the AI detects <strong>unrelated documents</strong>, combined mode falls back to doc-by-doc automatically.',
              ]}
            />
          </div>
        }
        right={
          <div className='dark-bg rounded-2xl p-8 flex flex-col gap-4'>
            <div className='flex flex-col gap-3'>
              {SUMMARY_STYLE_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  icon={opt.icon}
                  iconBg={opt.iconBg}
                  iconColor={opt.iconColor}
                  label={opt.label}
                  description={opt.description}
                  selected={style === opt.value}
                  onClick={() => {
                    setShowWarning(false);
                    selectStyle(opt.value as SummaryStyle);
                  }}
                />
              ))}
            </div>

            {/* Warning banner — AI detected unrelated docs */}
            {showWarning && (
              <div className='flex items-start gap-3 bg-red-500/12 border border-red-400/30 rounded-xl p-4 animate-fade-in'>
                <svg
                  className='flex-shrink-0 mt-0.5'
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='#fca5a5'
                  strokeWidth='2'
                  strokeLinecap='round'
                >
                  <circle cx='12' cy='12' r='10' />
                  <line x1='12' y1='8' x2='12' y2='12' />
                  <line x1='12' y1='16' x2='12.01' y2='16' />
                </svg>
                <p className='text-red-300 text-sm leading-relaxed'>
                  <strong className='text-app-text'>
                    Documents appear unrelated.
                  </strong>{' '}
                  Combined mode isn't available — automatically switching to
                  Doc-by-doc.
                </p>
              </div>
            )}

            <button
              onClick={handleContinue}
              disabled={!style || isRedirecting}
              className='w-full bg-purple-500 text-app-text font-medium text-base rounded-2xl py-4 hover:bg-purple-600 active:scale-[0.99] disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-200 mt-1'
            >
              {isRedirecting ? 'Redirecting…' : 'Generate Summary'}
            </button>
          </div>
        }
      />
    </>
  );
}

// Router — delegates to the right sub-step

function OptionsInner() {
  const searchParams = useSearchParams();
  const step = searchParams.get('step') ?? 'length';
  return step === 'style' ? <StyleStep /> : <LengthStep />;
}

export default function ViewSummaryOptionsPage() {
  return (
    <>
      <div className='relative z-10 flex flex-col min-h-screen animate-fade-in'>
        <Header />
        <Suspense>
          <OptionsInner />
        </Suspense>
      </div>
    </>
  );
}
