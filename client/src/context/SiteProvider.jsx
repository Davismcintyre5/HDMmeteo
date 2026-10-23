import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { publicApi } from '../api/public';

export const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [plans, setPlans] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [providers, setProviders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, methodsRes, providersRes] = await Promise.all([
        publicApi.site.plans(),
        publicApi.site.paymentMethods(),
        publicApi.site.providers(),
      ]);
      setPlans(plansRes.plans || []);
      setPaymentMethods(methodsRes.methods || []);
      setProviders(providersRes || null);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getPlan = useCallback(
    (code) => plans.find((p) => p.code === code) || null,
    [plans]
  );

  const value = useMemo(
    () => ({
      plans,
      paymentMethods,
      providers,
      loading,
      error,
      refresh: load,
      getPlan,
    }),
    [plans, paymentMethods, providers, loading, error, load, getPlan]
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}