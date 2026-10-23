import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PageLoader } from './PublicRoute';

export function PendingRoute() {
  const { status } = useAuth();

  if (status === 'loading') return <PageLoader />;
  if (status === 'unauthenticated') return <Navigate to="/login?next=/pending" replace />;
  if (status === 'authenticated') return <Navigate to="/app/dashboard" replace />;

  return <Outlet />;
}