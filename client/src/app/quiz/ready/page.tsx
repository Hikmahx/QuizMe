'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/global/Header';
import TwoColumnLayout from '@/components/global/TwoColumnLayout';
import Breadcrumb from '@/components/global/Breadcrumb';
import { FEATURE_MAP } from '@/lib/features';
import { useQuizFlow } from '@/hooks/useQuizFlow';
import { getStoredCollectionId } from '@/lib/storage';

const feature = FEATURE_MAP['quiz-time'];
const TYPE_LABEL: Record<string, string> = {
  mcq: 'Multiple Choice',
  theory: 'Theory',
};

export default function QuizReadyPage() {
  const router = useRouter();
  const flow = useQuizFlow();

  useEffect(() => {
    if (!flow.hydrated) return;
    if (!flow.difficulty || !flow.questionCount || !flow.questionType) {
      router.replace('/quiz/options?step=difficulty');
    }
    if (flow.questionType === 'theory' && !flow.inputMode) {
      router.replace('/quiz/options?step=input');
    }
  }, [flow, router]);

  if (
    !flow.hydrated ||
    !flow.difficulty ||
    !flow.questionCount ||
    !flow.questionType
  )
    return null;

  const hasDocuments = !!getStoredCollectionId();

  const summaryItems = [
    {
      label: 'Difficulty',
      icon: 'speedometer-outline',
      value: flow.difficulty.charAt(0).toUpperCase() + flow.difficulty.slice(1),
    },
    {
      label: 'Questions',
      icon: 'help-circle-outline',
      value: `${flow.questionCount} questions`,
    },
    {
      label: 'Type',
      icon: 'document-text-outline',
      value: TYPE_LABEL[flow.questionType] ?? flow.questionType,
    },
    ...(flow.questionType === 'theory' && flow.inputMode
      ? [
          {
            label: 'Answer mode',
            icon: flow.inputMode === 'oral' ? 'mic-outline' : 'keypad-outline',
            value: flow.inputMode === 'oral' ? 'Oral' : 'Written',
          },
        ]
      : []),
    {
      label: 'Source',
      icon: hasDocuments ? 'document-text-outline' : 'cube-outline',
      value: hasDocuments ? 'Your uploaded documents' : 'Sample questions',
    },
  ];

  return (
    <div className='relative z-10 flex flex-col min-h-screen animate-fade-in'>
      <Header />
      <Breadcrumb
        feature={feature}
        crumbs={[
          { label: 'Setup', href: '/quiz/options?step=difficulty' },
          { label: 'Ready?' },
        ]}
      />
      <TwoColumnLayout
        left={
          <div>
            <span className='inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-6'>
              <span className='w-1.5 h-1.5 rounded-full bg-primary' />
              All set
            </span>
            <h1 className='text-4xl font-light text-app-text leading-tight mb-2'>
              Here's your
              <strong className='block font-bold'>quiz summary.</strong>
            </h1>
            <p className='text-app-text-secondary italic text-sm mb-9 leading-relaxed'>
              Double-check your settings. When you're ready, hit Start Quiz.
            </p>
            <ul className='flex flex-col gap-4'>
              {summaryItems.map((item) => (
                <li key={item.label} className='flex items-center gap-3'>
                  <span className='w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0'>
                    <ion-icon
                      name={item.icon}
                      style={{
                        fontSize: '16px',
                        color: 'var(--color-primary)',
                      }}
                    />
                  </span>
                  <span className='text-sm text-app-text-secondary'>
                    <strong className='text-app-text font-medium'>
                      {item.label}:
                    </strong>{' '}
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push('/quiz/options?step=difficulty')}
              className='mt-8 flex items-center gap-2 text-app-text-secondary text-sm hover:text-app-text transition-colors'
            >
              <ion-icon name='refresh-outline' style={{ fontSize: '14px' }} />
              Change settings
            </button>
          </div>
        }
        right={
          <div className='flex flex-col gap-4'>
            <div className='bg-app-card rounded-3xl p-8 flex flex-col items-center text-center gap-5'>
              <div className='w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center'>
                <ion-icon
                  name='brain-outline'
                  style={{ fontSize: '40px', color: 'var(--color-primary)' }}
                />
              </div>
              <div>
                <h2 className='text-app-text text-2xl font-bold mb-2'>
                  Are you ready?
                </h2>
                <p className='text-app-text-secondary text-sm leading-relaxed max-w-xs mx-auto'>
                  {flow.questionType === 'theory' && flow.inputMode === 'oral'
                    ? "Make sure your microphone is enabled. The AI reads each question aloud, then it's your turn."
                    : 'Move through each question at your own pace. You can go back to review.'}
                </p>
              </div>

              {hasDocuments && (
                <div className='w-full bg-primary/10 border border-primary/25 rounded-xl p-4 text-left'>
                  <div className='flex items-center gap-2 mb-2'>
                    <ion-icon
                      name='sparkles-outline'
                      style={{
                        fontSize: '14px',
                        color: 'var(--color-primary)',
                      }}
                    />
                    <p className='text-primary text-xs font-semibold'>
                      AI-generated questions
                    </p>
                  </div>
                  <p className='text-app-text-secondary text-xs leading-relaxed'>
                    Questions will be generated from your documents at{' '}
                    <strong className='text-app-text'>{flow.difficulty}</strong>{' '}
                    difficulty. Answers are also graded by the AI against your
                    documents. Expect 15–90 seconds on the first load.
                  </p>
                </div>
              )}

              {flow.questionType === 'theory' && flow.inputMode === 'oral' && (
                <div className='w-full bg-primary/10 border border-primary/25 rounded-xl p-4 text-left'>
                  <div className='flex items-center gap-2 mb-2'>
                    <ion-icon
                      name='mic-outline'
                      style={{
                        fontSize: '14px',
                        color: 'var(--color-primary)',
                      }}
                    />
                    <p className='text-primary text-xs font-semibold'>
                      Oral mode tips
                    </p>
                  </div>
                  <ul className='text-app-text-secondary text-xs space-y-1 leading-relaxed'>
                    <li>• AI reads each question aloud before you record</li>
                    <li>• Tap "Start Recording" when ready to answer</li>
                    <li>
                      • Tap "Stop Recording" when done — review your transcript
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push('/quiz/play')}
              className='w-full bg-primary text-white font-semibold text-base rounded-2xl py-4 hover:opacity-90 active:scale-[0.99] transition-all duration-200'
            >
              Start Quiz
            </button>
            <p className='text-app-text-secondary text-xs text-center'>
              {flow.questionCount} questions · {flow.difficulty} ·{' '}
              {TYPE_LABEL[flow.questionType ?? 'mcq']}
            </p>
          </div>
        }
      />
    </div>
  );
}
