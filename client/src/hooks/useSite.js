import { useContext } from 'react';
import { SiteContext } from '../context/SiteProvider';

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}