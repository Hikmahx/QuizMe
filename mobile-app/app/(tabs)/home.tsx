import { ScrollView, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tw';
import Screen from '@/components/global/Screen';
import Header from '@/components/global/Header';
import { Text } from '@/components/global/Themed';
import { useColors, useIsDark, alpha } from '@/hooks/useTheme';
import { FEATURES } from '@/lib/features';

export default function Home() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDark();

  return (
    <Screen>
      <Header />
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-6 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        <View style={tw`mb-10`}>
          <Text size={34} style={{ lineHeight: 44 }}>
            Welcome to the{'\n'}
            <Text bold size={34} style={{ lineHeight: 44 }}>
              QuizMe App
            </Text>
          </Text>
          <Text secondary size={15} style={tw`italic mt-2`}>
            Pick a feature to get started.
          </Text>
        </View>

        <View style={tw`gap-3`}>
          {FEATURES.map((feature) => (
            <Pressable
              key={feature.key}
              onPress={() => router.push(feature.route as any)}
              style={({ pressed }) => [
                tw`flex-row items-center gap-5 rounded-2xl p-4`,
                {
                  backgroundColor: colors.appCard,
                  borderWidth: 1.5,
                  borderColor: pressed
                    ? alpha(colors.primary, 0.45)
                    : colors.border,
                  shadowColor: isDark ? '#000' : colors.appShadow,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDark ? 0.28 : 0.08,
                  shadowRadius: 12,
                  elevation: 4,
                  opacity: pressed ? 0.93 : 1,
                },
              ]}
            >
              <View
                style={[
                  tw`w-14 h-14 rounded-2xl items-center justify-center shrink-0`,
                  { backgroundColor: feature.bgColor },
                ]}
              >
                <Ionicons
                  name={feature.icon as any}
                  size={28}
                  color={feature.iconColor}
                />
              </View>

              <View style={tw`flex-1`}>
                <Text medium size={17}>
                  {feature.label}
                </Text>
                <Text secondary size={13} style={tw`mt-1 leading-5`}>
                  {feature.description}
                </Text>
              </View>

              <Ionicons
                name='chevron-forward'
                size={18}
                color={colors.appTextSecondary}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
