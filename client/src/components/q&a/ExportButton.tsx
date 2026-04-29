'use client';

import { useReactToPrint } from 'react-to-print';

interface ExportButtonProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
  label?: string;
  title?: string;
}

export default function ExportButton({
  contentRef,
  label = 'Export',
  title = 'QuizMe Export',
}: ExportButtonProps) {
  const handlePrint = useReactToPrint({
    documentTitle: title,
    contentRef: contentRef, // ✅ v3+ API – pass the ref directly
    pageStyle: `
      @page { size: A4; margin: 20mm; }
      @media print {
        body { font-family: sans-serif; font-size: 12px; color: #1a1a2e; background: white; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  return (
    <button
      onClick={handlePrint}
      className='flex items-center gap-2 text-xs text-app-text-secondary hover:text-app-text border border-app-text-secondary/20 hover:border-app-text-secondary/40 rounded-xl px-3 py-2 transition-all'
    >
      <ion-icon name='download-outline' style={{ fontSize: '14px' }} />
      {label}
    </button>
  );
}
