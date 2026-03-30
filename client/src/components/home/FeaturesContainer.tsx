'use client';

import Category from './Category';
import WelcomeSection from './WelcomeSection';

const CATEGORIES = [
  {
    title: 'View Summary',
    path: '/summary',
    icon: '/assets/images/icon-summary.svg',
    bgClass: 'bg-purple-500/20',
    iconClass: 'text-purple-500',
  },
  {
    title: 'Ask Questions',
    path: '/q-and-a',
    icon: '/assets/images/icon-questions.svg',
    bgClass: 'bg-green-500/20',
    iconClass: 'text-green-500',
  },
  {
    title: 'Quiz Time!',
    path: '/quiz',
    icon: '/assets/images/icon-quiz.svg',
    bgClass: 'bg-blue-500/20',
    iconClass: 'text-blue-500',
  },
];

export default function FeaturesContainer() {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-28 w-full pb-8 md:pb-12'>
      <WelcomeSection />
      
      <div className='flex flex-col gap-5 md:gap-6 h-fit'>
        {CATEGORIES.map((item) => (
          <Category 
            key={item.title} 
            title={item.title} 
            path={item.path} 
            icon={item.icon} 
            bgClass={item.bgClass}
            iconClass={item.iconClass}
          />
        ))}
      </div>
    </div>
  );
}
