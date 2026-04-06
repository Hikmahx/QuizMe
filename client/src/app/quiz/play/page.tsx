'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/global/Header';
import Breadcrumb from '@/components/global/Breadcrumb';
import MCQAnswerOptions from '@/components/quiz/MCQAnswerOptions';
import WrittenAnswerInput from '@/components/quiz/WrittenAnswerInput';
import OralAnswerPanel from '@/components/quiz/OralAnswerPanel';
import { FEATURE_MAP } from '@/lib/features';
import { useQuizFlow } from '@/hooks/useQuizFlow';
import { MOCK_MCQ_QUESTIONS, MOCK_THEORY_QUESTIONS } from '@/lib/quiz-mock';
import { QuizQuestion, QuizAnswerState } from '@/types/quiz';

const feature = FEATURE_MAP['quiz-time'];

export default function QuizPlayPage() {
  const router = useRouter();
  const flow = useQuizFlow();

  const isMCQ = flow.questionType === 'mcq';
  const isOral = flow.questionType === 'theory' && flow.inputMode === 'oral';
  const isWritten =
    flow.questionType === 'theory' && flow.inputMode === 'written';

  const allQs: QuizQuestion[] = isMCQ
    ? MOCK_MCQ_QUESTIONS
    : MOCK_THEORY_QUESTIONS;
  const questions = allQs.slice(0, flow.questionCount ?? 5);
  const total = questions.length;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswerState[]>(() =>
    allQs.slice(0, flow.questionCount ?? 5).map(() => ({
      answer: null,
      submitted: false,
      correct: null,
    })),
  );
  const [showError, setShowError] = useState(false);
  // oral TTS word highlight index
  const [spokenWordIdx, setSpokenWordIdx] = useState(-1);

  const current = questions[currentIdx];
  const ans = answers[currentIdx];
  const progress = ((currentIdx + 1) / total) * 100;

  // Redirect guard
  useEffect(() => {
    if (!flow.hydrated) return;
    if (!flow.difficulty || !flow.questionCount || !flow.questionType) {
      router.replace('/quiz/options?step=difficulty');
    }
  }, [flow, router]);

  // Reset word highlight when question changes
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

  const canSubmit = (): boolean => {
    if (isMCQ) return ans.answer !== null;
    if (isWritten)
      return (
        typeof ans.answer === 'string' &&
        ans.answer.trim().split(/\s+/).filter(Boolean).length > 0
      );
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

  if (!flow.hydrated || !current) return null;

  const words = current.text.split(' ');
  const useUnderline = isOral && spokenWordIdx >= 0;

  // Is next enabled?
  const nextEnabled = ans.submitted || isOral;

  // Mode label for breadcrumb
  const modeLabel = isMCQ ? 'MCQ' : isOral ? 'Oral' : 'Written';

  return (
    // 100vh, no outer scroll
    <div className='h-screen flex flex-col overflow-hidden'>
      {/* ── Fixed header ───────────────────────────────────────────────────── */}
      <div className='flex-shrink-0'>
        <Header />
        <Breadcrumb feature={feature} crumbs={[{ label: modeLabel }]} />
      </div>

      {/* ── Two-column body — each side independently scrollable ──────────── */}
      <div className='flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 px-6 md:px-12 max-w-[1200px] mx-auto w-full'>
        {/* ── LEFT column ─────────────────────────────────────────────────── */}
        <div className='lg:pr-16 flex flex-col min-h-0 py-6'>
          {/* Scrollable question area */}
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

          {/* Progress bar — pinned to bottom of left column */}
          <div className='flex-shrink-0 pt-4'>
            <div className='h-1 w-full bg-app-text/10 rounded-full overflow-hidden'>
              <div
                className='h-full bg-primary rounded-full transition-all duration-500 ease-out'
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT column ────────────────────────────────────────────────── */}
        <div className='flex flex-col min-h-0 py-6'>
          {/* Scrollable answer area */}
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
                onChange={(v) => updateAnswer(currentIdx, { answer: v })}
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

          {/* ── Fixed bottom nav — pinned inside right column ─────────────── */}
          <div className='flex-shrink-0 pt-4 border-t border-app-text/10'>
            {/* Error message */}
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
              {/* Prev */}
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

              {/* Submit Answer — centre, grows to fill space */}
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

              {/* Oral: spacer so Prev/Next stay aligned */}
              {isOral && <div className='flex-1' />}

              {/* Next / Finish */}
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
