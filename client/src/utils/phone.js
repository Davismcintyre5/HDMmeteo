export function normalizeKenyanPhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  let n = digits;
  if (n.startsWith('254') && n.length === 12) return `+${n}`;
  if (n.startsWith('0') && n.length === 10) return `+254${n.slice(1)}`;
  if (n.length === 9 && (n.startsWith('7') || n.startsWith('1'))) return `+254${n}`;
  return null;
}

export function isValidKenyanPhone(raw) {
  return normalizeKenyanPhone(raw) !== null;
}

export function formatKenyanPhoneDisplay(raw) {
  const n = normalizeKenyanPhone(raw);
  if (!n) return '';
  const local = n.slice(4);
  return `+254 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}