<template>
  <div class="register-container">
    <div class="register-card">
      <div class="header">
        <h1>Kayıt Ol</h1>
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
            placeholder="Şifrenizi giriniz"
          >
        </div>

        <div class="form-group">
          <label for="role">Rol</label>
          <select id="role" v-model="formData.role" required>
            <option value="">Rol seçiniz</option>
            <option value="student">Öğrenci</option>
            <option value="teacher">Öğretmen</option>
          </select>
        </div>

        <div v-if="formData.role === 'student'" class="form-group">
          <label for="phone">Telefon</label>
          <input 
            type="text" 
            id="phone" 
            v-model="formData.phone" 
            required
            placeholder="Telefon numaranızı giriniz"
          >
        </div>

        <div v-if="formData.role === 'teacher'" class="form-group">
          <label for="languages">Diller</label>
          <input 
            type="text" 
            id="languages" 
            v-model="formData.languages" 
            required
            placeholder="Ders verebileceğiniz dilleri giriniz (örn. İngilizce, Almanca)"
          >
        </div>

        <div v-if="message" :class="['message', message.type]">
          {{ message.text }}
        </div>

        <button type="submit" class="register-btn">Kayıt Ol</button>
      </form>

      <div class="login-link">
        Zaten hesabınız var mı? <router-link to="/login">Giriş Yap</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'RegisterPage',
  data() {
    return {
      formData: {
        name: '',
        email: '',
        password: '',
        role: '',
        phone: '',
        languages: ''
      },
      message: null
    }
  },
  methods: {
    async handleRegister() {
      try {
        const response = await axios.post('http://localhost:3000/api/users/register', this.formData);
        if (response.data.success) {
          this.message = {
            type: 'success',
            text: 'Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...'
          };
          setTimeout(() => {
            this.$router.push('/login');
          }, 2000);
        }
      } catch (error) {
        let errorMessage = 'Kayıt sırasında bir hata oluştu.';
        if (error.response) {
          errorMessage = error.response.data.error || errorMessage;
        }
        this.message = {
          type: 'error',
          text: errorMessage
        };
      }
    },
    goToHome() {
      this.$router.push('/');
    }
  }
}
</script>
<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  padding: 20px;
}

.register-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  color: #333;
  font-size: 1.8rem;
}

.home-btn {
  padding: 0.5rem 1rem;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.home-btn:hover {
  background-color: #1976D2;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  color: #666;
  font-size: 0.9rem;
}

input, select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus, select:focus {
  outline: none;
  border-color: #2196F3;
}

.register-btn {
  padding: 0.75rem;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

.register-btn:hover {
  background-color: #1976D2;
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.login-link a {
  color: #2196F3;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

.message {
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  text-align: center;
}

.success {
  background-color: #dff0d8;
  color: #3c763d;
  border: 1px solid #d6e9c6;
}

.error {
  background-color: #f2dede;
  color: #a94442;
  border: 1px solid #ebccd1;
}
</style> 