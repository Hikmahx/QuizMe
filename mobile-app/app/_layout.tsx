import { Stack } from 'expo-router/stack';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { useFonts, Rubik_400Regular, Rubik_500Medium, Rubik_700Bold } from '@expo-google-fonts/rubik';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Rubik_400Regular, Rubik_500Medium, Rubik_700Bold });

  if (!fontsLoaded) return null;

  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </Provider>
  );
}
