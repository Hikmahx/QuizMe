import { SummaryLengthOption, SummaryStyleOption } from '@/types'

export const SUMMARY_LENGTH_OPTIONS: SummaryLengthOption[] = [
  {
    value: 'short',
    label: 'Short',
    description: 'A quick overview — the essentials at a glance',
    icon: '⚡',
    iconBg: 'bg-green-400/15',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Key points with a balanced level of detail',
    icon: '📋',
    iconBg: 'bg-blue-400/15',
  },
  {
    value: 'long',
    label: 'Long',
    description: 'Comprehensive, in-depth breakdown of everything',
    icon: '📚',
    iconBg: 'bg-purple-500/15',
  },
]

export const SUMMARY_STYLE_OPTIONS: SummaryStyleOption[] = [
  {
    value: 'combined',
    label: 'Combined',
    description: 'One unified summary across all your documents',
    icon: '🔗',
    iconBg: 'bg-blue-400/15',
  },
  {
    value: 'doc-by-doc',
    label: 'Doc-by-doc',
    description: 'Browse each document\'s summary separately',
    icon: '📑',
    iconBg: 'bg-purple-500/15',
  },
]
