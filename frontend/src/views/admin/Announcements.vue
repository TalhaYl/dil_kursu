<template>
  <div class="announcements-management">
    <div class="page-header">
      <h2>Duyurular Yönetimi</h2>
      <div class="header-actions">
        <button class="add-btn" @click="addAnnouncement">
          <i class="fas fa-plus"></i> Yeni Duyuru Ekle
        </button>
        <button class="edit-btn" @click="editSelectedAnnouncements" :disabled="!hasSelectedAnnouncements">
          <i class="fas fa-edit"></i> Düzenle
        </button>
        <button class="delete-btn" @click="deleteSelectedAnnouncements" :disabled="!hasSelectedAnnouncements">
          <i class="fas fa-trash"></i> Sil
        </button>
      </div>
    </div>

    <div class="announcements-list" v-if="announcements.length > 0">
      <div v-for="announcement in announcements" :key="announcement.id" class="announcement-card">
        <div class="announcement-header">
          <div class="announcement-title">
            <input 
              type="checkbox" 
              :checked="selectedAnnouncements.includes(announcement.id)"
              @change="toggleAnnouncementSelection(announcement.id)"
              class="announcement-checkbox"
            >
            <h3>{{ announcement.title }}</h3>
          </div>
          <div class="announcement-footer">
            <span class="status" :class="announcement.status">
              {{ announcement.status === 'active' ? 'Aktif' : 'Pasif' }}
            </span>
            <span class="date">{{ formatDate(announcement.created_at) }}</span>
          </div>
        </div>
        <div class="announcement-content">
          <p>{{ announcement.content }}</p>
        </div>
      </div>
    </div>

    <div v-else class="no-announcements">
      <p>Henüz duyuru bulunmuyor.</p>
    </div>

    <!-- Duyuru Düzenleme/Ekleme Modal -->
    <div class="modal" v-if="showModal">
      <div class="modal-content">
        <h3>{{ isEditing ? 'Duyuru Düzenle' : 'Yeni Duyuru Ekle' }}</h3>
        <form @submit.prevent="saveAnnouncement">
          <div class="form-group">
            <label for="title">Başlık</label>
            <input
              type="text"
              id="title"
              v-model="formData.title"
              required
            >
          </div>
          <div class="form-group">
            <label for="content">İçerik</label>
            <textarea
              id="content"
              v-model="formData.content"
              rows="5"
              required
            ></textarea>
          </div>
          <div class="form-group">
            <label for="status">Durum</label>
            <select id="status" v-model="formData.status">
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeModal">İptal</button>
            <button type="submit" class="save-btn">{{ isEditing ? 'Güncelle' : 'Kaydet' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import toast from '@/utils/toast'

export default {
  name: 'AnnouncementsView',
  setup() {
    const announcements = ref([])
    const showModal = ref(false)
    const isEditing = ref(false)
    const selectedAnnouncements = ref([])
    const formData = ref({
      title: '',
      content: '',
      status: 'active'
    })

    const hasSelectedAnnouncements = computed(() => selectedAnnouncements.value.length > 0)

    const toggleAnnouncementSelection = (id) => {
      const index = selectedAnnouncements.value.indexOf(id)
      if (index === -1) {
        selectedAnnouncements.value.push(id)
      } else {
        selectedAnnouncements.value.splice(index, 1)
      }
    }

    const editSelectedAnnouncements = () => {
      if (selectedAnnouncements.value.length === 1) {
        const announcement = announcements.value.find(a => a.id === selectedAnnouncements.value[0])
        if (announcement) {
          editAnnouncement(announcement)
        }
      }
    }

    const deleteSelectedAnnouncements = async () => {
      const confirmed = await toast.confirm('Seçili duyuruları silmek istediğinizden emin misiniz?', 'Duyuru Silme')
      if (!confirmed) return
      
      try {
        for (const id of selectedAnnouncements.value) {
          await axios.delete(`/api/announcements/${id}`)
        }
        await fetchAnnouncements()
        selectedAnnouncements.value = []
        toast.success('Seçili duyurular başarıyla silindi!')
      } catch (error) {
        console.error('Error deleting announcements:', error)
        toast.error('Silme işlemi sırasında bir hata oluştu!')
      }
    }

    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get('/api/announcements')
        announcements.value = response.data
      } catch (error) {
        console.error('Error fetching announcements:', error)
      }
    }

    const addAnnouncement = () => {
      isEditing.value = false
      formData.value = {
        title: '',
        content: '',
        status: 'active'
      }
      showModal.value = true
    }

    const editAnnouncement = (announcement) => {
      isEditing.value = true
      formData.value = { ...announcement }
      showModal.value = true
    }

    const deleteAnnouncement = async (announcement) => {
      const confirmed = await toast.confirm('Bu duyuruyu silmek istediğinizden emin misiniz?', 'Duyuru Silme')
      if (!confirmed) return
      
      try {
        await axios.delete(`/api/announcements/${announcement.id}`)
        await fetchAnnouncements()
        toast.success('Duyuru başarıyla silindi!')
      } catch (error) {
        console.error('Error deleting announcement:', error)
        toast.error('Silme işlemi sırasında bir hata oluştu!')
      }
    }

    const saveAnnouncement = async () => {
      try {
        if (isEditing.value) {
          await axios.put(`/api/announcements/${formData.value.id}`, formData.value)
        } else {
          await axios.post('/api/announcements', formData.value)
        }
        await fetchAnnouncements()
        showModal.value = false
        toast.success(isEditing.value ? 'Duyuru başarıyla güncellendi!' : 'Yeni duyuru başarıyla eklendi!')
      } catch (error) {
        console.error('Error saving announcement:', error)
        toast.error('Kaydetme sırasında bir hata oluştu!')
      }
    }

    const closeModal = () => {
      showModal.value = false
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    onMounted(() => {
      fetchAnnouncements()
    })

    return {
      announcements,
      showModal,
      isEditing,
      formData,
      selectedAnnouncements,
      hasSelectedAnnouncements,
      toggleAnnouncementSelection,
      editSelectedAnnouncements,
      deleteSelectedAnnouncements,
      addAnnouncement,
      editAnnouncement,
      deleteAnnouncement,
      saveAnnouncement,
      closeModal,
      formatDate
    }
  }
}
</script>

<style scoped>
.announcements-management {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.header-actions button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
  font-size: 14px;
  transition: background-color 0.3s;
}

.header-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-btn {
  background-color: #4CAF50;
}

.add-btn:hover {
  background-color: #45a049;
}

.edit-btn {
  background-color: #2196F3;
}

.edit-btn:hover {
  background-color: #1976D2;
}

.delete-btn {
  background-color: #f44336;
}

.delete-btn:hover {
  background-color: #D32F2F;
}

.announcements-list {
  display: grid;
  gap: 20px;
}

.announcement-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.announcement-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.announcement-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.announcement-header h3 {
  margin: 0;
  color: #2c3e50;
}

.announcement-content {
  margin-bottom: 15px;
}

.announcement-content p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.announcement-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #666;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.status.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status.inactive {
  background-color: #ffebee;
  color: #c62828;
}

