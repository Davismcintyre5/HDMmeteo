import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { publicApi } from '../../api/public';
import { isEmail } from '../../utils/validation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    if (!isEmail(email)) {
      setFieldError('Enter a valid email');
      return;
    }

    setSubmitting(true);
    try {
      await publicApi.auth.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send reset link');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicLayout hideNav hideFooter>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text">Forgot your password?</h1>
            <p className="text-sm text-text-muted mt-1.5">
              Enter your email and we'll send a reset link.
            </p>
          </div>

          {sent ? (
            <Alert variant="success" title="Check your inbox">
              If an account exists for {email}, we've sent a reset link. It expires in 1 hour.
            </Alert>
          ) : (
            <>
              {error && (
                <div className="mb-4"><Alert variant="error">{error}</Alert></div>
              )}
              <form onSubmit={onSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={fieldError}
                />
                <Button type="submit" fullWidth loading={submitting} leftIcon={<Mail size={16} />}>
                  Send reset link
                </Button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-text-muted">
            Remember it?{' '}
            <Link to="/login" className="text-[var(--brand-accent)] hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}