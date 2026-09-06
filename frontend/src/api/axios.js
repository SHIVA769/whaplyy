import axios from 'axios';

const addLegacyIds = (value) => {
  if (Array.isArray(value)) return value.map(addLegacyIds);
  if (!value || typeof value !== 'object') return value;

  const normalized = Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, addLegacyIds(nestedValue)])
  );

  if (normalized.id && !normalized._id) normalized._id = normalized.id;
  return normalized;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('whatsstore_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract error messages
api.interceptors.response.use(
  (response) => {
    response.data = addLegacyIds(response.data);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute = window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/register');
      const isStoreRoute = window.location.pathname.startsWith('/store');

      localStorage.removeItem('whatsstore_token');

      if (!isAuthRoute && !isStoreRoute) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
