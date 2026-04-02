'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FeatureMeta } from '@/types';
import { useSummaryFlow } from '@/hooks/useSummaryFlow';
import TwoColumnLayout from '@/components/global/TwoColumnLayout';
import Breadcrumb from '@/components/global/Breadcrumb';
import StepBadge from '@/components/global/StepBadge';
import ProgressBar from '@/components/global/ProgressBar';
import InfoList from '@/components/global/InfoList';
import FileDropzone from '@/components/summary/FileDropzone';

interface UploadStepProps {
  feature: FeatureMeta;
}

const UPLOAD_INFO: Record<string, { subtitle: string; bullets: string[] }> = {
  'view-summary': {
    subtitle: "Add the files you want to summarise. We'll do the rest.",
    bullets: [
      '<strong>Multiple files supported</strong> — upload several documents and summarise all of them at once.',
      '<strong>PDF, DOCX, and TXT</strong> formats accepted. Max 20 MB per file.',
      'Your content is processed <strong>privately</strong> and never stored after your session ends.',
    ],
  },
  'ask-questions': {
    subtitle: 'Add the files you want to ask questions about.',
    bullets: [
      '<strong>Multiple files supported</strong> — ask questions across all your documents.',
      '<strong>PDF, DOCX, and TXT</strong> formats accepted. Max 20 MB per file.',
      'Questions are answered using <strong>RAG</strong> — grounded in your document context.',
    ],
  },
  'quiz-time': {
    subtitle: 'Add the files you want to be quizzed on.',
    bullets: [
      '<strong>Multiple files supported</strong> — quiz across all your documents at once.',
      '<strong>PDF, DOCX, and TXT</strong> formats accepted. Max 20 MB per file.',
      'AI will generate <strong>tailored questions</strong> based on the content you upload.',
    ],
  },
};

export default function UploadStep({ feature }: UploadStepProps) {
  const router = useRouter();
  const { files, hydrated } = useSummaryFlow();

  // Debug logging
  useEffect(() => {
    console.log('UploadStep - files changed:', files.length);
  }, [files]);

  const info = UPLOAD_INFO[feature.key] ?? UPLOAD_INFO['view-summary'];

  const handleContinue = () => {
    console.log('Continue clicked, files length:', files.length);
    if (files.length === 0) return;
    
    if (feature.key === 'view-summary') {
      router.push('/view-summary/options?step=length');
    } else if (feature.key === 'ask-questions') {
      router.push('/q-and-a');
    } else {
      router.push('/quiz');
    }
  };

  // Show loading state while hydrating
  if (!hydrated) {
    return (
      <>
        <Breadcrumb feature={feature} />
        <div className='px-6 md:px-12 max-w-[1200px] mx-auto w-full'>
          <ProgressBar value={33} />
        </div>
        <TwoColumnLayout
          left={
            <div>
              <StepBadge current={1} total={3} />
              <h1 className='text-4xl font-light text-app-text leading-tight mb-2'>
                Upload your
                <strong className='block font-bold'>documents.</strong>
              </h1>
              <p className='text-app-text-secondary italic text-sm mb-9 leading-relaxed'>
                {info.subtitle}
              </p>
              <InfoList items={info.bullets} />
            </div>
          }
          right={
            <div className='dark-bg rounded-2xl p-8 flex flex-col gap-5'>
              <div className='flex items-center justify-center py-12'>
                <div className='w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin' />
              </div>
            </div>
          }
        />
      </>
    );
  }

  return (
    <>
      <Breadcrumb feature={feature} />
      <div className='px-6 md:px-12 max-w-[1200px] mx-auto w-full'>
        <ProgressBar value={33} />
      </div>
      <TwoColumnLayout
        left={
          <div>
            <StepBadge current={1} total={3} />
            <h1 className='text-4xl font-light text-app-text leading-tight mb-2'>
              Upload your
              <strong className='block font-bold'>documents.</strong>
            </h1>
            <p className='text-app-text-secondary italic text-sm mb-9 leading-relaxed'>
              {info.subtitle}
            </p>
            <InfoList items={info.bullets} />
          </div>
        }
        right={
          <div className='dark-bg rounded-2xl p-8 flex flex-col gap-5'>
            <FileDropzone />

            <button
              onClick={handleContinue}
              disabled={files.length === 0}
              className='w-full bg-purple-500 text-app-text font-medium text-base rounded-2xl py-4 hover:bg-purple-600 active:scale-[0.99] disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-200'
            >
              Continue ({files.length} file{files.length !== 1 ? 's' : ''})
            </button>

            <p className='flex items-center justify-center gap-1.5 text-xs text-app-text-secondary'>
              <svg
                width='13'
                height='13'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
              >
                <circle cx='12' cy='12' r='10' />
                <line x1='12' y1='8' x2='12' y2='12' />
                <line x1='12' y1='16' x2='12.01' y2='16' />
              </svg>
              Max 10 documents per session
            </p>
          </div>
        }
      />
    </>
  );
}