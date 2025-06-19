<template>
  <div class="about-management">
    <div class="page-header">
      <h2>Hakkımızda Sayfası Yönetimi</h2>
      <div class="header-actions">
        <button class="add-btn" @click="addAbout">
          <i class="fas fa-plus"></i> Yeni Ekle
        </button>
        <button class="edit-btn" @click="editAbout" :disabled="!aboutData">
          <i class="fas fa-edit"></i> Düzenle
        </button>
        <button class="delete-btn" @click="deleteAbout" :disabled="!aboutData">
          <i class="fas fa-trash"></i> Sil
        </button>
      </div>
    </div>

    <div class="about-content" v-if="aboutData">
      <h3>{{ aboutData.title }}</h3>
      <div class="content-section">
        <h4>İçerik</h4>
        <p>{{ aboutData.content }}</p>
      </div>
    </div>

    <!-- Hakkımızda Düzenleme/Ekleme Modal -->
    <div class="modal" v-if="showModal">
      <div class="modal-content">
        <h3>{{ isEditing ? 'Hakkımızda Düzenle' : 'Yeni Hakkımızda Ekle' }}</h3>
        <form @submit.prevent="saveAbout">
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
              rows="10"
              required
            ></textarea>
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
import { ref, onMounted } from 'vue'
import axios from 'axios'
import toast from '@/utils/toast'

export default {
  name: 'AboutView',
  setup() {
    const aboutData = ref(null)
    const showModal = ref(false)
    const isEditing = ref(false)
    const formData = ref({
      title: '',
      content: ''
    })

    const fetchAboutData = async () => {
      try {
        const response = await axios.get('/api/about')
        aboutData.value = response.data
      } catch (error) {
        console.error('Error fetching about data:', error)
      }
    }

    const addAbout = () => {
      isEditing.value = false
      formData.value = {
        title: '',
        content: ''
      }
      showModal.value = true
    }

    const editAbout = () => {
      if (!aboutData.value) return
      isEditing.value = true
      formData.value = { ...aboutData.value }
      showModal.value = true
    }

    const deleteAbout = async () => {
      if (!aboutData.value) return
      const confirmed = await toast.confirm('Hakkımızda sayfasını silmek istediğinizden emin misiniz?', 'Sayfa Silme')
      if (!confirmed) return
      
      try {
        await axios.delete('/api/about')
        aboutData.value = null
        toast.success('Hakkımızda sayfası başarıyla silindi!')
      } catch (error) {
        console.error('Error deleting about page:', error)
        toast.error('Silme işlemi sırasında bir hata oluştu!')
      }
    }

    const saveAbout = async () => {
      try {
        if (isEditing.value) {
          await axios.put('/api/about', formData.value)
        } else {
          // Önce mevcut sayfayı kontrol et
          try {
            const response = await axios.get('/api/about')
            if (response.data) {
              // Sayfa varsa güncelle
              await axios.put('/api/about', formData.value)
            } else {
              // Sayfa yoksa yeni ekle
              await axios.post('/api/about', formData.value)
            }
          } catch (error) {
            // Sayfa bulunamazsa yeni ekle
            await axios.post('/api/about', formData.value)
          }
        }
        await fetchAboutData()
        showModal.value = false
        toast.success(isEditing.value ? 'Hakkımızda sayfası başarıyla güncellendi!' : 'Yeni hakkımızda sayfası başarıyla eklendi!')
      } catch (error) {
        console.error('Error saving about page:', error)
        toast.error('Kaydetme sırasında bir hata oluştu!')
      }
    }

    const closeModal = () => {
      showModal.value = false
    }

    onMounted(() => {
      fetchAboutData()
    })

    return {
      aboutData,
      showModal,
      isEditing,
      formData,
      addAbout,
      editAbout,
      deleteAbout,
      saveAbout,
      closeModal
    }
  }
}
</script>

<style scoped>
.about-management {
  padding: 20px;
  max-width: 800px;
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
  border-radius: 4px;
  cursor: pointer;
  border: none;
  color: white;
}

.header-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.add-btn {
  background-color: #4CAF50;
}

.edit-btn {
  background-color: #2196F3;
}

.delete-btn {
  background-color: #f44336;
}

.about-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.content-section {
  margin-bottom: 20px;
}

.content-section h4 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.content-section p {
  color: #666;
  line-height: 1.6;
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
.form-group textarea {
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
  .about-management {
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

  .about-content {
    padding: 15px;
  }

  .content-section {
    margin-bottom: 15px;
  }

  .content-section h4 {
    font-size: 1.1rem;
  }

  .content-section p {
    font-size: 14px;
    line-height: 1.5;
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
  .form-group textarea {
    padding: 12px;
    font-size: 16px; /* iOS zoom'u engellemek için */
    border-radius: 6px;
  }

  .form-group textarea {
    min-height: 120px;
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
  .about-management {
    padding: 5px;
  }

  .page-header h2 {
    font-size: 1.5rem;
  }

  .header-actions {
    grid-template-columns: 1fr;
  }

  .about-content {
    padding: 12px;
  }

  .content-section h4 {
    font-size: 1rem;
  }

  .content-section p {
    font-size: 13px;
  }

  .modal-content {
    padding: 10px;
  }

  .form-group textarea {
    min-height: 100px;
  }
}
</style> 