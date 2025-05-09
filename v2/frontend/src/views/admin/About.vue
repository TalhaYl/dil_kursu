<template>
  <div class="about-management">
    <h2>Hakkımızda Sayfası Yönetimi</h2>
    <form @submit.prevent="handleSubmit" class="about-form">
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
      <div class="form-group">
        <label for="mission">Misyon</label>
        <textarea
          id="mission"
          v-model="formData.mission"
          rows="5"
          required
        ></textarea>
      </div>
      <div class="form-group">
        <label for="vision">Vizyon</label>
        <textarea
          id="vision"
          v-model="formData.vision"
          rows="5"
          required
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
  name: 'AboutView',
  setup() {
    const formData = ref({
      title: '',
      content: '',
      mission: '',
      vision: ''
    })

    const fetchAboutData = async () => {
      try {
        const response = await axios.get('/api/about')
        formData.value = response.data
      } catch (error) {
        console.error('Error fetching about data:', error)
      }
    }

    const handleSubmit = async () => {
      try {
        await axios.put('/api/about', formData.value)
        alert('Hakkımızda sayfası başarıyla güncellendi!')
      } catch (error) {
        console.error('Error updating about page:', error)
        alert('Güncelleme sırasında bir hata oluştu!')
      }
    }

    onMounted(() => {
      fetchAboutData()
    })

    return {
      formData,
      handleSubmit
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

.about-form {
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