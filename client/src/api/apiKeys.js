import { api } from './axios';

export const apiKeysApi = {
  list: () => api.get('/app/api-keys'),
  create: ({ name, scopes, expiresAt }) =>
    api.post('/app/api-keys', { name, scopes, expiresAt }),
  revoke: (id) => api.delete(`/app/api-keys/${id}`),
  rotate: (id) => api.post(`/app/api-keys/${id}/rotate`),
};