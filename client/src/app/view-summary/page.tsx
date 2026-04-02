'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/global/Header';
import TwoColumnLayout from '@/components/global/TwoColumnLayout';
import Breadcrumb from '@/components/global/Breadcrumb';
import InfoList from '@/components/global/InfoList';
import QuizCTA from '@/components/global/QuizCTA';
import SummaryCard from '@/components/summary/SummaryCard';
import DocNavigator from '@/components/summary/DocNavigator';
import { FEATURE_MAP } from '@/lib/features';
import { useSummaryFlow } from '@/hooks/useSummaryFlow';
import { DocSummary } from '@/types';

const feature = FEATURE_MAP['view-summary'];

const PLACEHOLDER_SUMMARIES: Record<
  string,
  Record<string, { title: string; paragraphs: string[] }>
> = {
  short: {
    single: {
      title: 'Summary — Short',
      paragraphs: [
        'This document provides an overview of neural network architectures, covering feedforward, convolutional, and recurrent networks.',
        'The key takeaway is that architecture choice should be driven by the structure of the input data.',
      ],
    },
    combined: {
      title: 'Combined Summary — Short',
      paragraphs: [
        'Your documents collectively explore the fundamentals of machine learning and data preprocessing. Key concepts include supervised learning, feature engineering, and model evaluation.',
        'Across all files, the recurring recommendation is to prioritise clean, well-labelled data before model selection. Overfitting is the most cited risk.',
      ],
    },
  },
  medium: {
    single: {
      title: 'Summary — Medium',
      paragraphs: [
        'This document provides a structured introduction to convolutional neural networks (CNNs), explaining the role of convolutional layers, pooling, and fully connected layers in image classification tasks.',
        'The author walks through training a CNN on the CIFAR-10 dataset, demonstrating how depth affects accuracy and training time. Regularisation techniques — specifically dropout and batch normalisation — are introduced as essential tools for preventing overfitting.',
      ],
    },
    combined: {
      title: 'Combined Summary — Medium',
      paragraphs: [
        'Your documents span three interconnected topics: supervised learning pipelines, unsupervised clustering algorithms, and real-world deployment considerations for ML models.',
        'Document 1 focuses on the data preprocessing pipeline — covering null imputation, normalisation, and train/test splitting. Document 2 discusses gradient descent variants (SGD, Adam, RMSProp) and their trade-offs. Document 3 addresses deployment concerns including latency, model versioning, and monitoring drift.',
        'A unifying theme is that model performance is more sensitive to data quality than to model complexity.',
      ],
    },
  },
  long: {
    single: {
      title: 'Summary — Long',
      paragraphs: [
        'This document presents an exhaustive treatment of transformer architectures, tracing their origin from the 2017 "Attention Is All You Need" paper through to modern large language models.',
        'Part I covers the self-attention mechanism in depth: the author derives the scaled dot-product attention formula, explains the intuition behind query, key, and value matrices, and works through a numerical example using a four-token sequence. Multi-head attention is introduced as a way to attend to different representational subspaces simultaneously.',
        'Part II transitions to practical considerations: positional encodings (both fixed sinusoidal and learnable variants), pre-norm vs post-norm layer placement, and the difference between encoder-only (BERT), decoder-only (GPT), and encoder-decoder (T5) architectures.',
      ],
    },
    combined: {
      title: 'Combined Summary — Long',
      paragraphs: [
        'Across your uploaded documents, a comprehensive picture of the end-to-end machine learning workflow emerges — from raw data ingestion through model deployment and ongoing monitoring.',
        'Document 1 (Data Preprocessing Guide) opens with an argument that most ML failures are rooted in data problems, not model architecture. It details a seven-step pipeline: data collection, null handling, outlier detection, feature encoding, scaling, dimensionality reduction, and splitting.',
        'Document 2 (Optimisation Algorithms) surveys gradient descent variants. SGD is described as noisy but effective for large datasets; Adam is positioned as the practical default for most deep learning tasks. Document 3 (ML in Production) introduces the concept of data drift, recommends regular retraining schedules, and discusses model versioning strategies using MLflow and DVC.',
      ],
    },
  },
};

const DOC_SUMMARIES: DocSummary[] = [
  {
    name: 'Data_Preprocessing_Guide.pdf',
    title: 'Data Preprocessing Guide',
    body: [
      'This document covers the full data preprocessing pipeline for machine learning: null imputation strategies, outlier detection using IQR and Z-scores, feature encoding (one-hot vs label encoding), min-max and standard scaling, PCA for dimensionality reduction, and stratified train/test splitting.',
      'The key argument is that clean data is the single highest-leverage investment in any ML project.',
    ],
  },
  {
    name: 'Optimisation_Algorithms.pdf',
    title: 'Optimisation Algorithms',
    body: [
      'A survey of gradient descent variants including batch GD, stochastic GD, mini-batch GD, and adaptive methods (Adagrad, RMSProp, Adam). The author benchmarks these against three datasets and concludes that Adam with a cosine learning rate schedule performs best across the board.',
      'Gradient clipping is recommended for recurrent architectures to prevent exploding gradients.',
    ],
  },
  {
    name: 'ML_in_Production.docx',
    title: 'ML in Production',
    body: [
      'Explores the operational challenges of deploying machine learning models: serving latency trade-offs (batch vs online inference), A/B testing frameworks, model versioning with MLflow, and detecting data/concept drift using statistical tests (KS test, PSI).',
      'The author emphasises that production ML is a software engineering problem and recommends treating model artefacts as first-class software releases.',
    ],
  },
];


