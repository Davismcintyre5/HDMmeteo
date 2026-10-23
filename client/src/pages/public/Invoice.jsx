import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { publicApi } from '../../api/public';
import { formatMoney, formatDate } from '../../utils/format';

export default function Invoice() {
  const { number } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!number) return;
    publicApi.site.invoiceByNumber(number)
      .then((res) => setInvoice(res.invoice || res))
      .catch((err) => setError(err.message || 'Invoice not found'))
      .finally(() => setLoading(false));
  }, [number]);

  if (loading) {
    return (
      <PublicLayout hideNav>
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !invoice) {
    return (
      <PublicLayout hideNav>
        <div className="max-w-md mx-auto px-4 py-16">
          <Alert variant="error" title="Invoice not found">
            {error || 'Check the link and try again.'}
          </Alert>
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-[var(--brand-accent)] hover:underline">
              <ArrowLeft size={12} className="mr-1 inline" /> Back to home
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const isPaid = invoice.status === 'paid';

  return (
    <PublicLayout hideNav>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-sm text-text-muted mt-1">
              {isPaid ? 'Paid' : 'Awaiting payment'}
            </p>
          </div>
          <Badge variant={isPaid ? 'success' : 'warning'} dot>{invoice.status}</Badge>
        </div>

        <Card>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">Billed to</p>
              <p className="font-medium text-text mt-1">{invoice.customerSnapshot?.name || '—'}</p>
              {invoice.customerSnapshot?.email && (
                <p className="text-xs text-text-muted">{invoice.customerSnapshot.email}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Issued: {formatDate(invoice.issuedAt)}</p>
              {invoice.dueDate && <p className="text-xs text-text-muted">Due: {formatDate(invoice.dueDate)}</p>}
            </div>
          </div>

          <table className="w-full text-sm mt-6">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left text-xs font-medium text-text-muted uppercase">Item</th>
                <th className="py-2 text-right text-xs font-medium text-text-muted uppercase">Qty</th>
                <th className="py-2 text-right text-xs font-medium text-text-muted uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="py-3">
                    <p className="text-text font-medium">{item.name}</p>
                    {item.description && <p className="text-xs text-text-muted">{item.description}</p>}
                  </td>
                  <td className="py-3 text-right text-text-muted">{item.qty}</td>
                  <td className="py-3 text-right text-text">{formatMoney(item.subtotal, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-sm">
            <div className="flex justify-between text-text-muted">
              <span>Subtotal</span><span>{formatMoney(invoice.subtotal, invoice.currency)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-text-muted">
                <span>Discount</span><span>−{formatMoney(invoice.discount, invoice.currency)}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="flex justify-between text-text-muted">
                <span>Tax</span><span>{formatMoney(invoice.tax, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-text text-base pt-2 border-t border-border">
              <span>Total</span><span>{formatMoney(invoice.total, invoice.currency)}</span>
            </div>
            {!isPaid && (
              <div className="flex justify-between font-medium text-warning">
                <span>Amount due</span><span>{formatMoney(invoice.amountDue, invoice.currency)}</span>
              </div>
            )}
          </div>
        </Card>

        {isPaid && (
          <Alert variant="success" title="Payment received" className="mt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              Paid on {formatDate(invoice.paidAt || invoice.issuedAt)}
            </div>
          </Alert>
        )}

        {!isPaid && invoice.paymentInstructions?.length > 0 && (
          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold text-text">How to pay</h2>
            {invoice.paymentInstructions.map((m) => (
              <Card key={m.code}>
                <p className="text-sm font-medium text-text">{m.title}</p>
                {m.description && <p className="text-xs text-text-muted mt-1">{m.description}</p>}
                {m.code === 'mpesa_stk' && (
                  <p className="text-xs text-text-muted mt-2">
                    Sign in and open your pending page to send the STK push.
                  </p>
                )}
                {m.recipient && Object.keys(m.recipient).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {Object.entries(m.recipient).filter(([, v]) => v).map(([k, v]) => (
                      <p key={k} className="text-xs text-text">
                        <span className="capitalize text-text-muted">{k}:</span>{' '}
                        <span className="font-mono">{String(v)}</span>
                      </p>
                    ))}
                  </div>
                )}
                {m.steps?.length > 0 && m.code !== 'mpesa_stk' && (
                  <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-text-muted">
                    {m.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                )}
              </Card>
            ))}
          </div>
        )}

        {invoice.notes && (
          <p className="mt-4 text-xs text-text-muted">{invoice.notes}</p>
        )}

        <div className="mt-8 flex justify-center">
          <Link to="/pending">
            <Button variant="outline" leftIcon={<ArrowLeft size={14} />}>Back to status</Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}