import { cn } from '../../utils/cn';

const VARIANTS = {
  default: 'bg-surface-2 text-text border-border',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  info: 'bg-info/10 text-info border-info/30',
  neutral: 'bg-surface-2 text-text-muted border-border',
};

const DOT_COLORS = {
  default: 'bg-text-muted',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-text-muted',
};

export function Badge({ variant = 'default', dot = false, size = 'md', className, children }) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        pad,
        VARIANTS[variant] || VARIANTS.default,
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', DOT_COLORS[variant] || DOT_COLORS.default)} />}
      {children}
    </span>
  );
}