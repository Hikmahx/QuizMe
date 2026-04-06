'use client';

import { useEffect, useRef, useState } from 'react';
import WaveformVisualizer from './WaveformVisualizer';

type Phase = 'ai-speaking' | 'ready' | 'recording' | 'analysing' | 'done';

interface OralAnswerPanelProps {
  questionText: string;
  onTranscriptReady: (transcript: string) => void;
  onWordIndex: (idx: number) => void;
  onRetry: () => void;
  submitted: boolean;
  savedTranscript: string;
}

const ANALYSE_MS = 1500; // spinner duration
const SAFETY_TIMEOUT = 60000; // 60 s hard cap

export default function OralAnswerPanel({
  questionText,
  onTranscriptReady,
  onWordIndex,
  onRetry,
  submitted,
  savedTranscript,
}: OralAnswerPanelProps) {
  const [phase, setPhase] = useState<Phase>(submitted ? 'done' : 'ai-speaking');
  const [transcript, setTranscript] = useState(savedTranscript);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [elapsed, setElapsed] = useState(0); // seconds recorded — shown in button

  const recognRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fullTextRef = useRef('');
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. TTS — runs when question changes
  useEffect(() => {
    if (submitted) {
      setPhase('done');
      return;
    }

    // Reset all state for the new question
    setPhase('ai-speaking');
    setTranscript('');
    setStream(null);
    setElapsed(0);
    fullTextRef.current = '';
    onWordIndex(-1);

    stopRecording(); // clean up any previous recording

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setTimeout(() => setPhase('ready'), 800);
      return;
    }

    window.speechSynthesis.cancel();

    const words = questionText.split(' ');
    const utter = new SpeechSynthesisUtterance(questionText);
    utter.rate = 0.92;
    utter.pitch = 1;

    utter.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name !== 'word') return;
      const before = questionText.slice(0, e.charIndex);
      const idx = before.split(' ').filter(Boolean).length - 1;
      onWordIndex(Math.max(0, idx));
    };

    utter.onend = () => {
      onWordIndex(words.length - 1); // highlight all words once done
      setTimeout(() => setPhase('ready'), 400);
    };

    window.speechSynthesis.speak(utter);

    return () => {
      window.speechSynthesis.cancel();
      onWordIndex(-1);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionText, submitted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helpers─
  const stopRecording = () => {
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognRef.current) {
      try {
        recognRef.current.stop();
      } catch {
        /* */
      }
      recognRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
  };

  const finalise = () => {
    stopRecording();
    setPhase('analysing');
    setTimeout(() => {
      const final = fullTextRef.current.trim();
      setTranscript(final);
      setPhase('done');
      onTranscriptReady(final);
    }, ANALYSE_MS);
  };

  // 3. Start recording
  const handleStartRecording = async () => {
    fullTextRef.current = '';
    setElapsed(0);
    setPhase('recording');

    let localStream: MediaStream | null = null;

    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // Mic denied — still run STT without waveform
      localStream = null;
    }

    streamRef.current = localStream;
    setStream(localStream);

    // Elapsed seconds counter
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);

    // Safety timeout — auto-stop after 60 s
    safetyRef.current = setTimeout(() => finalise(), SAFETY_TIMEOUT);

    // SpeechRecognition
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = false; // only accumulate final results — no fragmentation
    recog.lang = 'en-US';
    recognRef.current = recog;

    recog.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          fullTextRef.current += e.results[i][0].transcript + ' ';
        }
      }
    };

    recog.onerror = (e: any) => {
      // 'no-speech' is harmless — Chrome fires it after silence; just restart
      if (e.error === 'no-speech') {
        try {
          recog.start();
        } catch {
          /* */
        }
      }
      // Other errors: leave recording going, user can still stop manually
    };

    recog.onend = () => {
      // Chrome auto-stops recognition periodically — restart unless we intentionally ended
      if (recognRef.current === recog) {
        try {
          recog.start();
        } catch {
          /* user already hit Stop */
        }
      }
    };

    recog.start();
  };

  // 4. Stop recording (manual)
  const handleStopRecording = () => finalise();

  // 5. Retry — discard transcript, go back to ready
  const handleRetry = () => {
    stopRecording();
    fullTextRef.current = '';
    setTranscript('');
    setElapsed(0);
    setPhase('ready');
    onRetry(); // tell parent to clear the submitted answer
  };

  // Derived
  const waveMode =
    phase === 'ai-speaking' ? 'ai' : phase === 'recording' ? 'user' : 'idle';
  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <div className='flex flex-col gap-4'>
      {/* Waveform card */}
      <div className='bg-app-card rounded-2xl p-5 flex flex-col gap-4'>
        {/* Status row */}
        <div className='flex items-center justify-center gap-2 min-h-[22px]'>
          {phase === 'ai-speaking' && (
            <>
              <ion-icon
                name='volume-high-outline'
                style={{ fontSize: '16px', color: 'var(--color-primary)' }}
              />
              <span className='text-app-text-secondary text-sm'>
                AI is reading the question…
              </span>
            </>
          )}
          {phase === 'ready' && (
            <>
              <ion-icon
                name='mic-outline'
                style={{
                  fontSize: '16px',
                  color: 'var(--color-app-text-secondary)',
                }}
              />
              <span className='text-app-text-secondary text-sm'>
                Tap Record when you're ready
              </span>
            </>
          )}
          {phase === 'recording' && (
            <div className='flex items-center gap-2'>
              {/* Pulsing red dot */}
              <span className='relative flex h-2.5 w-2.5'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75' />
                <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500' />
              </span>
              <span className='text-red-400 text-sm font-medium'>
                Recording
              </span>
              <span className='text-app-text-secondary text-sm tabular-nums'>
                {mmss}
              </span>
            </div>
          )}
          {phase === 'analysing' && (
            <>
              <div className='w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin' />
              <span className='text-app-text-secondary text-sm'>
                Analysing your response…
              </span>
            </>
          )}
          {phase === 'done' && (
            <>
              <ion-icon
                name='checkmark-circle-outline'
                style={{ fontSize: '16px', color: 'var(--color-success)' }}
              />
              <span className='text-success text-sm font-medium'>
                Response captured
              </span>
            </>
          )}
        </div>

        {/* Waveform */}
        <WaveformVisualizer
          mode={waveMode}
          stream={phase === 'recording' ? stream : null}
        />
      </div>

      {/* Record / Stop button */}
      {phase === 'ready' && (
        <button
          onClick={handleStartRecording}
          className='w-full flex items-center justify-center gap-3 bg-app-card border-2 border-dashed border-app-text/20 hover:border-success/60 hover:bg-success/5 text-app-text rounded-2xl py-4 transition-all duration-200 group'
        >
          <span className='w-9 h-9 rounded-full bg-success/15 flex items-center justify-center group-hover:bg-success/25 transition-colors flex-shrink-0'>
            <ion-icon
              name='mic-outline'
              style={{ fontSize: '18px', color: 'var(--color-success)' }}
            />
          </span>
          <span className='font-medium text-base'>Start Recording</span>
        </button>
      )}

      {phase === 'recording' && (
        <button
          onClick={handleStopRecording}
          className='w-full flex items-center justify-center gap-3 bg-red-500/10 border-2 border-red-500/40 hover:bg-red-500/20 hover:border-red-500/70 text-red-400 rounded-2xl py-4 transition-all duration-200 group'
        >
          <span className='w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center group-hover:bg-red-500/25 transition-colors flex-shrink-0'>
            <ion-icon
              name='stop-circle-outline'
              style={{ fontSize: '20px', color: '#f87171' }}
            />
          </span>
          <span className='font-medium text-base'>Stop Recording</span>
          <span className='text-red-400/60 text-sm tabular-nums'>{mmss}</span>
        </button>
      )}

      {/* Transcript — revealed after analysing */}
      {phase === 'done' && transcript && (
        <div className='flex flex-col gap-3 animate-fade-in'>
          <div className='bg-app-card rounded-2xl p-5 flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <p className='text-app-text-secondary text-xs font-medium uppercase tracking-wide'>
                Your response
              </p>
              <button
                onClick={handleRetry}
                className='flex items-center gap-1.5 text-app-text-secondary text-xs hover:text-primary transition-colors'
              >
                <ion-icon name='refresh-outline' style={{ fontSize: '13px' }} />
                Retry
              </button>
            </div>
            <p className='text-app-text text-sm leading-relaxed'>
              {transcript}
            </p>
          </div>
          <p className='text-app-text-secondary text-xs text-center'>
            Not happy with your answer? Hit Retry to record again.
          </p>
        </div>
      )}

      {phase === 'done' && !transcript && (
        <div className='flex flex-col gap-3 animate-fade-in'>
          <div className='bg-app-card rounded-2xl p-5 flex items-center gap-3'>
            <ion-icon
              name='alert-circle-outline'
              style={{
                fontSize: '16px',
                color: 'var(--color-app-text-secondary)',
              }}
            />
            <p className='text-app-text-secondary text-sm italic'>
              No speech detected. You can retry or move to the next question.
            </p>
          </div>
          <button
            onClick={handleRetry}
            className='w-full flex items-center justify-center gap-2 border border-app-text/20 hover:border-primary/50 hover:text-primary text-app-text-secondary rounded-2xl py-3.5 text-sm font-medium transition-all duration-200'
          >
            <ion-icon name='refresh-outline' style={{ fontSize: '16px' }} />
            Try Again
          </button>
        </div>
      )}

      {/* Safety note */}
      {phase === 'recording' && (
        <p className='text-app-text-secondary text-xs text-center'>
          Recording stops automatically after 60 seconds
        </p>
      )}
    </div>
  );
}
