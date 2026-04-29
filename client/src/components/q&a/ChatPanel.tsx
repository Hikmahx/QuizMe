'use client';

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { QAChatMessage, QAMode } from '@/types/qa';
import { renderMarkdown } from '@/utils/helpers';

function TypingDots() {
  return (
    <span className='flex items-center gap-1 py-1'>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className='w-1.5 h-1.5 rounded-full bg-app-text-secondary/50 animate-bounce'
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

const MODE_LABEL: Record<QAMode, string> = {
  default: 'Default Mode',
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

const MODE_ICONS: Record<QAMode, string> = {
  default: 'chatbubble-ellipses-outline',
  resume: 'document-text-outline',
  compare: 'git-compare-outline',
  glossary: 'book-outline',
};

interface BubbleProps {
  msg: QAChatMessage;
  onModeChange: (m: QAMode) => void;
}

function MessageBubble({ msg, onModeChange }: BubbleProps) {
  const router = useRouter();
  const isUser = msg.role === 'user';

  if (isUser && msg.modeChange) {
    return (
      <div className='flex justify-end'>
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-2xl rounded-br-md border ${MODE_COLOURS[msg.modeChange]}`}>
          <ion-icon name={MODE_ICONS[msg.modeChange]} style={{ fontSize: '13px' }} />
          <span className='text-sm font-medium'>{MODE_LABEL[msg.modeChange]}</span>
        </div>
      </div>
    );
  }

  if (isUser && msg.fileChange) {
    return (
      <div className='flex justify-end'>
        <div className='inline-flex flex-col gap-1 bg-purple-500/15 border border-purple-500/25 text-purple-300 px-3 py-2.5 rounded-2xl rounded-br-md text-sm max-w-xs'>
          <span className='font-medium text-xs text-purple-400 uppercase tracking-wide'>Selected files</span>
          {msg.fileChange.map((f) => (
            <span key={f} className='flex items-center gap-1.5 text-xs'>
              <ion-icon name='document-outline' style={{ fontSize: '11px' }} />
              {f}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className='flex justify-end'>
        <div className='max-w-[80%] bg-purple-500/20 text-app-text px-4 py-3 rounded-2xl rounded-br-md text-sm leading-relaxed'>
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-2 max-w-[90%]'>
      <div className='flex items-start gap-2.5'>
        <div className='w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5'>
          <ion-icon name='sparkles' style={{ fontSize: '13px', color: '#A729F5' }} />
        </div>
        <div className='flex-1 min-w-0'>
          {msg.isLoading ? (
            <div className='bg-app-card/50 border border-app-text-secondary/10 px-4 py-3 rounded-2xl rounded-tl-md'>
              <TypingDots />
            </div>
          ) : (
            <div className='bg-transparent px-0 py-1'>
              <p
                className='text-app-text text-sm leading-relaxed'
                dangerouslySetInnerHTML={{ __html: `<p class="">${renderMarkdown(msg.content)}</p>` }}
              />
            </div>
          )}
        </div>
      </div>

      {msg.autoModeSuggestion && !msg.isLoading && (
        <div className='ml-9 mt-2'>
          <div className='bg-purple-500/8 border border-purple-500/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3'>
            <div className='flex items-center gap-2.5'>
              <ion-icon name={MODE_ICONS[msg.autoModeSuggestion.mode]} style={{ fontSize: '16px', color: '#A729F5' }} />
              <div>
                <p className='text-app-text text-xs font-semibold'>
                  Switch to {MODE_LABEL[msg.autoModeSuggestion.mode]}?
                </p>
                <p className='text-app-text-secondary text-xs mt-0.5'>
                  Detected from your documents
                </p>
              </div>
            </div>
            <div className='flex gap-2 flex-shrink-0'>
              <button
                onClick={() => onModeChange(msg.autoModeSuggestion!.mode)}
                className='text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-500 text-white hover:bg-purple-400 transition-colors'
              >
                Yes, switch
              </button>
            </div>
          </div>
        </div>
      )}

      {msg.modeSuggestions && msg.modeSuggestions.length > 0 && (
        <div className='ml-9 flex flex-wrap gap-2 mt-1'>
          {msg.modeSuggestions.map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all hover:scale-[1.03] ${MODE_COLOURS[m]}`}
            >
              <ion-icon name={MODE_ICONS[m]} style={{ fontSize: '12px' }} />
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ChatPanelProps {
  messages: QAChatMessage[];
  isStreaming: boolean;
  isAnalysing: boolean;
  onSend: (text: string) => void;
  onModeChange: (m: QAMode) => void;
}

// Error message strings set by useQAFlow's catch block
const ERROR_STRINGS = [
  'Something went wrong. Please try again.',
  'There was a problem',
];

export default function ChatPanel({
  messages,
  isStreaming,
  isAnalysing,
  onSend,
  onModeChange,
}: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Has the AI completed at least one message? (greeting finished)
  const hasCompletedAssistantMessage = messages.some(
    (msg) => msg.role === 'assistant' && !msg.isLoading,
  );

  // Is any message currently showing typing dots?
  const isAnyMessageLoading = messages.some((msg) => msg.isLoading === true);

  // Did the last assistant message end in a known error string?
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant' && !m.isLoading);
  const hasError =
    !isStreaming &&
    !isAnyMessageLoading &&
    !!lastAssistantMsg &&
    ERROR_STRINGS.some((e) => lastAssistantMsg.content.startsWith(e));

  // Disable when: streaming, analysing (mode switch), any bubble loading, or greeting not yet complete
  const isInputDisabled = isStreaming || isAnalysing || isAnyMessageLoading || !hasCompletedAssistantMessage;

  // Contextual placeholder
  const placeholder =
    !hasCompletedAssistantMessage || isAnyMessageLoading
      ? 'Waiting for response…'
      : isAnalysing
        ? 'Analysing documents…'
        : isStreaming
          ? 'AI is responding…'
          : hasError
            ? 'Try asking again…'
            : 'Ask anything about your documents…';

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || isInputDisabled) return;
    onSend(text);
    setDraft('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Input border: red on error, purple focus normally
  const inputBorderCls = hasError
    ? 'border-red-500/35 focus-within:border-red-500/60'
    : 'border-app-text-secondary/20 focus-within:border-purple-500/50';

  return (
    <div className='flex flex-col h-full'>
      {/* Message list */}
      <div className='flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5'>
        {messages.length === 0 && (
          <div className='flex flex-col items-center justify-center h-full gap-3 text-app-text-secondary'>
            <div className='w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center'>
              <ion-icon name='sparkles-outline' style={{ fontSize: '22px', color: '#A729F5' }} />
            </div>
            <p className='text-sm text-center leading-relaxed'>Starting conversation…</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} onModeChange={onModeChange} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Divider */}
      <div className='h-px bg-app-text-secondary/10 flex-shrink-0' />

      {/* Input area */}
      <div className='flex-shrink-0 p-3'>
        <div className={`flex items-end gap-2 bg-app-bg/60 border rounded-2xl px-3 py-2.5 transition-colors ${inputBorderCls}`}>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isInputDisabled}
            rows={1}
            className='flex-1 bg-transparent text-app-text text-sm placeholder:text-app-text-secondary/45 resize-none focus:outline-none leading-relaxed disabled:opacity-60'
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || isInputDisabled}
            className='w-9 h-9 flex-shrink-0 bg-purple-500 hover:bg-purple-600 disabled:opacity-35 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all active:scale-95'
            aria-label='Send'
          >
            {isStreaming ? (
              <div className='w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin' />
            ) : (
              <ion-icon name='arrow-up-outline' style={{ fontSize: '16px', color: 'white' }} />
            )}
          </button>
        </div>
        <p className='text-center text-[10px] text-app-text-secondary/40 mt-1.5'>
          Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
