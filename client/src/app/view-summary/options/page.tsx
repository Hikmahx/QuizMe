'use client';

import { Suspense } from 'react';
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

function LengthStep() {
  const router = useRouter();
  const { length, selectLength, files, generateSummary, clearSummary } =
    useSummaryFlow();

  const handleContinue = () => {
    if (!length) return;
    if (files.length > 1) {
      router.push('/view-summary/options?step=style');
    } else {
      clearSummary();
      generateSummary();
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

function StyleStep() {
  const router = useRouter();
  const { style, selectStyle, length, files, generateSummary, clearSummary } =
    useSummaryFlow();

  const lenLabel = length
    ? length.charAt(0).toUpperCase() + length.slice(1)
    : '';

  const handleContinue = () => {
    if (!style) return;
    clearSummary();
    generateSummary();
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
                  onClick={() => selectStyle(opt.value as SummaryStyle)}
                />
              ))}
            </div>
            <button
              onClick={handleContinue}
              disabled={!style}
              className='w-full bg-purple-500 text-app-text font-medium text-base rounded-2xl py-4 hover:bg-purple-600 active:scale-[0.99] disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-200 mt-1'
            >
              Generate Summary
            </button>
          </div>
        }
      />
    </>
  );
}

function OptionsInner() {
  const searchParams = useSearchParams();
  const step = searchParams.get('step') ?? 'length';
  return step === 'style' ? <StyleStep /> : <LengthStep />;
}

export default function ViewSummaryOptionsPage() {
  return (
    <div className='relative z-10 flex flex-col min-h-screen animate-fade-in'>
      <Header />
      <Suspense>
        <OptionsInner />
      </Suspense>
    </div>
  );
}
