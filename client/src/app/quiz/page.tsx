'use client';

// import BgBlobs from '@/components/global/BgBlobs'
import Header from '@/components/global/Header';
import TwoColumnLayout from '@/components/global/TwoColumnLayout';
import Breadcrumb from '@/components/global/Breadcrumb';
import { FEATURE_MAP } from '@/lib/features';

const feature = FEATURE_MAP['quiz-time'];

export default function QuizPage() {
  return (
    <>
      {/* <BgBlobs /> */}
      <div className='relative z-10 flex flex-col min-h-screen animate-fade-in'>
        <Header />
        <Breadcrumb feature={feature} crumbs={[{ label: 'Quiz' }]} />
        <TwoColumnLayout
          left={
            <div>
              <span className='inline-flex items-center gap-2 bg-blue-400/15 border border-blue-400/30 rounded-full px-4 py-1.5 text-sm text-blue-400 font-medium mb-6'>
                <span className='w-1.5 h-1.5 rounded-full bg-blue-400' />
                Quiz Time!
              </span>
              <h1 className='text-4xl font-light text-app-text leading-tight mb-2'>
                Test your
                <strong className='block font-bold'>knowledge.</strong>
              </h1>
              <p className='text-app-text-secondary italic text-sm leading-relaxed'>
                AI-generated questions based on your uploaded documents.
              </p>
            </div>
          }
          right={
            <div className='dark-bg rounded-2xl p-8 flex items-center justify-center min-h-[300px]'>
              <p className='text-app-text-secondary text-sm italic'>
                Quiz interface coming soon
              </p>
            </div>
          }
        />
      </div>
    </>
  );
}
