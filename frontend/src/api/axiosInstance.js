import axios from 'axios';

// In dev, Vite proxies /api → backend (see vite.config.js) so CORS is not an issue.
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

// Attach JWT token to every request automatically
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('eventify_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 — clear token and redirect, except on login/register (wrong password returns 401)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      const onAuthForm = path === '/login' || path === '/register';
      if (!onAuthForm) {
        localStorage.removeItem('eventify_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;