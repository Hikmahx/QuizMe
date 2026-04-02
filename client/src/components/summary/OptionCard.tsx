'use client';

interface OptionCardProps {
  icon: string;
  iconBg: string;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

export default function OptionCard({
  icon,
  iconBg,
  label,
  description,
  selected,
  onClick,
}: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-4 p-4 md:p-5 rounded-2xl border-2 transition-all duration-200 text-left',
        selected
          ? 'border-purple-500 bg-purple-500/10'
          : 'border-transparent bg-app-card hover:bg-app-card/80 hover:border-purple-500/30',
      ].join(' ')}
    >
      {/* Icon */}
      <span
        className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${iconBg}`}
      >
        {icon}
      </span>

      {/* Text */}
      <span className='flex-1 min-w-0'>
        <span className='block text-app-text font-medium text-base'>
          {label}
        </span>
        <span className='block text-app-text-secondary text-sm mt-0.5 leading-snug'>
          {description}
        </span>
      </span>

      {/* Radio indicator */}
      <span
        className={[
          'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
          selected
            ? 'border-purple-500 bg-purple-500'
            : 'border-app-text-secondary/30',
        ].join(' ')}
      >
        {selected && <span className='w-2 h-2 rounded-full bg-white' />}
      </span>
    </button>
  );
}
