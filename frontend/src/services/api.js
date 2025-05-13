// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - her istekte token ekleme
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor - hata yakalama
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Hataları loglama
    console.log('API Error:');
    console.log(error);
    
    // 401 Unauthorized hatasında kullanıcıyı login sayfasına yönlendirme
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;