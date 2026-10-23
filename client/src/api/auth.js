import { publicApi } from './public';

export const authApi = {
  async login({ email, password }) {
    const data = await publicApi.auth.login({ email, password });
    return {
      user: data.user,
      tenant: data.tenant,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  async register(payload) {
    const data = await publicApi.auth.register(payload);
    return {
      tenant: data.tenant,
      user: data.user,
      invoice: data.invoice,
      paymentInstructions: data.paymentInstructions,
    };
  },

  async refresh(refreshToken) {
    const data = await publicApi.auth.refresh(refreshToken);
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  async logout(refreshToken) {
    try {
      await publicApi.auth.logout(refreshToken);
    } catch {}
    return { ok: true };
  },
};