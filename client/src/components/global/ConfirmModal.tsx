'use client';

interface ConfirmModalProps {
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}


export default function ConfirmModal({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Proceed',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onCancel}
      />
      <div className='relative bg-app-card rounded-2xl p-7 w-full max-w-sm shadow-2xl'>
        <div className='w-12 h-12 rounded-2xl bg-amber-400/15 flex items-center justify-center mb-4'>
          <ion-icon
            name='warning-outline'
            style={{ fontSize: '24px', color: '#FBBF24' }}
          />
        </div>
        <h2 className='text-lg font-bold text-app-text mb-2'>{title}</h2>
        <p className='text-app-text-secondary text-sm leading-relaxed mb-6'>
          {message}
        </p>
        <div className='flex gap-3'>
          <button
            onClick={onCancel}
            className='flex-1 py-3 rounded-xl border border-app-text-secondary/25 text-app-text text-sm font-medium hover:bg-app-text-secondary/8 transition-colors'
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className='flex-1 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors'
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}