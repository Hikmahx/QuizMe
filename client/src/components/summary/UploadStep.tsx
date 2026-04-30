'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FeatureMeta } from '@/types';
import { useSummaryFlow } from '@/hooks/useSummaryFlow';
import { pasteTextToStoredMeta, MAX_FILES } from '@/lib/storage';
import TwoColumnLayout from '@/components/global/TwoColumnLayout';
import Breadcrumb from '@/components/global/Breadcrumb';
import StepBadge from '@/components/global/StepBadge';
import ProgressBar from '@/components/global/ProgressBar';
import InfoList from '@/components/global/InfoList';
import FileDropzone from '@/components/summary/FileDropzone';
import PasteTextInput from '@/components/summary/PasteTextInput';
import AddDocumentModal from '@/components/summary/AddDocumentModal';

interface UploadStepProps {
  feature: FeatureMeta;
}

const UPLOAD_INFO: Record<string, { subtitle: string; bullets: string[] }> = {
  'view-summary': {
    subtitle: "Add the files you want to summarise. We'll do the rest.",
    bullets: [
      '<strong>Multiple files supported</strong> — upload several documents and summarise all at once.',
      '<strong>PDF, DOCX, and TXT</strong> formats accepted. Max 20 MB per file.',
      '<strong>Paste text</strong> below — up to 2,000 words. Name and save it as a file.',
      'Your content is processed <strong>privately</strong> and never stored after your session ends.',
    ],
  },
  'ask-questions': {
    subtitle: 'Add the files you want to ask questions about.',
    bullets: [
      '<strong>Multiple files supported</strong> — ask questions across all your documents.',
      '<strong>PDF, DOCX, and TXT</strong> formats accepted. Max 20 MB per file.',
      '<strong>Paste text</strong> below — up to 2,000 words. Name and save it as a file.',
      // 'Questions are answered using <strong>RAG</strong> — grounded in your document context.',
    ],
  },
  'quiz-time': {
    subtitle: 'Add the files you want to be quizzed on.',
    bullets: [
      '<strong>Multiple files supported</strong> — quiz across all your documents at once.',
      '<strong>PDF, DOCX, and TXT</strong> formats accepted. Max 20 MB per file.',
      '<strong>Paste text</strong> below — up to 2,000 words. Name and save it as a file.',
      'AI will generate <strong>tailored questions</strong> based on the content you upload.',
    ],
  },
};

export default function UploadStep({ feature }: UploadStepProps) {
  const router = useRouter();
  const { files, addFiles, hydrated } = useSummaryFlow();
  const [hasPendingText, setHasPendingText] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    console.log('UploadStep - files changed:', files.length);
  }, [files]);

  const info = UPLOAD_INFO[feature.key] ?? UPLOAD_INFO['view-summary'];
  const hasFiles = files.length > 0;
  const canAddMore = hasFiles && files.length < MAX_FILES;

  const handlePasteSave = (text: string, filename: string) => {
    addFiles([pasteTextToStoredMeta(text, filename)]);
  };

  const handleContinue = () => {
    if (!hasFiles) return;
    if (feature.key === 'view-summary')
      router.push('/view-summary/options?step=length');
    else if (feature.key === 'ask-questions') router.push('/q-and-a');
    else router.push('/quiz');
  };

  const continueLabel = (() => {
    if (!hasFiles) return 'Continue (0 files)';
    const count = files.length;
    const base = `Continue (${count} file${count !== 1 ? 's' : ''})`;
    return hasPendingText ? `${base} — save text first` : base;
  })();

  const canContinue = hasFiles && !hasPendingText;

  const leftColumn = (
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
  );

  // Loading skeleton
  if (!hydrated) {
    return (
      <>
        <Breadcrumb feature={feature} />
        <div className='px-6 md:px-12 max-w-[1200px] mx-auto w-full'>
          <ProgressBar value={33} />
        </div>
        <TwoColumnLayout
          left={leftColumn}
          right={
            <div className='dark-bg rounded-2xl p-8 flex items-center justify-center min-h-[260px]'>
              <div className='w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin' />
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
        left={leftColumn}
        right={
          <div className='dark-bg rounded-2xl flex flex-col lg:max-h-[calc(100vh-200px)]'>
            <div className='flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-thin'>
              <FileDropzone />

              {/*
               * Paste input: only shown when NO files have been added yet.
               * Once any file exists the user adds via the modal instead.
               */}
              {!hasFiles && (
                <PasteTextInput
                  hasFiles={false}
                  onSave={handlePasteSave}
                  onTextChange={setHasPendingText}
                />
              )}
            </div>

            <div className='flex flex-col gap-3 px-6 pb-6 pt-3'>
              {canAddMore && (
                <>
                  <div className='flex items-center gap-3'>
                    <div className='flex-1 h-px bg-app-text-secondary/12' />
                    <span className='text-app-text-secondary text-xs'>
                      or add more
                    </span>
                    <div className='flex-1 h-px bg-app-text-secondary/12' />
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className='w-full flex items-center justify-center gap-2 border border-app-text-secondary/20 rounded-xl py-3.5 text-app-text-secondary text-sm hover:bg-app-text-secondary/7 hover:border-app-text-secondary/40 hover:text-app-text transition-all'
                  >
                    + Add another document
                  </button>
                </>
              )}

              <button
                onClick={handleContinue}
                disabled={!canContinue}
                className='w-full bg-purple-500 text-white font-medium text-base rounded-2xl py-4 hover:bg-purple-600 active:scale-[0.99] disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-200'
              >
                {continueLabel}
              </button>

              <p className='flex items-center justify-center gap-1.5 text-xs text-app-text-secondary'>
                <ion-icon
                  name='information-circle-outline'
                  style={{ fontSize: '13px' }}
                />
                Max 10 documents per session
              </p>
            </div>
          </div>
        }
      />

      {showAddModal && (
        <AddDocumentModal
          currentFileCount={files.length}
          onClose={() => setShowAddModal(false)}
          onAddFiles={(newFiles) => addFiles(newFiles)}
          onPasteText={(text, filename) =>
            addFiles([pasteTextToStoredMeta(text, filename)])
          }
        />
      )}
    </>
  );
}
