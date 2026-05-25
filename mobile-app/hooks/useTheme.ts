import { useColorScheme } from '@/hooks/useColorScheme';

// Token map — mirrors tailwind.config.js colours.
// Dark mode is the default (matches the screenshot).
const LIGHT = {
  primary:          '#a729f5',
  success:          '#26d782',
  error:            '#ee5454',
  appBg:            '#f4f6fa',
  appCard:          '#ffffff',
  appText:          '#313e51',
  appTextSecondary: '#626c7f',
  appShadow:        '#8fa0c1',
  border:           'rgba(49,62,81,0.12)',
} as const;

const DARK = {
  primary:          '#a729f5',
  success:          '#26d782',
  error:            '#ee5454',
  appBg:            '#313e51',
  appCard:          '#3b4d66',
  appText:          '#ffffff',
  appTextSecondary: '#abc1e1',
  appShadow:        '#1a2535',
  border:           'rgba(255,255,255,0.10)',
} as const;

export type AppColors = typeof DARK;

/** Returns the current theme's colour tokens. */
export function useColors(): AppColors {
  // Dark is default — falls back to dark when scheme is null/undefined.
  const scheme = useColorScheme();
  return scheme === 'light' ? LIGHT : DARK;
}

export function useIsDark(): boolean {
  return useColorScheme() !== 'light';
}

/** rgba helper — keeps colour logic out of components. */
export function alpha(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
