'use client';

import { useRouter } from 'next/navigation';

interface QuizCTAProps {
  /** compact = left-column embed, full = full-width banner */
  variant?: 'compact' | 'full';
}

/**
 * Persistent "Quiz yourself" CTA — appears on every feature result page.
 * README: "Quiz CTA — Appears on Every Feature Page"
 */
export default function QuizCTA({ variant = 'full' }: QuizCTAProps) {
  const router = useRouter();

  const handleQuiz = () => {
    router.push('/?selected=quiz-time/upload');
  };

  if (variant === 'compact') {
    return (
      <div className='bg-green-400/10 border border-green-400/25 rounded-2xl p-5 flex flex-col gap-4'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-[10px] bg-green-400/15 flex items-center justify-center text-lg flex-shrink-0'>
            <ion-icon name="brain-outline" style={{ fontSize: '20px' }} />
          </div>
          <div>
            <p className='text-app-text font-semibold text-sm'>
              Ready to test yourself?
            </p>
            <p className='text-app-text-secondary text-xs mt-0.5'>
              Quiz yourself on this material
            </p>
          </div>
        </div>
        <button
          onClick={handleQuiz}
          className='w-full bg-green-500 text-green-950 text-sm font-semibold rounded-xl py-3 hover:bg-green-500 transition-colors'
        >
          Quiz Me on This →
        </button>
      </div>
    );
  }

  return (
    <div className='bg-green-400/10 border border-green-400/25 rounded-2xl p-6 flex items-center gap-5'>
      <div className='w-12 h-12 rounded-2xl bg-green-400/15 flex items-center justify-center text-2xl flex-shrink-0'>
        <ion-icon name="brain-outline" style={{ fontSize: '20px' }} />
      </div>
      <div className='flex-1 min-w-0'>
        <h4 className='text-app-text font-semibold text-base'>
          Want to test your knowledge?
        </h4>
        <p className='text-app-text-secondary text-sm mt-1'>
          Quiz yourself on this material and see how much you've retained.
        </p>
      </div>
      <button
        onClick={handleQuiz}
        className='bg-green-500 text-green-950 text-sm font-semibold rounded-xl px-5 py-3 hover:bg-green-500 transition-colors whitespace-nowrap'
      >
        Quiz Me →
      </button>
    </div>
  );
}
