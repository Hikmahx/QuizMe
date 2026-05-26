import { View, ViewStyle } from 'react-native';
import tw from '@/lib/tw';
import { useColors, useIsDark } from '@/hooks/useTheme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function Card({ children, style }: Props) {
  const colors = useColors();
  const isDark = useIsDark();

  return (
    <View
      style={[
        tw`rounded-3xl p-5`,
        {
          backgroundColor: colors.appCard,
          shadowColor: isDark ? '#000' : colors.appShadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.4 : 0.12,
          shadowRadius: 24,
          elevation: 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
