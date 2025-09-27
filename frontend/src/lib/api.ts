import axios, { AxiosRequestConfig, AxiosInstance, AxiosRequestHeaders } from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://studybuddy-server-b74e.onrender.com/api';

export function api(token?: string): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE,
    headers: {} as AxiosRequestHeaders, // ensure correct typing
  });

  instance.interceptors.request.use((config: AxiosRequestConfig) => {
    if (token) {
      config.headers = {
        ...(config.headers as AxiosRequestHeaders),
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  });

  return instance;
}
