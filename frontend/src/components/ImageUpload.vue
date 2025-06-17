<template>
  <div class="image-upload">
    <div class="upload-container" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
      <input
        type="file"
        ref="fileInput"
        @change="handleFileSelect"
        accept="image/*"
        style="display: none"
      />
      <div v-if="!previewUrl" class="upload-placeholder">
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Resmi buraya sürükleyin veya tıklayın</p>
      </div>
      <img v-else :src="previewUrl" class="preview-image" />
    </div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <button 
      @click="uploadImage" 
      :disabled="!selectedFile || uploading"
      class="upload-button"
    >
      {{ uploading ? 'Yükleniyor...' : 'Resmi Yükle' }}
    </button>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ImageUpload',
  data() {
    return {
      selectedFile: null,
      previewUrl: null,
      uploading: false,
      error: null
    };
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    handleFileSelect(event) {
      const file = event.target.files[0];
      this.processFile(file);
    },
    handleDrop(event) {
      const file = event.dataTransfer.files[0];
      this.processFile(file);
    },
    processFile(file) {
      if (!file) return;
      
      if (!file.type.startsWith('image/')) {
        this.error = 'Lütfen sadece resim dosyası yükleyin';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.error = 'Resim boyutu 5MB\'dan küçük olmalıdır';
        return;
      }

      this.selectedFile = file;
      this.error = null;
      
      // Önizleme oluştur
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    async uploadImage() {
      if (!this.selectedFile) return;

      this.uploading = true;
      this.error = null;

      const formData = new FormData();
      formData.append('image', this.selectedFile);

      try {
        const response = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        this.$emit('upload-success', response.data);
        this.resetForm();
      } catch (error) {
        this.error = 'Resim yüklenirken bir hata oluştu';
        console.error('Upload error:', error);
      } finally {
        this.uploading = false;
      }
    },
    resetForm() {
      this.selectedFile = null;
      this.previewUrl = null;
      this.error = null;
    }
  }
};
</script>

<style scoped>
.image-upload {
  max-width: 500px;
  margin: 0 auto;
}

.upload-container {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  margin-bottom: 20px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-container:hover {
  border-color: #666;
}

.upload-placeholder {
  color: #666;
}

.upload-placeholder i {
  font-size: 48px;
  margin-bottom: 10px;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.error-message {
  color: red;
  margin-bottom: 10px;
}

.upload-button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
}

.upload-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style> 