import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  Key,
  CreditCard,
  BookOpen,
  User,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { SIDEBAR_ITEMS, PUBLIC_LINKS } from '../../utils/constants';
import { cn } from '../../utils/cn';

const ICONS = { LayoutDashboard, Key, CreditCard, BookOpen, User };

export function MobileNav({ open, onClose, variant = 'app' }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, scope, logout } = useAuth();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const dashHref = scope === 'pending' ? '/pending' : '/app/dashboard';

  const go = (to) => {
    onClose?.();
    navigate(to);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />

      <div className="relative w-72 max-w-[80vw] h-full bg-surface border-r border-border flex flex-col animate-slide-in">
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          <Logo size="sm" to={variant === 'app' ? dashHref : '/'} variant="mark" />
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-surface-2 text-text"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {variant === 'app'
            ? SIDEBAR_ITEMS.map((item) => {
                const Icon = ICONS[item.icon];
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition',
                        isActive
                          ? 'bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-medium'
                          : 'text-text-muted hover:text-text hover:bg-surface-2'
                      )
                    }
                  >
                    {Icon && <Icon size={17} />}
                    {item.label}
                  </NavLink>
                );
              })
            : PUBLIC_LINKS.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => go(link.href)}
                  className="block w-full text-left px-3 py-2 rounded-md text-sm text-text-muted hover:text-text hover:bg-surface-2 transition"
                >
                  {link.label}
                </button>
              ))}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          {isAuthenticated ? (
            <>
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-text truncate">{user?.fullName}</p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
              <Button variant="ghost" fullWidth onClick={() => { onClose?.(); logout(); }}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" fullWidth leftIcon={<LogIn size={15} />} onClick={() => go('/login')}>
                Sign in
              </Button>
              <Button variant="primary" fullWidth leftIcon={<UserPlus size={15} />} onClick={() => go('/register')}>
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}