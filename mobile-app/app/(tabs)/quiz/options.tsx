import { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  setDifficulty,
  setQuestionCount,
  setQuestionType,
  setInputMode,
  resetQuiz,
} from '@/redux/slices/quizSlice';
import tw from '@/lib/tw';
import Screen from '@/components/global/Screen';
import Header from '@/components/global/Header';
import { Text } from '@/components/global/Themed';
import ProgressBar from '@/components/global/ProgressBar';
import StepBadge from '@/components/global/StepBadge';
import InfoList from '@/components/global/InfoList';
import OptionCard from '@/components/global/OptionCard';
import Btn from '@/components/global/Btn';
import { useColors } from '@/hooks/useTheme';
import {
  QuizDifficulty,
  QuizQuestionCount,
  QuizQuestionType,
  TheoryInputMode,
} from '@/types';
import {
  DIFFICULTY_OPTIONS,
  COUNT_OPTIONS,
  TYPE_OPTIONS,
  INPUT_OPTIONS,
} from '@/lib/quiz-options';

type Step = 'difficulty' | 'count' | 'type' | 'input';
const STEPS: Step[] = ['difficulty', 'count', 'type', 'input'];

const STEP_META: Record<
  Step,
  { heading: string; sub: string; info: string[] }
> = {
  difficulty: {
    heading: 'Choose your\ndifficulty.',
    sub: 'How challenging do you want the questions to be?',
    info: [
      '<strong>Easy</strong> — familiar concepts, simple phrasing.',
      '<strong>Medium</strong> — application of ideas, some analysis.',
      '<strong>Hard</strong> — synthesis, edge cases, deep understanding.',
    ],
  },
  count: {
    heading: 'How many\nquestions?',
    sub: 'Pick a session length that fits your schedule.',
    info: [
      '<strong>10</strong> — perfect for a quick 5-minute check-in.',
      '<strong>20</strong> — the standard, covers most key ideas.',
      '<strong>30</strong> — comprehensive, nothing left out.',
    ],
  },
  type: {
    heading: 'What type of\nquestions?',
    sub: "Choose how you'd like to be tested.",
    info: [
      '<strong>Multiple Choice</strong> — select from A, B, C or D.',
      '<strong>Theory</strong> — write or speak an open-ended answer.',
    ],
  },
  input: {
    heading: 'How will you\nanswer?',
    sub: 'Theory questions can be answered in writing or out loud.',
    info: [
      '<strong>Written</strong> — type your answers at your own pace.',
      '<strong>Oral</strong> — AI reads questions aloud, you speak the answer.',
    ],
  },
};

export default function QuizOptions() {
  const router = useRouter();
  const dispatch = useDispatch();
  const colors = useColors();
  const { difficulty, questionCount, questionType, inputMode } = useSelector(
    (state: RootState) => state.quiz,
  );

  const [step, setStep] = useState<Step>('difficulty');

  const isTheory = questionType === 'theory';
  const totalSteps = isTheory ? 4 : 3;
  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  const options =
    step === 'difficulty'
      ? DIFFICULTY_OPTIONS
      : step === 'count'
        ? COUNT_OPTIONS
        : step === 'type'
          ? TYPE_OPTIONS
          : INPUT_OPTIONS;

  const selectedValue =
    step === 'difficulty'
      ? difficulty
      : step === 'count'
        ? questionCount
        : step === 'type'
          ? questionType
          : inputMode;

  const handleSelect = (value: any) => {
    if (step === 'difficulty') dispatch(setDifficulty(value as QuizDifficulty));
    if (step === 'count')
      dispatch(setQuestionCount(value as QuizQuestionCount));
    if (step === 'type') dispatch(setQuestionType(value as QuizQuestionType));
    if (step === 'input') dispatch(setInputMode(value as TheoryInputMode));
  };

  const handleContinue = () => {
    if (step === 'difficulty') {
      setStep('count');
      return;
    }
    if (step === 'count') {
      setStep('type');
      return;
    }
    if (step === 'type') {
      if (questionType === 'theory') {
        setStep('input');
        return;
      }
      dispatch(resetQuiz());
      router.push('/(tabs)/quiz/ready');
      return;
    }
    dispatch(resetQuiz());
    router.push('/(tabs)/quiz/ready');
  };

  const handleBack = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
  };

  const meta = STEP_META[step];
  const headingLines = meta.heading.split('\n');
  const canContinue = selectedValue !== null && selectedValue !== undefined;

  return (
    <Screen>
      <Header />
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-6 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        <View style={tw`flex-row items-center gap-3 mb-3`}>
          <Pressable
            onPress={handleBack}
            style={{ opacity: stepIndex === 0 ? 0.3 : 1 }}
            disabled={stepIndex === 0}
          >
            <Ionicons name='arrow-back' size={22} color={colors.appText} />
          </Pressable>
          <Text secondary size={13}>
            Step {stepIndex + 1} of {totalSteps}
          </Text>
        </View>

        <ProgressBar value={progress} />
        <StepBadge label={`Step ${stepIndex + 1} of ${totalSteps}`} />

        <Text size={34} style={{ lineHeight: 44 }}>
          {headingLines[0]}
          {'\n'}
          <Text bold size={34} style={{ lineHeight: 44 }}>
            {headingLines[1]}
          </Text>
        </Text>
        <Text secondary size={13} style={tw`italic mt-2 mb-7 leading-5`}>
          {meta.sub}
        </Text>

        <InfoList items={meta.info} />

        <View style={tw`mt-7 gap-3`}>
          {options.map((option: any) => (
            <OptionCard
              key={String(option.value)}
              icon={option.icon}
              bgColor={option.bgColor}
              iconColor={option.iconColor}
              label={option.label}
              description={option.description}
              selected={selectedValue === option.value}
              onPress={() => handleSelect(option.value)}
            />
          ))}
        </View>

        <View style={tw`mt-5`}>
          <Btn
            label='Continue'
            onPress={handleContinue}
            disabled={!canContinue}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
