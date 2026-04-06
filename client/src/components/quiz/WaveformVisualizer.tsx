'use client';

import { useEffect, useRef } from 'react';

type WaveMode = 'ai' | 'user' | 'idle';

interface Props {
  mode: WaveMode;

  stream?: MediaStream | null; // mediaStream from getUserMedia — required for 'user' mode live bars
}

const BAR_COUNT = 20;
const MIN_H = 4; // px — minimum bar height
const MAX_H = 72; // px — maximum bar height

// Colours (must match CSS variables or be hardcoded for canvas)
const AI_COLOR = '#a729f5';
const USER_COLOR = '#26d782';
const IDLE_COLOR = 'rgba(171,193,225,0.25)';

export default function WaveformVisualizer({ mode, stream }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const phaseRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(BAR_COUNT));

  // Wire up Web Audio analyser when stream is present
  useEffect(() => {
    if (mode !== 'user' || !stream) return;

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64; // small → 32 frequency bins
    analyser.smoothingTimeConstant = 0.75;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    dataRef.current = new Uint8Array(analyser.frequencyBinCount);

    return () => {
      source.disconnect();
      ctx.close();
      audioCtxRef.current = null;
      analyserRef.current = null;
    };
  }, [mode, stream]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use CSS pixel dimensions to avoid blur on HiDPI
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth * dpr;
    const H = canvas.clientHeight * dpr;
    canvas.width = W;
    canvas.height = H;
    ctx.scale(dpr, dpr);

    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;

    const barW = Math.floor((cw - (BAR_COUNT - 1) * 4) / BAR_COUNT);
    const gap = 4;
    const totalW = BAR_COUNT * barW + (BAR_COUNT - 1) * gap;
    const startX = (cw - totalW) / 2;

    const draw = () => {
      ctx.clearRect(0, 0, cw, ch);

      for (let i = 0; i < BAR_COUNT; i++) {
        let normH = 0; // 0–1

        if (mode === 'ai') {
          phaseRef.current += 0.003;
          // Multi-sine to give organic feel — each bar slightly offset
          normH =
            0.15 +
            0.85 *
              Math.abs(
                Math.sin(phaseRef.current * 18 + i * 0.45) * 0.6 +
                  Math.sin(phaseRef.current * 11 + i * 0.3) * 0.25 +
                  Math.sin(phaseRef.current * 7 + i * 0.6) * 0.15,
              );
          ctx.fillStyle = AI_COLOR;
        } else if (mode === 'user') {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataRef.current);
            // Map bar index to a frequency bin (first half = bass/mid)
            const bin = Math.floor(i * (dataRef.current.length / BAR_COUNT));
            normH = dataRef.current[bin] / 255;
            // Boost so even quiet speech is visible
            normH = Math.min(1, normH * 1.8);
          } else {
            // Fallback pulse while waiting for stream
            phaseRef.current += 0.003;
            normH =
              0.08 + 0.12 * Math.abs(Math.sin(phaseRef.current * 4 + i * 0.5));
          }
          ctx.fillStyle = USER_COLOR;
        } else {
          normH = 0.04; // idle — tiny bars
          ctx.fillStyle = IDLE_COLOR;
        }

        const h = Math.max(MIN_H, normH * MAX_H);
        const x = startX + i * (barW + gap);
        const y = (ch - h) / 2;

        ctx.beginPath();
        ctx.roundRect(x, y, barW, h, 3);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      className='w-full h-[88px]'
      style={{ display: 'block' }}
    />
  );
}
