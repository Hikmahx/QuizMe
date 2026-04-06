'use client';

interface WrittenAnswerInputProps {
  value: string;
  onChange: (v: string) => void;
  submitted: boolean;
  transcript?: string;
}

export default function WrittenAnswerInput({
  value,
  onChange,
  submitted,
}: WrittenAnswerInputProps) {
  return (
    <div className='flex flex-col h-full'>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={submitted}
        placeholder='Type your answer here…'
        className={[
          'w-full flex-1 min-h-[280px] bg-app-card border-2 rounded-2xl p-5 text-app-text text-sm leading-relaxed resize-none',
          'placeholder:text-app-text-secondary/50 focus:outline-none transition-colors duration-200',
          submitted
            ? 'border-primary/40 cursor-default opacity-80'
            : 'border-transparent focus:border-primary hover:border-primary/30',
        ].join(' ')}
      />
      {!submitted && (
        <p className='text-app-text-secondary text-xs mt-2 text-right'>
          {value.trim().split(/\s+/).filter(Boolean).length} word
          {value.trim().split(/\s+/).filter(Boolean).length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
