import axios from 'axios';

// Token prefix marking a frontend-only demo session (see authService login bypass).
export const DEMO_TOKEN_PREFIX = 'demo-session-';

// Resolve the API base.
// - Development: keep it relative so requests go through the Vite dev-server
//   proxy (vite.config.ts -> /api). Same-origin, so it does not depend on the
//   backend CORS allow-list nor on which port Vite happens to start on.
// - Production: use VITE_API_BASE_URL when provided, otherwise same-origin.
const API_BASE_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || '');

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Frontend-only demo sessions (see authService login bypass) carry a
      // "demo-session-" token no backend accepts; never auto-logout those, so
      // the offline demo keeps working even when a backend is reachable.
      const isDemoSession = localStorage.getItem('access_token')?.startsWith(DEMO_TOKEN_PREFIX);
      if (!isDemoSession) {
        // Token expired or invalid
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
