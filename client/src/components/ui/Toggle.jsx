import { cn } from '../../utils/cn';

export function Toggle({ checked, onChange, label, description, disabled, size = 'md' }) {
  const dims = size === 'sm'
    ? { track: 'w-9 h-5', thumb: 'w-3.5 h-3.5', on: 'translate-x-4' }
    : { track: 'w-11 h-6', thumb: 'w-4.5 h-4.5', on: 'translate-x-5' };

  return (
    <label className={cn('flex items-start gap-3 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full transition-colors mt-0.5',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          dims.track,
          checked ? 'bg-[var(--brand-accent)]' : 'bg-border'
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 bg-white rounded-full shadow transition-transform',
            dims.thumb,
            checked ? dims.on : 'translate-x-0'
          )}
        />
      </button>

      {(label || description) && (
        <span className="flex flex-col flex-1 min-w-0">
          {label && <span className="text-sm font-medium text-text">{label}</span>}
          {description && <span className="text-xs text-text-muted mt-0.5">{description}</span>}
        </span>
      )}
    </label>
  );
}