.no-announcements {
  text-align: center;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
  width: 600px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
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
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
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

/* Mobil Responsive Tasarım */
@media (max-width: 768px) {
  .announcements-management {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .header-actions {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
  }

  .header-actions button {
    padding: 12px 16px;
    font-size: 14px;
    min-height: 44px;
    justify-content: center;
  }

  .announcements-list {
    gap: 15px;
  }

  .announcement-card {
    padding: 15px;
  }

  .announcement-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .announcement-title {
    width: 100%;
  }

  .announcement-footer {
    width: 100%;
    justify-content: space-between;
  }

  /* Modal mobil optimizasyonu */
  .modal-content {
    width: 95% !important;
    max-width: 95% !important;
    margin: 10px;
    padding: 15px;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .form-group label {
    font-size: 14px;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    padding: 12px;
    font-size: 16px; /* iOS zoom'u engellemek için */
    border-radius: 6px;
  }

  .form-actions {
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
  }

  .form-actions button {
    width: 100%;
    padding: 12px;
    font-size: 16px;
    min-height: 44px;
  }
}

@media (max-width: 480px) {
  .announcements-management {
    padding: 5px;
  }

  .page-header h2 {
    font-size: 1.5rem;
  }

  .header-actions {
    grid-template-columns: 1fr;
  }

  .announcement-card {
    padding: 12px;
  }

  .announcement-header h3 {
    font-size: 1.1rem;
  }

  .modal-content {
    padding: 10px;
  }
}
</style> 