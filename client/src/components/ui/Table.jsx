import { cn } from '../../utils/cn';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';

const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' };

export function Table({
  columns = [],
  data = [],
  loading = false,
  rowKey = (r) => r?.id || r?._id,
  emptyMessage = 'No data',
  onRowClick,
  className,
}) {
  const isEmpty = !loading && data.length === 0;

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-3 py-3 text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap',
                  ALIGN[col.align] || ALIGN.left
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-12 text-center">
                <Spinner size="md" className="mx-auto" />
              </td>
            </tr>
          )}

          {isEmpty && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6">
                <EmptyState title={emptyMessage} />
              </td>
            </tr>
          )}

          {!loading && !isEmpty &&
            data.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-border/60 last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-surface-2 transition'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 py-3 text-text align-middle',
                      ALIGN[col.align] || ALIGN.left
                    )}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}