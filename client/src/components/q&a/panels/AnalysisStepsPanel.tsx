'use client';

import { useRef } from 'react';
import { AnalysisStep } from '@/types/qa';
import ExportButton from '../ExportButton';

// The backend returns AnalysisStep[] with a `detail` string per step.
// We parse those strings to produce scores and keyword tags — no API changes needed.

interface ParsedSkills {
  matching: string[];
  missing: string[];
  matchingCount: number;
  missingCount: number;
}

function parseSkillGap(steps: AnalysisStep[]): ParsedSkills {
  const step = steps.find((s) => s.label.toLowerCase().includes('skill'));
  const detail = step?.detail ?? '';

  const matchingNames =
    detail
      .match(/matching skills?\s*\(([^)]+)\)/i)?.[1]
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const missingNames =
    detail
      .match(/missing skills?\s*\(([^)]+)\)/i)?.[1]
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const matchingCount =
    parseInt(
      detail.match(/(\d+)\s+matching/i)?.[1] ?? String(matchingNames.length),
      10,
    ) || matchingNames.length;
  const missingCount =
    parseInt(
      detail.match(/(\d+)\s+missing/i)?.[1] ?? String(missingNames.length),
      10,
    ) || missingNames.length;

  return {
    matching: matchingNames,
    missing: missingNames,
    matchingCount,
    missingCount,
  };
}

function parseWeakSignals(steps: AnalysisStep[]): string[] {
  const step = steps.find(
    (s) =>
      s.label.toLowerCase().includes('keyword') ||
      s.label.toLowerCase().includes('alignment'),
  );
  const detail = step?.detail ?? '';
  // Look for "Gaps: X, Y, Z" pattern
  const gapsMatch = detail.match(/gaps?:?\s*([^.]+)/i);
  return (
    gapsMatch?.[1]
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? []
  );
}

interface Metric {
  label: string;
  pct: number;
  colour: string;
}

function deriveMetrics(steps: AnalysisStep[]): {
  metrics: Metric[];
  overall: number;
} {
  const { matchingCount, missingCount } = parseSkillGap(steps);
  const total = matchingCount + missingCount || 1;

  // Skills coverage: directly from the matching/missing ratio
  const skillsCoverage = Math.round((matchingCount / total) * 100);

  // Keyword match: derived from keyword alignment step text
  const kwStep = steps.find(
    (s) =>
      s.label.toLowerCase().includes('keyword') ||
      s.label.toLowerCase().includes('alignment'),
  );
  const kwDetail = (kwStep?.detail ?? '').toLowerCase();
  const strongKw = kwDetail.includes('strong');
  const hasGaps = kwDetail.includes('gap') || kwDetail.includes('missing');
  const keywordMatch = strongKw && hasGaps ? 62 : strongKw ? 80 : 45;

  // Outcomes/metrics: from resume step — does it mention notable achievements?
  const resumeStep = steps.find((s) =>
    s.label.toLowerCase().includes('resume'),
  );
  const resumeDetail = (resumeStep?.detail ?? '').toLowerCase();
  const outcomes = resumeDetail.includes('years') ? 70 : 55;

  // Role fit: weighted blend
  const roleFit = Math.round(
    skillsCoverage * 0.35 + keywordMatch * 0.35 + outcomes * 0.3,
  );

  const metrics: Metric[] = [
    { label: 'Keyword match', pct: keywordMatch, colour: '#4f86f7' },
    { label: 'Skills coverage', pct: skillsCoverage, colour: '#26d782' },
    { label: 'Outcomes/metrics', pct: outcomes, colour: '#26d782' },
    { label: 'Role fit', pct: roleFit, colour: '#f5a623' },
  ];
  const overall = Math.round(
    metrics.reduce((s, m) => s + m.pct, 0) / metrics.length,
  );
  return { metrics, overall };
}

// DonutRing

function DonutRing({ pct }: { pct: number }) {
  const size = 120;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className='flex-shrink-0'
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill='none'
        stroke='rgba(255,255,255,0.08)'
        strokeWidth={stroke}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill='none'
        stroke='url(#donutGrad)'
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap='round'
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <defs>
        <linearGradient id='donutGrad' x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stopColor='#A729F5' />
          <stop offset='100%' stopColor='#7c3aed' />
        </linearGradient>
      </defs>
      {/* Label */}
      <text
        x='50%'
        y='46%'
        dominantBaseline='middle'
        textAnchor='middle'
        fill='white'
        fontSize='22'
        fontWeight='700'
        fontFamily='sans-serif'
      >
        {pct}%
      </text>
      <text
        x='50%'
        y='64%'
        dominantBaseline='middle'
        textAnchor='middle'
        fill='rgba(255,255,255,0.45)'
        fontSize='10'
        fontFamily='sans-serif'
      >
        overall
      </text>
    </svg>
  );
}

// MetricBar

function MetricBar({ label, pct, colour }: Metric) {
  return (
    <div className='flex items-center gap-3'>
      <span className='text-app-text-secondary text-xs w-32 flex-shrink-0'>
        {label}
      </span>
      <div className='flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden'>
        <div
          className='h-full rounded-full transition-all duration-700'
          style={{ width: `${pct}%`, backgroundColor: colour }}
        />
      </div>
      <span className='text-app-text text-xs font-semibold w-9 text-right flex-shrink-0'>
        {pct}%
      </span>
    </div>
  );
}

