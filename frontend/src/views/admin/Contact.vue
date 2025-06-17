<template>
  <div class="contact-management">
    <div class="page-header">
      <h2>İletişim Bilgileri Yönetimi</h2>
      <div class="header-actions">
        <button class="add-btn" @click="addContact">
          <i class="fas fa-plus"></i> Yeni İletişim Bilgisi Ekle
        </button>
        <button class="edit-btn" @click="editSelectedContact" :disabled="!hasSelectedContact">
          <i class="fas fa-edit"></i> Düzenle
        </button>
        <button class="delete-btn" @click="deleteSelectedContact" :disabled="!hasSelectedContact">
          <i class="fas fa-trash"></i> Sil
        </button>
      </div>
    </div>

    <div class="contact-list" v-if="contactInfo.length > 0">
      <div v-for="contact in contactInfo" :key="contact.id" class="contact-card">
        <div class="contact-header">
          <div class="contact-title">
            <input 
              type="checkbox" 
              :checked="selectedContacts.includes(contact.id)"
              @change="toggleContactSelection(contact.id)"
              class="contact-checkbox"
            >
            <h3>{{ contact.branch_id ? getBranchName(contact.branch_id) : 'Merkez' }}</h3>
          </div>
        </div>
        <div class="contact-content">
          <div class="info-row">
            <i class="fas fa-map-marker-alt"></i>
            <p>{{ contact.address }}</p>
          </div>
          <div class="info-row">
            <i class="fas fa-phone"></i>
            <p>{{ contact.phone }}</p>
          </div>
          <div class="info-row">
            <i class="fas fa-envelope"></i>
            <p>{{ contact.email }}</p>
          </div>
          <div class="info-row">
            <i class="fas fa-clock"></i>
            <p>{{ contact.working_hours }}</p>
          </div>
          <div v-if="contact.map_embed" class="map-container">
            <div v-html="contact.map_embed"></div>
          </div>
          <div v-if="contact.social_media" class="social-media">
            <a v-for="(url, platform) in JSON.parse(contact.social_media)" 
               :key="platform" 
               :href="url" 
               target="_blank"
               class="social-link">
              <i :class="getSocialIcon(platform)"></i>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-contacts">
      <p>Henüz iletişim bilgisi bulunmuyor.</p>
    </div>

    <!-- İletişim Bilgisi Düzenleme/Ekleme Modal -->
    <div class="modal" v-if="showModal">
      <div class="modal-content">
        <h3>{{ isEditing ? 'İletişim Bilgisi Düzenle' : 'Yeni İletişim Bilgisi Ekle' }}</h3>
        <form @submit.prevent="saveContact">
          <div class="form-group">
            <label for="branch">Şube</label>
            <select id="branch" v-model="formData.branch_id">
              <option value="">Merkez</option>
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="address">Adres</label>
            <textarea id="address" v-model="formData.address" rows="3" required></textarea>
          </div>
          <div class="form-group">
            <label for="phone">Telefon</label>
            <input type="tel" id="phone" v-model="formData.phone" required>
          </div>
          <div class="form-group">
            <label for="email">E-posta</label>
            <input type="email" id="email" v-model="formData.email" required>
          </div>
          <div class="form-group">
            <label for="working_hours">Çalışma Saatleri</label>
            <input type="text" id="working_hours" v-model="formData.working_hours">
          </div>
          <div class="form-group">
            <label for="map_embed">Harita Gömme Kodu</label>
            <textarea id="map_embed" v-model="formData.map_embed" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Sosyal Medya</label>
            <div class="social-media-inputs">
              <div class="social-input">
                <i class="fab fa-facebook"></i>
                <input type="url" v-model="formData.social_media.facebook" placeholder="Facebook URL">
              </div>
              <div class="social-input">
                <i class="fab fa-twitter"></i>
                <input type="url" v-model="formData.social_media.twitter" placeholder="Twitter URL">
              </div>
              <div class="social-input">
                <i class="fab fa-instagram"></i>
                <input type="url" v-model="formData.social_media.instagram" placeholder="Instagram URL">
              </div>
              <div class="social-input">
                <i class="fab fa-linkedin"></i>
                <input type="url" v-model="formData.social_media.linkedin" placeholder="LinkedIn URL">
              </div>
            </div>
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
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

