import axios, { AxiosInstance, AxiosRequestHeaders } from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://studybuddy-server-b74e.onrender.com/api';

export function api(token?: string): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE,
  });

  if (token) {
    // Type-safe way to set headers
    instance.defaults.headers = {
      ...instance.defaults.headers,
      Authorization: `Bearer ${token}`,
    } as AxiosRequestHeaders;
  }

  return instance;
}
