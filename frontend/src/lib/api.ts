import axios, { AxiosInstance } from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://studybuddy-server-b74e.onrender.com/api';

export function api(token?: string): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE,
  });

  if (token) {
    // ✅ Type-safe way to set Authorization header in Axios v1
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  return instance;
}
