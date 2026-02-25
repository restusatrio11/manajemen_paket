import axios from 'axios';

// Konfigurasi dasar Axios (menggunakan port 3000 dimana API Next.js berjalan)
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Otomatis tambahkan Bearer token jika ada di localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bps_paket_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Tangani error 401 (Token Expired/Invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('bps_paket_token');
        localStorage.removeItem('bps_paket_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
