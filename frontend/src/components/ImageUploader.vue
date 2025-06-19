<template>
  <div class="image-uploader">
    <div 
      class="upload-container" 
      @click="triggerFileInput" 
      @dragover.prevent 
      @drop.prevent="handleDrop"
      :class="{ 'has-image': previewUrl }"
    >
      <input
        type="file"
        ref="fileInput"
        @change="handleFileSelect"
        accept="image/*"
        style="display: none"
      />
      <template v-if="!previewUrl">
        <div class="upload-placeholder">
          <i class="fas fa-cloud-upload-alt"></i>
          <p>{{ placeholderText }}</p>
        </div>
      </template>
      <template v-else>
        <img v-if="previewUrl" :src="getPreviewUrl(previewUrl)" alt="Preview" class="preview-image" />
        <div class="image-actions">
          <button @click.stop="removeImage" class="remove-btn">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </template>
    </div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="uploading" class="upload-progress">
      <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { getImageUrl } from '@/utils/config';

export default {
  name: 'ImageUploader',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    placeholderText: {
      type: String,
      default: 'Resmi buraya sürükleyin veya tıklayın'
    },
    uploadUrl: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      selectedFile: null,
      previewUrl: this.modelValue,
      uploading: false,
      uploadProgress: 0,
      error: null
    };
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(newValue) {
        this.previewUrl = newValue;
      }
    }
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
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);

      this.uploadImage();
    },
    async uploadImage() {
      if (!this.selectedFile) return;

      this.uploading = true;
      this.error = null;
      this.uploadProgress = 0;

      const formData = new FormData();
      formData.append('image', this.selectedFile);

      try {
        if (this.uploadUrl.includes('undefined')) {
          throw new Error('Geçersiz yükleme URL\'si');
        }


        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        }

        const response = await axios.post(this.uploadUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            this.uploadProgress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
          }
        });

        console.log('=== IMAGE UPLOADER DEBUG ===');
        console.log('Upload response:', response.data);
        console.log('Upload URL:', this.uploadUrl);

        if (response.data && response.data.image_path) {
          console.log('Raw image_path from backend:', response.data.image_path);
          
          this.$emit('update:modelValue', response.data.image_path);
          this.$emit('upload-success', response.data.image_path);
          console.log('Emitted upload-success with:', response.data.image_path);
          this.showSuccess('Resim başarıyla yüklendi');
        } else {
          throw new Error('Resim yükleme başarısız: Geçersiz yanıt formatı');
        }
      } catch (error) {
        this.error = error.response?.data?.error || 'Resim yüklenirken bir hata oluştu';
        console.error('Error uploading image:', error);
        this.$emit('upload-error', error);
        this.showError(error.response?.data?.error || 'Resim yüklenirken bir hata oluştu');
      } finally {
        this.uploading = false;
        this.uploadProgress = 0;
      }
    },
    removeImage() {
      this.selectedFile = null;
      this.previewUrl = null;
      this.$emit('update:modelValue', '');
      this.$emit('image-removed');
    },
    showSuccess(message) {
      this.$message.success(message);
    },
    showError(message) {
      this.$message.error(message);
    },
    getPreviewUrl(imagePath) {
      if (!imagePath) return '';
      if (imagePath.startsWith('http')) return imagePath;
      return getImageUrl(imagePath);
    }
  }
};
</script>

<style scoped>
.image-uploader {
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
  position: relative;
  overflow: hidden;
}

.upload-container:hover {
  border-color: #666;
}

.upload-container.has-image {
  border-style: solid;
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

.image-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 10px;
}

.remove-btn {
  background-color: rgba(255, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background-color: rgba(255, 0, 0, 0.9);
}

.error-message {
  color: red;
  margin-bottom: 10px;
}

.upload-progress {
  height: 4px;
  background-color: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 10px;
}

.progress-bar {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease;
}
</style> 