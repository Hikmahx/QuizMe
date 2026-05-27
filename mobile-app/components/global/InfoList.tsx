import { View } from 'react-native';
import tw from '@/lib/tw';
import { Text } from '@/components/global/Themed';
import { useColors } from '@/hooks/useTheme';

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, '');
}

export default function InfoList({ items }: { items: string[] }) {
  const colors = useColors();
  return (
    <View style={tw`gap-3`}>
      {items.map((item, index) => (
        <View key={index} style={tw`flex-row items-start gap-3`}>
          <View style={[tw`w-2 h-2 rounded-full mt-1.5 shrink-0`, { backgroundColor: colors.primary }]} />
          <Text secondary size={14} style={tw`flex-1 leading-6`}>
            {stripHtml(item)}
          </Text>
        </View>
      ))}
    </View>
  );
}