export default function ViewSummaryPage() {
  const router = useRouter();
  const { files, length, style, clearFlow, hydrated } = useSummaryFlow();
  const [docIdx, setDocIdx] = useState(0);

  // Guard: if user arrives here without completing the flow, redirect
  useEffect(() => {
    if (!hydrated) return;
    if (files.length === 0 || !length) {
      router.replace('/?selected=view-summary/upload');
    }
  }, [hydrated, files.length, length, router]);

  if (!hydrated || files.length === 0 || !length) return null;

  const isMulti = files.length > 1;
  const isDocByDoc = style === 'doc-by-doc';
  const lenLabel = length.charAt(0).toUpperCase() + length.slice(1);
  const styleLabel = isDocByDoc ? 'Doc-by-doc' : isMulti ? 'Combined' : null;

  const summaryKey = isMulti && !isDocByDoc ? 'combined' : 'single';
  const content =
    PLACEHOLDER_SUMMARIES[length]?.[summaryKey] ??
    PLACEHOLDER_SUMMARIES.medium.single;

  const docs: DocSummary[] = isDocByDoc
    ? files.map(
        (f, i) =>
          DOC_SUMMARIES[i] ?? {
            name: f.name,
            title: f.name,
            body: [
              'Summary content will appear here once the AI processes your document.',
            ],
          },
      )
    : [];

  const crumbs = [
    { label: lenLabel, href: '/view-summary/options?step=length' },
    ...(styleLabel
      ? [
          {
            label: styleLabel,
            href: isMulti ? '/view-summary/options?step=style' : undefined,
          },
        ]
      : []),
  ];

  const handleUploadDifferent = () => {
    clearFlow();
    router.push('/?selected=view-summary/upload');
  };

  // Left column 
  const leftContent = (
    <div className='flex flex-col h-full gap-8'>
      <div>
        <span className='inline-flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 rounded-full px-4 py-1.5 text-sm text-purple-400 font-medium mb-6'>
          <span className='w-1.5 h-1.5 rounded-full bg-purple-500' />
          {isDocByDoc ? 'Doc-by-doc' : isMulti ? 'Combined Summary' : 'Summary'}
        </span>
        <h1 className='text-4xl font-light text-app-text leading-tight mb-2'>
          Here's your
          <strong className='block font-bold'>
            {lenLabel.toLowerCase()} summary.
          </strong>
        </h1>
        <p className='text-app-text-secondary italic text-sm mb-9 leading-relaxed'>
          {isDocByDoc
            ? `Browsing ${files.length} documents one at a time.`
            : isMulti
              ? `A unified summary drawn from all ${files.length} documents you uploaded.`
              : 'Your document has been summarised below.'}
        </p>
        <InfoList
          items={[
            `<strong>${files.length} document${files.length > 1 ? 's' : ''}</strong> processed`,
            `<strong>${lenLabel}</strong> detail level`,
            isDocByDoc
              ? 'Use the arrows to browse each document'
              : isMulti
                ? 'Unified view across all files'
                : 'Ready to quiz when you are',
          ]}
        />
      </div>

      <div className='flex flex-col gap-3 mt-auto'>
        {/* Doc navigator in left col for doc-by-doc */}
        {isDocByDoc && (
          <DocNavigator
            currentIndex={docIdx}
            total={docs.length}
            currentName={docs[docIdx]?.name ?? ''}
            prevName={
              docIdx > 0
                ? docs[docIdx - 1].name.replace(/_/g, ' ').split('.')[0]
                : undefined
            }
            nextName={
              docIdx < docs.length - 1
                ? docs[docIdx + 1].name.replace(/_/g, ' ').split('.')[0]
                : undefined
            }
            onPrev={() => setDocIdx((i) => Math.max(0, i - 1))}
            onNext={() => setDocIdx((i) => Math.min(docs.length - 1, i + 1))}
          />
        )}

        {/* Quiz CTA — compact variant */}
        <QuizCTA variant='compact' />

        {/* Upload different files */}
        <button
          onClick={handleUploadDifferent}
          className='w-full flex items-center justify-center gap-2 border border-app-text-secondary/20 rounded-xl py-3 text-app-text-secondary text-sm hover:bg-app-text-secondary/7 hover:border-app-text-secondary/40 hover:text-app-text transition-all'
        >
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
          >
            <polyline points='1 4 1 10 7 10' />
            <path d='M3.51 15a9 9 0 1 0 .49-3.36' />
          </svg>
          Use different files
        </button>
      </div>
    </div>
  );

  // Right column 
  const rightContent = isDocByDoc ? (
    <SummaryCard
      title={docs[docIdx]?.title ?? ''}
      paragraphs={docs[docIdx]?.body ?? []}
    />
  ) : (
    <SummaryCard title={content.title} paragraphs={content.paragraphs} />
  );

  return (
    <>
      <div className='relative z-10 flex flex-col min-h-screen animate-fade-in'>
        <Header />
        <Breadcrumb feature={feature} crumbs={crumbs} />
        <TwoColumnLayout left={leftContent} right={rightContent} />
      </div>
    </>
  );
}
