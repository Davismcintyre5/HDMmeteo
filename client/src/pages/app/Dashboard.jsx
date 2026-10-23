import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Key, CreditCard, Calendar, TrendingUp, ArrowRight, Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useSite } from '../../hooks/useSite';
import { apiKeysApi } from '../../api/apiKeys';
import { billingApi } from '../../api/billing';
import { formatMoney, formatDate, relativeTime } from '../../utils/format';
import { STATUS_VARIANT } from '../../utils/constants';

export default function Dashboard() {
  const { user, tenant } = useAuth();
  const { getPlan } = useSite();

  const [keys, setKeys] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const plan = getPlan(tenant?.planCode);
  const subStatus = tenant?.subscriptionStatus || 'pending';
  const subVariant = STATUS_VARIANT[subStatus] || 'default';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [k, i] = await Promise.all([
          apiKeysApi.list().catch(() => ({ keys: [], maxAllowed: 0, used: 0 })),
          billingApi.invoices({ limit: 5 }).catch(() => ({ items: [] })),
        ]);
        if (!cancelled) {
          setKeys(k);
          setInvoices(i.items || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const activeKeys = keys?.keys?.filter((k) => k.status === 'active').length || 0;
  const totalKeys = keys?.keys?.length || 0;
  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + (i.total || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Welcome back, {user?.fullName?.split(' ')[0] || 'there'}</h1>
        <p className="text-sm text-text-muted mt-1">Here's what's happening with your account.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">API keys</p>
              <p className="text-2xl font-bold text-text mt-1.5">{activeKeys}</p>
              <p className="text-xs text-text-muted mt-1">of {totalKeys} total</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[var(--brand-accent)]/10 flex items-center justify-center">
              <Key size={18} className="text-[var(--brand-accent)]" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Plan</p>
              <p className="text-lg font-bold text-text mt-1.5">{plan?.name || tenant?.planCode || '—'}</p>
              <div className="mt-1.5">
                <Badge variant={subVariant} dot size="sm">{subStatus}</Badge>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[var(--brand-accent)]/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-[var(--brand-accent)]" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Renews</p>
              <p className="text-lg font-bold text-text mt-1.5">
                {tenant?.currentPeriodEnd ? formatDate(tenant.currentPeriodEnd) : '—'}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {tenant?.currentPeriodEnd ? relativeTime(tenant.currentPeriodEnd) : 'No active period'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[var(--brand-accent)]/10 flex items-center justify-center">
              <Calendar size={18} className="text-[var(--brand-accent)]" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Total paid</p>
              <p className="text-lg font-bold text-text mt-1.5">{formatMoney(totalPaid, 'KES')}</p>
              <p className="text-xs text-text-muted mt-1">{invoices.filter((i) => i.status === 'paid').length} invoices</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[var(--brand-accent)]/10 flex items-center justify-center">
              <CreditCard size={18} className="text-[var(--brand-accent)]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <Card title="Quick actions">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/app/api-keys">
            <Button variant="outline" fullWidth leftIcon={<Plus size={16} />}>Create API key</Button>
          </Link>
          <Link to="/app/billing">
            <Button variant="outline" fullWidth leftIcon={<CreditCard size={16} />}>Manage billing</Button>
          </Link>
          <Link to="/app/docs">
            <Button variant="outline" fullWidth rightIcon={<ArrowRight size={16} />}>Read docs</Button>
          </Link>
        </div>
      </Card>

      {/* Recent invoices */}
      <Card
        title="Recent invoices"
        description="Your last 5 invoices"
        footer={
          <Link to="/app/billing">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
              View all
            </Button>
          </Link>
        }
      >
        {invoices.length === 0 ? (
          <EmptyState title="No invoices yet" description="Your invoices will appear here once you have a subscription." />
        ) : (
          <div className="divide-y divide-border -mx-5">
            {invoices.map((inv) => (
              <Link
                key={inv._id || inv.id}
                to={`/app/billing`}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-2 transition"
              >
                <div>
                  <p className="text-sm font-medium text-text font-mono">{inv.invoiceNumber}</p>
                  <p className="text-xs text-text-muted mt-0.5">{formatDate(inv.issuedAt || inv.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text">{formatMoney(inv.total, inv.currency)}</p>
                  <div className="mt-1">
                    <Badge variant={STATUS_VARIANT[inv.status] || 'default'} size="sm" dot>
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}