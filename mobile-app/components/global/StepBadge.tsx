import { View } from 'react-native';
import tw from '@/lib/tw';
import { Text } from '@/components/global/Themed';
import { useColors, alpha } from '@/hooks/useTheme';

export default function StepBadge({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View
      style={[
        tw`flex-row items-center gap-2 self-start rounded-full px-4 py-1.5 mb-5`,
        { backgroundColor: alpha(colors.primary, 0.15), borderWidth: 1, borderColor: alpha(colors.primary, 0.3) },
      ]}
    >
      <View style={[tw`w-1.5 h-1.5 rounded-full`, { backgroundColor: colors.primary }]} />
      <Text medium size={13} style={{ color: colors.primary }}>{label}</Text>
    </View>
  );
}
