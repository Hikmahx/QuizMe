import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '@/lib/tw';
import { useColors } from '@/hooks/useTheme';

export default function Screen({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: colors.appBg }]}>
      {children}
    </SafeAreaView>
  );
}
