'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/global/Header';
import Breadcrumb from '@/components/global/Breadcrumb';
import { FEATURE_MAP } from '@/lib/features';
import { useSummaryFlow } from '@/hooks/useSummaryFlow';
import { useQAFlow } from '@/hooks/useQAFlow';
import { QAMode } from '@/types/qa';
import LeftPanel from '@/components/q&a/LeftPanel';
import ChatPanel from '@/components/q&a/ChatPanel';

const feature = FEATURE_MAP['ask-questions'];

const MODE_LABEL: Record<QAMode, string> = {
  default: 'Default Q&A',
  resume: 'Resume Mode',
  compare: 'Compare Mode',
  glossary: 'Glossary Mode',
};

const MODE_COLOURS: Record<QAMode, string> = {
  default: 'bg-green-400/15 text-green-400 border-green-400/25',
  resume: 'bg-orange-400/15 text-orange-400 border-orange-400/25',
  compare: 'bg-blue-400/15 text-blue-400 border-blue-400/25',
  glossary: 'bg-purple-400/15 text-purple-400 border-purple-400/25',
};

// Mobile tab type
type MobileTab = 'context' | 'chat';

function QAChatInner() {
  const params = useSearchParams();
  const rawMode = params.get('mode') ?? 'default';
  const initialMode = (
    ['default', 'resume', 'compare', 'glossary'] as QAMode[]
  ).includes(rawMode as QAMode)
    ? (rawMode as QAMode)
    : 'default';

  const { files, hydrated } = useSummaryFlow();
  const [mobileTab, setMobileTab] = useState<MobileTab>('context');

  const {
    mode,
    changeMode,
    selectedFiles,
    messages,
    isStreaming,
    isAnalysing,
    sendMessage,
    leftScreens,
    currentScreenIndex,
    navigateScreen,
    initChat,
  } = useQAFlow(files, initialMode);

  // Wait for hydration so files are loaded before initChat runs.
  // This prevents: double-greeting, 0/N files, and failed auto-detection.
  useEffect(() => {
    if (hydrated && files.length > 0) {
      initChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Left column content
  const LeftContent = (
    <div className='flex flex-col h-full gap-3 overflow-hidden'>
      {/* Top bar — mode badge + read-only file count */}
      <div className='flex items-center justify-between flex-shrink-0'>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${MODE_COLOURS[mode]}`}
        >
          <span className='w-1.5 h-1.5 rounded-full bg-current' />
          {MODE_LABEL[mode]}
        </span>
        <span className='text-xs text-app-text-secondary border border-app-text-secondary/15 rounded-xl px-3 py-1.5 bg-app-card flex items-center gap-1.5'>
          <ion-icon name='documents-outline' style={{ fontSize: '13px' }} />
          {/* {selectedFiles.length}/ */}
          {files.length} file
          {files.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Panel */}
      <div className='flex-1 min-h-0'>
        <LeftPanel
          screens={leftScreens}
          currentIndex={currentScreenIndex}
          onNavigate={navigateScreen}
          selectedFiles={selectedFiles}
          isAnalysing={isAnalysing}
        />
      </div>
    </div>
  );

  // Right column
  const RightContent = (
    <div className='dark-bg rounded-2xl flex flex-col h-full overflow-hidden'>
      {/* Chat header */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-app-text-secondary/10 flex-shrink-0'>
        <div className='items-center gap-2 hidden lg:flex'>
          {/* <div className='w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center'>
            <ion-icon
              name='sparkles'
              style={{ fontSize: '12px', color: '#A729F5' }}
            />
          </div> */}
          <span className='text-app-text text-sm font-medium'>QuizMe AI</span>
          {(isStreaming || isAnalysing) && (
            <span className='flex gap-0.5 items-center'>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className='w-1 h-1 rounded-full bg-purple-400 animate-pulse'
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          )}
        </div>

        {/* Quick mode switcher */}
        <div className='flex gap-1'>
          {(['default', 'resume', 'compare', 'glossary'] as QAMode[])
            .filter((m) => m !== mode)
            .map((m) => (
              <button
                key={m}
                onClick={() => changeMode(m)}
                disabled={isAnalysing || isStreaming}
                className='text-[10px] font-semibold uppercase tracking-wide text-app-text-secondary hover:text-app-text border border-app-text-secondary/15 hover:border-app-text-secondary/35 rounded-lg px-2 py-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed'
              >
                {m}
              </button>
            ))}
        </div>
      </div>

      {/* Chat */}
      <div className='flex-1 min-h-0'>
        <ChatPanel
          messages={messages}
          isStreaming={isStreaming}
          isAnalysing={isAnalysing}
          onSend={sendMessage}
          onModeChange={changeMode}
        />
      </div>
    </div>
  );

  return (
    <>
      <Header />
      <Breadcrumb feature={feature} crumbs={[{ label: 'Chat' }]} />

      {/* Mobile: tab switcher */}
      <div className='lg:hidden px-6 pb-3 flex gap-2'>
        {(['context', 'chat'] as MobileTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={[
              'flex-1 py-2.5 text-sm font-medium rounded-xl border transition-all',
              mobileTab === tab
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-400'
                : 'bg-app-card border-app-text-secondary/15 text-app-text-secondary hover:text-app-text',
            ].join(' ')}
          >
            <ion-icon
              name={
                tab === 'chat'
                  ? 'chatbubble-ellipses-outline'
                  : 'document-text-outline'
              }
              style={{ fontSize: '14px' }}
            />{' '}
            {tab === 'chat' ? 'Chat' : 'Context'}
          </button>
        ))}
      </div>

      {/* Desktop: two columns; Mobile: single tab */}
      <main
        className='flex-1 px-6 md:px-12 max-w-[1200px] mx-auto w-full pb-6 overflow-hidden'
        style={{ height: 'calc(100vh - 140px)' }}
      >
        {/* Desktop layout */}
        <div className='hidden lg:grid lg:grid-cols-2 lg:gap-6 h-[calc(100vh-170px)]'>
          <div className='overflow-hidden'>{LeftContent}</div>
          <div className='overflow-hidden'>{RightContent}</div>
        </div>

        {/* Mobile layout */}
        <div className='lg:hidden h-[80vh]'>
          {mobileTab === 'chat' ? (
            RightContent
          ) : (
            <div className='h-full overflow-y-auto'>{LeftContent}</div>
          )}
        </div>
      </main>
    </>
  );
}

export default function QAChatPage() {
  return (
    <div className='relative z-10 flex flex-col min-h-screen'>
      <Suspense
        fallback={
          <div className='flex items-center justify-center flex-1 min-h-screen'>
            <div className='w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin' />
          </div>
        }
      >
        <QAChatInner />
      </Suspense>
    </div>
  );
}
