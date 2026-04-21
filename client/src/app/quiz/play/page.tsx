'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/global/Header';
import Breadcrumb from '@/components/global/Breadcrumb';
import MCQAnswerOptions from '@/components/quiz/MCQAnswerOptions';
import WrittenAnswerInput from '@/components/quiz/WrittenAnswerInput';
import OralAnswerPanel from '@/components/quiz/OralAnswerPanel';
import { FEATURE_MAP } from '@/lib/features';
import { useQuizFlow } from '@/hooks/useQuizFlow';
import { MOCK_MCQ_QUESTIONS, MOCK_THEORY_QUESTIONS } from '@/lib/quiz-mock';
import { generateQuizApi } from '@/lib/quiz-api';
import { QuizQuestion, QuizAnswerState } from '@/types/quiz';

const feature = FEATURE_MAP['quiz-time'];

function getStoredCollectionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const s = JSON.parse(localStorage.getItem('quizme:summary-flow') ?? '{}');
    const id = s.collectionId ?? s.collection_id ?? '';
    return typeof id === 'string' ? id : '';
  } catch {
    return '';
  }
}

export default function QuizPlayPage() {
  const router = useRouter();
  const flow = useQuizFlow();

  const isMCQ = flow.questionType === 'mcq';
  const isOral = flow.questionType === 'theory' && flow.inputMode === 'oral';
  const isWritten =
    flow.questionType === 'theory' && flow.inputMode === 'written';

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswerState[]>([]);
  const [showError, setShowError] = useState(false);
  const [spokenWordIdx, setSpokenWordIdx] = useState(-1);

  useEffect(() => {
    if (!flow.hydrated) return;
    if (!flow.difficulty || !flow.questionCount || !flow.questionType) {
      router.replace('/quiz/options?step=difficulty');
    }
  }, [
    flow.hydrated,
    flow.difficulty,
    flow.questionCount,
    flow.questionType,
    router,
  ]);

  // Load questions — from AI if documents are uploaded, otherwise from mock data
  useEffect(() => {
    if (
      !flow.hydrated ||
      !flow.difficulty ||
      !flow.questionType ||
      !flow.questionCount
    )
      return;

    const collectionId = getStoredCollectionId();

    if (collectionId) {
      setQuestionsLoading(true);
      generateQuizApi({
        collectionId,
        difficulty: flow.difficulty,
        questionType: flow.questionType,
        count: flow.questionCount,
      })
        .then((generated) => {
          const qs = generated.slice(0, flow.questionCount ?? 10);
          setQuestions(qs);
          setAnswers(
            qs.map(() => ({ answer: null, submitted: false, correct: null })),
          );
          setQuestionsLoading(false);
        })
        .catch((err) => {
          console.error('Generation failed, using mock questions:', err);
          setGenerationError(
            'Could not generate questions from your documents. Using sample questions instead.',
          );
          loadMock();
        });
    } else {
      loadMock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.hydrated]);

  function loadMock() {
    const mocks = (isMCQ ? MOCK_MCQ_QUESTIONS : MOCK_THEORY_QUESTIONS).slice(
      0,
      flow.questionCount ?? 5,
    );
    setQuestions(mocks);
    setAnswers(
      mocks.map(() => ({ answer: null, submitted: false, correct: null })),
    );
    setQuestionsLoading(false);
  }

  useEffect(() => {
    setSpokenWordIdx(-1);
  }, [currentIdx]);

  const updateAnswer = useCallback(
    (idx: number, patch: Partial<QuizAnswerState>) => {
      setAnswers((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...patch };
        return copy;
      });
    },
    [],
  );

  const current = questions[currentIdx];
  const ans = answers[currentIdx];
  const total = questions.length;
  const progress = total > 0 ? ((currentIdx + 1) / total) * 100 : 0;

  const canSubmit = (): boolean => {
    if (!ans) return false;
    if (isMCQ) return ans.answer !== null;
    if (isWritten)
      return typeof ans.answer === 'string' && ans.answer.trim().length > 0;
    if (isOral) return ans.submitted;
    return false;
  };

  const handleSubmit = () => {
    if (!canSubmit()) {
      setShowError(true);
      return;
    }
    setShowError(false);
    if (isMCQ) {
      updateAnswer(currentIdx, {
        submitted: true,
        correct: ans.answer === current.correctIndex,
      });
    } else {
      updateAnswer(currentIdx, { submitted: true, correct: null });
    }
  };

  const handleNext = () => {
    setShowError(false);
    if (currentIdx < total - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      const finalAnswers = [...answers];
      if (!finalAnswers[currentIdx].submitted) {
        finalAnswers[currentIdx] = {
          ...finalAnswers[currentIdx],
          submitted: true,
          correct: null,
        };
      }
      sessionStorage.setItem('quizme:answers', JSON.stringify(finalAnswers));
      sessionStorage.setItem('quizme:questions', JSON.stringify(questions));
      router.push('/quiz/score');
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setShowError(false);
      setCurrentIdx((i) => i - 1);
    }
  };

  const handleTranscript = (t: string) => {
    updateAnswer(currentIdx, {
      answer: t,
      transcript: t,
      submitted: true,
      correct: null,
    });
  };

  const handleRetry = () => {
    updateAnswer(currentIdx, {
      answer: null,
      transcript: undefined,
      submitted: false,
      correct: null,
    });
  };

  // Loading state while Quiz Generator agent is running
  if (!flow.hydrated || questionsLoading) {
    const collectionId = getStoredCollectionId();
    return (
      <div className='h-screen flex flex-col overflow-hidden'>
        <div className='flex-shrink-0'>
          <Header />
          <Breadcrumb feature={feature} crumbs={[{ label: 'Generating…' }]} />
        </div>
        <div className='flex-1 flex flex-col items-center justify-center gap-5 px-6'>
          <div className='w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin' />
          <p className='text-app-text font-medium text-lg'>
            {collectionId
              ? 'Generating questions from your documents…'
              : 'Loading quiz…'}
          </p>
          {collectionId && (
            <p className='text-app-text-secondary text-sm text-center max-w-sm'>
              The AI agent is reading your documents and writing{' '}
              <strong>{flow.difficulty}</strong> questions. This takes about
              15–30 seconds.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!current) return null;

  const words = current.text.split(' ');
  const useUnderline = isOral && spokenWordIdx >= 0;
  const nextEnabled = !!(ans?.submitted || isOral);
  const modeLabel = isMCQ ? 'MCQ' : isOral ? 'Oral' : 'Written';

  return (
    <div className='h-screen flex flex-col overflow-hidden'>
      <div className='flex-shrink-0'>
        <Header />
        <Breadcrumb feature={feature} crumbs={[{ label: modeLabel }]} />
      </div>

      {generationError && (
        <div className='px-6 md:px-12 max-w-[1200px] mx-auto w-full pt-3'>
          <div className='bg-amber-500/10 border border-amber-400/30 rounded-xl px-4 py-2 text-amber-300 text-xs'>
            {generationError}
          </div>
        </div>
      )}

      <div className='flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 px-6 md:px-12 max-w-[1200px] mx-auto w-full'>
        {/* LEFT — question */}
        <div className='lg:pr-16 flex flex-col min-h-0 py-6'>
          <div className='flex-1 overflow-y-auto min-h-0 pr-1'>
            <p className='text-app-text-secondary italic text-sm mb-5'>
              Question {currentIdx + 1} of {total}
            </p>
            <h2 className='text-app-text font-bold text-2xl md:text-3xl leading-snug'>
              {useUnderline
                ? words.map((word, i) => (
                    <span
                      key={i}
                      className={[
                        'transition-all duration-100',
                        i <= spokenWordIdx
                          ? 'underline decoration-primary decoration-2 underline-offset-4'
                          : 'no-underline',
                      ].join(' ')}
                    >
                      {word}
                      {i < words.length - 1 ? ' ' : ''}
                    </span>
                  ))
                : current.text}
            </h2>
          </div>
          <div className='flex-shrink-0 pt-4'>
            <div className='h-1 w-full bg-app-text/10 rounded-full overflow-hidden'>
              <div
                className='h-full bg-primary rounded-full transition-all duration-500 ease-out'
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT — answer */}
        <div className='flex flex-col min-h-0 py-6'>
          <div className='flex-1 overflow-y-auto min-h-0'>
            {isMCQ && (
              <MCQAnswerOptions
                options={current.options ?? []}
                selectedIndex={
                  typeof ans?.answer === 'number' ? ans.answer : null
                }
                correctIndex={current.correctIndex}
                submitted={ans?.submitted ?? false}
                onSelect={(i) => {
                  if (ans?.submitted) return;
                  setShowError(false);
                  updateAnswer(currentIdx, { answer: i });
                }}
              />
            )}
            {isWritten && (
              <WrittenAnswerInput
                value={typeof ans?.answer === 'string' ? ans.answer : ''}
                onChange={(v) => updateAnswer(currentIdx, { answer: v })}
                submitted={ans?.submitted ?? false}
              />
            )}
            {isOral && (
              <OralAnswerPanel
                questionText={current.text}
                onTranscriptReady={handleTranscript}
                onWordIndex={setSpokenWordIdx}
                onRetry={handleRetry}
                submitted={ans?.submitted ?? false}
                savedTranscript={
                  typeof ans?.answer === 'string' ? ans.answer : ''
                }
              />
            )}
          </div>

          <div className='flex-shrink-0 pt-4 border-t border-app-text/10'>
            {showError && !ans?.submitted && (
              <div className='flex items-center gap-2 text-error text-sm mb-3'>
                <ion-icon
                  name='alert-circle-outline'
                  style={{ fontSize: '16px' }}
                />
                Please select an answer
              </div>
            )}
            <div className='flex items-center gap-3'>
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                aria-label='Previous question'
                className='flex items-center justify-center w-11 h-11 rounded-xl border border-app-text/20 text-app-text-secondary hover:bg-app-card hover:border-app-text/40 hover:text-app-text disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0'
              >
                <ion-icon
                  name='chevron-back-outline'
                  style={{ fontSize: '18px' }}
                />
              </button>
              {!isOral && (
                <button
                  onClick={ans?.submitted ? undefined : handleSubmit}
                  disabled={ans?.submitted}
                  className={[
                    'flex-1 font-medium text-base rounded-2xl py-3 transition-all duration-200',
                    ans?.submitted
                      ? 'bg-app-card text-app-text-secondary cursor-default'
                      : 'bg-primary text-white hover:opacity-90 active:scale-[0.99]',
                  ].join(' ')}
                >
                  {ans?.submitted ? 'Submitted ✓' : 'Submit Answer'}
                </button>
              )}
              {isOral && <div className='flex-1' />}
              <button
                onClick={handleNext}
                disabled={!nextEnabled}
                aria-label={
                  currentIdx === total - 1 ? 'Finish quiz' : 'Next question'
                }
                className='flex items-center justify-center w-11 h-11 rounded-xl border border-app-text/20 text-app-text-secondary hover:bg-app-card hover:border-app-text/40 hover:text-app-text disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0'
              >
                <ion-icon
                  name={
                    currentIdx === total - 1
                      ? 'flag-outline'
                      : 'chevron-forward-outline'
                  }
                  style={{ fontSize: '18px' }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
