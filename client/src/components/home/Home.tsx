'use client';

import Header from '@/components/global/Header';
import FeaturesContainer from './FeaturesContainer';

export default function Home() {
  return (
    <div className='min-h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-300'>
      <div className='relative z-10  '>
        <Header />
        <FeaturesContainer />
      </div>
    </div>
  );
}
