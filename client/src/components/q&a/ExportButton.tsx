'use client';

interface ExportButtonProps {
  targetId: string;
  label?: string;
}

export default function ExportButton({ targetId, label = 'Export PDF' }: ExportButtonProps) {
  const handleExport = () => {
    const el = document.getElementById(targetId);
    if (!el) return;

    // Clone element into a print-friendly window
    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>QuizMe Export</title>
          <style>
            body { font-family: 'Rubik', sans-serif; margin: 40px; color: #313e51; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 13px; }
            th { background: #f4f6fa; font-weight: 600; }
            h2 { color: #a729f5; }
            .term { font-weight: 600; margin-top: 12px; }
            .def { color: #626c7f; margin-left: 12px; margin-bottom: 4px; }
            .step { display: flex; gap: 8px; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .step-label { font-weight: 500; }
            .step-detail { color: #626c7f; font-size: 12px; }
          </style>
        </head>
        <body>
          ${el.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <button
      onClick={handleExport}
      className='flex items-center gap-2 text-xs text-app-text-secondary hover:text-app-text border border-app-text-secondary/20 hover:border-app-text-secondary/40 rounded-xl px-3 py-2 transition-all'
    >
      <ion-icon name='download-outline' style={{ fontSize: '14px' }} />
      {label}
    </button>
  );
}
