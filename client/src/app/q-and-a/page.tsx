'use client';

import Header from '@/components/global/Header';
import TwoColumnLayout from '@/components/global/TwoColumnLayout';
import Breadcrumb from '@/components/global/Breadcrumb';
import QuizCTA from '@/components/global/QuizCTA';
import { FEATURE_MAP } from '@/lib/features';

const feature = FEATURE_MAP['ask-questions'];

export default function QAndAPage() {
  return (
    <>
      <div className='relative z-10 flex flex-col min-h-screen animate-fade-in'>
        <Header />
        <Breadcrumb feature={feature} crumbs={[{ label: 'Q&A' }]} />
        <TwoColumnLayout
          left={
            <div className='flex flex-col gap-8'>
              <div>
                <span className='inline-flex items-center gap-2 bg-green-400/15 border border-green-400/30 rounded-full px-4 py-1.5 text-sm text-green-400 font-medium mb-6'>
                  <span className='w-1.5 h-1.5 rounded-full bg-green-400' />
                  Ask Questions
                </span>
                <h1 className='text-4xl font-light text-app-text leading-tight mb-2'>
                  Ask anything
                  <strong className='block font-bold'>about your docs.</strong>
                </h1>
                <p className='text-app-text-secondary italic text-sm leading-relaxed'>
                  Your questions are answered using RAG — grounded directly in
                  your document content.
                </p>
              </div>
              <QuizCTA variant='compact' />
            </div>
          }
          right={
            <div className='dark-bg rounded-2xl p-8 flex items-center justify-center min-h-[300px]'>
              <p className='text-app-text-secondary text-sm italic'>
                Q&A interface coming soon
              </p>
            </div>
          }
        />
      </div>
    </>
  );
}
