import {
  QuizDifficulty,
  QuizQuestionCount,
  QuizQuestionType,
  TheoryInputMode,
} from '@/types';

export interface QuizOption<T> {
  value: T;
  label: string;
  description: string;
  icon: string;
  bgColor: string;
  iconColor: string;
}

export const DIFFICULTY_OPTIONS: QuizOption<QuizDifficulty>[] = [
  {
    value: 'easy',
    label: 'Easy',
    description: 'Straightforward questions to build confidence',
    icon: 'leaf-outline',
    bgColor: 'rgba(38,215,130,0.18)',
    iconColor: '#26d782',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'A balanced challenge — most concepts tested',
    icon: 'flash-outline',
    bgColor: 'rgba(250,204,21,0.18)',
    iconColor: '#facc15',
  },
  {
    value: 'hard',
    label: 'Hard',
    description: 'Deep-dive questions that test true understanding',
    icon: 'flame-outline',
    bgColor: 'rgba(238,84,84,0.18)',
    iconColor: '#ee5454',
  },
];

export const COUNT_OPTIONS: QuizOption<QuizQuestionCount>[] = [
  {
    value: 10,
    label: '10 Questions',
    description: 'Quick session — great for a fast check-in',
    icon: 'flash-outline',
    bgColor: 'rgba(96,165,250,0.18)',
    iconColor: '#60a5fa',
  },
  {
    value: 20,
    label: '20 Questions',
    description: 'Standard session — covers key topics thoroughly',
    icon: 'list-outline',
    bgColor: 'rgba(167,41,245,0.18)',
    iconColor: '#a729f5',
  },
  {
    value: 30,
    label: '30 Questions',
    description: 'Deep dive — comprehensive coverage of the material',
    icon: 'library-outline',
    bgColor: 'rgba(251,146,60,0.18)',
    iconColor: '#fb923c',
  },
];

export const TYPE_OPTIONS: QuizOption<QuizQuestionType>[] = [
  {
    value: 'mcq',
    label: 'Multiple Choice',
    description: 'Pick the correct answer from four options',
    icon: 'checkmark-circle-outline',
    bgColor: 'rgba(96,165,250,0.18)',
    iconColor: '#60a5fa',
  },
  {
    value: 'theory',
    label: 'Theory',
    description: 'Write or speak your own answers in full',
    icon: 'create-outline',
    bgColor: 'rgba(167,41,245,0.18)',
    iconColor: '#a729f5',
  },
];

export const INPUT_OPTIONS: QuizOption<TheoryInputMode>[] = [
  {
    value: 'written',
    label: 'Written',
    description: 'Type your answers — no microphone needed',
    icon: 'keypad-outline',
    bgColor: 'rgba(96,165,250,0.18)',
    iconColor: '#60a5fa',
  },
  {
    value: 'oral',
    label: 'Oral',
    description: 'Speak your answers aloud — AI reads questions to you',
    icon: 'mic-outline',
    bgColor: 'rgba(167,41,245,0.18)',
    iconColor: '#a729f5',
  },
];
