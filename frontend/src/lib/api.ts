import axios, { AxiosInstance, AxiosHeaders } from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://studybuddy-server-b74e.onrender.com/api';

export function api(token?: string): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE,
  });

  if (token) {
    // Use AxiosHeaders to ensure TS compatibility
    const headers = new AxiosHeaders();
    headers.set('Authorization', `Bearer ${token}`);
    instance.defaults.headers = headers;
  }

  return instance;
}
