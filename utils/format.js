function formatMoney(amount, currency = 'KES') {
  const n = Number(amount || 0);
  return `${currency} ${n.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function humanDate(d, opts = {}) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString('en-KE', {
    dateStyle: opts.dateStyle || 'medium',
    timeStyle: opts.timeStyle || undefined,
    timeZone: 'Africa/Nairobi',
  });
}

function relativeTime(d) {
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
  return humanDate(date);
}

module.exports = { formatMoney, humanDate, relativeTime };