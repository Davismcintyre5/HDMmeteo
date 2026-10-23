import { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { Spinner } from './Spinner';

const VARIANTS = {
  primary: 'bg-[var(--brand-accent)] text-white hover:brightness-110 focus-visible:ring-[var(--brand-accent)]',
  secondary: 'bg-surface-2 text-text border border-border hover:bg-surface focus-visible:ring-border',
  outline: 'bg-transparent text-text border border-border hover:bg-surface-2 focus-visible:ring-border',
  ghost: 'bg-transparent text-text hover:bg-surface-2 focus-visible:ring-border',
  danger: 'bg-danger text-white hover:brightness-110 focus-visible:ring-danger',
  success: 'bg-success text-white hover:brightness-110 focus-visible:ring-success',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon = null,
    rightIcon = null,
    type = 'button',
    className,
    children,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});