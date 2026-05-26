import { Pressable, ActivityIndicator, View } from 'react-native';
import tw from '@/lib/tw';
import { Text } from '@/components/global/Themed';
import { useColors, alpha } from '@/hooks/useTheme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export default function Btn({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
}: Props) {
  const colors = useColors();
  const isPrimary = variant === 'primary';
  const textColor = isPrimary ? '#fff' : colors.appText;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        tw`w-full py-4 rounded-2xl items-center justify-center`,
        {
          backgroundColor: isPrimary
            ? pressed
              ? alpha(colors.primary, 0.85)
              : colors.primary
            : pressed
              ? alpha(colors.appText, 0.06)
              : 'transparent',
          borderWidth: isPrimary ? 0 : 1.5,
          borderColor:
            variant === 'secondary'
              ? alpha(colors.appText, 0.15)
              : alpha(colors.appTextSecondary, 0.25),
          opacity: disabled ? 0.38 : 1,
        },
      ]}
    >
      {loading ? (
        <View style={tw`flex-row items-center gap-2`}>
          <ActivityIndicator color={textColor} size='small' />
          <Text medium size={15} style={{ color: textColor }}>
            {label}
          </Text>
        </View>
      ) : (
        <Text medium size={15} style={{ color: textColor }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
