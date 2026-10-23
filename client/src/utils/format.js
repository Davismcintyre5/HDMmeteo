export function formatMoney(amount, currency = 'KES') {
  const n = Number(amount || 0);
  return `${currency} ${n.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(n) {
  return Number(n || 0).toLocaleString('en-KE');
}

export function formatDate(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString('en-KE', { dateStyle: 'medium', timeZone: 'Africa/Nairobi' });
}

export function formatDateTime(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Nairobi',
  });
}

export function relativeTime(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

export function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}