import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Key,
  CreditCard,
  BookOpen,
  User,
  ExternalLink,
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useSite } from '../../hooks/useSite';
import { useSocket } from '../../hooks/useSocket';
import { SIDEBAR_ITEMS, STATUS_VARIANT } from '../../utils/constants';
import { formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

const ICONS = { LayoutDashboard, Key, CreditCard, BookOpen, User };

export function AppSidebar() {
  const { tenant, invoice, refresh } = useAuth();
  const { getPlan } = useSite();
  const { on } = useSocket();

  const plan = getPlan(tenant?.planCode);
  const status = tenant?.subscriptionStatus || 'pending';
  const variant = STATUS_VARIANT[status] || 'default';

  useEffect(() => {
    const off = on('tenant:expired', () => {
      refresh();
    });
    return off;
  }, [on, refresh]);

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-surface border-r border-border">
      <div className="h-14 flex items-center px-4 border-b border-border">
        <Logo size="sm" to="/app/dashboard" />
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const showDot = item.to === '/app/billing' && invoice && invoice.status !== 'paid';
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition relative',
                  isActive
                    ? 'bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-medium'
                    : 'text-text-muted hover:text-text hover:bg-surface-2'
                )
              }
            >
              {Icon && <Icon size={17} />}
              <span className="flex-1">{item.label}</span>
              {showDot && <span className="w-1.5 h-1.5 rounded-full bg-danger" />}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="rounded-lg bg-surface-2 border border-border p-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Plan</p>
            <Badge variant={variant} size="sm" dot>{status}</Badge>
          </div>
          <p className="text-sm font-semibold text-text truncate">{plan?.name || tenant?.planCode || '—'}</p>
          {tenant?.currentPeriodEnd && (
            <p className="text-xs text-text-muted mt-1">
              Renews {formatDate(tenant.currentPeriodEnd)}
            </p>
          )}
          <a
            href="/app/billing"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-accent)] hover:underline"
          >
            Manage billing <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </aside>
  );
}