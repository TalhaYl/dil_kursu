<template>
  <div class="admin-dashboard">
    <div class="sidebar">
      <div class="sidebar-header">
        <img :src="$logo" alt="Bir Lisan Bir İnsan Logo" class="logo">
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
          <router-link to="/admin/announcements">
            <i class="fas fa-bullhorn"></i> Duyurular
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
            <i class="fas fa-user-circle user-avatar-icon"></i>
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
import toast from '@/utils/toast'

export default {
  name: 'AdminDashboard',
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const userName = ref('Admin Kullanıcı')
    
    // Sayfa başlığını route'a göre dinamik olarak belirle
    const pageTitle = computed(() => {
      const pathMap = {
        '/admin/students': 'Öğrenciler',
        '/admin/teachers': 'Öğretmenler',
        '/admin/branches': 'Şubeler',
        '/admin/classrooms': 'Sınıflar',
        '/admin/courses': 'Kurslar',
        '/admin/about': 'Hakkımızda',
        '/admin/contact': 'İletişim',
        '/admin/announcements': 'Duyurular'
      }
      
      return pathMap[route.path] || 'Dashboard'
    })
    
    const handleLogout = () => {
      localStorage.removeItem('auth_token')
      toast.info('Başarıyla çıkış yapıldı.', 'Çıkış')
      router.push('/login')
    }

    return {
      userName,
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

.sidebar-header {
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

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-icon {
  font-size: 40px;
  color: #64748b; /* Match the user name color */
}

.content-container {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

/* Mobil Responsive Tasarım */
@media (max-width: 768px) {
  .admin-dashboard {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    order: 2;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background-color: #1e293b;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  }

  .sidebar-header {
    display: none;
  }

  .sidebar nav {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: visible;
    padding: 5px 0;
  }

  .nav-section {
    display: flex;
    margin: 0;
  }

  .section-title {
    display: none;
  }

  .sidebar nav a {
    flex-direction: column;
    padding: 8px 12px;
    font-size: 12px;
    min-width: 70px;
    text-align: center;
    white-space: nowrap;
  }

  .sidebar nav a i {
    margin-right: 0;
    margin-bottom: 4px;
    font-size: 16px;
  }

  .sidebar-footer {
    display: none;
  }

  .main-content {
    order: 1;
    padding-bottom: 80px; /* Sidebar'ın yüksekliği kadar */
  }

  .header {
    padding: 0 15px;
    height: 60px;
  }

  .header h1 {
    font-size: 1.3rem;
  }

  .content-container {
    padding: 15px;
  }

  .user-avatar-icon {
    font-size: 32px;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 0 10px;
    height: 50px;
  }

  .header h1 {
    font-size: 1.2rem;
  }

  .content-container {
    padding: 10px;
  }

  .sidebar nav a {
    padding: 6px 8px;
    font-size: 10px;
    min-width: 60px;
  }

  .sidebar nav a i {
    font-size: 14px;
  }

  .user-avatar-icon {
    font-size: 28px;
  }
}

/* Ekstra küçük ekranlar için horizontal scroll */
@media (max-width: 576px) {
  .sidebar nav {
    justify-content: flex-start;
    gap: 5px;
    padding: 5px 10px;
  }

  .sidebar nav a {
    flex-shrink: 0;
    min-width: 55px;
  }
}

</style>