// Pill tag

function Pill({
  label,
  variant,
}: {
  label: string;
  variant: 'missing' | 'weak' | 'strong';
}) {
  const cls = {
    missing: 'border-red-400/40 text-red-300 bg-red-400/10',
    weak: 'border-amber-400/40 text-amber-300 bg-amber-400/10',
    strong: 'border-green-400/40 text-green-300 bg-green-400/10',
  }[variant];
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${cls}`}
    >
      {label}
    </span>
  );
}

// Main panel

interface AnalysisStepsPanelProps {
  steps: AnalysisStep[];
}

export default function AnalysisStepsPanel({ steps }: AnalysisStepsPanelProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const { matching, missing } = parseSkillGap(steps);
  const weakSignals = parseWeakSignals(steps);
  const { metrics, overall } = deriveMetrics(steps);
  const completedCount = steps.filter((s) => s.status === 'done').length;

  return (
    <div className='flex flex-col gap-4 h-full'>
      {/* Header */}
      <div className='flex items-center justify-between flex-shrink-0'>
        <div>
          <h3 className='text-base font-bold text-app-text'>Resume Analysis</h3>
          <p className='text-app-text-secondary text-xs mt-0.5'>
            {completedCount}/{steps.length} steps complete
          </p>
        </div>
        <ExportButton
          contentRef={printRef}
          label='Export'
          title='Resume Analysis'
        />
      </div>

      {/* Progress bar */}
      <div className='h-0.5 bg-app-text-secondary/15 rounded-full overflow-hidden flex-shrink-0'>
        <div
          className='h-full bg-purple-500 rounded-full transition-all duration-700'
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Scrollable content — this div is what gets printed */}
      <div
        ref={printRef}
        className='flex-1 overflow-y-auto flex flex-col gap-5 pr-0.5'
      >
        {/* ── Score section ── */}
        <div className='bg-app-card rounded-2xl p-4 flex items-center gap-5'>
          <DonutRing pct={overall} />
          <div className='flex flex-col gap-2.5 flex-1 min-w-0'>
            {metrics.map((m) => (
              <MetricBar key={m.label} {...m} />
            ))}
          </div>
        </div>

        {/* ── Step cards ── */}
        <div className='flex flex-col gap-2.5'>
          {steps.map((step) => (
            <div
              key={step.id}
              className='bg-app-card rounded-xl border border-app-text-secondary/10 px-4 py-3 flex flex-col gap-1'
            >
              <div className='flex items-center justify-between gap-3'>
                <span className='text-app-text text-sm font-semibold leading-tight'>
                  {step.label}
                </span>
                {step.status === 'done' && (
                  <span className='flex-shrink-0 text-[10px] font-bold tracking-wide text-green-400 bg-green-400/10 border border-green-400/25 rounded-full px-2 py-0.5'>
                    Complete
                  </span>
                )}
                {step.status === 'active' && (
                  <span className='flex-shrink-0 flex gap-0.5 items-center'>
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className='w-1 h-1 rounded-full bg-purple-400 animate-pulse'
                        style={{ animationDelay: `${d * 0.15}s` }}
                      />
                    ))}
                  </span>
                )}
                {step.status === 'pending' && (
                  <span className='flex-shrink-0 text-[10px] font-bold tracking-wide text-app-text-secondary bg-app-text-secondary/10 border border-app-text-secondary/20 rounded-full px-2 py-0.5'>
                    Pending
                  </span>
                )}
              </div>
              {step.detail && (
                <p className='text-app-text-secondary text-xs leading-relaxed'>
                  {step.detail}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* ── Keyword analysis ── */}
        {(missing.length > 0 ||
          weakSignals.length > 0 ||
          matching.length > 0) && (
          <div className='flex flex-col gap-4'>
            <p className='text-[10px] font-bold uppercase tracking-widest text-app-text-secondary'>
              Keyword Analysis
            </p>

            {missing.length > 0 && (
              <div className='flex flex-col gap-2'>
                <p className='text-[10px] font-semibold uppercase tracking-wide text-red-400/80'>
                  Missing high-priority terms
                </p>
                <div className='flex flex-wrap gap-1.5'>
                  {missing.map((t) => (
                    <Pill key={t} label={t} variant='missing' />
                  ))}
                </div>
              </div>
            )}

            {weakSignals.length > 0 && (
              <div className='flex flex-col gap-2'>
                <p className='text-[10px] font-semibold uppercase tracking-wide text-amber-400/80'>
                  Weak signals (present but underleveraged)
                </p>
                <div className='flex flex-wrap gap-1.5'>
                  {weakSignals.map((t) => (
                    <Pill key={t} label={t} variant='weak' />
                  ))}
                </div>
              </div>
            )}

            {matching.length > 0 && (
              <div className='flex flex-col gap-2'>
                <p className='text-[10px] font-semibold uppercase tracking-wide text-green-400/80'>
                  Strong matches
                </p>
                <div className='flex flex-wrap gap-1.5'>
                  {matching.slice(0, 8).map((t) => (
                    <Pill key={t} label={t} variant='strong' />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
