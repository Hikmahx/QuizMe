import { SummaryLengthOption, SummaryStyleOption } from '@/types'

export const SUMMARY_LENGTH_OPTIONS: SummaryLengthOption[] = [
  {
    value: 'short',
    label: 'Short',
    description: 'A quick overview — the essentials at a glance',
    icon: 'flash-outline',
    iconBg: 'bg-green-400/15',
    iconColor: 'text-green-400',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Key points with a balanced level of detail',
    icon: 'document-text-outline',
    iconBg: 'bg-blue-400/15',
    iconColor: 'text-blue-400',
  },
  {
    value: 'long',
    label: 'Long',
    description: 'Comprehensive, in-depth breakdown of everything',
    icon: 'book-outline',
    iconBg: 'bg-orange-400/15',
    iconColor: 'text-orange-400',
  },
]

export const SUMMARY_STYLE_OPTIONS: SummaryStyleOption[] = [
  {
    value: 'combined',
    label: 'Combined',
    description: 'One unified summary across all your documents',
    icon: 'link-outline',
    iconBg: 'bg-blue-400/15',
    iconColor: 'text-blue-400',
  },
  {
    value: 'doc-by-doc',
    label: 'Doc-by-doc',
    description: "Browse each document's summary separately",
    icon: 'copy-outline',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-500',
  },
]