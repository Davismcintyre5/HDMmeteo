import { Link } from 'react-router-dom';
import { useBranding } from '../../hooks/useBranding';
import { cn } from '../../utils/cn';

const SIZES = {
  sm: { box: 32, gap: 'gap-0' },
  md: { box: 44, gap: 'gap-0' },
  lg: { box: 64, gap: 'gap-0' },
};

export function Logo({ size = 'md', variant = 'full', to, className }) {
  const { brand, initials } = useBranding();
  const s = SIZES[size] || SIZES.md;

  const hasImage = Boolean(brand.logoUrl);
  const showWordmark = variant === 'full' && !hasImage;

  const mark = hasImage ? (
    <img
      src={brand.logoUrl}
      alt={brand.name}
      width={s.box}
      height={s.box}
      className="shrink-0 object-contain rounded-full"
      style={{ width: s.box, height: s.box }}
    />
  ) : (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{
        width: s.box,
        height: s.box,
        backgroundColor: brand.accent || '#0EA5A4',
        fontSize: Math.round(s.box * 0.4),
      }}
    >
      {initials}
    </div>
  );

  const content = (
    <span className={cn('inline-flex items-center', s.gap, className)}>
      {mark}
      {showWordmark && (
        <span className="font-bold tracking-tight text-xl" style={{ color: 'var(--text)' }}>
          {brand.name}
        </span>
      )}
    </span>
  );

  return to ? <Link to={to} aria-label={brand.name}>{content}</Link> : content;
}