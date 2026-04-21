'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/global/Header';
import Breadcrumb from '@/components/global/Breadcrumb';
import FeedbackCard from '@/components/quiz/FeedbackCard';
import { FEATURE_MAP } from '@/lib/features';
import { useQuizFlow } from '@/hooks/useQuizFlow';
import { QuizAnswerState, QuizQuestion, AIFeedback } from '@/types/quiz';
import { buildAnswerPayloads, evaluateQuizApi } from '@/lib/quiz-api';

const feature = FEATURE_MAP['quiz-time'];

function getStoredCollectionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = JSON.parse(localStorage.getItem('quizme:summary-flow') ?? '{}');
    const id = s.collectionId ?? s.collection_id ?? '';
    return typeof id === 'string' && id ? id : null;
  } catch {
    return null;
  }
}

export default function QuizFeedbackPage() {
  const router = useRouter();
  const flow = useQuizFlow();

  const [answers, setAnswers] = useState<QuizAnswerState[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [feedbacks, setFeedbacks] = useState<AIFeedback[]>([]);
  const [overallPct, setOverallPct] = useState<number | null>(null);
  const [evaluating, setEvaluating] = useState(true);
  const [ready, setReady] = useState(false);

  const isMCQ = flow.questionType === 'mcq';
  const isTheory = !isMCQ;

  useEffect(() => {
    const rawA = sessionStorage.getItem('quizme:answers');
    const rawQ = sessionStorage.getItem('quizme:questions');
    if (!rawA || !rawQ) {
      router.replace('/quiz/score');
      return;
    }

    const parsedAnswers: QuizAnswerState[] = JSON.parse(rawA);
    const parsedQuestions: QuizQuestion[] = JSON.parse(rawQ);

    setAnswers(parsedAnswers);
    setQuestions(parsedQuestions);
    setReady(true);

    // Build payloads and send to the Answer Grader agent
    const collectionId = getStoredCollectionId();
    const payloads = buildAnswerPayloads(
      parsedQuestions,
      parsedAnswers,
      flow.questionType ?? 'mcq',
    );

    evaluateQuizApi(payloads, collectionId).then((result) => {
      setFeedbacks(result.feedbacks);
      setOverallPct(result.overall_pct);
      setEvaluating(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (!ready) return null;

  const correctCount = feedbacks.filter((f) => f?.correct).length;

  return (
    <div className='h-screen flex flex-col overflow-hidden'>
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

      <div className='flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 px-6 md:px-12 max-w-[1200px] mx-auto w-full'>
        {/* LEFT — summary */}
        <div className='lg:pr-16 flex flex-col min-h-0 py-6'>
          <div className='flex-1 overflow-y-auto min-h-0 pr-1'>
            <span className='inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-6'>
              <span className='w-1.5 h-1.5 rounded-full bg-primary' />
              AI Feedback
            </span>
            <h1 className='text-4xl font-light text-app-text leading-tight mb-2'>
              Here's what
              <strong className='block font-bold'>the AI thinks.</strong>
            </h1>
            <p className='text-app-text-secondary italic text-sm mb-8 leading-relaxed'>
              {isTheory
                ? 'Each answer has been graded as a percentage by the AI, based on your uploaded documents.'
                : 'Review each explanation to understand where you went wrong.'}
            </p>

            {/* Score card */}
            <div className='bg-app-card rounded-2xl p-5 flex items-center gap-4'>
              <div className='w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0'>
                <ion-icon
                  name='bar-chart-outline'
                  style={{ fontSize: '24px', color: 'var(--color-primary)' }}
                />
              </div>
              <div>
                {evaluating ? (
                  <>
                    <p className='text-app-text font-semibold text-base'>
                      Grading…
                    </p>
                    <p className='text-app-text-secondary text-sm'>
                      AI agent is evaluating your answers
                    </p>
                  </>
                ) : (
                  <>
                    <p className='text-app-text font-semibold text-base'>
                      {isTheory
                        ? `Overall: ${overallPct}%`
                        : `${correctCount} / ${questions.length} correct`}
                    </p>
                    <p className='text-app-text-secondary text-sm'>
                      {isTheory
                        ? `${correctCount} of ${questions.length} answers passed (≥60%)`
                        : `${Math.round((correctCount / questions.length) * 100)}% accuracy`}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

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

        {/* RIGHT — feedback cards */}
        <div className='flex flex-col min-h-0 py-6'>
          <p className='text-app-text-secondary text-xs font-medium uppercase tracking-wide mb-4 flex-shrink-0'>
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </p>

          <div className='flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 pr-1'>
            {evaluating ? (
              // Loading state while the grader agent is running
              <div className='flex flex-col items-center justify-center h-40 gap-4'>
                <div className='w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin' />
                <p className='text-app-text-secondary text-sm'>
                  Grading {questions.length} answers…
                </p>
              </div>
            ) : (
              questions.map((q, i) => {
                const a = answers[i];
                const feedback = feedbacks[i];

                if (!feedback) return null;

                return (
                  <FeedbackCard
                    key={q.id}
                    index={i}
                    questionText={q.text}
                    correct={feedback.correct}
                    scorePct={feedback.score_pct}
                    explanation={feedback.explanation}
                    tip={feedback.tip}
                    isTheory={isTheory}
                    userAnswer={
                      isMCQ
                        ? q.options?.[a?.answer as number]?.text
                        : typeof a?.answer === 'string'
                          ? a.answer
                          : undefined
                    }
                  />
                );
              })
            )}
          </div>

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
