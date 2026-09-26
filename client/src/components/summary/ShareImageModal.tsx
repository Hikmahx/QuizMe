'use client';

import { useEffect, useState } from 'react';
import {
  generateSummaryImage,
  wordCount,
  truncateToWords,
  IMAGE_WORD_LIMIT,
} from '@/lib/generate-summary-image';

interface ShareImageModalProps {
  summary: string;
  docName: string;
  onClose: () => void;
}

type Step = 'warning' | 'generating' | 'preview' | 'error';

export default function ShareImageModal({ summary, docName, onClose }: ShareImageModalProps) {
  const count = wordCount(summary);
  const needsTruncation = count > IMAGE_WORD_LIMIT;

  const [step, setStep] = useState<Step>(needsTruncation ? 'warning' : 'generating');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const runGeneration = async () => {
    setStep('generating');
    try {
      const finalText = needsTruncation ? truncateToWords(summary, IMAGE_WORD_LIMIT) : summary;
      const url = await generateSummaryImage({ docName, summary: finalText });
      setImageUrl(url);
      setStep('preview');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not generate the image.');
      setStep('error');
    }
  };

  // Only auto-generate on mount if there's no warning to show first
  useEffect(() => {
    if (!needsTruncation) runGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `${docName.replace(/\.[^/.]+$/, '') || 'summary'}-quizme.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleShare = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'quizme-summary.png', { type: 'image/png' });

      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        handleDownload(); // fall back silently — device doesn't support sharing images
        return;
      }

      await navigator.share({
        files: [file],
        title: 'QuizMe summary',
      });
    } catch (err) {
      // AbortError = user cancelled the native share sheet — not a real error
      if (err instanceof Error && err.name !== 'AbortError') {
        handleDownload();
      }
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} />
      <div className='relative bg-app-card rounded-2xl p-7 w-full max-w-sm shadow-2xl max-h-[85vh] overflow-y-auto'>
        {step === 'warning' && (
          <>
            <div className='w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-4'>
              <ion-icon name='alert-outline' style={{ fontSize: '24px', color: '#f59e0b' }} />
            </div>
            <h2 className='text-lg font-bold text-app-text mb-2'>This summary is long</h2>
            <p className='text-app-text-secondary text-sm leading-relaxed mb-6'>
              This summary is <strong className='text-app-text'>{count} words</strong>. Images
              work best under {IMAGE_WORD_LIMIT} words, so we'll show the first{' '}
              {IMAGE_WORD_LIMIT} and trim the rest.
            </p>
            <div className='flex gap-3'>
              <button
                onClick={onClose}
                className='flex-1 py-3 rounded-xl border border-app-text-secondary/25 text-app-text text-sm font-medium hover:bg-app-text-secondary/8 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={runGeneration}
                className='flex-1 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors'
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 'generating' && (
          <div className='flex flex-col items-center justify-center py-10 gap-4'>
            <span className='w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin' />
            <p className='text-app-text-secondary text-sm'>Generating image…</p>
          </div>
        )}

        {step === 'error' && (
          <>
            <h2 className='text-lg font-bold text-app-text mb-2'>Couldn't generate image</h2>
            <p className='text-red-400 text-sm leading-relaxed mb-6'>{errorMessage}</p>
            <button
              onClick={onClose}
              className='w-full py-3 rounded-xl border border-app-text-secondary/25 text-app-text text-sm font-medium hover:bg-app-text-secondary/8 transition-colors'
            >
              Close
            </button>
          </>
        )}

        {step === 'preview' && imageUrl && (
          <>
            <h2 className='text-lg font-bold text-app-text mb-4'>Your summary image</h2>
            <img
              src={imageUrl}
              alt='Summary preview'
              className='w-full rounded-xl border border-app-text-secondary/15 mb-5'
            />
            <div className='flex gap-3'>
              <button
                onClick={handleDownload}
                className='flex-1 py-3 rounded-xl border border-app-text-secondary/25 text-app-text text-sm font-medium hover:bg-app-text-secondary/8 transition-colors flex items-center justify-center gap-2'
              >
                <ion-icon name='download-outline' style={{ fontSize: '15px' }} />
                Download
              </button>
              {canNativeShare && (
                <button
                  onClick={handleShare}
                  className='flex-1 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2'
                >
                  <ion-icon name='share-outline' style={{ fontSize: '15px' }} />
                  Share
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
