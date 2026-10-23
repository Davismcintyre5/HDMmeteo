import { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, id, required, rows = 3, maxLength, showCount, value, className, ...rest },
  ref
) {
  const autoId = useId();
  const textareaId = id || `textarea-${autoId}`;
  const describedBy = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-text mb-1.5">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        required={required}
        maxLength={maxLength}
        value={value}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full rounded-md bg-surface-2 border text-text placeholder:text-text-subtle',
          'px-3 py-2 text-sm transition focus:outline-none focus:ring-2 resize-y',
          'focus:ring-[var(--brand-accent)] focus:border-[var(--brand-accent)]',
          error ? 'border-danger focus:ring-danger' : 'border-border',
          className
        )}
        {...rest}
      />

      <div className="flex items-start justify-between gap-2 mt-1.5">
        <div className="flex-1">
          {error ? (
            <p id={`${textareaId}-error`} className="text-xs text-danger">{error}</p>
          ) : hint ? (
            <p id={`${textareaId}-hint`} className="text-xs text-text-muted">{hint}</p>
          ) : null}
        </div>
        {showCount && maxLength && (
          <p className="text-xs text-text-muted shrink-0">
            {String(value || '').length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});