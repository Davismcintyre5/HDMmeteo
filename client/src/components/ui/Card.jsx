import { cn } from '../../utils/cn';

export function Card({ title, description, footer, padding = true, hover = false, className, children }) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-xl',
        hover && 'transition hover:shadow-md hover:border-border/80',
        className
      )}
    >
      {(title || description) && (
        <div className="px-5 pt-4 pb-3 border-b border-border">
          {title && <h3 className="text-sm font-semibold text-text">{title}</h3>}
          {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
        </div>
      )}
      <div className={cn(padding && 'p-5')}>{children}</div>
      {footer && <div className="px-5 py-3 border-t border-border">{footer}</div>}
    </div>
  );
}