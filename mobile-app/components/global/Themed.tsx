import { Text as RNText, TextProps as RNTextProps, View as RNView, ViewProps as RNViewProps } from 'react-native';
import tw from '@/lib/tw';
import { useColors } from '@/hooks/useTheme';

export type TextProps = RNTextProps & {
  secondary?: boolean;
  bold?:      boolean;
  medium?:    boolean;
  size?:      number;
};

export type ViewProps = RNViewProps & {
  card?: boolean;
};

export function Text({ secondary, bold, medium, size, style, ...props }: TextProps) {
  const colors = useColors();
  return (
    <RNText
      style={[
        {
          fontFamily: bold ? 'Rubik_700Bold' : medium ? 'Rubik_500Medium' : 'Rubik_400Regular',
          fontSize:   size ?? 14,
          color:      secondary ? colors.appTextSecondary : colors.appText,
        },
        style,
      ]}
      {...props}
    />
  );
}

export function View({ card, style, ...props }: ViewProps) {
  const colors = useColors();
  return (
    <RNView
      style={[
        card ? tw`rounded-3xl p-5` : undefined,
        card ? { backgroundColor: colors.appCard } : undefined,
        style,
      ]}
      {...props}
    />
  );
}
