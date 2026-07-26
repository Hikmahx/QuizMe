'use client';

import { useCallback, useRef, useState } from 'react';

export type CopyState = 'idle' | 'copied' | 'error';

/**
 * Shared clipboard-copy logic, used anywhere a "Copy" button appears
 * (SummaryCard, FilePreviewModal, etc). Handles the modern Clipboard API
 * with a `document.execCommand('copy')` fallback for browsers/contexts
 * where `navigator.clipboard` isn't available, and exposes a small state
 * machine so callers can show "Copied"/"Failed" feedback without each
 * re-implementing the timeout logic.
 *
 * const { state, copy } = useCopyToClipboard();
 * <button onClick={() => copy(text)}>{state === 'copied' ? 'Copied' : 'Copy'}</button>
 */
export function useCopyToClipboard(resetAfterMs = 2000) {
  const [state, setState] = useState<CopyState>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string) => {
      if (!text) return;

      let succeeded = false;
      try {
        await navigator.clipboard.writeText(text);
        succeeded = true;
      } catch {
        // Fallback for browsers/contexts without Clipboard API access
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          succeeded = document.execCommand('copy');
          document.body.removeChild(textarea);
        } catch {
          succeeded = false;
        }
      }

      setState(succeeded ? 'copied' : 'error');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setState('idle'), resetAfterMs);
    },
    [resetAfterMs],
  );

  return { state, copy };
}