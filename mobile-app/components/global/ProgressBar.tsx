import { View } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import tw from '@/lib/tw';
import { useColors, alpha } from '@/hooks/useTheme';

export default function ProgressBar({ value }: { value: number }) {
  const colors = useColors();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(value, { duration: 500 });
  }, [value]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%` as any,
  }));

  return (
    <View
      style={[
        tw`h-1 rounded-full overflow-hidden mb-6`,
        { backgroundColor: alpha(colors.appText, 0.12) },
      ]}
    >
      <Animated.View
        style={[
          tw`h-1 rounded-full`,
          { backgroundColor: colors.primary },
          barStyle,
        ]}
      />
    </View>
  );
}
