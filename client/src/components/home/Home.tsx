'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'motion/react';
import Header from '@/components/global/Header';
import TwoColumnLayout from '../global/TwoColumnLayout';
import Feature from '@/components/home/Feature';
import UploadStep from '../summary/UploadStep';
import { FEATURES } from '@/lib/features';
import { FeatureKey } from '@/types';

// Left column: hero text stagger
const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13 } },
};

const heroLine = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

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
    <div className='relative z-10 flex flex-col min-h-screen'>
      <Header />
      <TwoColumnLayout
        left={
          <motion.div
            variants={heroContainer}
            initial='hidden'
            animate='visible'
          >
            <motion.h1
              variants={heroLine}
              className='text-4xl md:text-5xl xl:text-[64px] font-light text-app-text leading-tight mb-3'
            >
              Welcome to the
              <strong className='block font-bold'>QuizMe App</strong>
            </motion.h1>
            <motion.p
              variants={heroLine}
              className='text-app-text-secondary italic text-base mt-4'
            >
              Pick a feature to get started.
            </motion.p>
          </motion.div>
        }
        right={
          <div className='flex flex-col gap-3.5'>
            {FEATURES.map((feature, i) => (
              <Feature
                key={feature.key}
                title={feature.label}
                description={feature.description}
                icon={feature.icon}
                bgClass={feature.bgClass}
                iconClass={feature.iconClass}
                index={i}
                onClick={() => handleSelectFeature(feature.key)}
              />
            ))}
          </div>
        }
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
