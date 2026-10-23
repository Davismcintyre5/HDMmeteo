import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { useBranding } from '../../hooks/useBranding';
import { useToast } from '../../hooks/useToast';
import { isEmail, required } from '../../utils/validation';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();
  const { brand } = useBranding();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const next = params.get('next') || null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    const fe = {};
    if (!isEmail(form.email)) fe.email = 'Enter a valid email';
    if (!required(form.password)) fe.password = 'Password required';
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) return;

    setSubmitting(true);
    try {
      const res = await login(form);
      toast.success('Signed in');
      if (res.scope === 'pending') navigate('/pending', { replace: true });
      else if (next && next.startsWith('/app')) navigate(next, { replace: true });
      else navigate('/app/dashboard', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicLayout hideNav hideFooter>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text">Welcome back</h1>
            <p className="text-sm text-text-muted mt-1.5">Sign in to {brand.name}</p>
          </div>

          {error && (
            <div className="mb-4">
              <Alert variant="error">{error.message}</Alert>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              error={fieldErrors.email}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              error={fieldErrors.password}
            />
            <div className="flex items-center justify-between">
              <Link to="/forgot-password" className="text-xs text-[var(--brand-accent)] hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" fullWidth loading={submitting} leftIcon={<LogIn size={16} />}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-[var(--brand-accent)] hover:underline font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}