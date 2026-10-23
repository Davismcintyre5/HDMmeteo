import { Navigate, Outlet } from 'react-router-dom';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <Spinner size="lg" className="text-[var(--brand-accent)]" />
    </div>
  );
}

export function PublicRoute({ allowWhenAuthed = false }) {
  const { status } = useAuth();

  if (status === 'loading') return <PageLoader />;

  if (!allowWhenAuthed) {
    if (status === 'authenticated') return <Navigate to="/app/dashboard" replace />;
    if (status === 'pending') return <Navigate to="/pending" replace />;
  }

  return <Outlet />;
}