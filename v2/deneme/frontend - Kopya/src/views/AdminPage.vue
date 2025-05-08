<template>
  <div class="admin-container">
    <header class="admin-header">
      <h1>Admin Paneli</h1>
      <button @click="handleLogout" class="logout-btn">Çıkış Yap</button>
    </header>
    
    <div class="admin-content">
      <nav class="admin-nav">
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
        <!-- Şubeler Tab -->
        <div v-if="currentTab === 'branches'" class="branches-tab">
          <h2>Şubeler</h2>
          <div class="action-bar">
            <button @click="showAddBranchModal = true" class="add-btn">
              Yeni Şube Ekle
            </button>
          </div>
          <div class="branches-list">
            <!-- Şube listesi buraya gelecek -->
          </div>
        </div>

        <!-- Sınıflar Tab -->
        <div v-if="currentTab === 'classes'" class="classes-tab">
          <h2>Sınıflar</h2>
          <div class="action-bar">
            <button @click="showAddClassModal = true" class="add-btn">
              Yeni Sınıf Ekle
            </button>
          </div>
          <div class="classes-list">
            <!-- Sınıf listesi buraya gelecek -->
          </div>
        </div>

        <!-- Öğretmenler Tab -->
        <div v-if="currentTab === 'teachers'" class="teachers-tab">
          <h2>Öğretmenler</h2>
          <div class="action-bar">
            <button @click="showAddTeacherModal = true" class="add-btn">
              Yeni Öğretmen Ekle
            </button>
          </div>
          <div class="teachers-list">
            <!-- Öğretmen listesi buraya gelecek -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminPage',
  data() {
    return {
      currentTab: 'branches',
      tabs: [
        { id: 'branches', name: 'Şubeler' },
        { id: 'classes', name: 'Sınıflar' },
        { id: 'teachers', name: 'Öğretmenler' }
      ],
      showAddBranchModal: false,
      showAddClassModal: false,
      showAddTeacherModal: false
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
.admin-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.admin-header {
  background-color: #fff;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.admin-header h1 {
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

.admin-content {
  padding: 2rem;
  display: flex;
  gap: 2rem;
}

.admin-nav {
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
  background-color: #4CAF50;
  color: white;
}

.tab-content {
  flex: 1;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.action-bar {
  margin-bottom: 1rem;
}

.add-btn {
  padding: 0.75rem 1.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-btn:hover {
  background-color: #45a049;
}
</style> 