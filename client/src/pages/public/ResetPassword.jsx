import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { publicApi } from '../../api/public';
import { useToast } from '../../hooks/useToast';
import { isPassword } from '../../utils/validation';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    const fe = {};
    if (!isPassword(password)) fe.password = 'Min 8 characters';
    if (password !== confirm) fe.confirm = 'Passwords do not match';
    setErrors(fe);
    if (Object.keys(fe).length > 0) return;

    setSubmitting(true);
    try {
      await publicApi.auth.resetPassword(token, password);
      toast.success('Password reset. Sign in with your new password.');
      navigate('/login', { replace: true });
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
            <h1 className="text-2xl font-bold text-text">Set a new password</h1>
            <p className="text-sm text-text-muted mt-1.5">Choose a strong password for your account.</p>
          </div>

          {error && (
            <div className="mb-4">
              <Alert variant="error" title={error.code === 'TOKEN_INVALID' ? 'Link expired' : 'Could not reset'}>
                {error.message}
                {error.code === 'TOKEN_INVALID' && (
                  <div className="mt-3">
                    <Link to="/forgot-password">
                      <Button size="sm" variant="outline">Request new link</Button>
                    </Link>
                  </div>
                )}
              </Alert>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              hint="At least 8 characters"
              autoFocus
            />
            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={errors.confirm}
            />
            <Button type="submit" fullWidth loading={submitting} leftIcon={<Lock size={16} />}>
              Reset password
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            <Link to="/login" className="text-[var(--brand-accent)] hover:underline font-medium">Back to sign in</Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}