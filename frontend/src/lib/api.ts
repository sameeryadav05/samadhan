import axios, { AxiosInstance } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://studybuddy-server-b74e.onrender.com/api';

export function api(token?: string): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE,
    headers: {}, // initialize as empty object
  });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  });

  return instance;
}
