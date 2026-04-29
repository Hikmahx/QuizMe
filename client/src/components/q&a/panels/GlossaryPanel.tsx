'use client';

import { useState, useMemo, useRef } from 'react';
import { GlossaryEntry } from '@/types/qa';
import ExportButton from '../ExportButton';

const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function getInitial(term: string): string {
  const first = term[0]?.toUpperCase();
  return /[A-Z]/.test(first ?? '') ? first : '#';
}

interface GlossaryPanelProps {
  entries: GlossaryEntry[];
}

export default function GlossaryPanel({ entries }: GlossaryPanelProps) {
  const [search, setSearch] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const alphabarRef = useRef<HTMLDivElement>(null);
  // printRef wraps the scrollable content — passed to ExportButton
  const printRef = useRef<HTMLDivElement>(null);

  const populated = useMemo(
    () => new Set(entries.map((e) => getInitial(e.term))),
    [entries],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return entries.filter(
      (e) =>
        (!q ||
          e.term.toLowerCase().includes(q) ||
          e.definition.toLowerCase().includes(q)) &&
        (!activeLetter || getInitial(e.term) === activeLetter),
    );
  }, [entries, search, activeLetter]);

  const grouped = useMemo(() => {
    const map: Record<string, GlossaryEntry[]> = {};
    for (const e of filtered) {
      const k = getInitial(e.term);
      if (!map[k]) map[k] = [];
      map[k].push(e);
    }
    return map;
  }, [filtered]);

  const toggle = (term: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(term) ? next.delete(term) : next.add(term);
      return next;
    });

  const scrollToLetter = (letter: string) => {
    setActiveLetter((prev) => (prev === letter ? null : letter));
    const bar = alphabarRef.current;
    if (bar) {
      const btn = bar.querySelector(
        `[data-letter="${letter}"]`,
      ) as HTMLElement | null;
      btn?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
    const heading = scrollRef.current?.querySelector(
      `[data-group="${letter}"]`,
    ) as HTMLElement | null;
    heading?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className='flex flex-col gap-3 h-full'>
      {/* Header */}
      <div className='flex items-center justify-between flex-shrink-0'>
        <div>
          <h3 className='text-base font-bold text-app-text'>Glossary</h3>
          <p className='text-app-text-secondary text-xs mt-0.5'>
            {entries.length} terms extracted
          </p>
        </div>
        <ExportButton contentRef={printRef} label='Export' title='Glossary' />
      </div>

      {/* Search */}
      <div className='flex-shrink-0 relative'>
        <ion-icon
          name='search-outline'
          style={{
            fontSize: '15px',
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-app-text-secondary)',
          }}
        />
        <input
          type='text'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setActiveLetter(null);
          }}
          placeholder='Search glossary…'
          className='w-full bg-app-bg border border-app-text-secondary/20 rounded-xl pl-9 pr-4 py-2.5 text-sm text-app-text placeholder:text-app-text-secondary/50 focus:outline-none focus:border-purple-500/60 transition-colors'
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-app-text-secondary hover:text-app-text'
          >
            <ion-icon name='close-outline' style={{ fontSize: '16px' }} />
          </button>
        )}
      </div>

      {/* Alphabet bar */}
      <div
        ref={alphabarRef}
        className='flex-shrink-0 flex gap-1 overflow-x-auto pb-1'
        style={{ scrollbarWidth: 'none' }}
      >
        {ALPHABET.map((letter) => {
          const has = populated.has(letter);
          const active = activeLetter === letter;
          return (
            <button
              key={letter}
              data-letter={letter}
              onClick={() => has && scrollToLetter(letter)}
              disabled={!has}
              className={[
                'flex-shrink-0 w-7 h-7 rounded-lg text-xs font-semibold transition-all',
                active
                  ? 'bg-purple-500 text-white'
                  : has
                    ? 'bg-app-card text-app-text hover:bg-purple-500/15 hover:text-purple-400 border border-app-text-secondary/15'
                    : 'text-app-text-secondary/25 cursor-not-allowed',
              ].join(' ')}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className='flex items-center gap-2 flex-shrink-0'>
        <div className='flex-1 h-px bg-app-text-secondary/12' />
        <span className='text-[10px] uppercase tracking-widest text-app-text-secondary font-semibold'>
          {activeLetter ? `Letter ${activeLetter}` : 'All terms'}
        </span>
        <ion-icon
          name={activeLetter ? 'funnel' : 'funnel-outline'}
          style={{ fontSize: '10px', color: 'var(--color-app-text-secondary)' }}
        />
        <div className='flex-1 h-px bg-app-text-secondary/12' />
      </div>

      {/* Scrollable entry list — this div is passed to ExportButton */}
      <div
        ref={printRef}
        className='flex-1 overflow-y-auto flex flex-col gap-0.5'
      >
        {/* Inner scroll ref for letter scrolling */}
        <div ref={scrollRef}>
          {Object.keys(grouped)
            .sort()
            .map((letter) => (
              <div key={letter}>
                <div
                  data-group={letter}
                  className='sticky top-0 z-10 bg-app-bg/95 backdrop-blur-sm px-3 py-1.5 flex items-center gap-2'
                >
                  <span className='w-6 h-6 rounded-md bg-purple-500/15 text-purple-400 text-xs font-bold flex items-center justify-center flex-shrink-0'>
                    {letter}
                  </span>
                  <div className='h-px flex-1 bg-app-text-secondary/12' />
                </div>

                {grouped[letter].map((entry) => {
                  const isOpen = expanded.has(entry.term);
                  return (
                    <button
                      key={entry.term}
                      onClick={() => toggle(entry.term)}
                      className='w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-app-card/70 transition-colors text-left group'
                    >
                      <ion-icon
                        name={
                          isOpen
                            ? 'chevron-down-outline'
                            : 'chevron-forward-outline'
                        }
                        style={{
                          fontSize: '12px',
                          marginTop: '3px',
                          flexShrink: 0,
                          color: 'var(--color-app-text-secondary)',
                        }}
                      />
                      <div className='flex-1 min-w-0'>
                        <p className='text-app-text text-sm font-medium group-hover:text-purple-400 transition-colors'>
                          {entry.term}
                        </p>
                        {isOpen && (
                          <p className='text-app-text-secondary text-xs leading-relaxed mt-1'>
                            {entry.definition}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}

          {filtered.length === 0 && (
            <div className='flex flex-col items-center gap-2 py-8 text-app-text-secondary'>
              <ion-icon name='search-outline' style={{ fontSize: '24px' }} />
              <p className='text-sm'>No terms match &quot;{search}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
