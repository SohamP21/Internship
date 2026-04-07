import axios from 'axios';

const envApiUrl = import.meta.env.VITE_API_URL?.trim();

// Normalize VITE_API_URL so both of these work:
// - VITE_API_URL=https://your-backend.com
// - VITE_API_URL=https://your-backend.com/api
const normalizedEnvApiUrl = envApiUrl
  ? (envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl}/api`)
  : null;

// If VITE_API_URL is not set, fallback to Vite proxy path.
const baseURL = normalizedEnvApiUrl || '/api';

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