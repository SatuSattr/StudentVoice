import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

/**
 * BASE_URL Configuration:
 * - Emulator Android : http://10.0.2.2:8000
 * - Device Fisik     : http://192.168.x.x:8000 (ganti IP lokal komputer)
 * - iOS Simulator    : http://localhost:8000
 */
export const BASE_URL = 'http://172.16.0.105:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor — inject token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@sv_token');
    if (token) {
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle global errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear storage
      await AsyncStorage.removeItem('@sv_token');
      await AsyncStorage.removeItem('@sv_user');
    }
    return Promise.reject(error);
  }
);

export default api;
