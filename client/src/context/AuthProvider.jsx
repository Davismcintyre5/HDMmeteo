import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authApi } from '../api/auth';
import { profileApi } from '../api/profile';
import { billingApi } from '../api/billing';
import { setAuthBridge } from '../api/axios';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '../utils/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [accessToken, setAccessToken] = useState(() => getAccessToken());
  const [status, setStatus] = useState('loading');
  const [invoice, setInvoice] = useState(null);
  const [lastError, setLastError] = useState(null);

  const accessTokenRef = useRef(accessToken);
  const refreshingRef = useRef(null);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const deriveStatus = useCallback((t) => {
    if (!t) return 'unauthenticated';
    if (t.status === 'pending') return 'pending';
    if (t.status === 'active') return 'authenticated';
    return 'unauthenticated';
  }, []);

  const applySession = useCallback(
    ({ user: u, tenant: t, accessToken: at, refreshToken: rt }) => {
      if (at) {
        setTokens({ accessToken: at, refreshToken: rt });
        setAccessToken(at);
      }
      if (u) setUser(u);
      if (t) setTenant(t);
      setStatus(deriveStatus(t));
    },
    [deriveStatus]
  );

  const clearSession = useCallback(() => {
    clearTokens();
    setAccessToken(null);
    setUser(null);
    setTenant(null);
    setInvoice(null);
    setStatus('unauthenticated');
  }, []);

  const refreshSession = useCallback(async () => {
    if (refreshingRef.current) return refreshingRef.current;

    const rt = getRefreshToken();
    if (!rt) return false;

    const promise = (async () => {
      try {
        const { accessToken: at, refreshToken: newRt } = await authApi.refresh(rt);
        setTokens({ accessToken: at, refreshToken: newRt });
        setAccessToken(at);
        return at;
      } catch (err) {
        const isAuthFailure =
          err?.status === 401 ||
          err?.code === 'REFRESH_INVALID' ||
          err?.code === 'TOKEN_EXPIRED' ||
          err?.code === 'INVALID_TOKEN';

        if (isAuthFailure) clearSession();
        return false;
      } finally {
        refreshingRef.current = null;
      }
    })();

    refreshingRef.current = promise;
    return promise;
  }, [clearSession]);

  const loadProfile = useCallback(async () => {
    const res = await profileApi.get();
    const u = res.user;
    const t = res.tenant || null;
    if (u) setUser(u);
    if (t) setTenant(t);
    setStatus(deriveStatus(t));
    return { user: u, tenant: t };
  }, [deriveStatus]);

  /* ── Lightweight tenant re-check — no token rotation, no logout risk ── */
  const refreshTenantStatus = useCallback(async () => {
    try {
      const res = await profileApi.get();
      if (res.user) setUser(res.user);
      if (res.tenant) {
        setTenant(res.tenant);
        setStatus(deriveStatus(res.tenant));
        return res.tenant;
      }
      return null;
    } catch {
      return null;
    }
  }, [deriveStatus]);

  useEffect(() => {
    (async () => {
      const storedToken = getAccessToken();
      const storedRefresh = getRefreshToken();

      if ((storedToken && !storedRefresh) || (!storedToken && storedRefresh)) {
        clearTokens();
        setStatus('unauthenticated');
        return;
      }

      if (!storedToken) {
        setStatus('unauthenticated');
        return;
      }

      try {
        await loadProfile();
      } catch (err) {
        const newToken = await refreshSession();
        if (newToken) {
          try {
            await loadProfile();
            return;
          } catch {}
        }

        const isAuthFailure =
          err?.status === 401 ||
          err?.code === 'TOKEN_EXPIRED' ||
          err?.code === 'INVALID_TOKEN';

        if (isAuthFailure && !newToken) clearSession();
        else setStatus('unauthenticated');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAuthBridge({
      tokenGetter: () => accessTokenRef.current,
      refresh: refreshSession,
      onLogout: clearSession,
    });
  }, [refreshSession, clearSession]);

  const login = useCallback(
    async ({ email, password }) => {
      setLastError(null);
      try {
        const data = await authApi.login({ email, password });
        applySession(data);
        return { ok: true, scope: deriveStatus(data.tenant) };
      } catch (err) {
        setLastError(err);
        throw err;
      }
    },
    [applySession, deriveStatus]
  );

  const register = useCallback(async (payload) => {
    setLastError(null);
    try {
      const data = await authApi.register(payload);
      return { ok: true, ...data };
    } catch (err) {
      setLastError(err);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    const rt = getRefreshToken();
    clearSession();
    if (rt) authApi.logout(rt).catch(() => {});
  }, [clearSession]);

  const fetchInvoice = useCallback(async () => {
    try {
      const res = await billingApi.currentInvoice();
      const inv = res.invoice || null;
      setInvoice(inv);
      return inv;
    } catch {
      return null;
    }
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const updateTenant = useCallback(
    (patch) => {
      setTenant((prev) => {
        const next = prev ? { ...prev, ...patch } : prev;
        if (next) setStatus(deriveStatus(next));
        return next;
      });
    },
    [deriveStatus]
  );

  const scope = useMemo(() => {
    if (!tenant) return 'none';
    if (tenant.status === 'pending') return 'pending';
    return 'app';
  }, [tenant]);

  const isAuthenticated = status === 'authenticated' || status === 'pending';

  const value = useMemo(
    () => ({
      user,
      tenant,
      accessToken,
      status,
      scope,
      invoice,
      isAuthenticated,
      lastError,
      login,
      register,
      logout,
      refresh: refreshSession,
      refreshTenantStatus,
      fetchInvoice,
      setInvoice,
      updateUser,
      updateTenant,
    }),
    [
      user,
      tenant,
      accessToken,
      status,
      scope,
      invoice,
      isAuthenticated,
      lastError,
      login,
      register,
      logout,
      refreshSession,
      refreshTenantStatus,
      fetchInvoice,
      updateUser,
      updateTenant,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}