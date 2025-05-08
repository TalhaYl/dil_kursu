import { createApp } from 'vue';
import App from './App.vue';
import router from './router';  // 📌 Router'ı içe aktar

const app = createApp(App);
app.use(router);  // 📌 Router'ı Vue uygulamasına ekle
app.mount('#app');
