import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach JWT token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  let guestSessionId = localStorage.getItem('bb_guest_session_id');
  if (!guestSessionId) {
    guestSessionId = 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('bb_guest_session_id', guestSessionId);
  }
  config.headers['x-session-id'] = guestSessionId;

  return config;
}, (error) => Promise.reject(error));


// ── Response interceptor — handle 401 ──────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bb_token');
      // Don't hard redirect here — let Redux handle it
    }
    return Promise.reject(error);
  }
);

export default api;
