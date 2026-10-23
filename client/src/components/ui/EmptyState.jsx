import { cn } from '../../utils/cn';

export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)}>
      {icon && (
        <div className="mb-4 text-text-muted/60">
          {icon}
        </div>
      )}
      {title && <h3 className="text-base font-semibold text-text">{title}</h3>}
      {description && <p className="text-sm text-text-muted mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}