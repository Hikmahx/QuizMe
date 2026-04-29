'use client';

interface DocNavigatorProps {
  currentIndex: number;
  total: number;
  currentName: string;
  prevName?: string;
  nextName?: string;
  onPrev: () => void;
  onNext: () => void;
}

export default function DocNavigator({
  currentIndex,
  total,
  currentName,
  prevName,
  nextName,
  onPrev,
  onNext,
}: DocNavigatorProps) {
  return (
    <div className='flex items-center justify-between bg-app-card rounded-xl px-4 py-3'>
      <button
        onClick={onPrev}
        disabled={currentIndex === 0}
        className='flex items-center gap-1.5 border border-app-text-secondary/20 rounded-lg px-3 py-2 text-app-text-secondary text-xs hover:bg-app-text-secondary/8 hover:text-app-text hover:border-app-text-secondary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all'
      >
        ←{prevName && <span className='hidden md:block max-w-[80px] truncate'>{prevName}</span>}
      </button>

      <div className='text-center'>
        <p className='text-app-text text-sm font-medium max-w-[160px] truncate'>
          {currentName}
        </p>
        <p className='text-app-text-secondary text-xs mt-0.5'>
          {currentIndex + 1} of {total}
        </p>
      </div>

      <button
        onClick={onNext}
        disabled={currentIndex === total - 1}
        className='flex items-center gap-1.5 border border-app-text-secondary/20 rounded-lg px-3 py-2 text-app-text-secondary text-xs hover:bg-app-text-secondary/8 hover:text-app-text hover:border-app-text-secondary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all'
      >
        {nextName && <span className='hidden md:block max-w-[80px] truncate'>{nextName}</span>}→
      </button>
    </div>
  );
}
