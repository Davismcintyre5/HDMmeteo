import { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

export const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    leftIcon,
    rightIcon,
    id,
    required,
    type = 'text',
    className,
    ...rest
  },
  ref
) {
  const autoId = useId();
  const inputId = id || `input-${autoId}`;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text mb-1.5">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full rounded-md bg-surface-2 border text-text placeholder:text-text-subtle',
            'px-3 py-2 text-sm transition focus:outline-none focus:ring-2',
            'focus:ring-[var(--brand-accent)] focus:border-[var(--brand-accent)]',
            error ? 'border-danger focus:ring-danger' : 'border-border',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...rest}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger mt-1.5">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-text-muted mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
});