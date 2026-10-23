import { api } from './axios';

export const profileApi = {
  get: () => api.get('/app/profile'),
  update: ({ fullName, phone }) => api.patch('/app/profile', { fullName, phone }),
  changePassword: ({ currentPassword, newPassword }) =>
    api.post('/app/profile/change-password', { currentPassword, newPassword }),
};