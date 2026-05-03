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
import { useSummaryFlow } from '@/hooks/useSummaryFlow';
import { uploadFiles } from '@/lib/api';
import { generateQuizApi } from '@/lib/quiz-api';
import { QuizQuestion, QuizAnswerState } from '@/types/quiz';

const feature = FEATURE_MAP['quiz-time'];

type LoadState = 'idle' | 'uploading' | 'generating' | 'ready' | 'error';

/** Persist the collection_id so feedback/page.tsx can retrieve it later. */
function saveCollectionId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const current = JSON.parse(
      localStorage.getItem('quizme:summary-flow') ?? '{}',
    );
    localStorage.setItem(
      'quizme:summary-flow',
      JSON.stringify({ ...current, collectionId: id }),
    );
  } catch {
    /* storage quota — non-fatal */
  }
}

export default function QuizPlayPage() {
  const router = useRouter();
  const flow = useQuizFlow();
  const { files } = useSummaryFlow();

  const isMCQ = flow.questionType === 'mcq';
  const isOral = flow.questionType === 'theory' && flow.inputMode === 'oral';
  const isWritten =
    flow.questionType === 'theory' && flow.inputMode === 'written';

  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswerState[]>([]);
  const [showError, setShowError] = useState(false);
  const [spokenWordIdx, setSpokenWordIdx] = useState(-1);

  // Redirect guard
  useEffect(() => {
    if (!flow.hydrated) return;
    if (!flow.difficulty || !flow.questionCount || !flow.questionType) {
      router.replace('/quiz/options?step=difficulty');
    }
  }, [flow, router]);

  // Fetch questions from backend via RAG, with sessionStorage cache so
  // reloading the page doesn't re-index and re-generate from scratch.
  useEffect(() => {
    if (!flow.hydrated) return;
    if (!flow.difficulty || !flow.questionCount || !flow.questionType) return;
    if (loadState !== 'idle') return;

    async function fetchQuestions() {
      try {
        // Step 1: resolve collection_id without re-uploading if possible
        // The summary flow already indexed these files and stored the id.
        // We only call uploadFiles if we have no stored id at all.
        let collectionId: string | null = null;
        try {
          const stored = JSON.parse(
            localStorage.getItem('quizme:summary-flow') ?? '{}',
          );
          collectionId = stored.collectionId ?? null;
        } catch {
          /* ignore */
        }

        if (!collectionId) {
          setLoadState('uploading');
          if (!files || files.length === 0) {
            throw new Error(
              'No documents found. Please go back and upload your files first.',
            );
          }

          const uploadResult = await uploadFiles(files);
          collectionId = uploadResult.collection_id;
          saveCollectionId(collectionId);
        }

        // Step 2: check sessionStorage cache
        // Cache key encodes every parameter that affects the question set.
        const cacheKey = `quizme:questions::${collectionId}::${flow.difficulty}::${flow.questionCount}::${flow.questionType}`;
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          // Restore from cache — no LLM call needed
          const qs: QuizQuestion[] = JSON.parse(cached);
          setQuestions(qs);
          setAnswers(
            qs.map(() => ({ answer: null, submitted: false, correct: null })),
          );
          setLoadState('ready');
          return;
        }

        // Step 3: generate questions from indexed documents
        setLoadState('generating');
        const qs = await generateQuizApi({
          collectionId,
          difficulty: flow.difficulty!,
          count: flow.questionCount!,
          questionType: flow.questionType!,
        });

        // Persist to sessionStorage so reloads are instant
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(qs));
        } catch {
          /* quota */
        }

        // Also save current questions/type for the feedback page
        sessionStorage.setItem('quizme:questions', JSON.stringify(qs));
        sessionStorage.setItem('quizme:questionType', flow.questionType!);

        setQuestions(qs);
        setAnswers(
          qs.map(() => ({ answer: null, submitted: false, correct: null })),
        );
        setLoadState('ready');
      } catch (err) {
        console.error('Quiz generation failed:', err);
        setLoadError(
          err instanceof Error ? err.message : 'Failed to generate questions.',
        );
        setLoadState('error');
      }
    }

    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.hydrated]);

  // Reset spoken word highlight on question change
  useEffect(() => {
    setSpokenWordIdx(-1);
  }, [currentIdx]);

  // Derived values
  const total = questions.length;
  const current = questions[currentIdx];
  const ans = answers[currentIdx];
  const progress = total > 0 ? ((currentIdx + 1) / total) * 100 : 0;

  // Answer helpers
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
      // Also persist the question type so feedback page never relies on a stale hook value
      sessionStorage.setItem('quizme:questionType', flow.questionType ?? '');
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

  // Loading screen
  if (
    !flow.hydrated ||
    loadState === 'idle' ||
    loadState === 'uploading' ||
    loadState === 'generating'
  ) {
    const statusLabel =
      loadState === 'uploading'
        ? 'Indexing your documents…'
        : loadState === 'generating'
          ? 'Generating questions from your content…'
          : 'Preparing your quiz…';

    const steps = ['uploading', 'generating'] as const;

    return (
      <div className='h-screen flex flex-col overflow-hidden'>
        <div className='flex-shrink-0'>
          <Header />
          <Breadcrumb feature={feature} crumbs={[{ label: 'Loading' }]} />
        </div>
        <div className='flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 px-6 md:px-12 max-w-[1200px] mx-auto w-full items-center'>
          {/* LEFT */}
          <div className='lg:pr-16 py-6 flex flex-col gap-4'>
            <h2 className='text-4xl font-light text-app-text leading-tight'>
              Almost
              <strong className='block font-bold'>ready.</strong>
            </h2>
            <p className='text-app-text-secondary text-sm leading-relaxed'>
              The AI is reading your documents and crafting questions tailored
              to your content.
            </p>
            <p className='text-app-text-secondary/50 text-xs leading-relaxed'>
              This might a while
            </p>
            <div className='flex flex-col gap-2 mt-2'>
              {steps.map((step) => {
                const done = step === 'uploading' && loadState === 'generating';
                const active = loadState === step;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-xl border transition-all ${
                      active
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : done
                          ? 'border-green-400/30 bg-green-400/8 text-green-400'
                          : 'border-app-text-secondary/15 text-app-text-secondary'
                    }`}
                  >
                    <span className='w-5 h-5 flex items-center justify-center flex-shrink-0'>
                      {done ? (
                        <ion-icon
                          name='checkmark-circle-outline'
                          style={{ fontSize: '18px' }}
                        />
                      ) : active ? (
                        <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
                      ) : (
                        <div className='w-3 h-3 rounded-full border border-current opacity-40' />
                      )}
                    </span>
                    {step === 'uploading'
                      ? 'Indexing documents'
                      : 'Building questions'}
                  </div>
                );
              })}
            </div>
          </div>
          {/* RIGHT */}
          <div className='py-6 flex items-center justify-center'>
            <div className='w-full dark-bg rounded-2xl p-10 flex flex-col items-center justify-center gap-5 min-h-[260px]'>
              <div className='w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center'>
                <div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin' />
              </div>
              <p className='text-app-text font-medium text-base text-center'>
                {statusLabel}
              </p>
              {loadState === 'generating' && (
                <p className='text-app-text-secondary/60 text-xs text-center'>
                  This usually takes 15–90 seconds
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className='h-screen flex flex-col overflow-hidden'>
        <div className='flex-shrink-0'>
          <Header />
          <Breadcrumb feature={feature} crumbs={[{ label: 'Error' }]} />
        </div>
        <div className='flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 px-6 md:px-12 max-w-[1200px] mx-auto w-full items-center'>
          <div className='lg:pr-16 py-6 flex flex-col gap-4'>
            <h2 className='text-4xl font-light text-app-text leading-tight'>
              Something went
              <strong className='block font-bold'>wrong.</strong>
            </h2>
            <p className='text-app-text-secondary text-sm leading-relaxed'>
              {loadError}
            </p>
            <button
              onClick={() => router.push('/quiz/options?step=difficulty')}
              className='mt-2 px-6 py-3 bg-primary text-white rounded-2xl font-medium text-sm hover:opacity-90 transition-all w-fit'
            >
              ← Back to setup
            </button>
          </div>
          <div className='py-6 flex items-center justify-center'>
            <div className='w-full dark-bg rounded-2xl p-10 flex items-center justify-center min-h-[200px]'>
              <ion-icon
                name='alert-circle-outline'
                style={{ fontSize: '48px', color: '#f87171' }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Guard
  if (!current || !ans) return null;

  const words = current.text.split(' ');
  const useUnderline = isOral && spokenWordIdx >= 0;
  const nextEnabled = ans.submitted || isOral;
  const modeLabel = isMCQ ? 'MCQ' : isOral ? 'Oral' : 'Written';

  // Quiz UI
  return (
    <div className='h-screen flex flex-col overflow-hidden'>
      <div className='flex-shrink-0'>
        <Header />
        <Breadcrumb feature={feature} crumbs={[{ label: modeLabel }]} />
      </div>

      <div className='flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 px-6 md:px-12 max-w-[1200px] mx-auto w-full'>
        {/* LEFT: question */}
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

        {/* RIGHT: answer */}
        <div className='flex flex-col min-h-0 py-6'>
          <div className='flex-1 overflow-y-auto min-h-0'>
            {isMCQ && (
              <MCQAnswerOptions
                options={current.options ?? []}
                selectedIndex={
                  typeof ans.answer === 'number' ? ans.answer : null
                }
                correctIndex={current.correctIndex}
                submitted={ans.submitted}
                onSelect={(i) => {
                  if (ans.submitted) return;
                  setShowError(false);
                  updateAnswer(currentIdx, { answer: i });
                }}
              />
            )}
            {isWritten && (
              <WrittenAnswerInput
                value={typeof ans.answer === 'string' ? ans.answer : ''}
                onChange={(v) => updateAnswer(currentIdx, { answer: v ?? '' })}
                submitted={ans.submitted}
              />
            )}
            {isOral && (
              <OralAnswerPanel
                questionText={current.text}
                onTranscriptReady={handleTranscript}
                onWordIndex={setSpokenWordIdx}
                onRetry={handleRetry}
                submitted={ans.submitted}
                savedTranscript={
                  typeof ans.answer === 'string' ? ans.answer : ''
                }
              />
            )}
          </div>

          <div className='flex-shrink-0 pt-4 border-t border-app-text/10'>
            {showError && !ans.submitted && (
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
                  onClick={ans.submitted ? undefined : handleSubmit}
                  disabled={ans.submitted}
                  className={[
                    'flex-1 font-medium text-base rounded-2xl py-3 transition-all duration-200',
                    ans.submitted
                      ? 'bg-app-card text-app-text-secondary cursor-default'
                      : 'bg-primary text-white hover:opacity-90 active:scale-[0.99]',
                  ].join(' ')}
                >
                  {ans.submitted ? 'Submitted ✓' : 'Submit Answer'}
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
