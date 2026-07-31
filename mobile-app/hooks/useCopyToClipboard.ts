import { useCallback, useRef, useState } from 'react';
import * as Clipboard from 'expo-clipboard';

export type CopyState = 'idle' | 'copied' | 'error';

/**
 * Shared clipboard-copy logic for the mobile app (used by the summary
 * screen and the upload file-preview modal). Mirrors the web
 * useCopyToClipboard hook so both platforms share the same idle/copied/error
 * state machine instead of each screen re-implementing its own timeout.
 *
 * const { state, copy } = useCopyToClipboard();
 * <Pressable onPress={() => copy(text)}>...</Pressable>
 */
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