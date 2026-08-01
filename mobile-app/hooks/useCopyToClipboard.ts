import { useCallback, useRef, useState } from 'react';
import * as Clipboard from 'expo-clipboard';

export type CopyState = 'idle' | 'copied' | 'error';


export function useCopyToClipboard(resetAfterMs = 2000) {
  const [state, setState] = useState<CopyState>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string) => {
      if (!text) return;
      try {
        await Clipboard.setStringAsync(text);
        setState('copied');
      } catch {
        setState('error');
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setState('idle'), resetAfterMs);
    },
    [resetAfterMs],
  );

  return { state, copy };
}