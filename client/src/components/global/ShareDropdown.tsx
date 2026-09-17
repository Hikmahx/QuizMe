'use client';

import { useEffect, useRef, useState } from 'react';

interface ShareDropdownProps {
  onEmail?: () => void;
  onShareX?: () => void;
  onShareLinkedIn?: () => void;
  onShareImage?: () => void;
  className?: string;
}

interface ShareOption {
  key: string;
  label: string;
  icon: string;
  onSelect: () => void;
  // REMOVE AFTER ALL IMPLEMENTATIONS ARE DONE
  comingSoon?: boolean;
}

export default function ShareDropdown({
  onEmail,
  onShareX,
  onShareLinkedIn,
  onShareImage,
  className = '',
}: ShareDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);

    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);

  const options: ShareOption[] = [
    {
      key: 'email',
      label: 'Email',
      icon: 'mail-outline',
      onSelect: () => {
        setOpen(false);
        onEmail?.();
      },
      comingSoon: !onEmail,
    },
    {
      key: 'x',
      label: 'X',
      icon: 'logo-twitter',
      onSelect: () => {
        setOpen(false);
        onShareX?.();
      },
      comingSoon: !onShareX,
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: 'logo-linkedin',
      onSelect: () => {
        setOpen(false);
        onShareLinkedIn?.();
      },
      comingSoon: !onShareLinkedIn,
    },
    {
      key: 'image',
      label: 'Share as image',
      icon: 'image-outline',
      onSelect: () => {
        setOpen(false);
        onShareImage?.();
      },
      comingSoon: !onShareImage,
    },
  ];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        title='Share'
        aria-label='Share'
        aria-haspopup='menu'
        aria-expanded={open}
        className='flex items-center cursor-pointer px-2 py-1.5 rounded-lg border transition-all duration-150 border-app-text-secondary/20 text-app-text-secondary hover:bg-app-text-secondary/7 hover:border-app-text-secondary/40 hover:text-app-text shrink-0'
      >
        <ion-icon name='share-social-outline' style={{ fontSize: '14px' }} />
      </button>

      {open && (
        <div
          role='menu'
          className='absolute right-0 top-full mt-2 w-52 bg-app-card border border-app-text-secondary/15 rounded-2xl shadow-xl z-40 overflow-hidden py-1'
        >
          {options.map((opt) => (
            <button
              key={opt.key}
              role='menuitem'
              onClick={opt.onSelect}
              disabled={opt.comingSoon}
              className='w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-app-text hover:bg-app-text-secondary/8 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent'
            >
              <ion-icon name={opt.icon} style={{ fontSize: '15px' }} />
              <span className='flex-1'>{opt.label}</span>
              {opt.comingSoon && (
                <span className='text-[10px] uppercase tracking-wide text-app-text-secondary/60'>
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
