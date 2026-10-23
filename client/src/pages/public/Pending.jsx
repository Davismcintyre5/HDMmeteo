import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, LogOut, RefreshCw, Smartphone, AlertTriangle } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useToast } from '../../hooks/useToast';
import { billingApi } from '../../api/billing';
import { formatMoney, formatDate } from '../../utils/format';
import {
  normalizeKenyanPhone,
  isValidKenyanPhone,
  formatKenyanPhoneDisplay,
} from '../../utils/phone';

export default function Pending() {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    user,
    tenant,
    invoice,
    fetchInvoice,
    refresh,
    refreshTenantStatus,
    logout,
  } = useAuth();
  const { on } = useSocket();

  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [pollingFast, setPollingFast] = useState(false);
  const fastPollRef = useRef(null);
  const fastPollActiveRef = useRef(false);

  const tenantStatus = tenant?.status;

  /* ── Redirect when active ── */
  useEffect(() => {
    if (tenantStatus === 'active') {
      navigate('/app/dashboard', { replace: true });
    }
  }, [tenantStatus, navigate]);

  /* ── Initial load ── */
  useEffect(() => {
    fetchInvoice().catch(() => {});
    refreshTenantStatus().catch(() => {});
  }, [fetchInvoice, refreshTenantStatus]);

  /* ── Socket events ── */
  useEffect(() => {
    const offPayment = on('payment:received', () => {
      fetchInvoice().catch(() => {});
    });
    const offApproved = on('tenant:approved', async () => {
      toast.success('Account approved!');
      await refreshTenantStatus().catch(() => {});
    });
    return () => {
      offPayment();
      offApproved();
    };
  }, [on, fetchInvoice, refreshTenantStatus, toast]);

  /* ── 5s poll: invoice + tenant ── */
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await fetchInvoice();
        await refreshTenantStatus().catch(() => {});
      } catch {}
    }, 5_000);
    return () => clearInterval(interval);
  }, [fetchInvoice, refreshTenantStatus]);

  /* ── Fast poll after STK ── */
  function startFastPoll() {
    stopFastPoll();
    setPollingFast(true);
    fastPollActiveRef.current = true;
    let attempts = 0;
    fastPollRef.current = setInterval(async () => {
      if (!fastPollActiveRef.current) return;
      attempts++;
      try {
        const inv = await fetchInvoice();
        if (inv?.status === 'paid') {
          stopFastPoll();
          toast.success('Payment received!');
          await refreshTenantStatus().catch(() => {});
          return;
        }
      } catch {}
      if (attempts >= 20) {
        stopFastPoll();
        toast.info("Payment still pending. We'll update when confirmed.");
      }
    }, 3_000);
  }

  function stopFastPoll() {
    fastPollActiveRef.current = false;
    if (fastPollRef.current !== null) {
      clearInterval(fastPollRef.current);
      fastPollRef.current = null;
    }
    setPollingFast(false);
  }

  useEffect(() => () => stopFastPoll(), []);

  /* ── Manual check ── */
  async function checkStatus() {
    setRefreshing(true);
    try {
      const inv = await fetchInvoice();
      await refreshTenantStatus().catch(() => {});
      if (inv?.status === 'paid') {
        toast.info('Payment received — awaiting admin approval');
      } else if (inv) {
        toast.info('Status refreshed');
      } else {
        toast.warning('No invoice found — please contact support');
      }
    } catch (err) {
      toast.error(err?.message || 'Could not check status');
    } finally {
      setRefreshing(false);
    }
  }

  /* ── STK ── */
  async function payWithMpesa() {
    const normalized = normalizeKenyanPhone(phone);
    if (!normalized) {
      toast.error('Enter a valid Kenyan phone number');
      return;
    }
    if (!invoice) return;
    setPaying(true);
    try {
      await billingApi.stkPush(normalized);
      toast.success(`Payment prompt sent to ${formatKenyanPhoneDisplay(normalized)}.`);
      startFastPoll();
    } catch (err) {
      toast.error(err?.message || 'Failed to send payment prompt');
    } finally {
      setPaying(false);
    }
  }

  /* ── Derived ── */
  const isPaid = invoice?.status === 'paid';
  const canPay = Boolean(invoice && !isPaid && invoice.amountDue > 0);
  const instructions = invoice?.paymentInstructions || [];
  const phoneValid = isValidKenyanPhone(phone);

  return (
    <PublicLayout hideNav>
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-text">
            {isPaid ? 'Payment received' : 'Waiting for approval'}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {isPaid
              ? 'Your account will be activated shortly'
              : `Thanks for registering ${tenant?.name || ''}`}
          </p>
        </div>

        <div className="space-y-5">
          {isPaid ? (
            <Alert variant="success" title="Payment confirmed">
              We're verifying your payment now. Your account will be activated automatically — no action needed.
            </Alert>
          ) : (
            <Alert variant="info">
              We've received your registration and our team is reviewing it.
              You'll get an email once your account is live.
            </Alert>
          )}

          {invoice ? (
            <div
              className={`rounded-lg border p-4 text-sm ${
                isPaid ? 'border-success/30 bg-success/5' : 'border-border bg-surface-2'
              }`}
            >
              {isPaid && (
                <div className="mb-2 flex items-center gap-2 text-success">
                  <CheckCircle2 size={16} />
                  <span className="text-sm font-medium">Payment received</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Invoice</span>
                <span className="font-mono text-xs text-text">{invoice.invoiceNumber}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-text-muted">{isPaid ? 'Amount paid' : 'Amount due'}</span>
                <span className="font-semibold text-text">
                  {formatMoney(isPaid ? invoice.total : invoice.amountDue, invoice.currency)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-text-muted">Status</span>
                <span className={isPaid ? 'font-medium text-success' : 'font-medium text-warning'}>
                  {isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
              {!isPaid && invoice.dueDate && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-text-muted">Due</span>
                  <span className="text-text">{formatDate(invoice.dueDate)}</span>
                </div>
              )}
              {isPaid && invoice.paidAt && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-text-muted">Paid</span>
                  <span className="text-text">{formatDate(invoice.paidAt)}</span>
                </div>
              )}
            </div>
          ) : (
            <Alert variant="warning" title="No invoice found" icon={AlertTriangle}>
              We couldn't find an invoice for your registration.
              Click <strong>Check status</strong> to retry, or contact support if this persists.
            </Alert>
          )}

          {canPay && instructions.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-text">Payment methods</p>
              {instructions.map((inst) => {
                const isStk = inst.code === 'mpesa_stk';
                const steps = inst.steps ?? [];
                const recipientEntries = inst.recipient
                  ? Object.entries(inst.recipient).filter(([, v]) => v !== null && v !== undefined && v !== '')
                  : [];
                return (
                  <div key={inst.code} className="rounded-lg border border-border bg-surface p-4">
                    <p className="text-sm font-medium text-text">{inst.title}</p>
                    {inst.description && <p className="mt-1 text-xs text-text-muted">{inst.description}</p>}
                    {isStk && (
                      <div className="mt-3 space-y-2">
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          onBlur={() => {
                            const n = normalizeKenyanPhone(phone);
                            if (n) setPhone(formatKenyanPhoneDisplay(n));
                          }}
                          placeholder="+254 712 345 678"
                          className={`w-full rounded-md border bg-surface-2 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] ${
                            phone && !phoneValid ? 'border-danger' : 'border-border'
                          }`}
                        />
                        {phone && !phoneValid && (
                          <p className="text-xs text-danger">Enter a valid Kenyan number (07…, 01…, +254…)</p>
                        )}
                        <Button
                          fullWidth
                          leftIcon={<Smartphone size={16} />}
                          loading={paying || pollingFast}
                          onClick={payWithMpesa}
                          disabled={!phoneValid || pollingFast}
                        >
                          {pollingFast ? 'Waiting for confirmation…' : inst.action?.label || 'Send STK push'}
                        </Button>
                        {pollingFast && (
                          <p className="text-xs text-text-muted text-center">
                            Confirm the prompt on your phone. This updates automatically.
                          </p>
                        )}
                      </div>
                    )}
                    {!isStk && recipientEntries.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {recipientEntries.map(([k, v]) => (
                          <p key={k} className="text-xs text-text">
                            <span className="capitalize text-text-muted">{k}:</span>{' '}
                            <span className="font-mono">{String(v)}</span>
                          </p>
                        ))}
                      </div>
                    )}
                    {!isStk && steps.length > 0 && (
                      <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-text-muted">
                        {steps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {invoice?.invoiceNumber && (
            <Link to={`/invoice/${invoice.invoiceNumber}`} className="block">
              <Button fullWidth variant="outline">View full invoice</Button>
            </Link>
          )}

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              fullWidth
              leftIcon={<RefreshCw size={14} />}
              loading={refreshing}
              onClick={checkStatus}
            >
              Check status
            </Button>
            <Button variant="ghost" fullWidth leftIcon={<LogOut size={14} />} onClick={logout}>
              Sign out
            </Button>
          </div>

          <div className="border-t border-border pt-4 text-center text-xs text-text-muted">
            <div className="flex items-center justify-center gap-1.5">
              <Clock size={12} />
              {isPaid ? 'Auto-activates once approved' : 'Usually takes less than 24 hours'}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}