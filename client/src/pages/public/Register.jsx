import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { useSite } from '../../hooks/useSite';
import { useBranding } from '../../hooks/useBranding';
import { useToast } from '../../hooks/useToast';
import { isEmail, isPassword, isBusinessName, required } from '../../utils/validation';
import { isValidKenyanPhone, normalizeKenyanPhone } from '../../utils/phone';
import { formatMoney } from '../../utils/format';

export default function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { register, login } = useAuth();
  const { plans, loading: plansLoading } = useSite();
  const { brand } = useBranding();
  const toast = useToast();

  const initialPlan = params.get('plan') || plans[0]?.code || '';

  const [form, setForm] = useState({
    businessName: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    planCode: initialPlan,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    const fe = {};
    if (!isBusinessName(form.businessName)) fe.businessName = 'Min 2 characters';
    if (!required(form.fullName)) fe.fullName = 'Full name required';
    if (!isEmail(form.email)) fe.email = 'Enter a valid email';
    if (!isValidKenyanPhone(form.phone)) fe.phone = 'Enter a valid Kenyan phone (07…, 01…, +254…)';
    if (!isPassword(form.password)) fe.password = 'Min 8 characters';
    if (!form.planCode) fe.planCode = 'Select a plan';
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) return;

    setSubmitting(true);
    try {
      const phone = normalizeKenyanPhone(form.phone);

      await register({ ...form, phone });

      const res = await login({ email: form.email, password: form.password });

      toast.success('Account created. Complete payment to activate.');

      if (res.scope === 'pending') navigate('/pending', { replace: true });
      else navigate('/app/dashboard', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  const plan = plans.find((p) => p.code === form.planCode);

  return (
    <PublicLayout hideNav hideFooter>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text">Create your account</h1>
            <p className="text-sm text-text-muted mt-1.5">Start using {brand.name} in minutes</p>
          </div>

          {error && (
            <div className="mb-4">
              <Alert variant="error">{error.message}</Alert>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Project name"
              value={form.businessName}
              onChange={(e) => set('businessName', e.target.value)}
              error={fieldErrors.businessName}
              autoFocus
            />
            <Input
              label="Your full name"
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              error={fieldErrors.fullName}
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              error={fieldErrors.email}
            />
            <Input
              label="Phone (M-Pesa)"
              type="tel"
              placeholder="0712 345 678"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              error={fieldErrors.phone}
              hint="Used for M-Pesa payments"
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              error={fieldErrors.password}
              hint="At least 8 characters"
            />

            {!plansLoading && plans.length > 0 && (
              <Select
                label="Plan"
                value={form.planCode}
                onChange={(e) => set('planCode', e.target.value)}
                error={fieldErrors.planCode}
                options={plans.map((p) => ({
                  value: p.code,
                  label: `${p.name} — ${formatMoney(p.price.amount, p.price.currency)} / ${p.price.interval === 'once' ? 'once' : p.price.interval}`,
                }))}
              />
            )}

            {plan && (
              <div className="rounded-lg bg-surface-2 border border-border px-4 py-3 text-sm">
                <p className="text-text-muted">You'll be invoiced</p>
                <p className="text-text font-semibold mt-0.5">
                  {formatMoney(plan.price.amount, plan.price.currency)} · {plan.price.interval === 'once' ? 'one-time' : `per ${plan.price.interval}`}
                </p>
              </div>
            )}

            <Button type="submit" fullWidth loading={submitting} leftIcon={<UserPlus size={16} />}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--brand-accent)] hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}