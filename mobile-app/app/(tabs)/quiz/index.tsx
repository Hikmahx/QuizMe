import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function QuizIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/quiz/options');
  }, []);
  return null;
}
