import { createApp } from 'vue';
import App from './App.vue';
import router from './router';  // 📌 Router'ı içe aktar
import axios from 'axios';
import logo from './assets/images/logo.png'
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import toast from './utils/toast';
import './utils/alertInterceptor'; // Global alert interceptor'ı başlat
import { getApiUrl } from './utils/config'; // Import configuration utility
// Eğer ikonları da kullanıyorsanız bu import'u ekleyin
// import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// Axios base URL configuration
axios.defaults.baseURL = getApiUrl(); // Use configuration utility

// Axios interceptor ekle
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
    // Sadece gerçekten hata varsa toast göster
    if (error.response && error.response.status !== 401) {
      // Backend'den gelen hata mesajını kontrol et
      const errorMessage = error.response.data?.message || error.response.data?.error;
      
      // Boş mesaj kontrolü
      if (errorMessage && errorMessage.trim() !== '') {
        console.error('API Error:', error.response.data);
        toast.error(errorMessage);
      }
    } else if (error.request && !error.response) {
      // İstek yapıldı ama cevap alınamadı (sadece gerçek network hataları için)
      console.error('Network Error:', error.request);
      toast.error('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    } else if (error.message && error.message.trim() !== '') {
      // İstek oluşturulurken hata oluştu
      console.error('Error:', error.message);
      toast.error('Bir hata oluştu');
    }
    return Promise.reject(error);
  }
);

const app = createApp(App);

// Global hata yakalayıcı
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err, info);
  // Hata mesajını toast olarak gösterme - sonsuz döngü olabilir
}

// Global unhandled promise rejection yakalayıcı
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled Promise Rejection:', event.reason);
  event.preventDefault(); // Default browser error handling'i engelle
});

// Global JavaScript hata yakalayıcı
window.addEventListener('error', event => {
  console.error('Global JavaScript Error:', event.error);
});

// Element Plus'ı kullan
app.use(ElementPlus);

// Element Plus notification'larını devre dışı bırak
if (window.ElMessage) {
  const originalElMessage = window.ElMessage;
  window.ElMessage = {
    ...originalElMessage,
    error: (message) => {
      if (message && message.trim()) {
        toast.error(message);
      }
    },
    warning: (message) => {
      if (message && message.trim()) {
        toast.warning(message);
      }
    },
    success: (message) => {
      if (message && message.trim()) {
        toast.success(message);
      }
    },
    info: (message) => {
      if (message && message.trim()) {
        toast.info(message);
      }
    }
  };
}

// Eğer ikonları da kullanıyorsanız bu döngüyü ekleyin
// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//   app.component(key, component)
// }

// Global değişkenleri ekle
app.config.globalProperties.$logo = logo;

app.use(router);  // 📌 Router'ı Vue uygulamasına ekle
app.mount('#app');
