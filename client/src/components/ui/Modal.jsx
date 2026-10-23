import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEsc = true,
  showClose = true,
}) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    document.body.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      const first = dialogRef.current?.querySelector(
        'input, textarea, select, button:not([data-close]), [tabindex]:not([tabindex="-1"])'
      );
      first?.focus?.();
    }, 50);

    const onKey = (e) => {
      if (e.key === 'Escape' && closeOnEsc) onClose?.();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      triggerRef.current?.focus?.();
    };
  }, [open, closeOnEsc, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => closeOnBackdrop && onClose?.()}
      />

      <div
        ref={dialogRef}
        className={cn(
          'relative w-full bg-surface border border-border rounded-xl shadow-xl animate-slide-in',
          SIZES[size] || SIZES.md
        )}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            {title && (
              <h2 id="modal-title" className="text-base font-semibold text-text">
                {title}
              </h2>
            )}
            {showClose && (
              <button
                type="button"
                data-close
                onClick={onClose}
                className="ml-auto text-text-muted hover:text-text transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        <div className="px-5 py-4">{children}</div>

        {footer && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}