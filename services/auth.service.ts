import api from './api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  profile_picture?: {
    uri: string;
    type: string;
    name: string;
  };
}

export const authService = {
  async login(payload: LoginPayload) {
    const res = await api.post('/api/login', payload);
    return res.data;
  },

  async register(payload: RegisterPayload) {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('email', payload.email);
    formData.append('password', payload.password);
    formData.append('password_confirmation', payload.password_confirmation);
    if (payload.profile_picture) {
      formData.append('profile_picture', payload.profile_picture as any);
    }

    const res = await api.post('/api/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async logout() {
    const res = await api.post('/api/logout');
    return res.data;
  },

  async forgotPassword(email: string) {
    const res = await api.post('/api/forgot-password', { email });
    return res.data;
  },
};
