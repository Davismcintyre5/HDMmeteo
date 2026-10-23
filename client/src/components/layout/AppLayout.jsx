import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { AppFooter } from './AppFooter';
import { MobileNav } from './MobileNav';
import { useAuth } from '../../hooks/useAuth';

export function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (tenant?.status === 'pending') navigate('/pending', { replace: true });
  }, [tenant?.status, navigate]);

  const expired = tenant?.subscriptionStatus === 'expired';

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppSidebar />

      <div className="md:pl-60 flex flex-col min-h-screen">
        <AppHeader onMenuClick={() => setDrawerOpen(true)} />

        {expired && (
          <div className="bg-danger/10 border-b border-danger/30 px-4 py-2.5 flex items-center gap-2 text-sm text-danger">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="flex-1">Your subscription has expired.</span>
            <Link to="/app/billing" className="font-medium underline shrink-0">
              Renew now
            </Link>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>

        <AppFooter />
      </div>

      <MobileNav
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variant="app"
      />
    </div>
  );
}