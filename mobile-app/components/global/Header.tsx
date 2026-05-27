import { View, Pressable, Appearance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import tw from '@/lib/tw';
import { Text } from '@/components/global/Themed';
import { useColors, useIsDark } from '@/hooks/useTheme';

export default function Header() {
  const colors  = useColors();
  const isDark  = useIsDark();
  const [dark, setDark] = useState(isDark);

  const toggle = () => {
    Appearance.setColorScheme(dark ? 'light' : 'dark');
    setDark(!dark);
  };

  return (
    <View style={tw`flex-row items-center justify-between px-6 pt-2 pb-4`}>
      <Text bold size={18}>QuizMe</Text>

      <View style={tw`flex-row items-center gap-2.5`}>
        <Ionicons name="sunny-outline" size={18} color={colors.appTextSecondary} />

        <Pressable
          onPress={toggle}
          accessibilityRole="switch"
          style={[tw`w-13 h-7 rounded-full justify-center px-1`, { backgroundColor: colors.primary }]}
        >
          <View style={[tw`w-5 h-5 rounded-full bg-white`, { alignSelf: dark ? 'flex-end' : 'flex-start' }]} />
        </Pressable>

        <Ionicons name="moon-outline" size={18} color={colors.appTextSecondary} />
      </View>
    </View>
  );
}
