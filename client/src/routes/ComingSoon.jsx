import { Construction } from 'lucide-react';
import { Card } from '../components/ui/Card';

export function ComingSoon({ title = 'Coming soon', description = 'This page is under construction.' }) {
  return (
    <Card>
      <div className="flex flex-col items-center justify-center text-center py-16 px-4">
        <div className="w-14 h-14 rounded-full bg-[var(--brand-accent)]/10 flex items-center justify-center mb-4">
          <Construction size={26} className="text-[var(--brand-accent)]" />
        </div>
        <h2 className="text-lg font-semibold text-text">{title}</h2>
        <p className="text-sm text-text-muted mt-2 max-w-sm">{description}</p>
      </div>
    </Card>
  );
}