'use client';

import { MCQOption } from '@/types/quiz';

interface MCQAnswerOptionsProps {
  options: MCQOption[];
  selectedIndex: number | null;
  correctIndex?: number;
  submitted: boolean;
  onSelect: (index: number) => void;
}

export default function MCQAnswerOptions({
  options,
  selectedIndex,
  correctIndex,
  submitted,
  onSelect,
}: MCQAnswerOptionsProps) {
  return (
    <div className='flex flex-col gap-3'>
      {options.map((opt, i) => {
        const isSelected = selectedIndex === i;
        const isCorrect = submitted && correctIndex === i;
        const isWrong = submitted && isSelected && correctIndex !== i;

        // Border & background
        let wrapClass = 'border-transparent bg-app-card';
        if (!submitted && isSelected)
          wrapClass = 'border-purple-500 bg-app-card';
        if (isCorrect) wrapClass = 'border-success bg-app-card';
        if (isWrong) wrapClass = 'border-error bg-app-card';

        // Letter badge
        let letterClass = 'bg-app-bg text-app-text';
        if (!submitted && isSelected) letterClass = 'bg-purple-500 text-white';
        if (isCorrect) letterClass = 'bg-success text-white';
        if (isWrong) letterClass = 'bg-error text-white';

        return (
          <button
            key={opt.letter}
            disabled={submitted}
            onClick={() => onSelect(i)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-150 text-left disabled:cursor-default hover:border-purple-500/40 ${wrapClass}`}
          >
            {/* Letter badge */}
            <span
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${letterClass}`}
            >
              {opt.letter}
            </span>

            {/* Answer text */}
            <span className='text-app-text font-medium text-base flex-1'>
              {opt.text}
            </span>

            {isCorrect && (
              <ion-icon
                name='checkmark-circle'
                style={{
                  fontSize: '22px',
                  color: 'var(--color-success)',
                  flexShrink: 0,
                }}
              />
            )}
            {isWrong && (
              <ion-icon
                name='close-circle'
                style={{
                  fontSize: '22px',
                  color: 'var(--color-error)',
                  flexShrink: 0,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
