import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  info: { bg: 'bg-info/10 border-info/30', text: 'text-info', Icon: Info },
  success: { bg: 'bg-success/10 border-success/30', text: 'text-success', Icon: CheckCircle2 },
  warning: { bg: 'bg-warning/10 border-warning/30', text: 'text-warning', Icon: AlertTriangle },
  error: { bg: 'bg-danger/10 border-danger/30', text: 'text-danger', Icon: XCircle },
};

export function Alert({ variant = 'info', title, children, dismissible, onDismiss, icon }) {
  const v = VARIANTS[variant] || VARIANTS.info;
  const Icon = icon || v.Icon;

  return (
    <div
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-lg border px-4 py-3', v.bg)}
    >
      <Icon size={18} className={cn('shrink-0 mt-0.5', v.text)} />
      <div className="flex-1 min-w-0">
        {title && <p className={cn('text-sm font-semibold', v.text)}>{title}</p>}
        {children && <div className={cn('text-sm text-text', title && 'mt-1')}>{children}</div>}
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-text-muted hover:text-text transition"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}