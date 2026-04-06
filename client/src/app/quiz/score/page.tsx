'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/global/Header';
import TwoColumnLayout from '@/components/global/TwoColumnLayout';
import Breadcrumb from '@/components/global/Breadcrumb';
import { FEATURE_MAP } from '@/lib/features';
import { useQuizFlow } from '@/hooks/useQuizFlow';
import { QuizAnswerState, QuizQuestion } from '@/types/quiz';

const feature = FEATURE_MAP['quiz-time'];

export default function QuizScorePage() {
  const router = useRouter();
  const flow = useQuizFlow();

  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const rawA = sessionStorage.getItem('quizme:answers');
    const rawQ = sessionStorage.getItem('quizme:questions');
    if (!rawA || !rawQ) {
      router.replace('/quiz/options?step=difficulty');
      return;
    }

    const answers: QuizAnswerState[] = JSON.parse(rawA);
    const questions: QuizQuestion[] = JSON.parse(rawQ);

    const isMCQ = flow.questionType === 'mcq';
    const correct = isMCQ
      ? answers.filter((a) => a.correct === true).length
      : Math.floor(questions.length * 0.7);

    setScore(correct);
    setTotal(questions.length);
    setReady(true);
  }, [flow.questionType, router]);

  if (!ready) return null;

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const headline =
    percentage >= 80
      ? 'Excellent work!'
      : percentage >= 50
        ? 'Good effort!'
        : 'Keep practising!';
  const sub =
    percentage >= 80
      ? 'You have a strong grasp of this material.'
      : percentage >= 50
        ? 'Solid foundation — review the feedback to improve.'
        : "Review the feedback carefully and try again — you've got this.";

  return (
    <div className='relative z-10 flex flex-col min-h-screen animate-fade-in'>
      <Header />
      <Breadcrumb feature={feature} crumbs={[{ label: 'Score' }]} />
      <TwoColumnLayout
        left={
          <div>
            <p className='text-app-text-secondary italic text-sm mb-3'>
              Quiz completed
            </p>
            <h1 className='text-app-text text-4xl font-light leading-tight'>
              You scored…
              <strong className='block font-bold mt-1'>{headline}</strong>
            </h1>
            <p className='text-app-text-secondary italic text-sm mt-4 leading-relaxed'>
              {sub}
            </p>
          </div>
        }
        right={
          <div className='flex flex-col gap-4'>
            <div className='bg-app-card rounded-3xl p-10 flex flex-col items-center gap-3'>
              <p
                className='text-app-text font-bold leading-none'
                style={{ fontSize: '5.5rem' }}
              >
                {score}
              </p>
              <p className='text-app-text-secondary text-base'>
                out of {total}
              </p>
            </div>

            <button
              onClick={() => router.push('/quiz/feedback')}
              className='w-full bg-app-card border-2 border-app-text/10 text-app-text font-medium text-base rounded-2xl py-4 hover:border-primary/40 transition-all duration-200'
            >
              View Feedback
            </button>

            <button
              onClick={() => {
                sessionStorage.removeItem('quizme:answers');
                sessionStorage.removeItem('quizme:questions');
                router.push('/quiz/options?step=difficulty');
              }}
              className='w-full bg-primary text-white font-medium text-base rounded-2xl py-4 hover:opacity-90 active:scale-[0.99] transition-all duration-200'
            >
              Play Again
            </button>

            <button
              onClick={() => router.push('/')}
              className='text-app-text-secondary text-sm hover:text-app-text transition-colors text-center'
            >
              ← Back to home
            </button>
          </div>
        }
      />
    </div>
  );
}
