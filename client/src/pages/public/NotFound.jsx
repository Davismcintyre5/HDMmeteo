import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-md">
          <p className="text-7xl font-bold text-[var(--brand-accent)]">404</p>
          <h1 className="mt-4 text-2xl font-bold text-text">Page not found</h1>
          <p className="mt-2 text-text-muted">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button leftIcon={<Home size={16} />} onClick={() => navigate('/')}>
              Go home
            </Button>
            <Button variant="outline" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
              Go back
            </Button>
          </div>
          <div className="mt-8 text-sm text-text-muted">
            Need help?{' '}
            <Link to="/login" className="text-[var(--brand-accent)] hover:underline">Sign in</Link>
            {' '}or{' '}
            <Link to="/pricing" className="text-[var(--brand-accent)] hover:underline">view pricing</Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}