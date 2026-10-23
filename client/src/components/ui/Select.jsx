import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Select = forwardRef(function Select(
  { label, hint, error, options = [], placeholder, id, required, className, ...rest },
  ref
) {
  const autoId = useId();
  const selectId = id || `select-${autoId}`;
  const describedBy = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-text mb-1.5">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full appearance-none rounded-md bg-surface-2 border text-text',
            'px-3 py-2 pr-9 text-sm transition focus:outline-none focus:ring-2',
            'focus:ring-[var(--brand-accent)] focus:border-[var(--brand-accent)]',
            error ? 'border-danger focus:ring-danger' : 'border-border',
            className
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>

      {error ? (
        <p id={`${selectId}-error`} className="text-xs text-danger mt-1.5">{error}</p>
      ) : hint ? (
        <p id={`${selectId}-hint`} className="text-xs text-text-muted mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
});