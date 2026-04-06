interface FeedbackCardProps {
  index: number;
  questionText: string;
  correct: boolean;
  explanation: string;
  tip: string;
  userAnswer?: string;
}

export default function FeedbackCard({
  index,
  questionText,
  correct,
  explanation,
  tip,
  userAnswer,
}: FeedbackCardProps) {
  return (
    <div
      className={[
        'rounded-2xl p-5 border-2 flex flex-col gap-3',
        correct
          ? 'border-success/30 bg-success/5'
          : 'border-error/30 bg-error/5',
      ].join(' ')}
    >
      <div className='flex items-start gap-3'>
        <span
          className={[
            'w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5',
            correct ? 'bg-success text-white' : 'bg-error text-white',
          ].join(' ')}
        >
          {correct ? '✓' : '✗'}
        </span>
        <div className='flex-1 min-w-0'>
          <p className='text-app-text-secondary text-xs font-medium mb-1'>
            Question {index + 1}
          </p>
          <p className='text-app-text text-sm font-medium leading-snug'>
            {questionText}
          </p>
        </div>
      </div>

      {userAnswer && (
        <div className='bg-app-bg/50 rounded-xl p-3'>
          <p className='text-app-text-secondary text-xs font-medium mb-1'>
            Your answer
          </p>
          <p className='text-app-text text-sm italic'>{userAnswer}</p>
        </div>
      )}

      <div className='bg-app-bg/50 rounded-xl p-3'>
        <p
          className='text-app-text text-sm leading-relaxed'
          dangerouslySetInnerHTML={{ __html: explanation }}
        />
      </div>

      {tip && (
        <div className='flex items-start gap-2'>
          <span className='text-base flex-shrink-0'>💡</span>
          <p className='text-app-text-secondary text-xs leading-relaxed'>
            {tip}
          </p>
        </div>
      )}
    </div>
  );
}
