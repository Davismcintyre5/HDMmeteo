import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { useSite } from '../../hooks/useSite';
import { formatMoney } from '../../utils/format';

const FEATURE_LABELS = {
  currentWeather: 'Current weather',
  forecast: '7-day forecast',
  aiSummary: 'AI summaries',
  historical: 'Historical data',
  alerts: 'Weather alerts',
  bulkLookup: 'Bulk location lookup',
};

const FAQ = [
  { q: 'How does billing work?', a: 'You pay per period — monthly, yearly, or once for lifetime access. Invoices are generated at signup and renew automatically when you pay the renewal invoice.' },
  { q: 'Can I pay with M-Pesa?', a: 'Yes. We support M-Pesa STK push, M-Pesa till, M-Pesa send, Paybill, and bank transfer. Choose whichever works for you at checkout.' },
  { q: 'What happens when my plan expires?', a: 'Your API keys stop working until you renew. You won\'t lose data — reactivating restores full access immediately.' },
  { q: 'How many API keys can I create?', a: 'One by default. Need more? Contact support — we can raise your limit per account.' },
  { q: 'Is there a free trial?', a: 'Not currently. But our monthly plan is affordable enough to test with. Cancel by not renewing.' },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { plans, loading, error, refresh } = useSite();

  return (
    <PublicLayout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h1 className="text-4xl md:text-5xl font-bold text-text">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-text-muted">Pick the interval that fits. No hidden fees.</p>
        </div>

        {error && (
          <div className="max-w-xl mx-auto mb-8">
            <Alert variant="error" title="Could not load plans">
              {error.message}
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={refresh}>Retry</Button>
              </div>
            </Alert>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const featured = plan.price?.interval === 'year';
              return (
                <Card key={plan.code} className={`relative ${featured ? 'ring-2 ring-[var(--brand-accent)]' : ''}`}>
                  {featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="success" size="sm" dot>Best value</Badge>
                    </div>
                  )}
                  <p className="text-xs text-text-muted uppercase tracking-wider font-medium">{plan.name}</p>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-text">{formatMoney(plan.price.amount, plan.price.currency)}</span>
                    <span className="text-sm text-text-muted">/{plan.price.interval === 'once' ? 'once' : plan.price.interval}</span>
                  </div>
                  <p className="text-sm text-text-muted mt-2 mb-5 min-h-[40px]">{plan.description}</p>
                  <ul className="space-y-2 mb-6">
                    {Object.entries(plan.features || {}).map(([key, enabled]) => (
                      <li key={key} className="flex items-center gap-2 text-sm">
                        {enabled ? (
                          <Check size={15} className="text-success shrink-0" />
                        ) : (
                          <X size={15} className="text-text-subtle shrink-0" />
                        )}
                        <span className={enabled ? 'text-text' : 'text-text-subtle line-through'}>
                          {FEATURE_LABELS[key] || key}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={featured ? 'primary' : 'outline'}
                    fullWidth
                    onClick={() => navigate(`/register?plan=${plan.code}`)}
                  >
                    Get {plan.name}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-text text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="group border border-border rounded-lg bg-surface">
                <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-text flex items-center justify-between">
                  {item.q}
                  <span className="text-text-muted group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="px-5 pb-4 text-sm text-text-muted leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}