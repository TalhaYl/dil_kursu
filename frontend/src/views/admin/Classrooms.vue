<template>
  <div class="classrooms-page">
    <div class="page-header">
      <h2>Sınıflar</h2>
      <div class="header-buttons">
        <button class="add-btn" @click="showAddModal = true">
          <i class="fas fa-plus"></i> Yeni Sınıf
        </button>
        <button class="edit-btn" @click="editClassroom(selectedClassroom)" :disabled="!selectedClassroom">
          <i class="fas fa-edit"></i> Düzenle
        </button>
        <button class="delete-btn" @click="deleteClassroom(selectedClassroom?.id)" :disabled="!selectedClassroom">
          <i class="fas fa-trash"></i> Sil
        </button>
      </div>
    </div>

    <!-- Sınıf Listesi -->
    <div class="classrooms-list">
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">
              <input type="checkbox" 
                     :checked="selectedClassroom !== null"
                     @change="selectedClassroom = selectedClassroom ? null : classrooms[0]">
            </th>
            <th>ID</th>
            <th>Sınıf Adı</th>
            <th>Şube</th>
            <th>Kapasite</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="classroom in classrooms" :key="classroom.id" 
              :class="{ 'selected': selectedClassroom?.id === classroom.id }"
              @click="selectedClassroom = classroom">
            <td>
              <input type="checkbox" 
                     :checked="selectedClassroom?.id === classroom.id"
                     @click.stop="selectedClassroom = selectedClassroom?.id === classroom.id ? null : classroom">
            </td>
            <td>{{ classroom.id }}</td>
            <td>{{ classroom.name }}</td>
            <td>{{ classroom.branch_name }}</td>
            <td>{{ classroom.capacity }}</td>
            <td>
              <span :class="['status-badge', classroom.status]">
                {{ classroom.status === 'active' ? 'Aktif' : 
                   classroom.status === 'inactive' ? 'Pasif' : 'Bakımda' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Sınıf Ekleme/Düzenleme Modal -->
    <div class="modal" v-if="showAddModal">
      <div class="modal-content">
        <h3>{{ editingClassroom ? 'Sınıf Düzenle' : 'Yeni Sınıf' }}</h3>
        <form @submit.prevent="saveClassroom">
          <div class="form-group">
            <label>Sınıf Adı <span class="required">*</span></label>
            <input type="text" v-model="classroomForm.name" required>
          </div>
          
          <div class="form-group">
            <label>Şube <span class="required">*</span></label>
            <select v-model="classroomForm.branch_id" required>
              <option value="">Şube Seçin</option>
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Kapasite <span class="required">*</span></label>
            <input type="number" v-model="classroomForm.capacity" min="1" required>
          </div>
          
          <div class="form-group">
            <label>Durum</label>
            <select v-model="classroomForm.status">
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
              <option value="maintenance">Bakımda</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeModal">İptal</button>
            <button type="submit" class="save-btn">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'

export default {
  name: 'ClassroomsView',
  setup() {
    const classrooms = ref([])
    const branches = ref([])
    const showAddModal = ref(false)
    const editingClassroom = ref(null)
    const selectedClassroom = ref(null)
    const classroomForm = ref({
      name: '',
      branch_id: '',
      capacity: 20,
      status: 'active'
    })

    // Sınıfları getir
    const fetchClassrooms = async () => {
      try {
        const response = await axios.get('/api/classrooms')
        classrooms.value = response.data
      } catch (error) {
        console.error('Error fetching classrooms:', error)
        showError('Sınıflar yüklenirken bir hata oluştu')
      }
    }

    // Şubeleri getir
    const fetchBranches = async () => {
      try {
        const response = await axios.get('/api/branches')
        branches.value = response.data
      } catch (error) {
        console.error('Error fetching branches:', error)
        showError('Şubeler yüklenirken bir hata oluştu')
      }
    }

    // Sınıf düzenleme
    const editClassroom = (classroom) => {
      editingClassroom.value = classroom
      classroomForm.value = {
        name: classroom.name,
        branch_id: classroom.branch_id,
        capacity: classroom.capacity,
        status: classroom.status
      }
      showAddModal.value = true
    }

    // Sınıf kaydetme
    const saveClassroom = async () => {
      try {
        if (!classroomForm.value.name || !classroomForm.value.branch_id || !classroomForm.value.capacity) {
          showError('Lütfen tüm zorunlu alanları doldurun')
          return
        }

        if (editingClassroom.value) {
          await axios.put(`/api/classrooms/${editingClassroom.value.id}`, classroomForm.value)
          showSuccess('Sınıf başarıyla güncellendi')
        } else {
          await axios.post('/api/classrooms', classroomForm.value)
          showSuccess('Sınıf başarıyla eklendi')
        }
        closeModal()
        fetchClassrooms()
      } catch (error) {
        console.error('Error saving classroom:', error)
        const errorMessage = error.response?.data?.error || 'Sınıf kaydedilirken bir hata oluştu'
        showError(errorMessage)
      }
    }

    // Sınıf silme
    const deleteClassroom = async (id) => {
      if (confirm('Bu sınıfı silmek istediğinizden emin misiniz?')) {
        try {
          await axios.delete(`/api/classrooms/${id}`)
          showSuccess('Sınıf başarıyla silindi')
          fetchClassrooms()
        } catch (error) {
          console.error('Error deleting classroom:', error)
          const errorMessage = error.response?.data?.error || 'Sınıf silinirken bir hata oluştu'
          showError(errorMessage)
        }
      }
    }

    // Modal kapatma
    const closeModal = () => {
      showAddModal.value = false
      editingClassroom.value = null
      classroomForm.value = {
        name: '',
        branch_id: '',
        capacity: 20,
        status: 'active'
      }
    }

    // Bildirim fonksiyonları
    const showSuccess = (message) => {
      alert(message)
    }

    const showError = (message) => {
      alert(message)
    }

    onMounted(() => {
      fetchClassrooms()
      fetchBranches()
    })

    return {
      classrooms,
      branches,
      showAddModal,
      editingClassroom,
      selectedClassroom,
      classroomForm,
      editClassroom,
      saveClassroom,
      deleteClassroom,
      closeModal
    }
  }
}
</script>

<style scoped>
.classrooms-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.add-btn, .edit-btn, .delete-btn {
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.add-btn {
  background-color: #4CAF50;
  color: white;
}

.edit-btn {
  background-color: #2196F3;
  color: white;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.add-btn:hover {
  background-color: #45a049;
}

.edit-btn:hover {
  background-color: #1976D2;
}

.delete-btn:hover {
  background-color: #D32F2F;
}

.add-btn:disabled, .edit-btn:disabled, .delete-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.classrooms-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background-color: #4CAF50;
  color: white;
}

.status-badge.inactive {
  background-color: #9e9e9e;
  color: white;
}

.status-badge.maintenance {
  background-color: #ff9800;
  color: white;
}

select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

input[type="number"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn,
.save-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
}
</style> 