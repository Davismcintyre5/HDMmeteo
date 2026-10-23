import { cn } from '../../utils/cn';

export function Skeleton({ width = '100%', height = 16, rounded = 'md', className }) {
  const radius = { none: 'rounded-none', sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' }[rounded] || 'rounded-md';
  return (
    <span
      className={cn('block bg-surface-2 animate-pulse', radius, className)}
      style={{ width, height }}
    />
  );
}