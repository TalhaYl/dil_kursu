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
      <form @submit="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">
            <i class="fas fa-envelope"></i>
            E-posta
          </label>
          <input 
            type="email" 
            id="email" 
            v-model="formData.email" 
            required
            placeholder="E-posta adresinizi giriniz"
          >
        </div>

        <div class="form-group">
          <label for="password">
            <i class="fas fa-lock"></i>
            Şifre
          </label>
          <input 
            type="password" 
            id="password" 
            v-model="formData.password" 
            required
            placeholder="Şifrenizi giriniz"
          >
        </div>

        <!-- Hata mesajı gösterimi -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button type="submit" class="login-btn" :disabled="isLoading">
          <i v-if="!isLoading" class="fas fa-sign-in-alt"></i>
          <i v-else class="fas fa-spinner fa-spin"></i>
          {{ isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap' }}
        </button>
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
      },
      errorMessage: '',
      isLoading: false
    }
  },
  methods: {
    async handleLogin(e) {
      e.preventDefault();
      
      if (!this.formData.email || !this.formData.password) {
        this.errorMessage = 'Email ve şifre gereklidir';
        return;
      }

      this.isLoading = true;
      this.errorMessage = '';

      try {
        console.log('Sending login request...', { 
          email: this.formData.email,
          password: '***'
        });

        const response = await axios.post('/api/users/login', {
          email: this.formData.email,
          password: this.formData.password
        });

        console.log('Login response:', response.data);

        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));

          const userRole = response.data.user.role;
          console.log('User role:', userRole);

          // Rol bazlı yönlendirme
          const roleRoutes = {
            student: '/student',
            teacher: '/teacher',
            admin: '/admin',
            superadmin: '/superadmin'
          };

          const targetRoute = roleRoutes[userRole] || '/';
          console.log('Redirecting to:', targetRoute);
          
          await this.$router.push(targetRoute);
        }
      } catch (error) {
        console.error('Login error:', error);
        if (error.response) {
          // Backend'den gelen hata
          console.error('Error response:', error.response.data);
          this.errorMessage = error.response.data.error || 'Giriş yapılırken bir hata oluştu';
        } else if (error.request) {
          // İstek yapıldı ama cevap alınamadı
          console.error('No response received:', error.request);
          this.errorMessage = 'Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.';
        } else {
          // İstek oluşturulurken hata oluştu
          console.error('Request error:', error.message);
          this.errorMessage = 'Bir hata oluştu';
        }
      } finally {
        this.isLoading = false;
      }
    },
    goToHome(e) {
      e.preventDefault();
      this.$router.push('/');
    },
    goToRegister(e) {
      e.preventDefault();
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 3rem;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  width: 100%;
  max-width: 450px;
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  position: relative;
}

.header h1 {
  margin: 0;
  color: #2d3748;
  font-size: 2.2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-buttons {
  display: flex;
  gap: 0.75rem;
}

.home-btn, .register-btn {
  padding: 0.75rem 1.5rem;
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.home-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.home-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.register-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

label {
  color: #2d3748;
  font-size: 0.95rem;
  font-weight: 600;
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

label i {
  color: #667eea;
  width: 16px;
  text-align: center;
}

input {
  padding: 1rem 1.25rem;
  border: 2px solid rgba(102, 126, 234, 0.1);
  border-radius: 16px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
}

input::placeholder {
  color: #94a3b8;
}

.login-btn {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.login-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.login-btn:hover::before {
  left: 100%;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
}

.register-link {
  text-align: center;
  margin-top: 2rem;
  color: #64748b;
  font-size: 0.95rem;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.register-link a:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* Hata mesajı için yeni stil */
.error-message {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  backdrop-filter: blur(10px);
  font-weight: 500;
}

/* Loading durumu için stil */
.login-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.login-btn:disabled::before {
  display: none;
}
</style> 