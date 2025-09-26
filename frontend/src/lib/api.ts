import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

export function api(token?: string) {
  const instance = axios.create({ baseURL: API_BASE })
  instance.interceptors.request.use((config) => {
    if (token) config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
    return config
  })
  return instance
}


