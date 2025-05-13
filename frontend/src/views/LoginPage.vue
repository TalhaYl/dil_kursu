<template>
  <div class="login-container">
    <div class="login-card">
      <div class="header">
        <h1>Giriş Yap</h1>
        <div class="header-buttons">
          <button @click="goToHome" class="home-btn">Anasayfaya Dön</button>
          <button @click="goToRegister" class="register-btn">Kayıt Ol</button>
        </div>
      </div>
      <form @submit.prevent="handleLogin" class="login-form">
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

        <button type="submit" class="login-btn">Giriş Yap</button>
      </form>

      <div class="register-link">
        Hesabınız yok mu? <router-link to="/register">Kayıt Ol</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LoginPage',
  data() {
    return {
      formData: {
        email: '',
        password: ''
      }
    }
  },
  methods: {
    async handleLogin() {
  try {
    const response = await axios.post('http://localhost:3000/api/users/login', this.formData);

    if (response.data.token) {
      // Token'ı ve kullanıcıyı localStorage'a kaydediyoruz
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Kullanıcının rolüne göre yönlendirme
      const userRole = response.data.user.role;

      // Rolü kontrol ederek yönlendirme
      if (userRole === 'student') {
        this.$router.push('/student');
      } else if (userRole === 'teacher') {
        this.$router.push('/teacher');
      } else if (userRole === 'admin') {
        this.$router.push('/admin');
      } else if (userRole === 'superadmin') {
        this.$router.push('/superadmin');
      } else {
        // Eğer rol tanımlı değilse, anasayfaya yönlendir
        this.$router.push('/');
      }
    }
  } catch (error) {
    console.error('Giriş hatası:', error);
  } 
},
goToHome() {
      this.$router.push('/');
    },
    goToRegister() {
      this.$router.push('/register');
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  padding: 20px;
}

.login-card {
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

.header-buttons {
  display: flex;
  gap: 0.5rem;
}

.home-btn, .register-btn {
  padding: 0.5rem 1rem;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.home-btn {
  background-color: #2196F3;
}

.home-btn:hover {
  background-color: #1976D2;
}

.register-btn {
  background-color: #2196F3;
}

.register-btn:hover {
  background-color: #1976D2;
}

.login-form {
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

input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #2196F3;
}

.login-btn {
  padding: 0.75rem;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

.login-btn:hover {
  background-color: #1976D2;
}

.register-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.register-link a {
  color: #2196F3;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style> 