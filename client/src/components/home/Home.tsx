'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Header from '@/components/global/Header';
import TwoColumnLayout from '../global/TwoColumnLayout';
import Feature from '@/components/home/Feature';
import UploadStep from '../summary/UploadStep';
import { FEATURES } from '@/lib/features';
import { FeatureKey } from '@/types';


function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get('selected'); // e.g. "view-summary/upload"

  const activeFeatureKey = selected?.split('/')[0] as FeatureKey | undefined;
  const activeStep = selected?.split('/')[1]; // e.g. "upload"

  const activeMeta = activeFeatureKey
    ? FEATURES.find((f) => f.key === activeFeatureKey)
    : null;

  const handleSelectFeature = (key: FeatureKey) => {
    router.push(`/?selected=${key}/upload`);
  };

  if (activeMeta && activeStep === 'upload') {
    return (
      <div className='relative z-10 flex flex-col min-h-screen animate-fade-in'>
        <Header />
        <UploadStep feature={activeMeta} />
      </div>
    );
  }

  // Default: feature picker 
  return (
    <div className='relative z-10 flex flex-col min-h-screen animate-fade-in'>
      <Header />
      <TwoColumnLayout
        left={
          <div>
            <h1 className='text-4xl md:text-5xl font-light text-app-text leading-tight mb-3'>
              Welcome to the
              <strong className='block font-bold'>QuizMe App</strong>
            </h1>
            <p className='text-app-text-secondary italic text-base mt-4'>
              Pick a feature to get started.
            </p>
          </div>
        }
        right={
          <div className='flex flex-col gap-3.5'>
            {FEATURES.map((feature) => (
              <Feature
                key={feature.key}
                title={feature.label}
                description={feature.description}
                icon={feature.icon}
                bgClass={feature.bgClass}
                iconClass={feature.iconClass}
                onClick={() => handleSelectFeature(feature.key)}
              />
            ))}
          </div>
        }
      />
    </div>
  );
}

// Page export wrapped in Suspense (required for useSearchParams) 

export default function Home() {
  return (
    <>
      <Suspense>
        <HomeInner />
      </Suspense>
    </>
  );
}
