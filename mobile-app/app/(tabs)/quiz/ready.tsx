import { View, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import tw from '@/lib/tw';
import Screen from '@/components/global/Screen';
import Header from '@/components/global/Header';
import { Text } from '@/components/global/Themed';
import StepBadge from '@/components/global/StepBadge';
import ProgressBar from '@/components/global/ProgressBar';
import Card from '@/components/global/Card';
import Btn from '@/components/global/Btn';
import { useColors, alpha } from '@/hooks/useTheme';

const TYPE_LABEL: Record<string, string> = {
  mcq: 'Multiple Choice',
  theory: 'Theory',
};

export default function QuizReady() {
  const router = useRouter();
  const colors = useColors();
  const { difficulty, questionCount, questionType, inputMode } = useSelector(
    (state: RootState) => state.quiz,
  );
  const { collectionId } = useSelector((state: RootState) => state.upload);

  const hasDocs = !!collectionId;

  const summaryRows = [
    {
      icon: 'speedometer-outline',
      label: 'Difficulty',
      value: difficulty
        ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
        : '—',
    },
    {
      icon: 'help-circle-outline',
      label: 'Questions',
      value: `${questionCount} questions`,
    },
    {
      icon: 'document-text-outline',
      label: 'Type',
      value: TYPE_LABEL[questionType ?? 'mcq'] ?? '—',
    },
    ...(questionType === 'theory' && inputMode
      ? [
          {
            icon: inputMode === 'oral' ? 'mic-outline' : 'keypad-outline',
            label: 'Answer mode',
            value: inputMode === 'oral' ? 'Oral' : 'Written',
          },
        ]
      : []),
    {
      icon: hasDocs ? 'documents-outline' : 'cube-outline',
      label: 'Source',
      value: hasDocs ? 'Your uploaded documents' : 'Sample questions',
    },
  ];

  return (
    <Screen>
      <Header />
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-6 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        <ProgressBar value={100} />
        <StepBadge label='All set' />

        <Text size={34} style={{ lineHeight: 44 }}>
          Here's your{'\n'}
          <Text
            bold
            size={34}
            style={{ lineHeight: 44, color: colors.primary }}
          >
            quiz summary.
          </Text>
        </Text>
        <Text secondary size={13} style={tw`italic mt-2 mb-7 leading-5`}>
          Double-check your settings. When you're ready, hit Start Quiz.
        </Text>

        <View style={tw`gap-4 mb-7`}>
          {summaryRows.map((row) => (
            <View key={row.label} style={tw`flex-row items-center gap-3`}>
              <View
                style={[
                  tw`w-9 h-9 rounded-xl items-center justify-center`,
                  { backgroundColor: alpha(colors.primary, 0.15) },
                ]}
              >
                <Ionicons
                  name={row.icon as any}
                  size={18}
                  color={colors.primary}
                />
              </View>
              <Text size={14} style={{ lineHeight: 20 }}>
                <Text medium size={14}>
                  {row.label}:{' '}
                </Text>
                <Text secondary size={14}>
                  {row.value}
                </Text>
              </Text>
            </View>
          ))}
        </View>

        <Card style={tw`items-center mb-5`}>
          <View
            style={[
              tw`w-18 h-18 rounded-2xl items-center justify-center mb-4`,
              { backgroundColor: alpha(colors.primary, 0.15) },
            ]}
          >
            <Ionicons name='brain-outline' size={36} color={colors.primary} />
          </View>
          <Text bold size={22} style={tw`mb-2 text-center`}>
            Are you ready?
          </Text>
          <Text
            secondary
            size={13}
            style={{
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: hasDocs ? 16 : 0,
            }}
          >
            {questionType === 'theory' && inputMode === 'oral'
              ? "Make sure your microphone is enabled. The AI reads each question aloud, then it's your turn."
              : 'Move through each question at your own pace. Take your time.'}
          </Text>

          {hasDocs && (
            <View
              style={[
                tw`w-full rounded-xl p-3.5`,
                {
                  backgroundColor: alpha(colors.primary, 0.08),
                  borderWidth: 1.5,
                  borderColor: alpha(colors.primary, 0.2),
                },
              ]}
            >
              <View style={tw`flex-row items-center gap-2 mb-1.5`}>
                <Ionicons
                  name='sparkles-outline'
                  size={14}
                  color={colors.primary}
                />
                <Text medium size={12} style={{ color: colors.primary }}>
                  AI-generated questions
                </Text>
              </View>
              <Text secondary size={12} style={tw`leading-5`}>
                Questions generated from your documents at{' '}
                <Text medium size={12}>
                  {difficulty}
                </Text>{' '}
                difficulty. Expect 15–90 s on first load.
              </Text>
            </View>
          )}
        </Card>

        <Btn
          label='Start Quiz'
          onPress={() => router.push('/(tabs)/quiz/play')}
        />

        <Pressable
          onPress={() => router.push('/(tabs)/quiz/options')}
          style={tw`items-center py-3.5`}
        >
          <Text secondary size={13}>
            ← Change settings
          </Text>
        </Pressable>

        <Text secondary size={12} style={tw`text-center`}>
          {questionCount} questions · {difficulty} ·{' '}
          {TYPE_LABEL[questionType ?? 'mcq']}
        </Text>
      </ScrollView>
    </Screen>
  );
}
