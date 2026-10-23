import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { MobileNav } from './MobileNav';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { PUBLIC_LINKS } from '../../utils/constants';
import { cn } from '../../utils/cn';

export function PublicNav() {
  const navigate = useNavigate();
  const { isAuthenticated, scope } = useAuth();
  const { resolved, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dashHref = scope === 'pending' ? '/pending' : '/app/dashboard';

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 transition-colors',
          scrolled
            ? 'bg-bg/85 backdrop-blur border-b border-border'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Logo to="/" size="md" />

          <nav className="hidden md:flex items-center gap-8">
            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-text-muted hover:text-text transition"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-surface-2 text-text transition"
              aria-label="Toggle theme"
            >
              {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isAuthenticated ? (
              <Button variant="outline" onClick={() => navigate(dashHref)}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Sign in
                </Button>
                <Button variant="primary" onClick={() => navigate('/register')}>
                  Get started
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-1">
            <button
              type="button"
              onClick={toggle}
              className="inline-flex items-center justify-center w-10 h-10 rounded-md text-text hover:bg-surface-2 transition"
              aria-label="Toggle theme"
            >
              {resolved === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center w-10 h-10 rounded-md text-text hover:bg-surface-2 transition"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        variant="public"
      />
    </>
  );
}