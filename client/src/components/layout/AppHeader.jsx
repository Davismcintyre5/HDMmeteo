import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, User, CreditCard, LogOut } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { STATUS_VARIANT } from '../../utils/constants';
import { cn } from '../../utils/cn';

const PAGE_TITLES = {
  '/app/dashboard': 'Dashboard',
  '/app/api-keys': 'API Keys',
  '/app/billing': 'Billing',
  '/app/profile': 'Profile',
  '/app/docs': 'API Documentation',
};

function titleFor(path) {
  return PAGE_TITLES[path] || 'HDM METEO';
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AppHeader({ onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, tenant, logout } = useAuth();
  const { resolved, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const subStatus = tenant?.subscriptionStatus || 'pending';
  const subVariant = STATUS_VARIANT[subStatus] || 'default';

  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-border h-14 flex items-center gap-3 px-4">
      <button
        type="button"
        className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-surface-2 text-text"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="md:hidden">
        <Logo size="sm" to="/app/dashboard" variant="mark" />
      </div>

      <h1 className="hidden md:block text-base font-semibold text-text">
        {titleFor(location.pathname)}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <Badge variant={subVariant} dot size="sm">
          {subStatus}
        </Badge>

        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-surface-2 text-text transition"
          aria-label="Toggle theme"
        >
          {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center gap-2 h-9 pl-1 pr-2 rounded-md hover:bg-surface-2 transition"
            aria-label="User menu"
          >
            <span className="w-7 h-7 rounded-full bg-[var(--brand-accent)] text-white text-[11px] font-semibold flex items-center justify-center">
              {initials(user?.fullName)}
            </span>
            <span className="hidden sm:inline text-sm text-text max-w-[120px] truncate">
              {user?.fullName || 'Account'}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-text truncate">{user?.fullName}</p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); navigate('/app/profile'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-2 transition"
              >
                <User size={15} /> Profile
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); navigate('/app/billing'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-2 transition"
              >
                <CreditCard size={15} /> Billing
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); logout(); }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10 transition border-t border-border'
                )}
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}