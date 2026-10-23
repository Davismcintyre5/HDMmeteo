import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { publicApi } from '../api/public';

export const BrandingContext = createContext(null);

const DEFAULT_BRAND = {
  name: 'HDM METEO',
  logoUrl: '',
  color: '#0F172A',
  accent: '#0EA5A4',
  supportEmail: 'support@hdm.co.ke',
  supportPhone: '',
  supportWhatsapp: '',
  website: 'https://meteo.hdm.co.ke',
  address: '',
};

function applyCss(brand) {
  const root = document.documentElement;
  root.style.setProperty('--brand-color', brand.color || DEFAULT_BRAND.color);
  root.style.setProperty('--brand-accent', brand.accent || DEFAULT_BRAND.accent);

  if (brand.name) document.title = brand.name;

  if (brand.logoUrl) {
    const link = document.querySelector('link[rel="icon"]');
    if (link) link.href = brand.logoUrl;
  }
}

export function BrandingProvider({ children }) {
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await publicApi.site.brand();
      const next = { ...DEFAULT_BRAND, ...(data.brand || data || {}) };
      setBrand(next);
      applyCss(next);
      setError(null);
    } catch (err) {
      setError(err);
      applyCss(DEFAULT_BRAND);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const initials = useMemo(() => {
    const name = (brand.name || DEFAULT_BRAND.name).trim();
    return name.slice(0, 2).toUpperCase();
  }, [brand.name]);

  const value = useMemo(
    () => ({
      brand,
      loading,
      error,
      refresh: load,
      initials,
      isReady: !loading && !error,
    }),
    [brand, loading, error, load, initials]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}