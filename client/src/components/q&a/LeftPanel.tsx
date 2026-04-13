'use client';

import { LeftPanelScreen } from '@/types/qa';
import { StoredFileMeta } from '@/types';
import InfoPanel from './panels/InfoPanel';
import LoadingPanel from './panels/LoadingPanel';
import AgentStepsPanel from './panels/AgentStepsPanel';
import CompareTablePanel from './panels/CompareTablePanel';
import GlossaryPanel from './panels/GlossaryPanel';
import DefaultResultPanel from './panels/DefaultResultPanel';

interface LeftPanelProps {
  screens: LeftPanelScreen[];
  currentIndex: number;
  onNavigate: (dir: 'prev' | 'next') => void;
  selectedFiles: StoredFileMeta[];
  isAnalysing: boolean;  // When true, shows a loading overlay instead of screen content
}

function ScreenContent({
  screen,
  selectedFiles,
}: {
  screen: LeftPanelScreen;
  selectedFiles: StoredFileMeta[];
}) {
  switch (screen.type) {
    case 'info':
      return <InfoPanel mode={screen.mode} selectedFiles={selectedFiles} />;
    case 'agent-steps':
      return <AgentStepsPanel steps={screen.agentSteps ?? []} />;
    case 'compare-table':
      return (
        <CompareTablePanel
          files={screen.compareFiles ?? []}
          rows={screen.compareRows ?? []}
        />
      );
    case 'glossary':
      return <GlossaryPanel entries={screen.glossaryEntries ?? []} />;
    case 'default-result':
      return <DefaultResultPanel selectedFiles={selectedFiles} />;
    default:
      return null;
  }
}

export default function LeftPanel({
  screens,
  currentIndex,
  onNavigate,
  selectedFiles,
  isAnalysing,
}: LeftPanelProps) {
  const screen = screens[currentIndex];
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < screens.length - 1;

  return (
    <div className='flex flex-col h-full gap-3'>
      {/* Navigator — only shown when there are multiple screens */}
      {screens.length > 1 && (
        <div className='flex items-center justify-between flex-shrink-0'>
          <button
            onClick={() => onNavigate('prev')}
            disabled={!canPrev}
            aria-label='Previous screen'
            className='w-8 h-8 flex items-center justify-center rounded-xl border border-app-text-secondary/20 text-app-text-secondary hover:text-app-text hover:border-app-text-secondary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all'
          >
            <ion-icon name='chevron-back-outline' style={{ fontSize: '14px' }} />
          </button>

          {/* Pill indicators */}
          <div className='flex items-center gap-1.5'>
            {screens.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  if (i < currentIndex) onNavigate('prev');
                  else if (i > currentIndex) onNavigate('next');
                }}
                className={[
                  'rounded-full transition-all duration-300',
                  i === currentIndex
                    ? 'w-5 h-1.5 bg-purple-500'
                    : 'w-1.5 h-1.5 bg-app-text-secondary/25 hover:bg-app-text-secondary/50',
                ].join(' ')}
              />
            ))}
          </div>

          <button
            onClick={() => onNavigate('next')}
            disabled={!canNext}
            aria-label='Next screen'
            className='w-8 h-8 flex items-center justify-center rounded-xl border border-app-text-secondary/20 text-app-text-secondary hover:text-app-text hover:border-app-text-secondary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all'
          >
            <ion-icon name='chevron-forward-outline' style={{ fontSize: '14px' }} />
          </button>
        </div>
      )}

      {/* Screen label */}
      {screens.length > 1 && (
        <div className='flex-shrink-0'>
          <span className='inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-app-text-secondary bg-app-text-secondary/8 rounded-full px-3 py-1'>
            <span className='w-1 h-1 rounded-full bg-purple-400' />
            {screen.label}
          </span>
        </div>
      )}

      {/* Panel content — loading overlay hides real content without changing screen array */}
      <div className='flex-1 min-h-0 relative overflow-hidden'>
        {isAnalysing ? (
          <LoadingPanel />
        ) : (
          <ScreenContent screen={screen} selectedFiles={selectedFiles} />
        )}
      </div>
    </div>
  );
}
