<template>
  <div class="admin-dashboard">
    <div class="sidebar">
      <h2>Admin Panel</h2>
      <nav>
        <router-link to="/admin/students">Öğrenciler</router-link>
        <router-link to="/admin/teachers">Öğretmenler</router-link>
        <router-link to="/admin/branches">Şubeler</router-link>
        <router-link to="/admin/classrooms">Sınıflar</router-link>
        <router-link to="/admin/courses">Kurslar</router-link>
        <router-link to="/admin/about">Hakkımızda</router-link>
        <router-link to="/admin/contact">İletişim</router-link>
      </nav>
    </div>
    <div class="main-content">
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Toplam Öğrenci</h3>
          <p>{{ stats.totalStudents }}</p>
        </div>
        <div class="stat-card">
          <h3>Toplam Öğretmen</h3>
          <p>{{ stats.totalTeachers }}</p>
        </div>
        <div class="stat-card">
          <h3>Aktif Kurslar</h3>
          <p>{{ stats.activeCourses }}</p>
        </div>
        <div class="stat-card">
          <h3>Toplam Şube</h3>
          <p>{{ stats.totalBranches }}</p>
        </div>
      </div>
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'

export default {
  name: 'AdminDashboard',
  setup() {
    const stats = ref({
      totalStudents: 0,
      totalTeachers: 0,
      activeCourses: 0,
      totalBranches: 0
    })

    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/admin/stats')
        stats.value = response.data
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    onMounted(() => {
      fetchStats()
    })

    return {
      stats
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  background-color: #2c3e50;
  color: white;
  padding: 20px;
}

.sidebar h2 {
  margin-bottom: 30px;
  text-align: center;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar nav a {
  color: white;
  text-decoration: none;
  padding: 10px;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.sidebar nav a:hover {
  background-color: #34495e;
}

.main-content {
  flex: 1;
  padding: 20px;
  background-color: #f5f6fa;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-card h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1rem;
}

.stat-card p {
  margin: 10px 0 0;
  font-size: 2rem;
  font-weight: bold;
  color: #3498db;
}
</style> 