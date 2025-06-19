<template>
  <div class="students-page">
    <div class="page-header">
      <h2>Öğrenciler</h2>
      <div class="header-actions">
        <button class="add-btn" @click="showModal">
          <i class="fas fa-plus"></i> Yeni Öğrenci
        </button>
        <button class="edit-btn" @click="editSelectedStudents" :disabled="!hasSelectedStudents">
          <i class="fas fa-edit"></i> Düzenle
        </button>
        <button class="delete-btn" @click="deleteSelectedStudents" :disabled="!hasSelectedStudents">
          <i class="fas fa-trash"></i> Sil
        </button>
      </div>
    </div>

    <!-- Öğrenci Listesi -->
    <div class="students-list">
      <table>
        <thead>
          <tr>
            <th>
              <input type="checkbox" v-model="selectAll" @change="toggleSelectAll">
            </th>
            <th>Fotoğraf</th>
            <th>Ad Soyad</th>
            <th>E-posta</th>
            <th>Telefon</th>
            <th>Adres</th>
            <th>Şube</th>
            <th>Durum</th>
            <th>Kurslar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in students" :key="student.id" 
              :class="{ 'selected': selectedStudents.includes(student.id) }"
              @click="toggleStudentSelection(student.id)">
            <td @click.stop>
              <input type="checkbox" v-model="selectedStudents" :value="student.id">
            </td>
            <td>
              <div class="student-photo">
                <img 
                  v-if="student.image_path" 
                  :src="getImageUrl(student.image_path)" 
                  :alt="student.name"
                  class="student-avatar"
                />
                <div v-else class="no-photo">
                  <i class="fas fa-user"></i>
                </div>
              </div>
            </td>
            <td>{{ student.name }}</td>
            <td>{{ student.email }}</td>
            <td>{{ student.phone }}</td>
            <td>{{ student.address }}</td>
            <td>{{ student.branch_name }}</td>
            <td>
              <span :class="['status-badge', student.status]">
                {{ student.status === 'active' ? 'Aktif' : 'Pasif' }}
              </span>
            </td>
            <td>
              <div class="courses-list">
                <span v-for="course in student.courses?.split(',')" :key="course" class="course-tag">
                  {{ course }}
                </span>
                <span v-if="!student.courses">Kurs yok</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Öğrenci Ekleme/Düzenleme Modal -->
    <div class="modal" v-if="showAddModal">
      <div class="modal-content">
        <h3>{{ editingStudent ? 'Öğrenci Düzenle' : 'Yeni Öğrenci' }}</h3>
        <form @submit.prevent="saveStudent" ref="studentFormRef">
          <div class="form-group">
            <label>Ad Soyad <span class="required">*</span></label>
            <input type="text" v-model="studentForm.name" required>
          </div>

          <div class="form-group">
            <label>E-posta <span class="required">*</span></label>
            <input type="email" v-model="studentForm.email" required>
          </div>

          <div class="form-group" v-if="!editingStudent">
            <label>Şifre</label>
            <input type="password" v-model="studentForm.password" placeholder="Boş bırakılırsa otomatik oluşturulur">
            <small class="help-text">
              <i class="fas fa-info-circle"></i>
              Şifre boş bırakılırsa varsayılan şifre "123456" olarak ayarlanır.
            </small>
          </div>
          
          <div class="form-group">
            <label>Telefon</label>
            <input type="tel" v-model="studentForm.phone" pattern="[0-9]{10}" placeholder="5XX XXX XX XX">
          </div>
          
          <div class="form-group">
            <label>Adres</label>
            <div class="address-input">
              <textarea 
                v-model="studentForm.address" 
                @input="searchAddress"
                placeholder="Adresi yazın veya haritadan seçin..."
              ></textarea>
              <button type="button" class="search-btn" @click="searchAddress">
                <i class="fas fa-search"></i>
              </button>
            </div>
          </div>

          <div class="form-group map-container">
            <label>Konum Seçimi</label>
            <div id="map"></div>
            <small class="help-text">
              <i class="fas fa-info-circle"></i>
              Haritadan konumu seçin veya adresi yazın. Marker'ı sürükleyerek hassas konum ayarı yapabilirsiniz.
            </small>
          </div>

          <div class="form-group coordinates-display" v-if="studentForm.latitude && studentForm.longitude">
            <label>Seçilen Konum</label>
            <div class="coordinates">
              <div class="coordinate-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>Enlem: {{ studentForm.latitude }}</span>
              </div>
              <div class="coordinate-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>Boylam: {{ studentForm.longitude }}</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Şube</label>
            <select v-model="studentForm.branch_id" @change="onBranchChange">
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </option>
            </select>
          </div>

          <div class="form-group" v-if="studentForm.branch_id">
            <label>Kurslar</label>
            <div class="courses-selection">
              <div v-for="course in filteredCourses" :key="course.id" class="course-checkbox">
                <input 
                  type="checkbox" 
                  :id="'course-' + course.id" 
                  :value="course.id" 
                  v-model="studentForm.course_ids"
                >
                <label :for="'course-' + course.id">{{ course.name }}</label>
              </div>
              <div v-if="filteredCourses.length === 0" class="no-courses">
                Bu şubede kurs yok.
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Durum</label>
            <select v-model="studentForm.status">
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
          </div>

          <div class="form-group">
            <label>Profil Fotoğrafı</label>
            <div v-if="studentForm.image_path">
              <img :src="getImageUrl(studentForm.image_path)" alt="Profil Fotoğrafı" style="max-width: 150px; max-height: 150px; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 10px;" />
            </div>
            <ImageUploader
              v-model="studentForm.image_path"
              :upload-url="getImageUploadUrl(editingStudent?.id)"
              placeholder-text="Öğrenci fotoğrafını buraya sürükleyin veya tıklayın"
              @upload-success="handleImageUploadSuccess"
            />
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeModal">
              <i class="fas fa-times"></i> İptal
            </button>
            <button type="submit" class="save-btn">
              <i class="fas fa-save"></i> {{ editingStudent ? 'Güncelle' : 'Kaydet' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Kurs Ekleme Modal -->
    <div class="modal" v-if="showCourseModal">
      <div class="modal-content">
        <h3>Kurs Yönetimi</h3>
        <div class="course-management">
          <div class="current-courses">
            <h4>Mevcut Kurslar</h4>
            <div class="courses-list">
              <div v-for="course in selectedStudent?.courses?.split(',')" :key="course" class="course-item">
                <span>{{ course }}</span>
                <button class="remove-course-btn" @click="removeCourse(course)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div v-if="!selectedStudent?.courses" class="no-courses">
                Henüz kurs kaydı yok
              </div>
            </div>
          </div>

          <div class="add-course">
            <h4>Kurs Ekle</h4>
            <div class="form-group">
              <select v-model="selectedCourse">
                <option value="">Kurs Seçin</option>
                <option v-for="course in availableCourses" :key="course.id" :value="course.id">
                  {{ course.name }}
                </option>
              </select>
              <button class="add-course-btn" @click="addCourse" :disabled="!selectedCourse">
                <i class="fas fa-plus"></i> Ekle
              </button>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="cancel-btn" @click="closeCourseModal">Kapat</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, nextTick } from 'vue'
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import toast from '@/utils/toast'
import ImageUploader from '@/components/ImageUploader.vue'
import branchIconPng from '@/assets/images/a.png'
import { getImageUrl } from '@/utils/config'

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
  name: 'StudentsView',
  components: {
    ImageUploader
  },
  setup() {
    const students = ref([])
    const branches = ref([])
    const courses = ref([])
    const showAddModal = ref(false)
    const showCourseModal = ref(false)
    const editingStudent = ref(null)
    const selectedStudent = ref(null)
    const selectedCourse = ref('')
    const map = ref(null)
    const marker = ref(null)
    const branchMarkers = ref([])
    const studentForm = ref({
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      branch_id: '',
      status: 'active',
      course_ids: [],
      latitude: '',
      longitude: '',
      image_path: ''
    })
    const selectedStudents = ref([])
    const selectAll = ref(false)
    const studentFormRef = ref(null)

    // Haritayı başlat
    const initMap = () => {
      const mapElement = document.getElementById('map')
      if (!mapElement) {
        console.error('Map element not found')
        return
      }

      try {
        // Haritayı oluştur
        map.value = L.map(mapElement, {
          center: [35.34, 33.32],
          zoom: 12,
          zoomControl: true,
          attributionControl: true
        })

        // OpenStreetMap tile layer ekle
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map.value)

        // Şube markerlarını ekle
        addBranchMarkers();

        // Haritayı yeniden boyutlandır
        setTimeout(() => {
          map.value.invalidateSize()
        }, 100)

        // Haritayı tıklandığında
        map.value.on('click', (e) => {
          const { lat, lng } = e.latlng
          updateMarker(lat, lng)
          updateCoordinates(lat, lng)
          reverseGeocode(lat, lng)
        })

        console.log('Map initialized successfully')
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    // Şube markerlarını ekle
    const addBranchMarkers = () => {
      // Harita yüklenmemişse çık
      if (!map.value) {
        console.warn('Map not initialized yet, skipping branch markers')
        return
      }

      // Önce eski markerları temizle
      if (branchMarkers.value.length > 0) {
        branchMarkers.value.forEach(m => {
          try {
            m.remove()
          } catch (error) {
            console.warn('Error removing branch marker:', error)
          }
        })
        branchMarkers.value = []
      }

      if (!branches.value) return

      branches.value.forEach(branch => {
        if (branch.latitude && branch.longitude) {
          try {
            const icon = L.icon({
              iconUrl: branchIconPng,
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            })
            const m = L.marker([parseFloat(branch.latitude), parseFloat(branch.longitude)], { icon })
              .addTo(map.value)
              .bindPopup(branch.name)
            branchMarkers.value.push(m)
          } catch (error) {
            console.error('Error adding branch marker:', error)
          }
        }
      })
    }

    // Yardımcı: İki nokta arası mesafe (Haversine)
    function calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    // En yakın şubeyi bul
    function findNearestBranch(lat, lng, branches) {
      let minDist = Infinity;
      let nearest = null;
      for (const branch of branches) {
        if (branch.latitude && branch.longitude) {
          const dist = calculateDistance(lat, lng, parseFloat(branch.latitude), parseFloat(branch.longitude));
          if (dist < minDist) {
            minDist = dist;
            nearest = branch;
          }
        }
      }
      return nearest;
    }

    // Adres veya konum değiştiğinde otomatik şube ata
    function autoSelectBranch() {
      if (studentForm.value.latitude && studentForm.value.longitude && branches.value.length > 0) {
        const nearest = findNearestBranch(parseFloat(studentForm.value.latitude), parseFloat(studentForm.value.longitude), branches.value);
        if (nearest) {
          studentForm.value.branch_id = nearest.id;
        }
      }
    }

    // Şube select değiştiğinde kurslar sıfırlanabilir (isteğe bağlı)
    function onBranchChange() {
      studentForm.value.course_ids = [];
    }

    // Adres arama fonksiyonunu güncelle
    const searchAddress = async () => {
      if (!studentForm.value.address) return
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(studentForm.value.address)}&countrycodes=tr`
        )
        const data = await response.json()
        if (data && data.length > 0) {
          const { lat, lon } = data[0]
          const latNum = parseFloat(lat)
          const lngNum = parseFloat(lon)
          
          // Harita yüklenmişse güncelle
          if (map.value) {
            map.value.setView([latNum, lngNum], 15)
            updateMarker(latNum, lngNum)
          }
          
          updateCoordinates(latNum, lngNum)
          // Adres değiştiğinde otomatik şube ata
          autoSelectBranch()
        }
      } catch (error) {
        console.error('Error searching address:', error)
      }
    }

    // Marker güncellendiğinde de otomatik şube ata
    const updateCoordinates = (lat, lng) => {
      studentForm.value.latitude = lat.toFixed(6)
      studentForm.value.longitude = lng.toFixed(6)
      autoSelectBranch()
    }

    // Modal açıldığında da otomatik şube ata
    const showModal = async () => {
      showAddModal.value = true
      await nextTick()
      
      if (studentFormRef.value) {
        studentFormRef.value.scrollTo({ top: 0, behavior: 'auto' })
      }
      
      try {
        if (!map.value) {
          initMap()
          // Haritanın yüklenmesi için kısa bir bekleme
          await new Promise(resolve => setTimeout(resolve, 100))
        } else {
          map.value.invalidateSize()
        }
        
        // Harita hazır olduktan sonra şube markerlarını ekle
        if (map.value) {
          addBranchMarkers()
        }
      } catch (error) {
        console.error('Error handling map in modal:', error)
      }
      
      // Modal açıldığında otomatik şube ata
      autoSelectBranch()
    }

    // Marker'ı güncelle
    const updateMarker = (lat, lng) => {
      // Harita yüklenmemişse çık
      if (!map.value) {
        console.warn('Map not initialized yet, skipping marker update')
        return
      }

      // Eski marker'ı kaldır
      if (marker.value) {
        try {
          map.value.removeLayer(marker.value)
        } catch (error) {
          console.warn('Error removing old marker:', error)
        }
      }

      try {
        // Yeni marker ekle
        marker.value = L.marker([lat, lng], {
          draggable: true
        }).addTo(map.value)

        // Marker sürüklendiğinde
        marker.value.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng()
          updateCoordinates(lat, lng)
          reverseGeocode(lat, lng)
        })
      } catch (error) {
        console.error('Error creating marker:', error)
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
          studentForm.value.address = data.display_name
        }
      } catch (error) {
        console.error('Error reverse geocoding:', error)
      }
    }

    // Bildirim fonksiyonları
    const showSuccess = (message) => {
      toast.success(message)
    }

    const showError = (message) => {
      toast.error(message)
    }

    // Seçili öğrenci var mı kontrolü
    const hasSelectedStudents = computed(() => selectedStudents.value.length > 0)

    // Tümünü seç/kaldır
    const toggleSelectAll = () => {
      if (selectAll.value) {
        selectedStudents.value = students.value.map(student => student.id)
      } else {
        selectedStudents.value = []
      }
    }

    // Öğrenci seçimi toggle
    const toggleStudentSelection = (studentId) => {
      const index = selectedStudents.value.indexOf(studentId)
      if (index > -1) {
        selectedStudents.value.splice(index, 1)
      } else {
        selectedStudents.value.push(studentId)
      }
    }

    // Seçili öğrencileri düzenle
    const editSelectedStudents = () => {
      if (selectedStudents.value.length === 1) {
        const student = students.value.find(s => s.id === selectedStudents.value[0])
        if (student) {
          editStudent(student)
        }
      } else {
        showError('Lütfen sadece bir öğrenci seçin')
      }
    }

    // Seçili öğrencileri sil
    const deleteSelectedStudents = async () => {
      const confirmed = await toast.confirm(`${selectedStudents.value.length} öğrenciyi silmek istediğinizden emin misiniz?`, 'Öğrenci Silme')
      if (!confirmed) return

      try {
        for (const studentId of selectedStudents.value) {
          await axios.delete(`/api/students/${studentId}`)
        }
        showSuccess('Seçili öğrenciler başarıyla silindi')
        selectedStudents.value = []
        selectAll.value = false
        await fetchStudents()
      } catch (error) {
        console.error('Error deleting students:', error)
        const errorMessage = error.response?.data?.error || 'Öğrenciler silinirken bir hata oluştu'
        showError(errorMessage)
      }
    }

    // Öğrencileri getir
    const fetchStudents = async () => {
      try {
        const response = await axios.get('/api/students')
        students.value = response.data
      } catch (error) {
        console.error('Error fetching students:', error)
      }
    }

    // Şubeleri getir
    const fetchBranches = async () => {
      try {
        const response = await axios.get('/api/branches')
        branches.value = response.data
      } catch (error) {
        console.error('Error fetching branches:', error)
      }
    }

    // Kursları getir
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/courses')
        courses.value = response.data
      } catch (error) {
        console.error('Error fetching courses:', error)
      }
    }

    // Öğrenci düzenleme
    const editStudent = async (student) => {
      editingStudent.value = student
      studentForm.value = {
        name: student.name,
        email: student.email,
        phone: student.phone || '',
        address: student.address || '',
        branch_id: student.branch_id,
        status: student.status || 'active',
        course_ids: student.courses ? student.courses.split(',').map(courseName => {
          const course = courses.value.find(c => c.name === courseName)
          return course ? course.id : null
        }).filter(id => id !== null) : [],
        latitude: student.latitude || '',
        longitude: student.longitude || '',
        image_path: student.image_path || ''
      }
      
      await showModal()
      
      // Haritayı güncelle - nextTick ile haritanın hazır olmasını bekle
      if (student.latitude && student.longitude) {
        await nextTick()
        // Harita var mı kontrol et
        if (map.value) {
          const lat = parseFloat(student.latitude)
          const lng = parseFloat(student.longitude)
          map.value.setView([lat, lng], 15)
          updateMarker(lat, lng)
        } else {
          console.warn('Map not ready for student editing')
        }
      }
    }

    // Kurs modalını göster
    const openCourseModal = (student) => {
      selectedStudent.value = student
      showCourseModal.value = true
    }

    // Kurs modalını kapat
    const closeCourseModal = () => {
      selectedStudent.value = null
      selectedCourse.value = ''
      showCourseModal.value = false
    }

    // Kurs ekle
    const addCourse = async () => {
      try {
        await axios.post(`/api/students/${selectedStudent.value.id}/courses`, {
          course_id: selectedCourse.value
        })
        selectedCourse.value = ''
        fetchStudents()
      } catch (error) {
        console.error('Error adding course:', error)
        if (error.response?.data?.error) {
          toast.error(error.response.data.error)
        }
      }
    }

    // Kurs sil
    const removeCourse = async (courseName) => {
      try {
        const course = courses.value.find(c => c.name === courseName)
        if (!course) return

        await axios.delete(`/api/students/${selectedStudent.value.id}/courses/${course.id}`)
        fetchStudents()
      } catch (error) {
        console.error('Error removing course:', error)
        if (error.response?.data?.error) {
          toast.error(error.response.data.error)
        }
      }
    }

    // Form validasyonu
    const isFormValid = computed(() => {
      return studentForm.value.name && 
             studentForm.value.email && 
             studentForm.value.branch_id &&
             isValidEmail(studentForm.value.email)
    })

    // E-posta validasyonu
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    // Öğrenci kaydetme
    const handleImageUploadSuccess = (imagePath) => {
      console.log('Image path received:', imagePath); // Debug için
      if (typeof imagePath === 'string') {
        studentForm.value.image_path = imagePath;
        console.log('Form data after image upload:', studentForm.value); // Debug için
      } else {
        console.error('Invalid image path format:', imagePath);
        showError('Geçersiz resim yolu formatı');
      }
    };

    const saveStudent = async () => {
      try {
        console.log('Current form data before save:', studentForm.value); // Debug için
        
        // Resim yolunu kontrol et
        if (!studentForm.value.image_path) {
          console.log('No image path in form data'); // Debug için
        }

        const studentData = {
          name: studentForm.value.name,
          email: studentForm.value.email,
          password: studentForm.value.password || undefined, // Boşsa undefined gönder
          phone: studentForm.value.phone,
          address: studentForm.value.address,
          branch_id: studentForm.value.branch_id,
          course_ids: studentForm.value.course_ids,
          status: studentForm.value.status,
          latitude: studentForm.value.latitude,
          longitude: studentForm.value.longitude,
          image_path: studentForm.value.image_path || null // Resim yolunu ekle
        };

        console.log('Sending data to backend:', studentData); // Debug için

        if (editingStudent.value) {
          // Güncelleme
          await axios.put(`/api/students/${editingStudent.value.id}`, studentData);
          showSuccess('Öğrenci başarıyla güncellendi');
        } else {
          // Yeni kayıt
          const response = await axios.post('/api/students', studentData);
          console.log('Backend response:', response.data); // Debug için
          
          // Varsayılan şifre bilgisi varsa göster
          if (response.data.temporaryPassword) {
            showSuccess(`Öğrenci başarıyla eklendi. Şifre: ${response.data.temporaryPassword}`);
          } else {
            showSuccess('Öğrenci başarıyla eklendi');
          }
        }

        await fetchStudents();
        closeModal();
      } catch (error) {
        console.error('Error saving student:', error);
        showError(error.response?.data?.error || 'Öğrenci kaydedilirken bir hata oluştu');
      }
    };

    const closeModal = () => {
      showAddModal.value = false
      editingStudent.value = null
      studentForm.value = {
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        branch_id: '',
        status: 'active',
        course_ids: [],
        latitude: '',
        longitude: '',
        image_path: ''
      }
    }

    // Öğrenci silme
    const deleteStudent = async (student) => {
      const confirmed = await toast.confirm('Bu öğrenciyi silmek istediğinizden emin misiniz?', 'Öğrenci Silme')
      if (!confirmed) return
      
      try {
        await axios.delete(`/api/students/${student.id}`)
        showSuccess('Öğrenci başarıyla silindi')
        await fetchStudents()
      } catch (error) {
        console.error('Error deleting student:', error)
        const errorMessage = error.response?.data?.error || 'Öğrenci silinirken bir hata oluştu'
        showError(errorMessage)
      }
    }

    // Filtrelenmiş kurslar (sadece seçili şubedeki kurslar)
    const filteredCourses = computed(() => {
      if (!studentForm.value.branch_id) return [];
      return courses.value.filter(course => course.branch_id == studentForm.value.branch_id);
    });

    // Resim yükleme URL'sini düzelt
    const getImageUploadUrl = (studentId) => {
      if (!studentId || studentId === 'new') {
        return '/api/students/temp/image';
      }
      return `/api/students/${studentId}/image`;
    }

    onMounted(() => {
      fetchStudents()
      fetchBranches()
      fetchCourses()
    })

    return {
      students,
      branches,
      courses,
      showAddModal,
      showCourseModal,
      editingStudent,
      selectedStudent,
      selectedCourse,
      studentForm,
      editStudent,
      openCourseModal,
      closeCourseModal,
      addCourse,
      removeCourse,
      saveStudent,
      closeModal,
      deleteStudent,
      showSuccess,
      showError,
      selectedStudents,
      selectAll,
      hasSelectedStudents,
      toggleSelectAll,
      toggleStudentSelection,
      editSelectedStudents,
      deleteSelectedStudents,
      isFormValid,
      isValidEmail,
      searchAddress,
      showModal,
      studentFormRef,
      onBranchChange,
      filteredCourses,
      handleImageUploadSuccess,
      getImageUploadUrl,
      getImageUrl
    }
  }
}
</script>

<style scoped>
.students-page {
  padding: 20px;
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
  opacity: 0.5;
  cursor: not-allowed;
}

.header-actions .add-btn {
  background-color: #4CAF50;
}

.header-actions .edit-btn {
  background-color: #2196F3;
}

.header-actions .delete-btn {
  background-color: #f44336;
}

/* Checkbox stilleri */
input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.students-list {
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

tr {
  cursor: pointer;
  transition: background-color 0.2s;
}

tr:hover {
  background-color: #f8f9fa;
}

tr.selected {
  background-color: #e3f2fd !important;
}

.edit-btn, .delete-btn {
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px 8px;
  margin: 0 4px;
}

.edit-btn {
  color: #2196F3;
}

.delete-btn {
  color: #f44336;
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
}

.form-group textarea {
  height: 100px;
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

.courses-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.course-tag {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.9em;
}

.course-btn {
  color: #4CAF50;
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px 8px;
  margin: 0 4px;
}

.course-management {
  margin-bottom: 20px;
}

.current-courses {
  margin-bottom: 20px;
}

.course-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f5f5f5;
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
}

.remove-course-btn {
  color: #f44336;
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
}

.add-course {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.add-course-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.add-course-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.no-courses {
  color: #666;
  font-style: italic;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.9em;
  font-weight: 500;
}

.status-badge.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.inactive {
  background-color: #ffebee;
  color: #c62828;
}

.required {
  color: #f44336;
  margin-left: 4px;
}

.form-group input:invalid,
.form-group select:invalid {
  border-color: #f44336;
}

.save-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.courses-selection {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.course-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.course-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.course-checkbox label {
  font-size: 14px;
  color: #333;
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
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
}

.coordinates {
  display: flex;
  gap: 20px;
}

.coordinate-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.coordinate-item i {
  color: #4CAF50;
}

.student-photo {
  display: flex;
  align-items: center;
  justify-content: center;
}

.student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e0e0e0;
}

.no-photo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  border: 2px solid #e0e0e0;
}

/* Mobil Responsive Tasarım */
@media (max-width: 768px) {
  .students-page {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .header-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .header-actions button {
    padding: 12px 16px;
    font-size: 14px;
    min-height: 44px;
  }

  /* Tablo mobil görünümü */
  .students-list {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  table {
    min-width: 900px;
    font-size: 12px;
  }

  th, td {
    padding: 8px 4px;
    min-width: 80px;
  }

  .student-avatar {
    width: 30px;
    height: 30px;
  }

  .no-photo {
    width: 30px;
    height: 30px;
  }

  /* Modal mobil optimizasyonu */
  .modal-content {
    width: 95% !important;
    max-width: 95% !important;
    margin: 10px;
    padding: 15px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-content h3 {
    font-size: 1.2rem;
    margin-bottom: 15px;
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

  /* Harita mobil optimizasyonu */
  .map-container {
    height: 250px;
    margin: 15px 0;
  }

  #map {
    height: 100%;
  }

  .coordinates {
    flex-direction: column;
    gap: 10px;
  }

  .courses-selection {
    grid-template-columns: 1fr;
    max-height: 150px;
  }

  .form-actions {
    flex-direction: column;
    gap: 10px;
  }

  .form-actions button {
    width: 100%;
    padding: 12px;
    font-size: 16px;
    min-height: 44px;
  }

  /* Kurs yönetimi modal */
  .course-management {
    margin-bottom: 15px;
  }

  .add-course {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .add-course-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .students-page {
    padding: 5px;
  }

  .page-header h2 {
    font-size: 1.5rem;
  }

  .header-actions {
    grid-template-columns: 1fr;
  }

  table {
    font-size: 11px;
    min-width: 700px;
  }

  th, td {
    padding: 6px 2px;
  }

  .modal-content {
    padding: 10px;
  }

  .map-container {
    height: 200px;
  }

  .help-text {
    font-size: 12px;
  }
}
</style> 