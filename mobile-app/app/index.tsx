import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import tw from '@/lib/tw';
import { Text } from '@/components/global/Themed';

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/(tabs)/home'), 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={[
        tw`flex-1 items-center justify-center gap-2`,
        { backgroundColor: '#a729f5' },
      ]}
    >
      <Text bold size={38} style={{ color: '#fff', letterSpacing: 0.5 }}>
        QuizMe
      </Text>
      <Text size={15} style={{ color: 'rgba(255,255,255,0.72)' }}>
        AI-powered learning
      </Text>
    </View>
  );
}
