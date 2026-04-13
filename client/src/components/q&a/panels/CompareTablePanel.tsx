'use client';

import { CompareRow } from '@/types/qa';
import ExportButton from '../ExportButton';

interface CompareTablePanelProps {
  files: string[];
  rows: CompareRow[];
}

export default function CompareTablePanel({ files, rows }: CompareTablePanelProps) {
  // Max 2 files shown side by side; if more, show first 2 with note
  const displayFiles = files.slice(0, 2);

  return (
    <div className='flex flex-col gap-4 h-full'>
      {/* Header */}
      <div className='flex items-center justify-between flex-shrink-0'>
        <div>
          <h3 className='text-base font-bold text-app-text'>Comparison</h3>
          <p className='text-app-text-secondary text-xs mt-0.5'>
            {rows.length} aspects · {files.length} document{files.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ExportButton targetId='compare-table-export' label='Export' />
      </div>

      {/* Table */}
      <div id='compare-table-export' className='flex-1 overflow-y-auto rounded-xl border border-app-text-secondary/15 overflow-hidden'>
        {/* Column headers */}
        <div
          className='grid sticky top-0 z-10 bg-app-card border-b border-app-text-secondary/15'
          style={{ gridTemplateColumns: `140px repeat(${displayFiles.length}, 1fr)` }}
        >
          <div className='px-3 py-2.5'>
            <span className='text-[10px] font-semibold uppercase tracking-wider text-app-text-secondary'>
              Aspect
            </span>
          </div>
          {displayFiles.map((name, i) => (
            <div
              key={name}
              className={`px-3 py-2.5 ${i > 0 ? 'border-l border-app-text-secondary/15' : ''}`}
            >
              <span className='text-xs font-medium text-app-text truncate block' title={name}>
                {name}
              </span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {rows.map((row, ri) => (
          <div
            key={ri}
            className={`grid border-b border-app-text-secondary/10 last:border-b-0 ${
              ri % 2 === 0 ? 'bg-app-bg/20' : ''
            }`}
            style={{ gridTemplateColumns: `140px repeat(${displayFiles.length}, 1fr)` }}
          >
            {/* Aspect */}
            <div className='px-3 py-3 flex items-start'>
              <span className='text-app-text-secondary text-xs font-medium leading-relaxed'>
                {row.aspect}
              </span>
            </div>

            {/* Values */}
            {displayFiles.map((_, vi) => (
              <div
                key={vi}
                className={`px-3 py-3 ${vi > 0 ? 'border-l border-app-text-secondary/10' : ''}`}
              >
                <p className='text-app-text text-xs leading-relaxed'>
                  {row.values[vi] ?? '—'}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>

      {files.length > 2 && (
        <p className='text-xs text-app-text-secondary text-center'>
          Showing first 2 of {files.length} documents
        </p>
      )}
    </div>
  );
}
