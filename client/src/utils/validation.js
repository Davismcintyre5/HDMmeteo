export function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
}

export function isUrl(s) {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

export function isHHMM(s) {
  if (!/^\d{2}:\d{2}$/.test(String(s || ''))) return false;
  const [h, m] = s.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export function isPassword(s) {
  return typeof s === 'string' && s.length >= 8;
}

export function isStrongPassword(s) {
  if (!isPassword(s)) return false;
  return /[a-zA-Z]/.test(s) && /\d/.test(s);
}

export function isBusinessName(s) {
  return typeof s === 'string' && s.trim().length >= 2;
}

export function required(v) {
  return v !== undefined && v !== null && String(v).trim() !== '';
}