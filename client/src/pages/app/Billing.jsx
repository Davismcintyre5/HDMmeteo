import { useEffect, useState } from 'react';
import { CreditCard, Smartphone, ArrowRight, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Table } from '../../components/ui/Table';
import { Spinner } from '../../components/ui/Spinner';
import { billingApi } from '../../api/billing';
import { useAuth } from '../../hooks/useAuth';
import { useSite } from '../../hooks/useSite';
import { useSocket } from '../../hooks/useSocket';
import { useToast } from '../../hooks/useToast';
import { formatMoney, formatDate } from '../../utils/format';
import { STATUS_VARIANT, PLAN_INTERVALS } from '../../utils/constants';
import {
  normalizeKenyanPhone,
  isValidKenyanPhone,
  formatKenyanPhoneDisplay,
} from '../../utils/phone';

export default function Billing() {
  const toast = useToast();
  const { user, tenant, fetchInvoice } = useAuth();
  const { plans, getPlan } = useSite();
  const { on } = useSocket();

  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stkOpen, setStkOpen] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [paying, setPaying] = useState(false);

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState('');
  const [upgrading, setUpgrading] = useState(false);

  const [renewing, setRenewing] = useState(false);

  const plan = getPlan(tenant?.planCode);

  async function load() {
    setLoading(true);
    try {
      const [c, h] = await Promise.all([
        billingApi.currentInvoice().catch(() => ({ invoice: null })),
        billingApi.invoices({ limit: 20 }).catch(() => ({ items: [] })),
      ]);
      setCurrent(c.invoice || null);
      setHistory(h.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const off = on('payment:received', () => load());
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doStk() {
    const normalized = normalizeKenyanPhone(phone);
    if (!normalized) {
      toast.error('Enter a valid Kenyan phone number');
      return;
    }
    setPaying(true);
    try {
      await billingApi.stkPush(normalized);
      toast.success(`Payment prompt sent to ${formatKenyanPhoneDisplay(normalized)}`);
      setStkOpen(false);
      setTimeout(load, 3000);
    } catch (err) {
      toast.error(err.message || 'Failed to send prompt');
    } finally {
      setPaying(false);
    }
  }

  async function doUpgrade() {
    if (!upgradePlan) return;
    setUpgrading(true);
    try {
      await billingApi.upgrade(upgradePlan);
      toast.success('Upgrade invoice created');
      setUpgradeOpen(false);
      load();
      await fetchInvoice();
    } catch (err) {
      toast.error(err.message || 'Upgrade failed');
    } finally {
      setUpgrading(false);
    }
  }

  async function doRenew() {
    setRenewing(true);
    try {
      await billingApi.renew();
      toast.success('Renewal invoice created');
      load();
      await fetchInvoice();
    } catch (err) {
      toast.error(err.message || 'Renew failed');
    } finally {
      setRenewing(false);
    }
  }

  const phoneValid = isValidKenyanPhone(phone);
  const availableUpgrades = plans.filter((p) => p.code !== tenant?.planCode);

  if (loading && !current && history.length === 0) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice',
      render: (r) => <span className="font-mono text-xs text-text">{r.invoiceNumber}</span>,
    },
    {
      key: 'issuedAt',
      label: 'Date',
      render: (r) => <span className="text-xs text-text-muted">{formatDate(r.issuedAt || r.createdAt)}</span>,
    },
    {
      key: 'total',
      label: 'Amount',
      align: 'right',
      render: (r) => <span className="text-sm font-medium text-text">{formatMoney(r.total, r.currency)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <Badge variant={STATUS_VARIANT[r.status] || 'default'} size="sm" dot>
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <a href={`/invoice/${r.invoiceNumber}`} target="_blank" rel="noreferrer">
          <Button size="sm" variant="ghost">View</Button>
        </a>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Billing</h1>
        <p className="text-sm text-text-muted mt-1">Manage your subscription and invoices.</p>
      </div>

      {/* Current invoice */}
      {current && current.status !== 'paid' && (
        <Card className="border-warning/40 bg-warning/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={16} className="text-warning" />
                <p className="text-sm font-semibold text-text">Outstanding invoice</p>
              </div>
              <p className="text-xs text-text-muted">
                {current.invoiceNumber} · {formatMoney(current.amountDue, current.currency)} due{current.dueDate ? ` by ${formatDate(current.dueDate)}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a href={`/invoice/${current.invoiceNumber}`} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">View invoice</Button>
              </a>
              <Button size="sm" leftIcon={<Smartphone size={14} />} onClick={() => setStkOpen(true)}>
                Pay with M-Pesa
              </Button>
            </div>
          </div>
        </Card>
      )}

      {(!current || current.status === 'paid') && (
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <CreditCard size={18} className="text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">No outstanding invoices</p>
              <p className="text-xs text-text-muted mt-0.5">You're all caught up.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Plan card */}
      <Card title="Your plan">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-lg font-bold text-text">{plan?.name || tenant?.planCode || '—'}</p>
            {plan && (
              <p className="text-sm text-text-muted mt-1">
                {formatMoney(plan.price.amount, plan.price.currency)} / {plan.price.interval === 'once' ? 'once' : plan.price.interval}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge variant={STATUS_VARIANT[tenant?.subscriptionStatus] || 'default'} size="sm" dot>
                {tenant?.subscriptionStatus || 'pending'}
              </Badge>
              {tenant?.currentPeriodEnd && (
                <span className="text-xs text-text-muted">Renews {formatDate(tenant.currentPeriodEnd)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={doRenew} loading={renewing}>Renew</Button>
            {availableUpgrades.length > 0 && (
              <Button size="sm" rightIcon={<ArrowRight size={14} />} onClick={() => { setUpgradePlan(availableUpgrades[0]?.code || ''); setUpgradeOpen(true); }}>
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* History */}
      <Card title="Invoice history" padding={false}>
        <div className="p-4">
          {history.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">No invoices yet.</p>
          ) : (
            <Table columns={columns} data={history} rowKey={(r) => r._id || r.id} />
          )}
        </div>
      </Card>

      {/* STK Modal */}
      <Modal
        open={stkOpen}
        onClose={() => setStkOpen(false)}
        title="Pay with M-Pesa"
        footer={
          <>
            <Button variant="ghost" onClick={() => setStkOpen(false)}>Cancel</Button>
            <Button onClick={doStk} loading={paying} disabled={!phoneValid} leftIcon={<Smartphone size={14} />}>
              Send prompt
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-text-muted">
            We'll send an M-Pesa payment request to your phone. Confirm it to complete payment.
          </p>
          <Input
            label="Phone number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+254 712 345 678"
            error={phone && !phoneValid ? 'Enter a valid Kenyan number' : null}
            autoFocus
          />
          <div className="rounded-lg bg-surface-2 border border-border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Amount</span>
              <span className="font-semibold text-text">{formatMoney(current?.amountDue ?? 0, current?.currency || 'KES')}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Upgrade Modal */}
      <Modal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Upgrade plan"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUpgradeOpen(false)}>Cancel</Button>
            <Button onClick={doUpgrade} loading={upgrading} disabled={!upgradePlan}>Create upgrade invoice</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-text-muted">
            You'll receive an invoice for the new plan. Once paid, an admin will approve the switch.
          </p>
          <Select
            label="New plan"
            value={upgradePlan}
            onChange={(e) => setUpgradePlan(e.target.value)}
            options={availableUpgrades.map((p) => ({
              value: p.code,
              label: `${p.name} — ${formatMoney(p.price.amount, p.price.currency)} / ${p.price.interval === 'once' ? 'once' : p.price.interval}`,
            }))}
          />
        </div>
      </Modal>
    </div>
  );
}