import Colors from '../constants/Colors';
import { useColorScheme } from './useColorScheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const scheme = useColorScheme() ?? 'light';
  const fromProps = props[scheme];
  return fromProps ?? Colors[scheme][colorName];
}

/** Returns the full colour token map for the current scheme */
export function useColors() {
  const scheme = useColorScheme() ?? 'light';
  return Colors[scheme];
}

export function useIsDark() {
  return useColorScheme() === 'dark';
}
