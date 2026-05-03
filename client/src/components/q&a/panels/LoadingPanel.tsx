'use client';

const STEPS = [
  { icon: 'cloud-upload-outline', label: 'Reading documents…' },
  { icon: 'analytics-outline', label: 'Analysing content…' },
  { icon: 'sparkles-outline', label: 'Preparing results…' },
];

export default function LoadingPanel() {
  return (
    <div className='flex flex-col items-center justify-center h-full gap-8 py-8'>
      {/* Animated spinner */}
      <div className='relative w-16 h-16'>
        <div className='absolute inset-0 rounded-full border-4 border-purple-500/20' />
        <div className='absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin' />
        <div className='absolute inset-2 rounded-full bg-purple-500/10 flex items-center justify-center'>
          <ion-icon name='sparkles-outline' style={{ fontSize: '18px', color: '#A729F5' }} />
        </div>
      </div>

      <p className='text-app-text-secondary/50 text-xs text-center -mt-2'>
        This might take 15–90 seconds
      </p>

      <div className='flex flex-col gap-3 w-full'>
        {STEPS.map((s, i) => (
          <div
            key={i}
            className='flex items-center gap-3 bg-app-bg/40 rounded-xl px-4 py-3'
            style={{ animationDelay: `${i * 0.4}s` }}
          >
            <div className='w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0'>
              <ion-icon name={s.icon} style={{ fontSize: '16px', color: '#A729F5' }} />
            </div>
            <span className='text-app-text-secondary text-sm'>{s.label}</span>
            <div className='ml-auto flex gap-1'>
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className='w-1.5 h-1.5 rounded-full bg-purple-500/40 animate-pulse'
                  style={{ animationDelay: `${d * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
