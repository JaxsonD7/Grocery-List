import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useVisualViewportHeight } from '../../hooks/useVisualViewportHeight';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string;
}

export function Modal({ title, onClose, children, footer, maxWidthClass = 'max-w-lg' }: ModalProps) {
  // Driven by the visual viewport (not 100vh/100dvh) so the dialog shrinks
  // when a mobile on-screen keyboard opens — otherwise the footer's Save
  // button can end up rendered underneath the keyboard, out of reach.
  const viewportHeight = useVisualViewportHeight();
  const maxHeight = Math.min(viewportHeight - 24, 800);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`w-full ${maxWidthClass} flex flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl animate-in pb-[env(safe-area-inset-bottom)]`}
        style={{ maxHeight }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-5 py-4 shrink-0">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 py-4 grow">{children}</div>
        {footer && (
          <div className="border-t border-neutral-200 dark:border-neutral-800 px-5 py-3 shrink-0 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
