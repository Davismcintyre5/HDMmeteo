import { createContext, useCallback, useContext, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../utils/cn';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const VARIANTS = {
  success: 'border-success/40 bg-success/10 text-text',
  error: 'border-danger/40 bg-danger/10 text-text',
  warning: 'border-warning/40 bg-warning/10 text-text',
  info: 'border-info/40 bg-info/10 text-text',
};

const ICON_COLORS = {
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
};

function ToastItem({ toast, onDismiss }) {
  const Icon = ICONS[toast.variant] || Info;
  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg animate-slide-in max-w-sm',
        VARIANTS[toast.variant]
      )}
      role="alert"
    >
      <Icon size={18} className={cn('shrink-0 mt-0.5', ICON_COLORS[toast.variant])} />
      <p className="text-sm flex-1 leading-relaxed">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-text-muted hover:text-text transition"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (variant, message, opts = {}) => {
      const id = opts.id || `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const duration = opts.duration !== undefined ? opts.duration : 4000;

      setToasts((prev) => {
        const next = [...prev, { id, variant, message }];
        return next.length > 3 ? next.slice(next.length - 3) : next;
      });

      if (duration > 0) {
        const t = setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, t);
      }

      return id;
    },
    [dismiss]
  );

  const api = {
    success: (m, o) => push('success', m, o),
    error: (m, o) => push('error', m, o),
    warning: (m, o) => push('warning', m, o),
    info: (m, o) => push('info', m, o),
    toast: (m, o) => push('info', m, o),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}