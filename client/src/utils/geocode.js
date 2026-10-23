import { publicApi } from '../api/public';

const CACHE_PREFIX = 'hdm_geo:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function cacheKey(lat, lon) {
  return `${CACHE_PREFIX}${lat.toFixed(3)}:${lon.toFixed(3)}`;
}

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.at > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed.name;
  } catch {
    return null;
  }
}

function writeCache(key, name) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ name, at: Date.now() }));
  } catch {}
}

export async function reverseGeocode(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const key = cacheKey(lat, lon);
  const cached = readCache(key);
  if (cached) return cached;

  try {
    const res = await publicApi.site.geocode({ lat, lon });
    const name = res?.name || null;
    if (name) writeCache(key, name);
    return name;
  } catch {
    return null;
  }
}

export function formatCoords(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return '';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(3)}°${latDir}, ${Math.abs(lon).toFixed(3)}°${lonDir}`;
}