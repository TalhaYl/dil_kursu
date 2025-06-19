<template>
  <div class="register-container">
    <div class="register-card">
      <div class="header">
        <h1>Öğrenci Kayıt</h1>
        <button @click="goToHome" class="home-btn">Anasayfaya Dön</button>
      </div>
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="name">Ad Soyad</label>
          <input 
            type="text" 
            id="name" 
            v-model="formData.name" 
            required
            placeholder="Ad Soyad giriniz"
          >
        </div>

        <div class="form-group">
          <label for="email">E-posta</label>
          <input 
            type="email" 
            id="email" 
            v-model="formData.email" 
            required
            placeholder="E-posta adresinizi giriniz"
          >
        </div>

        <div class="form-group">
          <label for="password">Şifre</label>
          <input 
            type="password" 
            id="password" 
            v-model="formData.password" 
            required
            minlength="6"
            placeholder="En az 6 karakter"
          >
        </div>

        <div class="form-group">
          <label for="phone">Telefon</label>
          <input 
            type="tel" 
            id="phone" 
            v-model="formData.phone" 
            required
            pattern="[0-9]{10}"
            placeholder="5XX XXX XX XX"
          >
        </div>

        <div v-if="message" :class="['message', message.type]">
          {{ message.text }}
        </div>

        <button type="submit" class="register-btn" :disabled="loading">
          {{ loading ? 'Kaydediliyor...' : 'Öğrenci Olarak Kayıt Ol' }}
        </button>
      </form>

      <div class="login-link">
        Zaten hesabınız var mı? <router-link to="/login">Giriş Yap</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import toast from '@/utils/toast';

export default {
  name: 'RegisterPage',
  data() {
    return {
      formData: {
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'student'
      },
      loading: false,
      message: null
    }
  },
  methods: {
    async handleRegister() {
      try {
        this.loading = true;
        
        console.log('Öğrenci kayıt verisi:', this.formData);
        
        const response = await axios.post('http://localhost:3000/api/users/register', this.formData);
        if (response.data.success) {
          toast.success('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
          setTimeout(() => {
            this.$router.push('/login');
          }, 2000);
        }
      } catch (error) {
        let errorMessage = 'Kayıt sırasında bir hata oluştu.';
        if (error.response) {
          errorMessage = error.response.data.error || errorMessage;
        }
        toast.error(errorMessage);
      } finally {
        this.loading = false;
      }
    },
    goToHome() {
      this.$router.push('/');
    }
  }
}
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

.register-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.register-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  padding: 40px;
  border-radius: 25px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  width: 100%;
  max-width: 450px;
  position: relative;
  overflow: hidden;
}

.register-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}

.header h1 {
  margin: 0;
  color: white;
  font-size: 2rem;
  font-weight: 700;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 12px;
}

.header h1::before {
  content: '\f501';
  font-family: 'Font Awesome 6 Free';
  font-weight: 900;
  color: #4CAF50;
}

.home-btn {
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.home-btn::before {
  content: '\f015';
  font-family: 'Font Awesome 6 Free';
  font-weight: 900;
}

.home-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

label {
  color: white;
  font-size: 1rem;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
}

label[for="name"]::before { content: '\f007'; font-family: 'Font Awesome 6 Free'; font-weight: 900; color: #4CAF50; }
label[for="email"]::before { content: '\f0e0'; font-family: 'Font Awesome 6 Free'; font-weight: 900; color: #2196F3; }
label[for="password"]::before { content: '\f023'; font-family: 'Font Awesome 6 Free'; font-weight: 900; color: #FF9800; }
label[for="phone"]::before { content: '\f095'; font-family: 'Font Awesome 6 Free'; font-weight: 900; color: #9C27B0; }

input {
  padding: 15px 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  color: white;
  transition: all 0.3s ease;
}

input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.register-btn {
  padding: 18px 0;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 700;
  margin-top: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.register-btn::before {
  content: '\f501';
  font-family: 'Font Awesome 6 Free';
  font-weight: 900;
}

.register-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.register-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #45a049 0%, #4CAF50 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.5);
}

.register-btn:hover:not(:disabled)::after {
  left: 100%;
}

.register-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.login-link {
  text-align: center;
  margin-top: 2rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.login-link a {
  color: white;
  text-decoration: none;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  transition: all 0.3s ease;
}

.login-link a:hover {
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

.message {
  padding: 1.2rem;
  border-radius: 15px;
  margin-top: 1rem;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: 600;
}

.success {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
  border-color: rgba(76, 175, 80, 0.3);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.1);
}

.error {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
  border-color: rgba(244, 67, 54, 0.3);
  box-shadow: 0 5px 15px rgba(244, 67, 54, 0.1);
}
</style> 