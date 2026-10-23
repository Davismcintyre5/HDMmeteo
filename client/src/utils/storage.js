const ACCESS_TOKEN_KEY = 'hdm_meteo_access_token';
const REFRESH_TOKEN_KEY = 'hdm_meteo_refresh_token';
const THEME_KEY = 'hdm_meteo_theme';

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function getAccessToken() {
  return safeGet(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return safeGet(REFRESH_TOKEN_KEY);
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) safeSet(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) safeSet(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  safeRemove(ACCESS_TOKEN_KEY);
  safeRemove(REFRESH_TOKEN_KEY);
}

export function getTheme() {
  return safeGet(THEME_KEY) || 'system';
}

export function setTheme(theme) {
  safeSet(THEME_KEY, theme);
}