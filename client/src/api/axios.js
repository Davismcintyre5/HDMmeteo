import axios from 'axios';
import { normalizeError, isAuthError } from './errors';

export const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

let tokenGetter = () => null;
let refreshHandler = async () => false;
let logoutHandler = () => {};

export function setAuthBridge({ tokenGetter: tg, refresh, onLogout }) {
  if (tg) tokenGetter = tg;
  if (refresh) refreshHandler = refresh;
  if (onLogout) logoutHandler = onLogout;
}

function generateRequestId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

api.interceptors.request.use((config) => {
  const token = tokenGetter();

  if (!config.headers['X-Request-Id']) {
    config.headers['X-Request-Id'] = generateRequestId();
  }

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let isRefreshing = false;
let pendingQueue = [];

function flushQueue(error, token) {
  for (const item of pendingQueue) {
    if (error) item.reject(error);
    else item.resolve(token);
  }
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && 'success' in body) {
      if (body.success === false) {
        throw normalizeError({ response: { ...response, data: body } });
      }
      return body.data !== undefined ? body.data : body;
    }
    return body;
  },
  async (error) => {
    const original = error.config;
    const normalized = normalizeError(error);

    const isRefreshCall = original?.url?.includes('/public/auth/refresh');
    const alreadyRetried = original?.__retried;

    if (
      error.response?.status === 401 &&
      !alreadyRetried &&
      !isRefreshCall &&
      isAuthError(normalized)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              original.__retried = true;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      isRefreshing = true;
      try {
        const newToken = await refreshHandler();
        if (!newToken) throw normalized;

        flushQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        original.__retried = true;
        return api(original);
      } catch (refreshErr) {
        flushQueue(refreshErr, null);
        logoutHandler();
        return Promise.reject(normalized);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalized);
  }
);