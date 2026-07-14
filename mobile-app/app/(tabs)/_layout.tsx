import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useTheme';

export default function TabLayout() {
  const colors = useColors();

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.appTextSecondary,
          tabBarStyle: {
            backgroundColor: colors.appCard,
            borderTopColor: colors.border,
            paddingTop: 6,
            height: 58,
          },
          tabBarLabelStyle: { fontFamily: 'Rubik_400Regular', fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name='home'
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name='home-outline' size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name='upload'
          options={{
            title: 'Upload',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name='cloud-upload-outline' size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name='summary'
          options={{
            title: 'Summary',
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name='document-text-outline'
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name='qa'
          options={{
            title: 'Ask AI',
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name='chatbubble-ellipses-outline'
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name='quiz/index'
          options={{
            title: 'Quiz',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name='school-outline' size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen name='quiz/options' options={{ href: null }} />
        <Tabs.Screen name='quiz/ready' options={{ href: null }} />
        <Tabs.Screen name='quiz/play' options={{ href: null }} />
        <Tabs.Screen name='quiz/score' options={{ href: null }} />
        <Tabs.Screen name='quiz/feedback' options={{ href: null }} />
      </Tabs>
    </SafeAreaProvider>
  );
}
