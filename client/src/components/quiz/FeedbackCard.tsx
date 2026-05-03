interface FeedbackCardProps {
  index: number;
  questionText: string;
  correct: boolean;
  scorePct: number;
  explanation: string;
  tip: string;
  userAnswer?: string;
  isTheory?: boolean;
}

export default function FeedbackCard({
  index,
  questionText,
  correct,
  scorePct,
  explanation,
  tip,
  userAnswer,
  isTheory = false,
}: FeedbackCardProps) {
  const borderClass = correct
    ? 'border-success/30 bg-success/5'
    : 'border-error/30 bg-error/5';

  // Percentage badge colour for theory (green / amber / red)
  const pctClass =
    scorePct >= 80
      ? 'bg-success/15 text-success'
      : scorePct >= 50
        ? 'bg-yellow-400/15 text-yellow-400'
        : 'bg-error/15 text-error';

  return (
    <div
      className='rounded-2xl bg-app-bg'
    >
      <div
        className={`rounded-2xl p-5 border-2 flex flex-col gap-3 ${borderClass}`}
      >
        <div className='flex items-start gap-3'>
          {/* Badge: percentage for theory, tick/cross for MCQ */}
          {isTheory ? (
            <span
              className={`px-2 py-0.5 rounded-lg text-xs font-bold flex-shrink-0 mt-0.5 ${pctClass}`}
            >
              {scorePct}%
            </span>
          ) : (
            <span
              className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5',
                correct ? 'bg-success text-white' : 'bg-error text-white',
              ].join(' ')}
            >
              {correct ? '✓' : '✗'}
            </span>
          )}
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
          <div className='rounded-xl p-3'>
            <p className='text-app-text-secondary text-xs font-medium mb-1'>
              Your answer
            </p>
            <p className='text-app-text text-sm italic'>{userAnswer}</p>
          </div>
        )}

        <div className='rounded-xl p-3'>
          <p
            className='text-app-text text-sm leading-relaxed'
            dangerouslySetInnerHTML={{ __html: explanation }}
          />
        </div>

        {tip && (
          <div className='flex items-start gap-2 mt-1'>
            <div
              className={`p-1 flex-shrink-0 ${scorePct >= 80 ? ' text-success' : scorePct >= 50 ? 'text-yellow-400' : 'text-error'}`}
            >
              <ion-icon
                name='bulb-outline'
                style={{ fontSize: '14px', display: 'block' }}
              />
            </div>
            <p className='text-app-text-secondary text-xs leading-relaxed'>
              <span className='font-bold'>Pro Tip: </span>
              {tip}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
