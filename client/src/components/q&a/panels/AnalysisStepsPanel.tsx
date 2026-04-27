'use client';

import { AnalysisStep } from '@/types/qa';
import ExportButton from '../ExportButton';

const STATUS_CONFIG = {
  done: {
    ring: 'border-green-500/50 bg-green-500/10',
    dot: 'bg-green-400',
    text: 'text-green-400',
    icon: 'checkmark-circle-outline',
  },
  active: {
    ring: 'border-purple-500/50 bg-purple-500/10',
    dot: 'bg-purple-400',
    text: 'text-purple-400',
    icon: 'ellipsis-horizontal-outline',
  },
  pending: {
    ring: 'border-app-text-secondary/20 bg-transparent',
    dot: 'bg-app-text-secondary/30',
    text: 'text-app-text-secondary',
    icon: 'time-outline',
  },
  error: {
    ring: 'border-red-500/50 bg-red-500/10',
    dot: 'bg-red-400',
    text: 'text-red-400',
    icon: 'close-circle-outline',
  },
};

interface AnalysisStepsPanelProps {
  steps: AnalysisStep[];
}

export default function AnalysisStepsPanel({ steps }: AnalysisStepsPanelProps) {
  const completedCount = steps.filter((s) => s.status === 'done').length;

  return (
    <div className='flex flex-col gap-4 h-full'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-base font-bold text-app-text'>Resume Analysis</h3>
          <p className='text-app-text-secondary text-xs mt-0.5'>
            {completedCount}/{steps.length} steps complete
          </p>
        </div>
        <ExportButton targetId='analysis-steps-export' label='Export' />
      </div>

      {/* Progress bar */}
      <div className='h-1 bg-app-text-secondary/15 rounded-full overflow-hidden'>
        <div
          className='h-full bg-purple-500 rounded-full transition-all duration-700'
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div
        id='analysis-steps-export'
        className='flex flex-col gap-2 flex-1 overflow-y-auto'
      >
        {steps.map((step, i) => {
          const cfg = STATUS_CONFIG[step.status];
          return (
            <div key={step.id} className='relative'>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className='absolute left-5 top-10 bottom-0 w-px bg-app-text-secondary/15' />
              )}

              <div
                className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.ring} transition-all`}
              >
                {/* Icon circle */}
                <div className='w-8 h-8 rounded-lg bg-app-bg/50 flex items-center justify-center flex-shrink-0 mt-0.5'>
                  <ion-icon
                    name={step.icon}
                    style={{ fontSize: '16px' }}
                    className={cfg.text}
                  />
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <span className='text-app-text text-sm font-medium'>
                      {step.label}
                    </span>
                    {step.status === 'active' && (
                      <span className='flex gap-0.5'>
                        {[0, 1, 2].map((d) => (
                          <span
                            key={d}
                            className='w-1 h-1 rounded-full bg-purple-400 animate-pulse'
                            style={{ animationDelay: `${d * 0.15}s` }}
                          />
                        ))}
                      </span>
                    )}
                    {step.status === 'done' && (
                      <ion-icon
                        name='checkmark-circle'
                        style={{ fontSize: '14px', color: '#26d782' }}
                      />
                    )}
                  </div>
                  {step.detail && (
                    <p className='text-app-text-secondary text-xs mt-0.5 leading-relaxed'>
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
