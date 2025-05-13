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
            <div v-for="branch in branches" :key="branch.id" class="branch-card">
              <h3>{{ branch.name }}</h3>
              <p>{{ branch.address }}</p>
              <p>{{ branch.transportation }}</p>
              <p>{{ branch.social_facilities }}</p>
              <div class="card-actions">
                <button @click="editBranch(branch)" class="edit-btn">Düzenle</button>
                <button @click="deleteBranch(branch.id)" class="delete-btn">Sil</button>
              </div>
            </div>
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
            <div v-for="classroom in classrooms" :key="classroom.id" class="classroom-card">
              <h3>{{ classroom.name }}</h3>
              <p>Kapasite: {{ classroom.capacity }}</p>
              <p>Şube: {{ getBranchName(classroom.branch_id) }}</p>
            </div>
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
            <div v-for="teacher in teachers" :key="teacher.id" class="teacher-card">
              <h3>{{ teacher.name }}</h3>
              <p>Diller: {{ teacher.languages }}</p>
              <p>Çalışma Günleri: {{ teacher.working_days }}</p>
              <p>Şube: {{ getBranchName(teacher.branch_id) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Yeni Şube Ekle Modal -->
    <div v-if="showAddBranchModal" class="modal-overlay">
      <div class="modal">
        <h3>Yeni Şube Ekle</h3>
        <input v-model="newBranch.name" placeholder="Şube Adı" required />
        <input v-model="newBranch.address" placeholder="Adres" required />
        <input v-model="newBranch.transportation" placeholder="Ulaşım Bilgisi" />
        <input v-model="newBranch.social_facilities" placeholder="Sosyal İmkanlar" />
        <div class="modal-actions">
          <button @click="submitBranch">Kaydet</button>
          <button @click="showAddBranchModal = false">İptal</button>
        </div>
      </div>
    </div>

    <!-- Yeni Sınıf Ekle Modal -->
    <div v-if="showAddClassModal" class="modal-overlay">
      <div class="modal">
        <h3>Yeni Sınıf Ekle</h3>
        <input v-model="newClassroom.name" placeholder="Sınıf Adı" required />
        <input v-model="newClassroom.capacity" type="number" placeholder="Kapasite" required />
        <select v-model="newClassroom.branch_id" required>
          <option value="">Şube Seçin</option>
          <option v-for="branch in branches" :key="branch.id" :value="branch.id">
            {{ branch.name }}
          </option>
        </select>
        <div class="modal-actions">
          <button @click="submitClassroom">Kaydet</button>
          <button @click="showAddClassModal = false">İptal</button>
        </div>
      </div>
    </div>

    <!-- Yeni Öğretmen Ekle Modal -->
    <div v-if="showAddTeacherModal" class="modal-overlay">
      <div class="modal">
        <h3>Yeni Öğretmen Ekle</h3>
        <input v-model="newTeacher.name" placeholder="Ad Soyad" required />
        <input v-model="newTeacher.email" type="email" placeholder="E-posta" required />
        <input v-model="newTeacher.password" type="password" placeholder="Şifre" required />
        <input v-model="newTeacher.languages" placeholder="Öğrettiği Diller (virgülle ayırın)" required />
        <input v-model="newTeacher.working_days" placeholder="Çalışma Günleri (virgülle ayırın)" required />
        <select v-model="newTeacher.branch_id" required>
          <option value="">Şube Seçin</option>
          <option v-for="branch in branches" :key="branch.id" :value="branch.id">
            {{ branch.name }}
          </option>
        </select>
        <div class="modal-actions">
          <button @click="submitTeacher">Kaydet</button>
          <button @click="showAddTeacherModal = false">İptal</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api';

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
      branches: [],
      classrooms: [],
      teachers: [],
      showAddBranchModal: false,
      showAddClassModal: false,
      showAddTeacherModal: false,
      newBranch: {
        name: '',
        address: '',
        transportation: '',
        social_facilities: ''
      },
      newClassroom: {
        name: '',
        capacity: '',
        branch_id: ''
      },
      newTeacher: {
        name: '',
        email: '',
        password: '',
        languages: '',
        working_days: '',
        branch_id: ''
      }
    }
  },

  async created() {
    await this.fetchBranches();
    await this.fetchClassrooms();
    await this.fetchTeachers();
  },

  methods: {
    handleLogout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.$router.push('/login');
    },

    async fetchBranches() {
      try {
        const response = await api.get('/api/branches');
        this.branches = response.data;
      } catch (error) {
        console.error('Şubeleri alma hatası:', error);
        this.$toast.error('Şubeler yüklenirken bir hata oluştu');
      }
    },

    async fetchClassrooms() {
      try {
        const response = await api.get('/api/classrooms');
        this.classrooms = response.data;
      } catch (error) {
        console.error('Sınıfları alma hatası:', error);
        this.$toast.error('Sınıflar yüklenirken bir hata oluştu');
      }
    },

    async fetchTeachers() {
      try {
        const response = await api.get('/api/teachers');
        this.teachers = response.data;
      } catch (error) {
        console.error('Öğretmenleri alma hatası:', error);
        this.$toast.error('Öğretmenler yüklenirken bir hata oluştu');
      }
    },

    getBranchName(branchId) {
      const branch = this.branches.find(b => b.id === branchId);
      return branch ? branch.name : 'Bilinmiyor';
    },

    async submitBranch() {
      try {
        const response = await api.post('/api/branches', this.newBranch);
        this.branches.push(response.data);
        this.showAddBranchModal = false;
        this.newBranch = {
          name: '',
          address: '',
          transportation: '',
          social_facilities: ''
        };
        this.$toast.success('Şube başarıyla eklendi');
      } catch (error) {
        console.error('Şube eklenemedi:', error);
        this.$toast.error('Şube eklenirken bir hata oluştu');
      }
    },

    async deleteBranch(branchId) {
      try {
        await api.delete(`/api/branches/${branchId}`);
        this.branches = this.branches.filter(b => b.id !== branchId);
        this.$toast.success('Şube başarıyla silindi');
      } catch (error) {
        console.error('Şube silinemedi:', error);
        this.$toast.error('Şube silinirken bir hata oluştu');
      }
    },

    async editBranch(branch) {
      try {
        const response = await api.put(`/api/branches/${branch.id}`, branch);
        const index = this.branches.findIndex(b => b.id === branch.id);
        this.branches[index] = response.data;
        this.$toast.success('Şube başarıyla güncellendi');
      } catch (error) {
        console.error('Şube güncellenemedi:', error);
        this.$toast.error('Şube güncellenirken bir hata oluştu');
      }
    },

    async submitClassroom() {
      try {
        const response = await api.post('/classrooms', this.newClassroom);
        this.classrooms.push(response.data);
        this.showAddClassModal = false;
        this.newClassroom = {
          name: '',
          capacity: '',
          branch_id: ''
        };
      } catch (error) {
        console.error('Sınıf eklenemedi:', error);
      }
    },

    async submitTeacher() {
      try {
        // Önce kullanıcı oluştur
        const userResponse = await api.post('/users/register', {
          name: this.newTeacher.name,
          email: this.newTeacher.email,
          password: this.newTeacher.password,
          role: 'teacher'
        });

        // Sonra öğretmen bilgilerini ekle
        const teacherResponse = await api.post('/teachers', {
          user_id: userResponse.data.user.id,
          languages: this.newTeacher.languages.split(',').map(lang => lang.trim()),
          working_days: this.newTeacher.working_days.split(',').map(day => day.trim()),
          branch_id: this.newTeacher.branch_id
        });

        this.teachers.push(teacherResponse.data);
        this.showAddTeacherModal = false;
        this.newTeacher = {
          name: '',
          email: '',
          password: '',
          languages: '',
          working_days: '',
          branch_id: ''
        };
      } catch (error) {
        console.error('Öğretmen eklenemedi:', error);
      }
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

/* Modal CSS */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
}

.modal h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.modal input,
.modal select {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.modal-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.modal-actions button:first-child {
  background-color: #4CAF50;
  color: white;
}

.modal-actions button:last-child {
  background-color: #f44336;
  color: white;
}

.branch-card,
.classroom-card,
.teacher-card {
  background: white;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.edit-btn,
.delete-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.edit-btn {
  background-color: #4CAF50;
  color: white;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}
</style>
