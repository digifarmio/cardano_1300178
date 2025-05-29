import axios, { AxiosError } from 'axios';

import { tokenStorage } from './token-storage';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isAuthRoute = error.config?.url?.includes('/login');
    if (error.response?.status === 401 && !isAuthRoute) {
      tokenStorage.clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
