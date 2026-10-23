import { api } from './axios';

export const billingApi = {
  currentInvoice: () => api.get('/app/billing/current-invoice'),
  invoices: (params) => api.get('/app/billing/invoices', { params }),
  invoiceByNumber: (number) => api.get(`/app/billing/invoices/${number}`),
  stkPush: (phone) => api.post('/app/billing/stk-push', { phone }),
  renew: () => api.post('/app/billing/renew'),
  upgrade: (planCode) => api.post('/app/billing/upgrade', { planCode }),
};