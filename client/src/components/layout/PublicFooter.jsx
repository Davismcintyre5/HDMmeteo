import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { useBranding } from '../../hooks/useBranding';

export function PublicFooter() {
  const { brand } = useBranding();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Logo size="sm" to="/" />
            <p className="text-xs text-text-muted mt-3 leading-relaxed max-w-xs">
              Weather data, delivered. One key. Every forecast.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-text uppercase tracking-wider mb-3">
              Product
            </h4>
            <ul className="space-y-2">
              <li><Link to="/pricing" className="text-sm text-text-muted hover:text-text transition">Pricing</Link></li>
              <li><Link to="/app/docs" className="text-sm text-text-muted hover:text-text transition">Docs</Link></li>
              <li><Link to="/#features" className="text-sm text-text-muted hover:text-text transition">Features</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-text uppercase tracking-wider mb-3">
              Company
            </h4>
            <ul className="space-y-2">
              <li><Link to="/#contact" className="text-sm text-text-muted hover:text-text transition">Contact</Link></li>
              <li>
                <a
                  href={brand.website || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-text-muted hover:text-text transition"
                >
                  Website
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-text uppercase tracking-wider mb-3">
              Support
            </h4>
            <ul className="space-y-2">
              {brand.supportEmail && (
                <li>
                  <a href={`mailto:${brand.supportEmail}`} className="text-sm text-text-muted hover:text-text transition break-all">
                    {brand.supportEmail}
                  </a>
                </li>
              )}
              {brand.supportPhone && (
                <li>
                  <a href={`tel:${brand.supportPhone.replace(/\s+/g, '')}`} className="text-sm text-text-muted hover:text-text transition">
                    {brand.supportPhone}
                  </a>
                </li>
              )}
              {brand.supportWhatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${brand.supportWhatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-text-muted hover:text-text transition"
                  >
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            © {year} {brand.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link to="/terms" className="text-xs text-text-muted hover:text-text transition">Terms</Link>
            <Link to="/privacy" className="text-xs text-text-muted hover:text-text transition">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}