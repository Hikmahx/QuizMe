'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/global/Header';
import Breadcrumb from '@/components/global/Breadcrumb';
import FeedbackCard from '@/components/quiz/FeedbackCard';
import { FEATURE_MAP } from '@/lib/features';
import { QuizAnswerState, QuizQuestion, AIFeedback } from '@/types/quiz';
import { evaluateQuizApi } from '@/lib/quiz-api';
import { getStoredCollectionId } from '@/lib/storage';

const feature = FEATURE_MAP['quiz-time'];

/**
 * Read questionType from sessionStorage (written there by play/page.tsx).
 * This avoids relying on the useQuizFlow hook whose value can be stale
 * if the component mounts before the hook hydrates from localStorage.
 */
function getStoredQuestionType(): 'mcq' | 'theory' | null {
  if (typeof window === 'undefined') return null;
  const t = sessionStorage.getItem('quizme:questionType');
  return t === 'mcq' || t === 'theory' ? t : null;
}

export default function QuizFeedbackPage() {
  const router = useRouter();

  const [answers, setAnswers] = useState<QuizAnswerState[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [feedbacks, setFeedbacks] = useState<AIFeedback[]>([]);
  const [overallPct, setOverallPct] = useState<number | null>(null);
  const [evaluating, setEvaluating] = useState(true);
  const [ready, setReady] = useState(false);
  const [questionType, setQuestionType] = useState<'mcq' | 'theory' | null>(
    null,
  );

  useEffect(() => {
    const rawA = sessionStorage.getItem('quizme:answers');
    const rawQ = sessionStorage.getItem('quizme:questions');

    if (!rawA || !rawQ) {
      router.replace('/quiz/score');
      return;
    }

    const parsedAnswers: QuizAnswerState[] = JSON.parse(rawA);
    const parsedQuestions: QuizQuestion[] = JSON.parse(rawQ);
    const qType = getStoredQuestionType();

    setAnswers(parsedAnswers);
    setQuestions(parsedQuestions);
    setQuestionType(qType);
    setReady(true);

    const collectionId = getStoredCollectionId();

    const correctPayloads = parsedQuestions.map((q, i) => {
      const ans = parsedAnswers[i];

      if (qType === 'mcq') {
        const userText =
          typeof ans?.answer === 'number'
            ? (q.options?.[ans.answer]?.text ?? '')
            : '';
        const correctText =
          q.correctIndex !== undefined
            ? (q.options?.[q.correctIndex]?.text ?? '')
            : '';
        return {
          question: q.text,
          user_answer: userText,
          correct_answer: correctText,
          question_type: 'mcq' as const,
        };
      }

      const userAnswer =
        typeof ans?.answer === 'string' ? ans.answer.trim() : '';
      return {
        question: q.text,
        user_answer: userAnswer,
        correct_answer: '',
        question_type: 'theory' as const,
      };
    });

    evaluateQuizApi(correctPayloads, collectionId).then((result) => {
      setFeedbacks(result.feedbacks);
      setOverallPct(result.overall_pct);
      setEvaluating(false);
    });

  }, [router]);

  if (!ready) return null;

  const isMCQ = questionType === 'mcq';
  const isTheory = !isMCQ;
  const correctCount = feedbacks.filter((f) => f?.correct).length;

  return (
    <div className='flex flex-col min-h-screen lg:h-screen lg:overflow-hidden'>
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

      <div className='flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-2 px-6 md:px-12 max-w-[1200px] mx-auto w-full gap-0'>
        {/* LEFT */}
        <div className='lg:pr-16 flex flex-col lg:min-h-0 py-6'>
          {/* On mobile: static content, no inner scroll */}
          <div className='lg:flex-1 lg:overflow-y-auto lg:min-h-0 lg:pr-1'>
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
                ? 'Each answer is graded as a percentage. 50% or above = correct.'
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
                        ? `${correctCount} of ${questions.length} answers passed (≥50%)`
                        : `${questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0}% accuracy`}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons — on mobile: static below content; desktop: pinned to bottom */}
          <div className='pt-4 border-t border-app-text/10 flex flex-col gap-3 mt-4 lg:mt-0 lg:flex-shrink-0'>
            <button
              onClick={() => {
                sessionStorage.removeItem('quizme:answers');
                sessionStorage.removeItem('quizme:questions');
                sessionStorage.removeItem('quizme:questionType');
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
        <div className='flex flex-col lg:min-h-0 py-6'>
          <p className='text-app-text-secondary text-xs font-medium uppercase tracking-wide mb-4 flex-shrink-0'>
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </p>

          {/* On mobile: static list, page scrolls. On desktop: contained scroll */}
          <div className='lg:flex-1 lg:overflow-y-auto lg:min-h-0 flex flex-col gap-4 lg:pr-1'>
            {evaluating ? (
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

                const userAnswerText = isMCQ
                  ? q.options?.[a?.answer as number]?.text
                  : typeof a?.answer === 'string'
                    ? a.answer
                    : undefined;

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
                    userAnswer={userAnswerText}
                  />
                );
              })
            )}
          </div>

          <div className='pt-4 border-t border-app-text/10 mt-4 lg:mt-0 lg:flex-shrink-0'>
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
