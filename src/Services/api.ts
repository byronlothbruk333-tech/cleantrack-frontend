import axios from 'axios';

// ============================================
// AXIOS INSTANCE
// ============================================
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// REQUEST INTERCEPTOR — attach auth token
// ✅ FIXED: Uses the correct localStorage keys
// ============================================
api.interceptors.request.use(
  (config) => {
    // ✅ Match the keys used in authService.ts
    const token = localStorage.getItem('cleantrack_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// RESPONSE INTERCEPTOR — handle 401
// ✅ FIXED: Clears the correct localStorage keys
// ============================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // ✅ Match the keys used in authService.ts
      localStorage.removeItem('cleantrack_access_token');
      localStorage.removeItem('cleantrack_refresh_token');
      localStorage.removeItem('cleantrack_user');

      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;