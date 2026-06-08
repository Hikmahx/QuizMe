import { SummaryLength, SummaryStyle } from '@/types';

export interface SummaryOption<T> {
  value: T;
  label: string;
  description: string;
  icon: string;
  bgColor: string;
  iconColor: string;
}

export const LENGTH_OPTIONS: SummaryOption<SummaryLength>[] = [
  {
    value: 'short',
    label: 'Short',
    description: 'A quick overview — the essentials at a glance',
    icon: 'flash-outline',
    bgColor: 'rgba(38,215,130,0.18)',
    iconColor: '#26d782',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Key points with a balanced level of detail',
    icon: 'document-text-outline',
    bgColor: 'rgba(96,165,250,0.18)',
    iconColor: '#60a5fa',
  },
  {
    value: 'long',
    label: 'Long',
    description: 'Comprehensive, in-depth breakdown of everything',
    icon: 'book-outline',
    bgColor: 'rgba(251,146,60,0.18)',
    iconColor: '#fb923c',
  },
];

export const STYLE_OPTIONS: SummaryOption<SummaryStyle>[] = [
  {
    value: 'combined',
    label: 'Combined',
    description: 'One unified summary across all your documents',
    icon: 'link-outline',
    bgColor: 'rgba(96,165,250,0.18)',
    iconColor: '#60a5fa',
  },
  {
    value: 'doc-by-doc',
    label: 'Doc-by-doc',
    description: "Browse each document's summary separately",
    icon: 'copy-outline',
    bgColor: 'rgba(167,41,245,0.18)',
    iconColor: '#a729f5',
  },
];
