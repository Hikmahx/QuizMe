'use client';

import { useCallback, useRef, useState } from 'react';

export type CopyState = 'idle' | 'copied' | 'error';


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