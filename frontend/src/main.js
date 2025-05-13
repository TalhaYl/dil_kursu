import { createApp } from 'vue';
import App from './App.vue';
import router from './router';  // 📌 Router'ı içe aktar
import axios from 'axios';

// Axios base URL configuration
axios.defaults.baseURL = 'http://localhost:3000'; // Backend sunucunuzun adresi

// Request interceptor
axios.interceptors.request.use(
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

// Response interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Backend'den gelen hata mesajını göster
      console.error('API Error:', error.response.data);
      alert(error.response.data.message || 'Bir hata oluştu');
    } else if (error.request) {
      // İstek yapıldı ama cevap alınamadı
      console.error('Network Error:', error.request);
      alert('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    } else {
      // İstek oluşturulurken hata oluştu
      console.error('Error:', error.message);
      alert('Bir hata oluştu');
    }
    return Promise.reject(error);
  }
);

const app = createApp(App);
app.use(router);  // 📌 Router'ı Vue uygulamasına ekle
app.mount('#app');
