<template>
  <div class="admin-dashboard">
    <div class="sidebar">
      <div class="logo-container">
        <img src="/public/images/logo.png" alt="Logo" class="logo" />
        <h2>Admin Panel</h2>
      </div>
      
      <nav>
        <div class="nav-section">
          <span class="section-title">Yönetim</span>
          <router-link to="/admin/students">
            <i class="fas fa-user-graduate"></i> Öğrenciler
          </router-link>
          <router-link to="/admin/teachers">
            <i class="fas fa-chalkboard-teacher"></i> Öğretmenler
          </router-link>
          <router-link to="/admin/courses">
            <i class="fas fa-book"></i> Kurslar
          </router-link>
        </div>
        
        <div class="nav-section">
          <span class="section-title">Organizasyon</span>
          <router-link to="/admin/branches">
            <i class="fas fa-building"></i> Şubeler
          </router-link>
          <router-link to="/admin/classrooms">
            <i class="fas fa-door-open"></i> Sınıflar
          </router-link>
        </div>
        
        <div class="nav-section">
          <span class="section-title">İçerik</span>
          <router-link to="/admin/about">
            <i class="fas fa-info-circle"></i> Hakkımızda
          </router-link>
          <router-link to="/admin/contact">
            <i class="fas fa-envelope"></i> İletişim
          </router-link>
        </div>
      </nav>
      
      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">
          <i class="fas fa-sign-out-alt"></i> Çıkış Yap
        </button>
      </div>
    </div>
    
    <div class="main-content">
      <div class="header">
        <div class="header-left">
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <div class="user-info">
            <span>{{ userName }}</span>
            <img :src="userAvatar" alt="User" class="user-avatar" />
          </div>
        </div>
      </div>
      
      <div class="content-container">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'AdminDashboard',
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const userName = ref('Admin Kullanıcı')
    const userAvatar = ref('/images/logo.png')
    
    // Sayfa başlığını route'a göre dinamik olarak belirle
    const pageTitle = computed(() => {
      const pathMap = {
        '/admin/students': 'Öğrenciler',
        '/admin/teachers': 'Öğretmenler',
        '/admin/branches': 'Şubeler',
        '/admin/classrooms': 'Sınıflar',
        '/admin/courses': 'Kurslar',
        '/admin/about': 'Hakkımızda',
        '/admin/contact': 'İletişim'
      }
      
      return pathMap[route.path] || 'Dashboard'
    })
    
    const handleLogout = () => {
      // Burada çıkış işlemleri yapılabilir (API isteği, token silme vs.)
      localStorage.removeItem('auth_token')
      router.push('/login')
    }

    return {
      userName,
      userAvatar,
      pageTitle,
      handleLogout
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  min-height: 100vh;
  font-family: 'Roboto', sans-serif;
}

.sidebar {
  width: 280px;
  background-color: #1e293b;
  color: white;
  padding: 0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
}

.logo-container {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.logo {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

.sidebar h2 {
  margin: 0;
  font-weight: 500;
  font-size: 1.2rem;
}

.nav-section {
  margin: 15px 0;
}

.section-title {
  display: block;
  padding: 10px 20px;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #64748b;
}

.sidebar nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar nav a {
  color: #e2e8f0;
  text-decoration: none;
  padding: 12px 20px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
}

.sidebar nav a i {
  margin-right: 10px;
  width: 20px;
  text-align: center;
}

.sidebar nav a:hover {
  background-color: rgba(255,255,255,0.1);
}

.sidebar nav a.router-link-active {
  background-color: #0ea5e9;
  color: white;
  border-radius: 0;
  font-weight: 500;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #dc2626;
}

.logout-btn i {
  margin-right: 8px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
}

.header {
  height: 70px;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  color: #334155;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-info span {
  margin-right: 10px;
  color: #64748b;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.content-container {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

</style>