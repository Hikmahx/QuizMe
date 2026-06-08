import { FeatureMeta } from '@/types';

export const FEATURES: FeatureMeta[] = [
  {
    key: 'view-summary',
    label: 'View Summary',
    icon: 'document-text-outline',
    bgColor: 'rgba(167,41,245,0.20)',
    iconColor: '#a729f5',
    route: '/(tabs)/summary',
    description: 'Get a concise summary of your documents',
  },
  {
    key: 'ask-questions',
    label: 'Ask Questions',
    icon: 'help-circle-outline',
    bgColor: 'rgba(38,215,130,0.20)',
    iconColor: '#26d782',
    route: '/(tabs)/qa',
    description: 'Ask anything about your uploaded documents',
  },
  {
    key: 'quiz-time',
    label: 'Quiz Time!',
    icon: 'grid-outline',
    bgColor: 'rgba(96,165,250,0.20)',
    iconColor: '#60a5fa',
    route: '/(tabs)/quiz',
    description: 'Test your knowledge with AI-generated quizzes',
  },
];

export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
];

export const MAX_FILES = 2;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
