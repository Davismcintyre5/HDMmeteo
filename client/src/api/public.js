import { api } from './axios';

export const publicApi = {
  auth: {
    register: (data) => api.post('/public/auth/register', data),
    login: (data) => api.post('/public/auth/login', data),
    refresh: (refreshToken) => api.post('/public/auth/refresh', { refreshToken }),
    logout: (refreshToken) => api.post('/public/auth/logout', { refreshToken }),
    verifyEmail: (token) => api.get(`/public/auth/verify-email/${token}`),
    forgotPassword: (email) => api.post('/public/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post(`/public/auth/reset-password/${token}`, { password }),
  },
  site: {
    brand: () => api.get('/public/site/brand'),
    plans: () => api.get('/public/site/plans'),
    paymentMethods: () => api.get('/public/site/payment-methods'),
    providers: () => api.get('/public/site/providers'),
    invoiceByNumber: (number) => api.get(`/public/site/invoices/${number}`),
    demoWeather: ({ lat, lon }) =>
      api.get('/public/site/demo-weather', { params: { lat, lon } }),
    geocode: ({ lat, lon }) =>
      api.get('/public/site/geocode', { params: { lat, lon } }),
  },
};