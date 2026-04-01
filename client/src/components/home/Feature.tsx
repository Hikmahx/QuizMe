'use client';

import FeatureIcon from '@/components/global/FeatureIcon';

interface FeatureProps {
  title: string;
  description?: string;
  icon: string;
  bgClass: string;
  iconClass: string;
  onClick?: () => void;
}

export default function Feature({
  title,
  description,
  icon,
  bgClass,
  iconClass,
  onClick,
}: FeatureProps) {
  return (
    <button onClick={onClick} className='group w-full text-left card border-2 border-transparent hover:border-purple-500/40 transition-all duration-200 cursor-pointer'>
      <div className='flex items-center gap-4 md:gap-8 w-full dark-bg'>
        <FeatureIcon
          icon={icon}
          bgClass={bgClass}
          iconClass={iconClass}
          containerSize={52}
          iconSize={26}
          showLabel={false}
        />
        <div className='flex-1 min-w-0'>
          <p className='text-lg md:text-xl font-medium text-app-text'>
            {title}
          </p>
          {description && (
            <p className='text-sm text-app-text-secondary mt-0.5'>
              {description}
            </p>
          )}
        </div>
        <span className='text-app-text-secondary text-xl group-hover:text-app-text transition-colors'>
          ›
        </span>
      </div>
    </button>
  );
}
