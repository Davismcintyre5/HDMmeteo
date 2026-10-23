import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PageLoader } from './PublicRoute';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <PageLoader />;
  if (status === 'unauthenticated') {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (status === 'pending') return <Navigate to="/pending" replace />;

  return <Outlet />;
}