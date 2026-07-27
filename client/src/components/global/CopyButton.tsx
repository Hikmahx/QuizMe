'use client';

import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  errorLabel?: string;
  hideLabelOnMobile?: boolean;
  className?: string;
}

export default function CopyButton({
  text,
  label = 'Copy',
  copiedLabel = 'Copied',
  errorLabel = 'Failed',
  hideLabelOnMobile = false,
  className = '',
}: CopyButtonProps) {
  const { state, copy } = useCopyToClipboard();

  const displayLabel =
    state === 'copied' ? copiedLabel : state === 'error' ? errorLabel : label;

  const icon =
    state === 'copied'
      ? 'checkmark-outline'
      : state === 'error'
        ? 'close-outline'
        : 'copy-outline';

  const stateClasses =
    state === 'copied'
      ? 'bg-green-500/15 border-green-400/40 text-green-400'
      : state === 'error'
        ? 'bg-red-500/15 border-red-400/40 text-red-400'
        : 'border-app-text-secondary/20 text-app-text-secondary hover:bg-app-text-secondary/7 hover:border-app-text-secondary/40 hover:text-app-text';

  return (
    <button
      onClick={() => copy(text)}
      disabled={!text}
      title='Copy to clipboard'
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed shrink-0',
        stateClasses,
        className,
      ].join(' ')}
    >
      <ion-icon name={icon} style={{ fontSize: '14px' }} />
      <span className={hideLabelOnMobile ? 'hidden sm:inline' : undefined}>
        {displayLabel}
      </span>
    </button>
  );
}