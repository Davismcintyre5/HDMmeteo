import { useBranding } from '../../hooks/useBranding';

export function AppFooter() {
  const { brand } = useBranding();
  const year = new Date().getFullYear();
  const version = import.meta.env.VITE_APP_VERSION || '1.0.0';

  return (
    <footer className="border-t border-border bg-surface px-6 py-3 text-xs text-text-muted">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          © {year} {brand.name} · v{version}
        </p>
        <div className="flex items-center gap-4">
          {brand.supportEmail && (
            <a href={`mailto:${brand.supportEmail}`} className="hover:text-text transition">
              Support
            </a>
          )}
          <a
            href={brand.website || '#'}
            target="_blank"
            rel="noreferrer"
            className="hover:text-text transition"
          >
            Website
          </a>
        </div>
      </div>
    </footer>
  );
}