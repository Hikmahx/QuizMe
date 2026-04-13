'use client';

import { QAMode } from '@/types/qa';

interface ModeCardProps {
  mode: QAMode;
  label: string;
  description: string;
  icon: string;
  accentClass: string;       // e.g. 'text-green-400'
  accentBgClass: string;     // e.g. 'bg-green-400/15'
  borderClass: string;       // e.g. 'border-green-400/60'
  selected: boolean;
  onClick: () => void;
  badge?: string;            // e.g. 'Default'
}

export default function ModeCard({
  label,
  description,
  icon,
  accentClass,
  accentBgClass,
  borderClass,
  selected,
  onClick,
  badge,
}: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left',
        selected
          ? `${borderClass} bg-white/5`
          : 'border-transparent bg-app-card hover:bg-app-card/80 hover:border-white/10',
      ].join(' ')}
    >
      {/* Icon */}
      <span
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accentBgClass}`}
      >
        <ion-icon
          name={icon}
          style={{ fontSize: '22px' }}
          className={accentClass}
        />
      </span>

      {/* Text */}
      <span className='flex-1 min-w-0'>
        <span className='flex items-center gap-2'>
          <span className='block text-app-text font-medium text-base'>{label}</span>
          {badge && (
            <span className='text-[10px] font-semibold uppercase tracking-wide bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full'>
              {badge}
            </span>
          )}
        </span>
        <span className='block text-app-text-secondary text-sm mt-0.5 leading-snug'>
          {description}
        </span>
      </span>

      {/* Radio dot */}
      <span
        className={[
          'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
          selected ? `${borderClass} bg-white/10` : 'border-app-text-secondary/30',
        ].join(' ')}
      >
        {selected && <span className='w-2 h-2 rounded-full bg-purple-400' />}
      </span>
    </button>
  );
}
