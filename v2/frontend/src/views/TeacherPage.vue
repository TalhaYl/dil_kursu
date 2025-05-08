<template>
  <div class="teacher-container">
    <header class="teacher-header">
      <h1>Öğretmen Paneli</h1>
      <button @click="handleLogout" class="logout-btn">Çıkış Yap</button>
    </header>
    
    <div class="teacher-content">
      <nav class="teacher-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['nav-btn', { active: currentTab === tab.id }]"
          @click="currentTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </nav>

      <div class="tab-content">
        <!-- Dersler Tab -->
        <div v-if="currentTab === 'courses'" class="courses-tab">
          <h2>Derslerim</h2>
          <div class="courses-list">
            <!-- Ders listesi buraya gelecek -->
          </div>
        </div>

        <!-- Öğrenciler Tab -->
        <div v-if="currentTab === 'students'" class="students-tab">
          <h2>Öğrencilerim</h2>
          <div class="students-list">
            <!-- Öğrenci listesi buraya gelecek -->
          </div>
        </div>

        <!-- Program Tab -->
        <div v-if="currentTab === 'schedule'" class="schedule-tab">
          <h2>Ders Programı</h2>
          <div class="schedule-calendar">
            <!-- Takvim buraya gelecek -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TeacherPage',
  data() {
    return {
      currentTab: 'courses',
      tabs: [
        { id: 'courses', name: 'Derslerim' },
        { id: 'students', name: 'Öğrencilerim' },
        { id: 'schedule', name: 'Ders Programı' }
      ]
    }
  },
  methods: {
    handleLogout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.$router.push('/login');
    }
  }
}
</script>

<style scoped>
.teacher-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.teacher-header {
  background-color: #fff;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.teacher-header h1 {
  margin: 0;
  color: #333;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.teacher-content {
  padding: 2rem;
  display: flex;
  gap: 2rem;
}

.teacher-nav {
  width: 200px;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.nav-btn {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  text-align: left;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
}

.nav-btn:hover {
  background-color: #f5f5f5;
}

.nav-btn.active {
  background-color: #2196F3;
  color: white;
}

.tab-content {
  flex: 1;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h2 {
  margin-top: 0;
  color: #333;
  margin-bottom: 1.5rem;
}
</style> 