export default {
  name: 'ContactView',
  setup() {
    const contactInfo = ref([])
    const branches = ref([])
    const showModal = ref(false)
    const isEditing = ref(false)
    const selectedContacts = ref([])
    const formData = ref({
      branch_id: '',
      address: '',
      phone: '',
      email: '',
      working_hours: '',
      map_embed: '',
      social_media: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: ''
      },
      status: 'active'
    })

    const hasSelectedContact = computed(() => selectedContacts.value.length === 1)

    const fetchContactInfo = async () => {
      try {
        const response = await axios.get('/api/contact-info')
        contactInfo.value = response.data
      } catch (error) {
        console.error('Error fetching contact info:', error)
      }
    }

    const fetchBranches = async () => {
      try {
        const response = await axios.get('/api/branches')
        branches.value = response.data
      } catch (error) {
        console.error('Error fetching branches:', error)
      }
    }

    const toggleContactSelection = (id) => {
      const index = selectedContacts.value.indexOf(id)
      if (index === -1) {
        selectedContacts.value.push(id)
      } else {
        selectedContacts.value.splice(index, 1)
      }
    }

    const getBranchName = (branchId) => {
      const branch = branches.value.find(b => b.id === branchId)
      return branch ? branch.name : 'Bilinmeyen Şube'
    }

    const getSocialIcon = (platform) => {
      const icons = {
        facebook: 'fab fa-facebook',
        twitter: 'fab fa-twitter',
        instagram: 'fab fa-instagram',
        linkedin: 'fab fa-linkedin'
      }
      return icons[platform] || 'fas fa-link'
    }

    const addContact = () => {
      isEditing.value = false
      formData.value = {
        branch_id: '',
        address: '',
        phone: '',
        email: '',
        working_hours: '',
        map_embed: '',
        social_media: {
          facebook: '',
          twitter: '',
          instagram: '',
          linkedin: ''
        },
        status: 'active'
      }
      showModal.value = true
    }

    const editContact = (contact) => {
      isEditing.value = true
      formData.value = {
        ...contact,
        social_media: JSON.parse(contact.social_media || '{}')
      }
      showModal.value = true
    }

    const deleteContact = async (contact) => {
      if (!confirm('Bu iletişim bilgisini silmek istediğinizden emin misiniz?')) return
      
      try {
        await axios.delete(`/api/contact-info/${contact.id}`)
        await fetchContactInfo()
        alert('İletişim bilgisi başarıyla silindi!')
      } catch (error) {
        console.error('Error deleting contact info:', error)
        alert('Silme işlemi sırasında bir hata oluştu!')
      }
    }

    const saveContact = async () => {
      try {
        const data = {
          ...formData.value,
          social_media: JSON.stringify(formData.value.social_media)
        }

        if (isEditing.value) {
          await axios.put(`/api/contact-info/${formData.value.id}`, data)
        } else {
          await axios.post('/api/contact-info', data)
        }
        await fetchContactInfo()
        showModal.value = false
        alert(isEditing.value ? 'İletişim bilgisi başarıyla güncellendi!' : 'Yeni iletişim bilgisi başarıyla eklendi!')
      } catch (error) {
        console.error('Error saving contact info:', error)
        alert('Kaydetme sırasında bir hata oluştu!')
      }
    }

    const closeModal = () => {
      showModal.value = false
    }

    const editSelectedContact = () => {
      if (selectedContacts.value.length !== 1) return
      const contact = contactInfo.value.find(c => c.id === selectedContacts.value[0])
      if (contact) {
        editContact(contact)
      }
    }

    const deleteSelectedContact = async () => {
      if (selectedContacts.value.length !== 1) return
      const contact = contactInfo.value.find(c => c.id === selectedContacts.value[0])
      if (contact) {
        await deleteContact(contact)
      }
    }

    onMounted(() => {
      fetchContactInfo()
      fetchBranches()
    })

    return {
      contactInfo,
      branches,
      showModal,
      isEditing,
      selectedContacts,
      hasSelectedContact,
      formData,
      toggleContactSelection,
      getBranchName,
      getSocialIcon,
      addContact,
      editContact,
      deleteContact,
      editSelectedContact,
      deleteSelectedContact,
      saveContact,
      closeModal
    }
  }
}
</script>

<style scoped>
.contact-management {
  padding: 20px;
  max-width: 1200px;
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

.add-btn {
  background-color: #4CAF50;
}

.add-btn:hover {
  background-color: #45a049;
}

.contact-list {
  display: grid;
  gap: 20px;
}

.contact-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.contact-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.contact-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.contact-header h3 {
  margin: 0;
  color: #2c3e50;
}

.contact-actions {
  display: flex;
  gap: 10px;
}

.contact-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: background-color 0.3s;
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

.contact-content {
  display: grid;
  gap: 15px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.info-row i {
  color: #666;
  width: 20px;
  text-align: center;
  margin-top: 3px;
}

.info-row p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.map-container {
  margin-top: 15px;
}

.map-container iframe {
  width: 100%;
  height: 300px;
  border: none;
  border-radius: 4px;
}

.social-media {
  display: flex;
  gap: 15px;
  margin-top: 15px;
}

.social-link {
  color: #666;
  font-size: 20px;
  transition: color 0.3s;
}

.social-link:hover {
  color: #2196F3;
}

.no-contacts {
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
.form-group select,
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

.social-media-inputs {
  display: grid;
  gap: 10px;
}

.social-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.social-input i {
  width: 20px;
  text-align: center;
  color: #666;
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

.header-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style> 