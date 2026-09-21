'use client';

import { useState } from 'react';
import { shareSummaryByEmail } from '@/lib/api';

interface EmailShareModalProps {
  /** The summary text being shared, sent as-is, no truncation. */
  summary: string;
  /** Document/summary title, used as the email subject line. */
  docName?: string;
  onClose: () => void;
}

type SendState = 'idle' | 'sending' | 'sent' | 'error';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function EmailShareModal({ summary, docName, onClose }: EmailShareModalProps) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<SendState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const emailValid = isValidEmail(email);

  const handleSend = async () => {
    if (!emailValid || state === 'sending') return;
    setState('sending');
    setErrorMessage('');
    try {
      await shareSummaryByEmail(email.trim(), summary, docName);
      setState('sent');
    } catch (err) {
      setState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} />
      <div className='relative bg-app-card rounded-2xl p-7 w-full max-w-sm shadow-2xl'>
        <div className='w-12 h-12 rounded-2xl bg-purple-500/15 flex items-center justify-center mb-4'>
          <ion-icon name='mail-outline' style={{ fontSize: '24px', color: '#A855F7' }} />
        </div>

        {state === 'sent' ? (
          <>
            <h2 className='text-lg font-bold text-app-text mb-2'>Email sent</h2>
            <p className='text-app-text-secondary text-sm leading-relaxed mb-6'>
              Your summary was sent to <strong className='text-app-text'>{email.trim()}</strong>.
            </p>
            <button
              onClick={onClose}
              className='w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors'
            >
              Done
            </button>
          </>
        ) : (
          <>
            <h2 className='text-lg font-bold text-app-text mb-2'>Email this summary</h2>
            <p className='text-app-text-secondary text-sm leading-relaxed mb-4'>
              {docName ? (
                <>
                  Sends <strong className='text-app-text break-words'>{docName}</strong>'s summary as-is.
                </>
              ) : (
                "Sends this summary as-is."
              )}
            </p>

            <input
              type='email'
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder='recipient@example.com'
              disabled={state === 'sending'}
              className='w-full px-4 py-3 rounded-xl bg-app-bg border border-app-text-secondary/20 text-app-text text-sm placeholder:text-app-text-secondary/50 focus:outline-none focus:border-purple-500/60 transition-colors mb-2 disabled:opacity-60'
            />

            {state === 'error' && (
              <p className='text-red-400 text-xs leading-relaxed mb-3'>{errorMessage}</p>
            )}

            <div className='flex gap-3 mt-4'>
              <button
                onClick={onClose}
                disabled={state === 'sending'}
                className='flex-1 py-3 rounded-xl border border-app-text-secondary/25 text-app-text text-sm font-medium hover:bg-app-text-secondary/8 transition-colors disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!emailValid || state === 'sending'}
                className='flex-1 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2'
              >
                {state === 'sending' ? (
                  <>
                    <span className='w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin' />
                    Sending
                  </>
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
