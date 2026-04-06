'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/global/Header';
import Breadcrumb from '@/components/global/Breadcrumb';
import FeedbackCard from '@/components/quiz/FeedbackCard';
import { FEATURE_MAP } from '@/lib/features';
import { useQuizFlow } from '@/hooks/useQuizFlow';
import { QuizAnswerState, QuizQuestion } from '@/types/quiz';
import { MOCK_FEEDBACKS } from '@/lib/quiz-mock';

const feature = FEATURE_MAP['quiz-time'];

export default function QuizFeedbackPage() {
  const router = useRouter();
  const flow = useQuizFlow();

  const [answers, setAnswers] = useState<QuizAnswerState[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const rawA = sessionStorage.getItem('quizme:answers');
    const rawQ = sessionStorage.getItem('quizme:questions');
    if (!rawA || !rawQ) {
      router.replace('/quiz/score');
      return;
    }
    setAnswers(JSON.parse(rawA));
    setQuestions(JSON.parse(rawQ));
    setReady(true);
  }, [router]);

  if (!ready) return null;

  const isMCQ = flow.questionType === 'mcq';
  const correctCount = isMCQ
    ? answers.filter((a) => a.correct).length
    : Math.floor(questions.length * 0.7);

  return (
    // Fixed 100vh — same structure as play page
    <div className='h-screen flex flex-col overflow-hidden'>
      {/* Fixed header */}
      <div className='flex-shrink-0'>
        <Header />
        <Breadcrumb
          feature={feature}
          crumbs={[
            { label: 'Score', href: '/quiz/score' },
            { label: 'Feedback' },
          ]}
        />
      </div>

      {/* Two-column body */}
      <div className='flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 px-6 md:px-12 max-w-[1200px] mx-auto w-full'>
        {/* LEFT — context */}
        <div className='lg:pr-16 flex flex-col min-h-0 py-6'>
          <div className='flex-1 overflow-y-auto min-h-0 pr-1'>
            <span className='inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-6'>
              <span className='w-1.5 h-1.5 rounded-full bg-primary' />
              AI Feedback
            </span>
            <h1 className='text-4xl font-light text-app-text leading-tight mb-2'>
              Here's what
              <strong className='block font-bold'>you got wrong.</strong>
            </h1>
            <p className='text-app-text-secondary italic text-sm mb-8 leading-relaxed'>
              Review each explanation to understand where you went wrong and how
              to improve.
            </p>

            {/* Score mini-card */}
            <div className='bg-app-card rounded-2xl p-5 flex items-center gap-4'>
              <div className='w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0'>
                <ion-icon
                  name='bar-chart-outline'
                  style={{ fontSize: '24px', color: 'var(--color-primary)' }}
                />
              </div>
              <div>
                <p className='text-app-text font-semibold text-base'>
                  {isMCQ
                    ? `${correctCount} / ${questions.length} correct`
                    : `${questions.length} answers reviewed`}
                </p>
                <p className='text-app-text-secondary text-sm'>
                  {isMCQ
                    ? `${Math.round((correctCount / questions.length) * 100)}% accuracy`
                    : 'Theory — AI graded your responses'}
                </p>
              </div>
            </div>
          </div>

          {/* Fixed bottom — action buttons in left col */}
          <div className='flex-shrink-0 pt-4 border-t border-app-text/10 flex flex-col gap-3'>
            <button
              onClick={() => {
                sessionStorage.removeItem('quizme:answers');
                sessionStorage.removeItem('quizme:questions');
                router.push('/quiz/options?step=difficulty');
              }}
              className='w-full bg-primary text-white font-medium text-base rounded-2xl py-3.5 hover:opacity-90 transition-all'
            >
              Play Again
            </button>
            <button
              onClick={() => router.push('/')}
              className='w-full border border-app-text/15 text-app-text-secondary text-sm rounded-2xl py-3 hover:border-app-text/30 hover:text-app-text transition-all'
            >
              ← Back to home
            </button>
          </div>
        </div>

        {/* RIGHT — scrollable feedback cards */}
        <div className='flex flex-col min-h-0 py-6'>
          <p className='text-app-text-secondary text-xs font-medium uppercase tracking-wide mb-4 flex-shrink-0'>
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </p>

          <div className='flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 pr-1'>
            {questions.map((q, i) => {
              const a = answers[i];
              const feedback = MOCK_FEEDBACKS[i % MOCK_FEEDBACKS.length];
              const correct = isMCQ ? (a?.correct ?? false) : i % 3 !== 0;

              return (
                <FeedbackCard
                  key={q.id}
                  index={i}
                  questionText={q.text}
                  correct={correct}
                  explanation={feedback.explanation}
                  tip={feedback.tip}
                  userAnswer={
                    isMCQ
                      ? q.options?.[a?.answer as number]?.text
                      : typeof a?.answer === 'string'
                        ? a.answer
                        : undefined
                  }
                />
              );
            })}
          </div>

          {/* Back to score — fixed bottom right */}
          <div className='flex-shrink-0 pt-4 border-t border-app-text/10'>
            <button
              onClick={() => router.push('/quiz/score')}
              className='w-full border border-app-text/20 text-app-text-secondary text-sm rounded-2xl py-3 hover:bg-app-card hover:border-app-text/40 hover:text-app-text transition-all'
            >
              ← Back to Score
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
