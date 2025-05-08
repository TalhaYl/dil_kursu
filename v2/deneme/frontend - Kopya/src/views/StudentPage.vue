<template>
  <div class="student-container">
    <header class="student-header">
      <h1>Öğrenci Paneli</h1>
      <button @click="handleLogout" class="logout-btn">Çıkış Yap</button>
    </header>
    
    <div class="student-content">
      <nav class="student-nav">
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
        <!-- Derslerim Tab -->
        <div v-if="currentTab === 'courses'" class="courses-tab">
          <h2>Derslerim</h2>
          <div class="courses-list">
            <!-- Ders listesi buraya gelecek -->
          </div>
        </div>

        <!-- Program Tab -->
        <div v-if="currentTab === 'schedule'" class="schedule-tab">
          <h2>Ders Programı</h2>
          <div class="schedule-calendar">
            <!-- Takvim buraya gelecek -->
          </div>
        </div>

        <!-- Ödevler Tab -->
        <div v-if="currentTab === 'homework'" class="homework-tab">
          <h2>Ödevlerim</h2>
          <div class="homework-list">
            <!-- Ödev listesi buraya gelecek -->
          </div>
        </div>

        <!-- Notlar Tab -->
        <div v-if="currentTab === 'grades'" class="grades-tab">
          <h2>Notlarım</h2>
          <div class="grades-list">
            <!-- Not listesi buraya gelecek -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StudentPage',
  data() {
    return {
      currentTab: 'courses',
      tabs: [
        { id: 'courses', name: 'Derslerim' },
        { id: 'schedule', name: 'Ders Programı' },
        { id: 'homework', name: 'Ödevlerim' },
        { id: 'grades', name: 'Notlarım' }
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
.student-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.student-header {
  background-color: #fff;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.student-header h1 {
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

.student-content {
  padding: 2rem;
  display: flex;
  gap: 2rem;
}

.student-nav {
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