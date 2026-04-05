import {
  QuizDifficulty,
  QuizQuestionCount,
  QuizQuestionType,
  TheoryInputMode,
} from '@/types/quiz';

export interface QuizOptionItem<T> {
  value: T;
  label: string;
  description: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

export const DIFFICULTY_OPTIONS: QuizOptionItem<QuizDifficulty>[] = [
  {
    value: 'easy',
    label: 'Easy',
    description: 'Straightforward questions to build confidence',
    icon: 'leaf-outline',
    iconBg: 'bg-green-400/15',
    iconColor: 'text-green-400',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'A balanced challenge — most concepts tested',
    icon: 'flash-outline',
    iconBg: 'bg-yellow-400/15',
    iconColor: 'text-yellow-400',
  },
  {
    value: 'hard',
    label: 'Hard',
    description: 'Deep-dive questions that test true understanding',
    icon: 'flame-outline',
    iconBg: 'bg-red-400/15',
    iconColor: 'text-red-400',
  },
];

export const QUESTION_COUNT_OPTIONS: QuizOptionItem<QuizQuestionCount>[] = [
  {
    value: 10,
    label: '10 Questions',
    description: 'Quick session — great for a fast check-in',
    icon: 'flash-outline',
    iconBg: 'bg-blue-400/15',
    iconColor: 'text-blue-400',
  },
  {
    value: 20,
    label: '20 Questions',
    description: 'Standard session — covers key topics thoroughly',
    icon: 'list-outline',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
  },
  {
    value: 30,
    label: '30 Questions',
    description: 'Deep dive — comprehensive coverage of the material',
    icon: 'library-outline',
    iconBg: 'bg-orange-400/15',
    iconColor: 'text-orange-400',
  },
];

export const QUESTION_TYPE_OPTIONS: QuizOptionItem<QuizQuestionType>[] = [
  {
    value: 'mcq',
    label: 'Multiple Choice',
    description: 'Pick the correct answer from four options',
    icon: 'checkmark-circle-outline',
    iconBg: 'bg-blue-400/15',
    iconColor: 'text-blue-400',
  },
  {
    value: 'theory',
    label: 'Theory',
    description: 'Write or speak your own answers in full',
    icon: 'create-outline',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
  },
];

export const INPUT_MODE_OPTIONS: QuizOptionItem<TheoryInputMode>[] = [
  {
    value: 'written',
    label: 'Written',
    description: 'Type your answers — no microphone needed',
    icon: 'keypad-outline',
    iconBg: 'bg-blue-400/15',
    iconColor: 'text-blue-400',
  },
  {
    value: 'oral',
    label: 'Oral',
    description: 'Speak your answers aloud — AI reads questions to you',
    icon: 'mic-outline',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
  },
];
