<template>
  <div class="contact-management">
    <h2>İletişim Bilgileri Yönetimi</h2>
    <form @submit.prevent="handleSubmit" class="contact-form">
      <div class="form-group">
        <label for="address">Adres</label>
        <textarea
          id="address"
          v-model="formData.address"
          rows="3"
          required
        ></textarea>
      </div>
      <div class="form-group">
        <label for="phone">Telefon</label>
        <input
          type="tel"
          id="phone"
          v-model="formData.phone"
          required
        >
      </div>
      <div class="form-group">
        <label for="email">E-posta</label>
        <input
          type="email"
          id="email"
          v-model="formData.email"
          required
        >
      </div>
      <div class="form-group">
        <label for="working_hours">Çalışma Saatleri</label>
        <textarea
          id="working_hours"
          v-model="formData.working_hours"
          rows="3"
          required
        ></textarea>
      </div>
      <div class="form-group">
        <label for="social_media">Sosyal Medya</label>
        <div class="social-media-inputs">
          <div class="social-input">
            <label for="facebook">Facebook</label>
            <input
              type="url"
              id="facebook"
              v-model="formData.social_media.facebook"
              placeholder="Facebook URL"
            >
          </div>
          <div class="social-input">
            <label for="instagram">Instagram</label>
            <input
              type="url"
              id="instagram"
              v-model="formData.social_media.instagram"
              placeholder="Instagram URL"
            >
          </div>
          <div class="social-input">
            <label for="twitter">Twitter</label>
            <input
              type="url"
              id="twitter"
              v-model="formData.social_media.twitter"
              placeholder="Twitter URL"
            >
          </div>
        </div>
      </div>
      <div class="form-group">
        <label for="map_embed">Harita Embed Kodu</label>
        <textarea
          id="map_embed"
          v-model="formData.map_embed"
          rows="3"
          placeholder="Google Maps embed kodu"
        ></textarea>
      </div>
      <div class="form-actions">
        <button type="submit" class="save-btn">Kaydet</button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'

export default {
  name: 'ContactView',
  setup() {
    const formData = ref({
      address: '',
      phone: '',
      email: '',
      working_hours: '',
      social_media: {
        facebook: '',
        instagram: '',
        twitter: ''
      },
      map_embed: ''
    })

    const fetchContactData = async () => {
      try {
        const response = await axios.get('/api/contact')
        formData.value = response.data
      } catch (error) {
        console.error('Error fetching contact data:', error)
      }
    }

    const handleSubmit = async () => {
      try {
        await axios.put('/api/contact', formData.value)
        alert('İletişim bilgileri başarıyla güncellendi!')
      } catch (error) {
        console.error('Error updating contact information:', error)
        alert('Güncelleme sırasında bir hata oluştu!')
      }
    }

    onMounted(() => {
      fetchContactData()
    })

    return {
      formData,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.contact-management {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.contact-form {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #2c3e50;
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

.social-media-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.social-input {
  display: flex;
  flex-direction: column;
}

.social-input label {
  font-size: 0.9rem;
  margin-bottom: 3px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.save-btn {
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.save-btn:hover {
  background-color: #27ae60;
}
</style> 