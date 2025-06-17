<template>
  <div class="branches-page">
    <div class="page-header">
      <h2>Şubeler</h2>
      <div class="header-buttons">
        <button class="add-btn" @click="showModal">
          <i class="fas fa-plus"></i> Yeni Şube
        </button>
        <button class="edit-btn" @click="editBranch(selectedBranch)" :disabled="!selectedBranch">
          <i class="fas fa-edit"></i> Düzenle
        </button>
        <button class="delete-btn" @click="deleteBranch(selectedBranch?.id)" :disabled="!selectedBranch">
          <i class="fas fa-trash"></i> Sil
        </button>
      </div>
    </div>

    <!-- Şube Listesi -->
    <div class="branches-list">
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">
              <input type="checkbox" 
                     :checked="selectedBranch !== null"
                     @change="selectedBranch = selectedBranch ? null : branches[0]">
            </th>
            <th>ID</th>
            <th>Şube Adı</th>
            <th>Adres</th>
            <th>Telefon</th>
            <th>E-posta</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="branch in branches" :key="branch.id" 
              :class="{ 'selected': selectedBranch?.id === branch.id }"
              @click="selectedBranch = branch">
            <td>
              <input type="checkbox" 
                     :checked="selectedBranch?.id === branch.id"
                     @click.stop="selectedBranch = selectedBranch?.id === branch.id ? null : branch">
            </td>
            <td>{{ branch.id }}</td>
            <td>{{ branch.name }}</td>
            <td>{{ branch.address }}</td>
            <td>{{ branch.phone }}</td>
            <td>{{ branch.email }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Şube Ekleme/Düzenleme Modal -->
    <div class="modal" v-if="showAddModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingBranch ? 'Şube Düzenle' : 'Yeni Şube' }}</h3>
          <button class="close-btn" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form @submit.prevent="saveBranch" class="branch-form">
          <div class="form-row">
            <div class="form-group">
              <label>Şube Adı <span class="required">*</span></label>
              <input type="text" v-model="branchForm.name" required placeholder="Örn: Kadıköy Şubesi">
            </div>
            
            <div class="form-group">
              <label>Telefon</label>
              <input type="tel" v-model="branchForm.phone" pattern="[0-9]{10}" placeholder="5XX XXX XX XX">
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" v-model="branchForm.email" required>
          </div>
          
          <div class="form-group">
            <label>Adres <span class="required">*</span></label>
            <div class="address-input">
              <textarea 
                v-model="branchForm.address" 
                required 
                @input="searchAddress"
                placeholder="Adresi yazın veya haritadan seçin..."
              ></textarea>
              <button type="button" class="search-btn" @click="searchAddress">
                <i class="fas fa-search"></i>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="transportation">Ulaşım Bilgileri:</label>
            <textarea id="transportation" v-model="branchForm.transportation" rows="3" placeholder="Şubeye ulaşım seçeneklerini giriniz..."></textarea>
          </div>

          <div class="form-group">
            <label for="social_facilities">Sosyal İmkanlar:</label>
            <textarea id="social_facilities" v-model="branchForm.social_facilities" rows="3" placeholder="Şubedeki sosyal imkanları giriniz..."></textarea>
          </div>
          
          <div class="form-group map-container">
            <label>Konum Seçimi</label>
            <div id="map"></div>
            <small class="help-text">
              <i class="fas fa-info-circle"></i>
              Haritadan konumu seçin veya adresi yazın. Marker'ı sürükleyerek hassas konum ayarı yapabilirsiniz.
            </small>
          </div>
          
          <div class="form-group coordinates-display" v-if="branchForm.latitude && branchForm.longitude">
            <label>Seçilen Konum</label>
            <div class="coordinates">
              <div class="coordinate-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>Enlem: {{ branchForm.latitude }}</span>
              </div>
              <div class="coordinate-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>Boylam: {{ branchForm.longitude }}</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="image">Resim:</label>
            <ImageUploader
              :key="`image-uploader-${editingBranch?.id || 'new'}-${Date.now()}`"
              v-model="branchForm.image_path"
              :upload-url="editingBranch ? `/api/branches/${editingBranch.id}/image` : '/api/branches/image'"
              placeholder-text="Şube resmini buraya sürükleyin veya tıklayın"
              @upload-success="handleImageUploadSuccess"
              @image-removed="() => branchForm.image_path = ''"
              :current-image-path="branchForm.image_path"
            />
            <button 
              v-if="branchForm.image_path" 
              type="button" 
              class="cancel-btn" 
              @click="branchForm.image_path = ''" 
              style="margin-top: 10px;"
            >
              <i class="fas fa-trash"></i> Resmi Kaldır
            </button>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeModal">
              <i class="fas fa-times"></i> İptal
            </button>
            <button type="submit" class="save-btn">
              <i class="fas fa-save"></i> {{ editingBranch ? 'Güncelle' : 'Kaydet' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, nextTick } from 'vue'
import axios from 'axios'
import locationData from '@/assets/locations.json'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import ImageUploader from '@/components/ImageUploader.vue'

// Leaflet marker icon düzeltmesi
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

export default {
  name: 'BranchesView',
  components: {
    ImageUploader
  },
  setup() {
    const branches = ref([])
    const showAddModal = ref(false)
    const editingBranch = ref(null)
    const selectedBranch = ref(null)
    const map = ref(null)
    const marker = ref(null)
    const branchForm = ref({
      id: '',
      name: '',
      address: '',
      phone: '',
      email: '',
      latitude: '',
      longitude: '',
      image_path: '',
      transportation: '',
      social_facilities: ''
    })

    // Dinamik şehir ve ilçe listeleri
    const countryList = Object.keys(locationData)
    const cityList = computed(() => branchForm.value.country ? Object.keys(locationData[branchForm.value.country]) : [])
    const districtList = computed(() => (branchForm.value.country && branchForm.value.city) ? locationData[branchForm.value.country][branchForm.value.city] : [])

    // Haritayı başlat
    const initMap = () => {
      const mapElement = document.getElementById('map')
      if (!mapElement) return

      // Haritayı oluştur
      map.value = L.map(mapElement, {
        center: [41.0082, 28.9784],
        zoom: 12,
        zoomControl: true
      })

      // OpenStreetMap tile layer ekle
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map.value)

      // Haritaya tıklandığında
      map.value.on('click', (e) => {
        const { lat, lng } = e.latlng
        updateMarker(lat, lng)
        updateCoordinates(lat, lng)
        reverseGeocode(lat, lng)
      })
    }

    // Marker'ı güncelle
    const updateMarker = (lat, lng) => {
      if (!map.value) return;
      if (marker.value) {
        marker.value.setLatLng([lat, lng]);
      } else {
        marker.value = L.marker([lat, lng], { draggable: true }).addTo(map.value);
      }
    }

    // Koordinatları güncelle
    const updateCoordinates = (lat, lng) => {
      branchForm.value.latitude = lat.toFixed(6)
      branchForm.value.longitude = lng.toFixed(6)
    }

    // Adres arama
    const searchAddress = async () => {
      if (!branchForm.value.address) return

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(branchForm.value.address)}&countrycodes=tr`
        )
        const data = await response.json()

        if (data && data.length > 0) {
          const { lat, lon } = data[0]
          const latNum = parseFloat(lat)
          const lngNum = parseFloat(lon)
          
          map.value.setView([latNum, lngNum], 15)
          updateMarker(latNum, lngNum)
          updateCoordinates(latNum, lngNum)
        }
      } catch (error) {
        console.error('Error searching address:', error)
      }
    }

    // Koordinattan adres bulma
    const reverseGeocode = async (lat, lng) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        )
        const data = await response.json()

        if (data && data.display_name) {
          branchForm.value.address = data.display_name
        }
      } catch (error) {
        console.error('Error reverse geocoding:', error)
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

    // Şube düzenleme
    const editBranch = async (branch) => {
      editingBranch.value = branch
      branchForm.value = {
        id: branch.id || '',
        name: branch.name,
        address: branch.address,
        phone: branch.phone || '',
        email: branch.email || '',
        latitude: branch.latitude || '',
        longitude: branch.longitude || '',
        image_path: branch.image_path || '',
        transportation: branch.transportation || '',
        social_facilities: branch.social_facilities || ''
      }
      showModal()
      await nextTick();
      if (map.value) {
        updateMarker(branch.latitude, branch.longitude);
      }
    }

    // Şube kaydetme - DÜZELTİLMİŞ VERSİYON
    const saveBranch = async () => {
      try {
        const payload = {
          name: branchForm.value.name,
          address: branchForm.value.address,
          phone: branchForm.value.phone,
          email: branchForm.value.email,
          latitude: parseFloat(branchForm.value.latitude) || null,
          longitude: parseFloat(branchForm.value.longitude) || null,
          image_path: branchForm.value.image_path || null,
          transportation: branchForm.value.transportation || '',
          social_facilities: branchForm.value.social_facilities || ''
        }

        let response;
        if (editingBranch.value && editingBranch.value.id) {
          // Düzenleme modu - sadece o şubeyi güncelle
          response = await axios.put(`/api/branches/${editingBranch.value.id}`, payload)
          showSuccess('Şube başarıyla güncellendi')
          
          // Sadece güncellenen şubeyi branches dizisinde güncelle
          const index = branches.value.findIndex(b => b.id === editingBranch.value.id)
          if (index !== -1) {
            branches.value[index] = { ...branches.value[index], ...payload, id: editingBranch.value.id }
          }
          
          // Seçili şube güncellenen şube ise onu da güncelle
          if (selectedBranch.value && selectedBranch.value.id === editingBranch.value.id) {
            selectedBranch.value = { ...selectedBranch.value, ...payload }
          }
        } else {
          // Yeni şube ekleme
          response = await axios.post('/api/branches', payload)
          showSuccess('Şube başarıyla eklendi')
          
          // Yeni şubeyi listeye ekle
          if (response.data) {
            branches.value.push(response.data)
          } else {
            // Eğer response.data yoksa tüm listeyi yenile
            await fetchBranches()
          }
        }
        
        closeModal()
      } catch (error) {
        console.error('Error saving branch:', error)
        const errorMessage = error.response?.data?.error || 'Şube kaydedilirken bir hata oluştu'
        showError(errorMessage)
      }
    }

    // Şube silme
    const deleteBranch = async (id) => {
      if (confirm('Bu şubeyi silmek istediğinizden emin misiniz?')) {
        try {
          await axios.delete(`/api/branches/${id}`)
          showSuccess('Şube başarıyla silindi')
          fetchBranches()
        } catch (error) {
          console.error('Error deleting branch:', error)
          const errorMessage = error.response?.data?.error || 'Şube silinirken bir hata oluştu'
          showError(errorMessage)
        }
      }
    }

    // Modal kapatma - DÜZELTİLMİŞ VERSİYON
    const closeModal = () => {
      showAddModal.value = false
      editingBranch.value = null
      
      // Form verilerini tamamen temizle
      branchForm.value = {
        id: '',
        name: '',
        address: '',
        phone: '',
        email: '',
        latitude: '',
        longitude: '',
        image_path: '',
        transportation: '',
        social_facilities: ''
      }
      
      // Harita marker'ını temizle
      if (marker.value && map.value) {
        map.value.removeLayer(marker.value)
        marker.value = null
      }
    }

    // Bildirim fonksiyonları
    const showSuccess = (message) => {
      alert(message)
    }

    const showError = (message) => {
      alert(message)
    }

    // Modal açıldığında haritayı başlat
    const showModal = async () => {
      showAddModal.value = true
      await nextTick()
      if (!map.value) {
        initMap()
      } else {
        map.value.invalidateSize()
      }
    }

    // Fotoğraf yükleme başarı handler'ı - DÜZELTİLMİŞ VERSİYON
    const handleImageUploadSuccess = (response) => {
      console.log('Upload response:', response)
      
      // Response bir obje ise (backend'den gelen şube objesi)
      if (typeof response === 'object' && response.image_path) {
        branchForm.value.image_path = response.image_path;
        
        // Eğer düzenleme modundaysa ve response'da id varsa, sadece o şubeyi güncelle
        if (editingBranch.value && response.id) {
          const branchIndex = branches.value.findIndex(b => b.id === response.id);
          if (branchIndex !== -1) {
            // Sadece image_path'i güncelle, diğer alanları koru
            branches.value[branchIndex] = { 
              ...branches.value[branchIndex], 
              image_path: response.image_path,
              updated_at: response.updated_at 
            };
          }
          
          // Seçili şube de güncellenen şube ise onu da güncelle
          if (selectedBranch.value && selectedBranch.value.id === response.id) {
            selectedBranch.value = { 
              ...selectedBranch.value, 
              image_path: response.image_path,
              updated_at: response.updated_at 
            };
          }
        }
      } 
      // Response sadece string ise (image path)
      else if (typeof response === 'string') {
        branchForm.value.image_path = response;
      }
      
      console.log('Image uploaded for form:', branchForm.value.image_path)
      console.log('Current editing branch:', editingBranch.value?.id)
    }

    onMounted(() => {
      fetchBranches()
    })

    return {
      branches,
      showAddModal,
      editingBranch,
      selectedBranch,
      branchForm,
      countryList,
      cityList,
      districtList,
      editBranch,
      saveBranch,
      deleteBranch,
      closeModal,
      showModal,
      searchAddress,
      handleImageUploadSuccess
    }
  }
}
</script>

<style scoped>
.branches-page {
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

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

tr.selected {
  background-color: #e3f2fd;
}

tr {
  cursor: pointer;
}

tr:hover {
  background-color: #f5f5f5;
}

.branches-list {
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
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 800px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 5px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}

.branch-form {
  padding: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
  outline: none;
}

.form-group textarea {
  height: 80px;
  resize: vertical;
}

.address-input {
  position: relative;
}

.search-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 5px;
  transition: color 0.2s;
}

.search-btn:hover {
  color: #4CAF50;
}

.map-container {
  margin: 20px 0;
  position: relative;
  width: 100%;
  height: 400px;
}

#map {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 1;
}

.help-text {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 0.9em;
  margin-top: 8px;
}

.help-text i {
  color: #4CAF50;
}

.coordinates-display {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
}

.coordinates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.coordinate-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.coordinate-item i {
  color: #4CAF50;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.cancel-btn,
.save-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  color: #666;
}

.save-btn {
  background-color: #4CAF50;
  border: none;
  color: white;
}

.cancel-btn:hover {
  background-color: #eee;
}

.save-btn:hover {
  background-color: #45a049;
}

.required {
  color: #f44336;
  margin-left: 4px;
}

/* Leaflet için özel stiller */
:deep(.leaflet-container) {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: 1px solid #ddd;
}

:deep(.leaflet-control-zoom) {
  border: none !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
}

:deep(.leaflet-control-zoom a) {
  background-color: white !important;
  color: #333 !important;
  border: none !important;
  width: 30px !important;
  height: 30px !important;
  line-height: 30px !important;
}

:deep(.leaflet-control-zoom a:hover) {
  background-color: #f8f9fa !important;
}

/* Responsive tasarım */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .coordinates {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
    margin: 10px;
  }
}
</style> 