import { FeatureMeta } from '@/types'

export const FEATURES: FeatureMeta[] = [
  {
    key: 'view-summary',
    label: 'View Summary',
    icon: '/icons/summary.svg',
    bgClass: 'bg-purple-500/15',
    iconClass: 'text-purple-400',
    destinationPath: '/view-summary',
    description: 'Get a concise summary of your documents',
  },
  {
    key: 'ask-questions',
    label: 'Ask Questions',
    icon: '/icons/questions.svg',
    bgClass: 'bg-green-400/15',
    iconClass: 'text-green-400',
    destinationPath: '/q-and-a',
    description: 'Ask anything about your uploaded documents',
  },
  {
    key: 'quiz-time',
    label: 'Quiz Time!',
    icon: '/icons/quiz.svg',
    bgClass: 'bg-blue-400/15',
    iconClass: 'text-blue-400',
    destinationPath: '/quiz',
    description: 'Test your knowledge with AI-generated quizzes',
  },
]

export const FEATURE_MAP = Object.fromEntries(
  FEATURES.map((f) => [f.key, f])
) as Record<string, FeatureMeta>

export const MAX_FILES = 10
export const MAX_FILE_SIZE_MB = 20
export const ACCEPTED_TYPES = '.pdf,.docx,.txt'
