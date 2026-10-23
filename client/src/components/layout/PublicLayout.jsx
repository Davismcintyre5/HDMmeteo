import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicNav } from './PublicNav';
import { PublicFooter } from './PublicFooter';

export function PublicLayout({ children, hideNav = false, hideFooter = false }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      {!hideNav && <PublicNav />}
      <main className="flex-1">{children}</main>
      {!hideFooter && <PublicFooter />}
    </div>
  );
}