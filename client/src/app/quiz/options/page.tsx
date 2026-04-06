'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/global/Header';
import TwoColumnLayout from '@/components/global/TwoColumnLayout';
import Breadcrumb from '@/components/global/Breadcrumb';
import StepBadge from '@/components/global/StepBadge';
import ProgressBar from '@/components/global/ProgressBar';
import InfoList from '@/components/global/InfoList';
import OptionCard from '@/components/global/OptionCard';
import { FEATURE_MAP } from '@/lib/features';
import {
  DIFFICULTY_OPTIONS,
  QUESTION_COUNT_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  INPUT_MODE_OPTIONS,
} from '@/lib/quiz-options';
import { useQuizFlow } from '@/hooks/useQuizFlow';
import {
  QuizDifficulty,
  QuizQuestionCount,
  QuizQuestionType,
  TheoryInputMode,
} from '@/types/quiz';

const feature = FEATURE_MAP['quiz-time'];

const STEP_META = {
  difficulty: {
    heading: ['Choose your', 'difficulty.'],
    subtitle: 'How challenging do you want the questions to be?',
    bullets: [
      '<strong>Easy</strong> — foundational concepts to build your confidence.',
      '<strong>Medium</strong> — a balanced mix that covers the key material.',
      '<strong>Hard</strong> — deep-dive questions that test real understanding.',
    ],
  },
  count: {
    heading: ['How many', 'questions?'],
    subtitle: 'Pick a session length that fits your schedule.',
    bullets: [
      '<strong>10 questions</strong> — a quick 5–10 minute check-in.',
      '<strong>20 questions</strong> — the standard session, well-rounded coverage.',
      '<strong>30 questions</strong> — a thorough deep-dive into everything.',
    ],
  },
  type: {
    heading: ['What type of', 'questions?'],
    subtitle: "Choose how you'd like to be tested.",
    bullets: [
      '<strong>MCQ</strong> — four options, one correct answer. Fast and focused.',
      '<strong>Theory</strong> — open-ended. Demonstrate real understanding in your own words.',
    ],
  },
  input: {
    heading: ['How will you', 'answer?'],
    subtitle: 'Theory questions can be answered in writing or out loud.',
    bullets: [
      '<strong>Written</strong> — type your answers. Works anywhere, no mic needed.',
      '<strong>Oral</strong> — speak your answers. AI reads questions to you, you respond by voice.',
    ],
  },
};

const STEP_ORDER = ['difficulty', 'count', 'type', 'input'];

function QuizOptionsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step') ?? 'difficulty';
  const flow = useQuizFlow();

  const selectedMap: Record<string, string | number | null> = {
    difficulty: flow.difficulty,
    count: flow.questionCount,
    type: flow.questionType,
    input: flow.inputMode,
  };

  const handleSelect = (step: string, value: unknown) => {
    if (step === 'difficulty') flow.setDifficulty(value as QuizDifficulty);
    if (step === 'count') flow.setQuestionCount(value as QuizQuestionCount);
    if (step === 'type') flow.setQuestionType(value as QuizQuestionType);
    if (step === 'input') flow.setInputMode(value as TheoryInputMode);
  };

  const getNextRoute = (step: string): string => {
    if (step === 'difficulty') return '/quiz/options?step=count';
    if (step === 'count') return '/quiz/options?step=type';
    if (step === 'type')
      return flow.questionType === 'theory'
        ? '/quiz/options?step=input'
        : '/quiz/ready';
    return '/quiz/ready';
  };

  const totalSteps = flow.questionType === 'theory' ? 4 : 3;
  const current = STEP_ORDER.indexOf(stepParam) + 1;
  const progress = (current / STEP_ORDER.length) * 60;

  const meta =
    STEP_META[stepParam as keyof typeof STEP_META] ?? STEP_META.difficulty;
  const options =
    stepParam === 'difficulty'
      ? DIFFICULTY_OPTIONS
      : stepParam === 'count'
        ? QUESTION_COUNT_OPTIONS
        : stepParam === 'type'
          ? QUESTION_TYPE_OPTIONS
          : INPUT_MODE_OPTIONS;

  const selected = selectedMap[stepParam];
  const canContinue = selected !== null && selected !== undefined;

  const crumbs = [
    { label: 'Setup', href: '/quiz/options?step=difficulty' },
    { label: meta.heading[1].replace('.', '') },
  ];

  return (
    <>
      <Breadcrumb feature={feature} crumbs={crumbs} />
      <div className='px-6 md:px-12 max-w-[1200px] mx-auto w-full'>
        <ProgressBar value={progress} />
      </div>
      <TwoColumnLayout
        left={
          <div>
            <StepBadge current={current} total={totalSteps} />
            <h1 className='text-4xl font-light text-app-text leading-tight mb-2'>
              {meta.heading[0]}
              <strong className='block font-bold'>{meta.heading[1]}</strong>
            </h1>
            <p className='text-app-text-secondary italic text-sm mb-9 leading-relaxed'>
              {meta.subtitle}
            </p>
            <InfoList items={meta.bullets} />
          </div>
        }
        right={
          <div className='p-8 flex flex-col gap-4'>
            <div className='flex flex-col gap-3'>
              {options.map((opt) => (
                <OptionCard
                  key={String(opt.value)}
                  icon={opt.icon}
                  iconBg={opt.iconBg}
                  iconColor={opt.iconColor}
                  label={opt.label}
                  description={opt.description}
                  selected={selected === opt.value}
                  onClick={() => handleSelect(stepParam, opt.value)}
                />
              ))}
            </div>
            <button
              disabled={!canContinue}
              onClick={() => router.push(getNextRoute(stepParam))}
              className='w-full bg-primary text-white font-medium text-base rounded-2xl py-4 hover:opacity-90 active:scale-[0.99] disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-200 mt-1'
            >
              Continue
            </button>
          </div>
        }
      />
    </>
  );
}

export default function QuizOptionsPage() {
  return (
    <div className='relative z-10 flex flex-col min-h-screen animate-fade-in'>
      <Header />
      <Suspense>
        <QuizOptionsInner />
      </Suspense>
    </div>
  );
}
