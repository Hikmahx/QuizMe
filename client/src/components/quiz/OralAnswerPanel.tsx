'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import WaveformVisualizer from './WaveformVisualizer';
import { speakText, transcribeAudio } from '@/lib/api';

type Phase =
  | 'idle' // waiting for user to press "Hear Question"
  | 'loading' // speakText() fetch in-flight — audio not yet received
  | 'ai-speaking' // audio received and playing
  | 'ready' // audio done, mic button visible
  | 'recording' // MediaRecorder active
  | 'analysing' // waiting for STT response
  | 'done'; // transcript ready

interface OralAnswerPanelProps {
  questionText: string;
  onTranscriptReady: (transcript: string) => void;
  onWordIndex: (idx: number) => void;
  onRetry: () => void;
  submitted: boolean;
  savedTranscript: string;
}

const SAFETY_MS = 60_000;

export default function OralAnswerPanel({
  questionText,
  onTranscriptReady,
  onWordIndex,
  onRetry,
  submitted,
  savedTranscript,
}: OralAnswerPanelProps) {
  const [phase, setPhase] = useState<Phase>(submitted ? 'done' : 'idle');
  const [transcript, setTranscript] = useState(savedTranscript);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Audio playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const playAbortRef = useRef<AbortController | null>(null); // cancels in-flight speakText fetch

  // Recording
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // When question changes (navigating questions), reset to idle
  useEffect(() => {
    if (submitted) {
      setPhase('done');
      return;
    }

    // Stop any playing audio immediately
    stopAudio();
    // Stop any active recording
    stopRecording();

    setPhase('idle');
    setTranscript('');
    setStream(null);
    setElapsed(0);
    onWordIndex(-1);

    return () => {
      stopAudio();
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionText, submitted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      stopRecording();
    };
  }, []);

  // Helpers
  const stopAudio = () => {
    // Cancel any in-flight fetch
    if (playAbortRef.current) {
      playAbortRef.current.abort();
      playAbortRef.current = null;
    }
    // Stop and tear down the Audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load(); // resets the element fully
      audioRef.current = null;
    }
    // Revoke the blob URL to free memory
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    onWordIndex(-1);
  };

  const stopRecording = () => {
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      try {
        mediaRecRef.current.stop();
      } catch {
        /**/
      }
    }
    mediaRecRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
  };

  // Play question audio (triggered by button click — satisfies autoplay)
  const handleHearQuestion = useCallback(async () => {
    stopAudio();
    setPhase('ai-speaking');
    onWordIndex(-1);

    const abort = new AbortController();
    playAbortRef.current = abort;

    setPhase('loading'); // show spinner while audio is being fetched

    try {
      const url = await speakText(questionText);

      // If cancelled while fetching (e.g. user clicked next question)
      if (abort.signal.aborted) {
        URL.revokeObjectURL(url);
        return;
      }

      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      setPhase('ai-speaking'); // audio received — now actually speaking

      const words = questionText.split(' ');

      audio.addEventListener('timeupdate', () => {
        if (!audio.duration || abort.signal.aborted) return;
        const idx = Math.min(
          words.length - 1,
          Math.floor((audio.currentTime / audio.duration) * words.length),
        );
        onWordIndex(idx);
      });

      audio.addEventListener('ended', () => {
        if (abort.signal.aborted) return;
        onWordIndex(words.length - 1);
        setTimeout(() => {
          if (!abort.signal.aborted) setPhase('ready');
        }, 300);
      });

      audio.addEventListener('error', () => {
        if (abort.signal.aborted) return;
        // Audio element error — fall through to ready so user can still record
        setPhase('ready');
      });

      // play() is safe here because it's inside a click handler (user gesture)
      await audio.play();
    } catch (err: any) {
      if (abort.signal.aborted) return; // intentionally cancelled — not an error
      console.error('TTS error:', err);
      setPhase('ready'); // degrade gracefully — let user record without audio
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionText]);

  // Recording
  const finaliseWithBlob = async (blob: Blob) => {
    setPhase('analysing');
    try {
      const text = await transcribeAudio(blob);
      setTranscript(text);
      setPhase('done');
      onTranscriptReady(text);
    } catch (err) {
      console.error('transcribeAudio error:', err);
      setTranscript('');
      setPhase('done');
      onTranscriptReady('');
    }
  };

  const handleStartRecording = async () => {
    // Stop audio if still playing when user hits record
    stopAudio();

    chunksRef.current = [];
    setElapsed(0);
    setPhase('recording');

    let localStream: MediaStream | null = null;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPhase('ready');
      return;
    }

    streamRef.current = localStream;
    setStream(localStream);

    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    safetyRef.current = setTimeout(() => handleStopRecording(), SAFETY_MS);

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

    const rec = new MediaRecorder(localStream, mimeType ? { mimeType } : {});
    mediaRecRef.current = rec;

    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    rec.onstop = () => {
      stopRecording();
      const blob = new Blob(chunksRef.current, {
        type: mimeType || 'audio/webm',
      });
      finaliseWithBlob(blob);
    };

    rec.start(250);
  };

  const handleStopRecording = () => {
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop(); // triggers rec.onstop → finaliseWithBlob
    }
  };

  const handleRetry = () => {
    stopAudio();
    stopRecording();
    chunksRef.current = [];
    setTranscript('');
    setElapsed(0);
    setPhase('idle');
    onWordIndex(-1);
    onRetry();
  };

  // Derived
  const waveMode =
    phase === 'ai-speaking' ? 'ai' : phase === 'recording' ? 'user' : 'idle';
  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <div className='flex flex-col gap-4'>
      {/* Waveform card */}
      <div className='bg-app-card rounded-2xl p-5 flex flex-col gap-4'>
        {/* Status label */}
        <div className='flex items-center justify-center gap-2 min-h-[22px]'>
          {phase === 'idle' && (
            <>
              <ion-icon
                name='headset-outline'
                style={{
                  fontSize: '16px',
                  color: 'var(--color-app-text-secondary)',
                }}
              />
              <span className='text-app-text-secondary text-sm'>
                Press the button below to hear the question
              </span>
            </>
          )}

          {phase === 'loading' && (
            <>
              <div className='w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin' />
              <span className='text-app-text-secondary text-sm'>
                Loading audio…
              </span>
            </>
          )}

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
                Transcribing your response…
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

        <WaveformVisualizer
          mode={waveMode}
          stream={phase === 'recording' ? stream : null}
        />
      </div>

      {/* Hear Question button (idle only) */}
      {phase === 'idle' && (
        <button
          onClick={handleHearQuestion}
          className='w-full flex items-center justify-center gap-3 bg-app-card border-2 border-dashed border-primary/30 hover:border-primary/70 hover:bg-primary/5 text-app-text rounded-2xl py-4 transition-all duration-200 group'
        >
          <span className='w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0'>
            <ion-icon
              name='volume-high-outline'
              style={{ fontSize: '18px', color: 'var(--color-primary)' }}
            />
          </span>
          <span className='font-medium text-base'>Hear Question</span>
        </button>
      )}

      {/* Replay button (loading / speaking / ready) */}
      {(phase === 'loading' ||
        phase === 'ai-speaking' ||
        phase === 'ready') && (
        <button
          onClick={handleHearQuestion}
          disabled={phase === 'loading' || phase === 'ai-speaking'}
          className='w-full flex items-center justify-center gap-2 text-app-text-secondary text-sm border border-app-text/15 hover:border-primary/40 hover:text-primary rounded-xl py-2.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed'
        >
          <ion-icon name='refresh-outline' style={{ fontSize: '15px' }} />
          {phase === 'loading'
            ? 'Loading…'
            : phase === 'ai-speaking'
              ? 'Playing…'
              : 'Replay Question'}
        </button>
      )}

      {/* Record button */}
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

      {/* Stop button */}
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

      {/* Transcript */}
      {phase === 'done' && transcript && (
        <div className='flex flex-col gap-3'>
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

      {/* No speech detected */}
      {phase === 'done' && !transcript && (
        <div className='flex flex-col gap-3'>
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

      {phase === 'recording' && (
        <p className='text-app-text-secondary text-xs text-center'>
          Recording stops automatically after 60 seconds
        </p>
      )}
    </div>
  );
}
