import { createApp } from 'vue';
import App from './App.vue';
import router from './router';  // 📌 Router'ı içe aktar
import axios from 'axios';
import logo from './assets/images/logo.png'
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
// Eğer ikonları da kullanıyorsanız bu import'u ekleyin
// import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// Axios base URL configuration
axios.defaults.baseURL = 'http://localhost:3000'; // Backend sunucunuzun adresi

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

// Element Plus'ı kullan
app.use(ElementPlus);

// Eğer ikonları da kullanıyorsanız bu döngüyü ekleyin
// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//   app.component(key, component)
// }

// Global değişkenleri ekle
app.config.globalProperties.$logo = logo;

app.use(router);  // 📌 Router'ı Vue uygulamasına ekle
app.mount('#app');
