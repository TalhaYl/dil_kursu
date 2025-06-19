<template>
  <div class="student-container">
    <header class="student-header">
      <h1>Öğrenci Paneli</h1>
      <div class="welcome-message">Hoş geldin, {{ studentName }}</div>
      <button @click="handleLogout" class="logout-btn">Çıkış Yap</button>
    </header>
    
    <div class="student-content">
      <nav class="student-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['nav-btn', { active: currentTab === tab.id }]"
          @click="currentTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </nav>

      <div class="tab-content">
        <!-- Derslerim Tab -->
        <div v-if="currentTab === 'courses'" class="courses-tab">
          <h2>Derslerim</h2>
          <div class="courses-list">
            <div v-for="course in myCourses" :key="course.id" class="course-item">
              <h3>{{ course.name }}</h3>
              <p>Dil: {{ course.language }}</p>
              <p>Seviye: {{ course.level || 'A1' }}</p>
              <p>Öğretmen: {{ course.teacher_name }}</p>
              <p>Başlangıç: {{ formatDate(course.start_date) }}</p>
              <p>Bitiş: {{ formatDate(course.end_date) }}</p>
            </div>
          </div>
        </div>

        <!-- Ders Programım Tab -->
        <div v-if="currentTab === 'schedule'" class="schedule-tab">
          <h2>Ders Programım</h2>
          <table class="weekly-schedule-table">
            <thead>
              <tr>
                <th>Saat</th>
                <th v-for="day in weekDays" :key="day">{{ day }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="hour in hours" :key="hour">
                <td>{{ hour }}</td>
                <td v-for="day in weekDays" :key="day">
                  <div v-for="course in getCoursesAt(day, hour)" :key="course.id" class="course-cell">
                    {{ course.name }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bilgilerim Tab -->
        <div v-if="currentTab === 'profile'" class="profile-tab">
          <h2>Bilgilerim</h2>
          <form @submit.prevent="updateProfile" class="profile-form">
            <div class="form-group">
              <label>Ad Soyad</label>
              <input type="text" v-model="profile.name" required>
            </div>
            <div class="form-group">
              <label>E-posta</label>
              <input type="email" v-model="profile.email" required>
            </div>
            <div class="form-group">
              <label>Telefon</label>
              <input type="tel" v-model="profile.phone">
            </div>
            <div class="form-group">
              <label>Yeni Şifre</label>
              <input type="password" v-model="profile.newPassword">
            </div>

            <button type="submit" class="save-btn">Bilgileri Güncelle</button>
          </form>
        </div>

        <!-- Kursa Kayıt Tab -->
        <div v-if="currentTab === 'register'" class="register-tab">
          <h2>Kursa Kayıt</h2>
          
          <!-- Kurs Arama Bölümü -->
          <div class="search-section">
            <h3>Kurs Ara</h3>
            <div class="search-filters">
              <div class="filter-group">
                <label>Dil:</label>
                <select v-model="searchFilters.language">
                  <option value="">Tüm Diller</option>
                  <option value="Türkçe">Türkçe</option>
                  <option value="İngilizce">İngilizce</option>
                  <option value="Almanca">Almanca</option>
                  <option value="Fransızca">Fransızca</option>
                  <option value="İspanyolca">İspanyolca</option>
                  <option value="İtalyanca">İtalyanca</option>
                  <option value="Rusça">Rusça</option>
                  <option value="Arapça">Arapça</option>
                  <option value="Çince">Çince</option>
                  <option value="Japonca">Japonca</option>
                </select>
              </div>

              <div class="filter-group">
                <label>Seviye:</label>
                <select v-model="searchFilters.level">
                  <option value="">Tüm Seviyeler</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
              </div>
              

              
              <div class="filter-group">
                <label>Durum:</label>
                <select v-model="searchFilters.status">
                  <option value="">Tümü</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                  <option value="completed">Tamamlandı</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label>Gün:</label>
                <select v-model="searchFilters.day">
                  <option value="">Tüm Günler</option>
                  <option v-for="day in weekDays" :key="day" :value="day">{{ day }}</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label>Zaman Dilimi:</label>
                <select v-model="searchFilters.timeSlot">
                  <option value="">Tüm Saatler</option>
                  <option value="09:00-12:00">Sabah (09:00-12:00)</option>
                  <option value="13:00-16:00">Öğleden Sonra (13:00-16:00)</option>
                  <option value="17:00-20:00">Akşam (17:00-20:00)</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label>Şube:</label>
                <select v-model="searchFilters.branch">
                  <option value="">Tüm Şubeler</option>
                  <option v-for="branch in allBranches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label>Öğretmen:</label>
                <select v-model="searchFilters.teacher">
                  <option value="">Tüm Öğretmenler</option>
                  <option v-for="teacher in availableTeachers" :key="teacher.id" :value="teacher.id">{{ teacher.name }}</option>
                </select>
              </div>
              

              
              <div class="filter-group">
                <label>Maksimum Öğrenci:</label>
                <select v-model="searchFilters.maxStudents">
                  <option value="">Tümü</option>
                  <option value="1-10">1-10 Kişi</option>
                  <option value="11-20">11-20 Kişi</option>
                  <option value="21-30">21+ Kişi</option>
                </select>
              </div>
              
              <div class="filter-actions">
                <button @click="searchCourses" class="search-btn">
                  <i class="fas fa-search"></i> Ara
                </button>
                <button @click="clearFilters" class="clear-btn">
                  <i class="fas fa-times"></i> Temizle
                </button>
              </div>
            </div>

            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
            <div v-else-if="searchedCourses && searchedCourses.length > 0" class="search-results">
              <h4>Arama Sonuçları</h4>
              <div class="courses-grid">
                <div v-for="course in searchedCourses" :key="course.id" class="course-card">
                  <h5>{{ course.name }}</h5>
                  <p><strong>Dil:</strong> {{ course.language }}</p>
                  <p><strong>Seviye:</strong> {{ course.level || 'A1' }}</p>
                  <p><strong>Şube:</strong> {{ course.branch_name }}</p>
                  <p><strong>Adres:</strong> {{ course.branch_address }}</p>
                  <p><strong>Öğretmen:</strong> {{ course.teacher_name }}</p>
                  <p><strong>Gün/Saat:</strong> {{ formatSchedule(course.schedule) }}</p>
                  <p><strong>Maksimum Öğrenci:</strong> {{ course.max_students }}</p>
                  <button class="register-btn" @click="registerToSearchedCourse(course)">Kursa Kayıt Ol</button>
                </div>
              </div>
            </div>
            <div v-else-if="searchedCourses && searchedCourses.length === 0 && (searchFilters.language || searchFilters.day)">
              <p>Kurs bulunamadı.</p>
            </div>
          </div>

          <div class="location-section">
            <h3>Konum Seçimi</h3>
            <div class="map-container">
              <div id="map" ref="mapContainer" style="width: 100%; height: 400px;"></div>
            </div>
            <div v-if="selectedLocation" class="location-info">
              <p><strong>Enlem:</strong> {{ selectedLocation.lat }}</p>
              <p><strong>Boylam:</strong> {{ selectedLocation.lng }}</p>
            </div>
            <!-- Şube Listesi -->
            <div v-if="allBranches && allBranches.length > 0" class="branches-list-section">
              <h3>Şubeler (En Yakından Uzağa)</h3>
              <ul class="branches-list">
                <li v-for="branch in allBranches" :key="branch.id"
                    :class="['branch-list-item', { selected: selectedBranch && selectedBranch.id === branch.id }]"
                    @click="onBranchListClick(branch)">
                  {{ capitalize(branch.name) }} <span class="branch-distance">({{ branch.distance }} km)</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Şube Kursları Listesi -->
          <div v-if="selectedBranch && availableCourses && availableCourses.length > 0" class="branch-courses-section">
            <h3>{{ capitalize(selectedBranch.name) }} Şubesindeki Kurslar</h3>
            <div class="courses-list">
              <div v-for="course in availableCourses" :key="course.id" class="course-item">
                <h3>{{ course.name }}</h3>
                <p>Dil: {{ course.language }}</p>
                <p>Seviye: {{ course.level || 'A1' }}</p>
                <p>Öğretmen: {{ course.teacher_name }}</p>
                <p>Başlangıç: {{ formatDate(course.start_date) }}</p>
                <p>Bitiş: {{ formatDate(course.end_date) }}</p>
                <button class="register-btn" @click="registerToCourse(course.id)">Kursa Kayıt Ol</button>
              </div>
            </div>
          </div>

          <div v-if="selectedCourse" class="course-detail-section">
            <h3>Kurs Detayları</h3>
            <p><strong>Kurs Adı:</strong> {{ selectedCourse.name }}</p>
            <p><strong>Dil:</strong> {{ selectedCourse.language }}</p>
            <p><strong>Seviye:</strong> {{ selectedCourse.level || 'A1' }}</p>
            <p><strong>Şube:</strong> {{ selectedCourse.branch_name }}</p>
            <p><strong>Adres:</strong> {{ selectedCourse.branch_address }}</p>
            <p><strong>Öğretmen:</strong> {{ selectedCourse.teacher_name }}</p>
            <p><strong>Gün/Saat:</strong> {{ formatSchedule(selectedCourse.schedule) }}</p>
            <p><strong>Maksimum Öğrenci:</strong> {{ selectedCourse.max_students }}</p>
            <button class="register-btn" @click="registerToSelectedCourse">Kursa Kayıt Ol</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isLoading" class="loading-spinner">
      <div class="spinner"></div>
      <p>Yükleniyor...</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import toast from '@/utils/toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import branchIconPng from '@/assets/images/a.png';

// Leaflet marker icon düzeltmesi
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default {
  name: 'StudentPage',
  data() {
    return {
      currentTab: 'courses',
      tabs: [
        { id: 'courses', name: 'Derslerim' },
        { id: 'schedule', name: 'Ders Programım' },
        { id: 'profile', name: 'Bilgilerim' },
        { id: 'register', name: 'Kursa Kayıt' }
      ],
      myCourses: [],
      weekDays: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
      hours: [
        '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
      ],
      studentName: '',
      profile: {
        name: '',
        email: '',
        phone: '',
        newPassword: ''
      },
      selectedLocation: {
        lat: null,
        lng: null
      },
      locationError: null,
      nearestBranch: null,
      otherBranches: [],
      availableCourses: [],
      map: null,
      currentMarker: null, // Mevcut öğrenci marker'ı
      mapLoaded: false,
      mapLoadError: false,
      mapLoadAttempted: false,
      isLoading: false,
      errorMessage: null,
      selectedBranch: null,
      searchFilters: {
        language: '',
        level: '',
        status: '',
        day: '',
        timeSlot: '',
        branch: '',
        teacher: '',
        maxStudents: ''
      },
      searchedCourses: [],
      exampleCourses: [
        { id: 1, name: 'İngilizce A1', language: 'İngilizce', branch: 'Kadıköy', day: 'Pazartesi', time: '10:00' },
        { id: 2, name: 'Almanca B1', language: 'Almanca', branch: 'Kadıköy', day: 'Salı', time: '14:00' }
      ],
      branches: [
        { id: 1, name: 'Kadıköy' },
        { id: 2, name: 'Beşiktaş' }
      ],
      courses: [],
      allCourses: [
        { id: 1, name: 'İngilizce A1', language: 'İngilizce', branchId: 1, day: 'Pazartesi', time: '10:00' },
        { id: 2, name: 'Almanca B1', language: 'Almanca', branchId: 1, day: 'Salı', time: '14:00' },
        { id: 3, name: 'Fransızca A2', language: 'Fransızca', branchId: 2, day: 'Çarşamba', time: '16:00' }
      ],
      selectedCourse: null,
      allBranches: [],
      branchMarkers: [],
      availableTeachers: []
    }
  },
  computed: {
    sortedBranches() {
      if (!this.allBranches) return [];
      // En yakın şubeyi en üste al
      return [
        ...this.allBranches.filter(b => b.id === this.nearestBranch?.id),
        ...this.allBranches.filter(b => b.id !== this.nearestBranch?.id)
      ];
    }
  },
  methods: {
    handleLogout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.$router.push('/login');
    },
    formatDate(date) {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('tr-TR');
    },
    async fetchMyCourses() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token bulunamadı');
          return;
        }

        const response = await axios.get('/api/students/my-courses', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        this.myCourses = response.data;
      } catch (error) {
        console.error('Kurslar alınamadı:', error);
        if (error.response?.status === 404) {
          console.log('Öğrenci bulunamadı veya kurs kaydı yok');
        }
      }
    },
    getCoursesAt(day, hour) {
      return this.myCourses.filter(course => {
        if (!course.schedule || !course.schedule[day]) return false;
        const start = this.formatHour(course.schedule[day].start);
        const end = this.formatHour(course.schedule[day].end);
        if (!start || !end) return false;
        return hour >= start && hour < end;
      });
    },
    formatHour(time) {
      if (!time) return null;
      if (typeof time === 'string' && time.includes('T')) {
        const d = new Date(time);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
      }
      if (typeof time === 'string' && time.match(/^\d{2}:\d{2}$/)) {
        return time;
      }
      return null;
    },
    async fetchStudentName() {
      try {
        const response = await axios.get('/api/students/profile');
        this.studentName = response.data.name;
      } catch (error) {
        console.error('Öğrenci adı alınamadı:', error);
      }
    },
    async fetchStudentProfile() {
      try {
        const response = await axios.get('/api/students/profile');
        this.profile = { ...response.data, newPassword: '' };
      } catch (error) {
        console.error('Profil alınamadı:', error);
      }
    },
    async updateProfile() {
      try {
        const payload = { ...this.profile };
        if (!payload.newPassword) delete payload.newPassword;
        const response = await axios.put('/api/students/profile', payload);
        this.profile = { ...response.data, newPassword: '' };
        toast.success('Profil bilgileriniz başarıyla güncellendi.', 'Profil Güncellendi');
      } catch (error) {
        console.error('Profil güncellenemedi:', error);
        toast.error('Profil güncellenirken bir hata oluştu.', 'Güncelleme Hatası');
      }
    },
    // Leaflet haritayı başlat
    initMap() {
      const mapElement = this.$refs.mapContainer;
      if (!mapElement) {
        console.error('Map element not found');
        return;
      }

      try {
        // Haritayı oluştur
        this.map = L.map(mapElement, {
          center: [35.34, 33.32],
          zoom: 12,
          zoomControl: true,
          attributionControl: true
        });

        // OpenStreetMap tile layer ekle
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(this.map);

        // Haritayı yeniden boyutlandır
        setTimeout(() => {
          this.map.invalidateSize();
        }, 100);

        // Haritaya tıklandığında
        this.map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          this.updateLocationMarker(lat, lng);
        });

        // Şube markerlarını ekle
        this.addBranchMarkers();

        console.log('Student page map initialized successfully');
      } catch (error) {
        console.error('Error initializing student page map:', error);
      }
    },
    // Marker'ı güncelle (eski marker'ı kaldır, yeni marker ekle)
    updateLocationMarker(lat, lng) {
      // Harita yüklenmemişse çık
      if (!this.map) {
        console.warn('Map not initialized yet, skipping marker update');
        return;
      }

      try {
        // Eski marker'ı kaldır
        if (this.currentMarker) {
          this.map.removeLayer(this.currentMarker);
          this.currentMarker = null;
        }

        // Kırmızı marker ikonu
        const redIcon = L.icon({
          iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });

        // Yeni marker oluştur
        this.currentMarker = L.marker([lat, lng], {
          draggable: true,
          icon: redIcon
        }).addTo(this.map);

        // Marker sürüklendiğinde koordinatları güncelle
        this.currentMarker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          this.updateCoordinates(lat, lng);
        });

        // İlk koordinatları ayarla
        this.updateCoordinates(lat, lng);
      } catch (error) {
        console.error('Error updating location marker:', error);
      }
    },



    // Koordinatları güncelle ve en yakın şubeyi bul
    updateCoordinates(lat, lng) {
      this.selectedLocation = { 
        lat: parseFloat(lat.toFixed(6)), 
        lng: parseFloat(lng.toFixed(6)) 
      };
      console.log('Konum güncellendi:', this.selectedLocation);
      this.getNearestBranch();
    },

    clearUserLocationMarkers() {
      // Sadece kullanıcı konum markerını temizle
      if (this.currentMarker && this.map) {
        try {
          this.map.removeLayer(this.currentMarker);
          this.currentMarker = null;
        } catch (error) {
          console.warn('Error removing user location marker:', error);
        }
      }
      
      console.log('Kullanıcı konum markeri temizlendi');
    },
    clearAllMarkers() {
      // Tüm markerları temizle (kullanıcı konumu + şube markerları)
      this.clearUserLocationMarkers();
      
      // Şube markerlarını da temizle
      if (this.branchMarkers && this.branchMarkers.length > 0) {
        this.branchMarkers.forEach(marker => {
          if (marker && this.map) {
            try {
              this.map.removeLayer(marker);
            } catch (error) {
              console.warn('Error removing branch marker:', error);
            }
          }
        });
        this.branchMarkers = [];
      }
      
      console.log('Tüm markerlar temizlendi');
    },

    capitalize(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    async getNearestBranch() {
      if (!this.selectedLocation || !this.selectedLocation.lat || !this.selectedLocation.lng) {
        console.log('Konum bilgisi eksik:', this.selectedLocation);
        return;
      }
      try {
        const res = await axios.post('/api/branches/nearest', {
          latitude: this.selectedLocation.lat,
          longitude: this.selectedLocation.lng
        });
        if (res.data.success) {
          this.nearestBranch = res.data.nearestBranch;
          this.allBranches = res.data.allBranches;
          this.selectedBranch = this.nearestBranch;
          this.selectedCourse = null;
          this.courses = [];
          
          // En yakın şubedeki kursları otomatik olarak getir
          if (this.nearestBranch && this.nearestBranch.id) {
            await this.fetchBranchCourses(this.nearestBranch.id);
          }
        } else {
          this.nearestBranch = null;
          console.error('Şubeler bulunamadı:', res.data.message);
        }
      } catch (err) {
        this.nearestBranch = null;
        console.error('Şubeler getirilirken hata:', err);
        this.allBranches = [];
      }
    },
    async fetchBranchCourses(branchId) {
      if (!branchId) return;

      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
        setTimeout(() => {
          this.$router.push('/login');
        }, 2000);
        return;
      }

      this.isLoading = true;
      this.errorMessage = null;

      try {
        const response = await axios.get(`/api/branches/${branchId}/courses`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        this.availableCourses = response.data;
      } catch (error) {
        console.error('Kurslar getirilemedi:', error);
        
        if (error.response?.status === 401) {
          this.errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
          setTimeout(() => {
            this.$router.push('/login');
          }, 2000);
        } else if (error.response?.status === 404) {
          this.errorMessage = 'Kurslar bulunamadı.';
        } else {
          this.errorMessage = 'Kurslar getirilirken bir hata oluştu.';
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    formatSchedule(schedule) {
      if (!schedule) return '';
      const days = Object.keys(schedule);
      return days.map(day => {
        const time = schedule[day];
        return `${day}: ${time.start}-${time.end}`;
      }).join(', ');
    },
    
    isRegistered(courseId) {
      return this.myCourses.some(course => course.id === courseId);
    },
    
    async registerToCourse(courseId) {
      try {
        await axios.post(`/api/students/courses/${courseId}`);
        await this.fetchMyCourses();
        if (this.selectedBranch && this.selectedBranch.id) {
          await this.fetchBranchCourses(this.selectedBranch.id);
        }
        // Success mesajı register fonksiyonlarında gösteriliyor
      } catch (error) {
        console.error('Kurs kaydı hatası:', error);
        throw error; // Hatayı yukarı ilet
      }
    },
    selectBranch(branch) {
      this.selectedBranch = branch;
      this.selectedCourse = null;
      this.courses = this.allCourses.filter(c => c.branchId === branch.id);
    },
    selectCourse(course) {
      if (typeof course === 'string' || typeof course === 'number') {
        this.selectedCourse = this.availableCourses.find(c => c.id == course);
      } else {
        this.selectedCourse = course;
      }
    },
    async registerToSelectedCourse() {
      if (!this.selectedCourse) return;
      const currentCount = this.selectedCourse.student_count || 0;
      const maxCount = this.selectedCourse.max_students || 0;
      if (maxCount > 0 && currentCount >= maxCount) {
        toast.error('Kurs dolu, kayıt yapılamaz.', 'Kayıt Hatası');
      } else {
        try {
          await this.registerToCourse(this.selectedCourse.id);
          toast.success('Kursa başarıyla kayıt oldunuz!', 'Kayıt Başarılı');
        } catch (error) {
          toast.error('Kayıt sırasında bir hata oluştu.', 'Kayıt Hatası');
        }
      }
    },
    async searchCourses() {
      try {
        this.isLoading = true;
        this.errorMessage = null;

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        }

        const params = {};
        if (this.searchFilters.language) params.language = this.searchFilters.language;
        if (this.searchFilters.level) params.level = this.searchFilters.level;
        if (this.searchFilters.status) params.status = this.searchFilters.status;
        if (this.searchFilters.day) params.day = this.searchFilters.day;
        if (this.searchFilters.timeSlot) params.timeSlot = this.searchFilters.timeSlot;
        if (this.searchFilters.branch) params.branch = this.searchFilters.branch;
        if (this.searchFilters.teacher) params.teacher = this.searchFilters.teacher;
        if (this.searchFilters.maxStudents) params.maxStudents = this.searchFilters.maxStudents;

        const response = await axios.get('/api/courses/student-search', {
          params,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          this.searchedCourses = response.data.courses;
          if (this.searchedCourses.length === 0) {
            toast.info('Arama kriterlerinize uygun kurs bulunamadı.', 'Arama Sonucu');
          } else {
            toast.success(`${this.searchedCourses.length} kurs bulundu.`, 'Arama Başarılı');
          }
        } else {
          this.errorMessage = 'Kurslar getirilirken bir hata oluştu.';
          toast.error(this.errorMessage);
        }
      } catch (error) {
        console.error('Kurs arama hatası:', error);
        if (error.response && error.response.status === 404) {
          this.errorMessage = 'Kurs bulunamadı';
          toast.info('Arama kriterlerinize uygun kurs bulunamadı.', 'Arama Sonucu');
        } else {
          this.errorMessage = error.response?.data?.error || 'Kurs arama sırasında bir hata oluştu.';
          toast.error(this.errorMessage, 'Arama Hatası');
        }
        this.searchedCourses = [];
      } finally {
        this.isLoading = false;
      }
    },
    async onBranchChange() {
      if (this.selectedBranch) {
        await this.fetchBranchCourses(this.selectedBranch.id);
      } else {
        this.availableCourses = [];
      }
    },
    async registerToSearchedCourse(course) {
      const currentCount = course.student_count || 0;
      const maxCount = course.max_students || 0;
      if (maxCount > 0 && currentCount >= maxCount) {
        toast.error('Kurs dolu, kayıt yapılamaz.', 'Kayıt Hatası');
      } else {
        try {
          await this.registerToCourse(course.id);
          toast.success('Kursa başarıyla kayıt oldunuz!', 'Kayıt Başarılı');
        } catch (error) {
          toast.error('Kayıt sırasında bir hata oluştu.', 'Kayıt Hatası');
        }
      }
    },

    showSuccess(message, title = 'Başarılı') {
      toast.success(message, title);
    },
    showError(message, title = 'Hata') {
      toast.error(message, title);
    },
    onBranchListClick(branch) {
      this.selectedBranch = branch;
      this.fetchBranchCourses(branch.id);
    },
    // Şube markerlarını ekle
    addBranchMarkers() {
      // Harita yüklenmemişse çık
      if (!this.map) {
        console.warn('Map not initialized yet, skipping branch markers');
        return;
      }

      // Eski şube markerlarını temizle
      if (this.branchMarkers && this.branchMarkers.length > 0) {
        this.branchMarkers.forEach(marker => {
          try {
            this.map.removeLayer(marker);
          } catch (error) {
            console.warn('Error removing old branch marker:', error);
          }
        });
        this.branchMarkers = [];
      }
      
      if (!this.allBranches) return;

      try {
        // Yeni şube markerlarını ekle
        this.allBranches.forEach(branch => {
          if (branch.latitude && branch.longitude) {
            const branchIcon = L.icon({
              iconUrl: branchIconPng,
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            });

            const marker = L.marker([parseFloat(branch.latitude), parseFloat(branch.longitude)], {
              icon: branchIcon
            }).addTo(this.map);

            // Şube marker'ına tıklandığında popup
            marker.bindPopup(`<div style="padding: 8px 12px;">
                               <strong style="color: #2196F3; font-size: 16px;">${branch.name}</strong>
                             </div>`);

            this.branchMarkers.push(marker);
          }
        });
      } catch (error) {
        console.error('Error adding branch markers:', error);
      }
    },
    async fetchAllBranches() {
      try {
        const response = await axios.get('/api/branches');
        this.allBranches = response.data;
      } catch (error) {
        console.error('Şubeler alınamadı:', error);
        this.allBranches = [];
      }
    },
    async fetchAvailableTeachers() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/teachers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        this.availableTeachers = response.data;
      } catch (error) {
        console.error('Öğretmenler alınamadı:', error);
        this.availableTeachers = [];
      }
    },
    clearFilters() {
      this.searchFilters = {
        language: '',
        level: '',
        status: '',
        day: '',
        timeSlot: '',
        branch: '',
        teacher: '',
        maxStudents: ''
      };
    }
  },
  mounted() {
    this.fetchMyCourses();
    this.fetchStudentName();
    this.fetchStudentProfile();
    // Harita açılır açılmaz tüm şubeleri getir
    this.fetchAllBranches();
    this.fetchAvailableTeachers();
  },

  beforeUnmount() {
    // Component yok edilmeden önce tüm markerları temizle
    if (this.currentMarker && this.map) {
      try {
        this.map.removeLayer(this.currentMarker);
        this.currentMarker = null;
      } catch (error) {
        console.warn('Error removing current marker on unmount:', error);
      }
    }
    
    if (this.branchMarkers && this.branchMarkers.length > 0) {
      this.branchMarkers.forEach(marker => {
        if (this.map) {
          try {
            this.map.removeLayer(marker);
          } catch (error) {
            console.warn('Error removing branch marker on unmount:', error);
          }
        }
      });
      this.branchMarkers = [];
    }
    
    // Haritayı kaldır
    if (this.map) {
      try {
        this.map.remove();
        this.map = null;
      } catch (error) {
        console.warn('Error removing map on unmount:', error);
      }
    }
    
    console.log('Tüm markerlar ve harita temizlendi (component unmount)');
  },
  watch: {
    currentTab(newTab) {
      if (newTab === 'register') {
        this.$nextTick(() => {
          // Harita yoksa oluştur, varsa sadece marker'ları temizle
          if (!this.map) {
            this.initMap();
          } else {
            // Harita zaten varsa sadece kullanıcı marker'ını temizle
            this.clearUserLocationMarkers();
            // Haritayı yeniden boyutlandır
            setTimeout(() => {
              this.map.invalidateSize();
            }, 100);
          }
        });
      } else {
        // Diğer tablara geçince sadece kullanıcı konum markerlarını temizle
        if (this.map) {
          this.clearUserLocationMarkers();
        }
      }
    },
    selectedLocation: {
      deep: true,
      handler(newLocation) {
        if (newLocation.lat && newLocation.lng) {
          this.getNearestBranch();
        }
      }
    },
    allBranches() {
      // Harita varsa ve register tab'indaysak şube markerlarını ekle
      if (this.map && this.currentTab === 'register') {
        this.$nextTick(() => {
          this.addBranchMarkers();
        });
      }
    }
  }
}
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

.student-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.student-header {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.student-header h1 {
  color: white;
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 15px;
}

.student-header h1::before {
  content: '\f19d';
  font-family: 'Font Awesome 6 Free';
  font-weight: 900;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.logout-btn::before {
  content: '\f2f5';
  font-family: 'Font Awesome 6 Free';
  font-weight: 900;
  margin-right: 8px;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.student-content {
  display: flex;
  gap: 30px;
}

.student-nav {
  width: 280px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 25px;
  height: fit-content;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.nav-btn {
  width: 100%;
  padding: 18px 20px;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-weight: 500;
  font-size: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn:nth-child(1)::before { content: '\f19d'; font-family: 'Font Awesome 6 Free'; font-weight: 900; }
.nav-btn:nth-child(2)::before { content: '\f133'; font-family: 'Font Awesome 6 Free'; font-weight: 900; }
.nav-btn:nth-child(3)::before { content: '\f007'; font-family: 'Font Awesome 6 Free'; font-weight: 900; }
.nav-btn:nth-child(4)::before { content: '\f067'; font-family: 'Font Awesome 6 Free'; font-weight: 900; }

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(8px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.nav-btn.active {
  background: rgba(255, 255, 255, 0.25);
  font-weight: 700;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  transform: translateX(5px);
}

.tab-content {
  flex: 1;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

h2 {
  margin-top: 0;
  color: white;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 700;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 15px;
}

.courses-tab h2::before {
  content: '\f19d';
  font-family: 'Font Awesome 6 Free';
  font-weight: 900;
}

.schedule-tab h2::before {
  content: '\f133';
  font-family: 'Font Awesome 6 Free';
  font-weight: 900;
}

.profile-tab h2::before {
  content: '\f007';
  font-family: 'Font Awesome 6 Free';
  font-weight: 900;
}

.register-tab h2::before {
  content: '\f067';
  font-family: 'Font Awesome 6 Free';
  font-weight: 900;
}

.courses-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.course-item {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.course-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.course-item h3 {
  color: white;
  margin: 0 0 15px 0;
  font-size: 1.3rem;
  font-weight: 700;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

.course-item p {
  color: rgba(255, 255, 255, 0.9);
  margin: 8px 0;
  font-weight: 500;
}

.weekly-schedule-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.weekly-schedule-table th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 10px;
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  border: none;
}

.weekly-schedule-table td {
  padding: 12px 8px;
  text-align: center;
  min-width: 80px;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  font-weight: 500;
}

.course-cell {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 8px;
  margin: 2px 0;
  padding: 6px 8px;
  font-size: 0.9em;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.welcome-message {
  color: white;
  font-size: 1.2rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  font-weight: 500;
}

.profile-form {
  max-width: 600px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.form-group input {
  width: 100%;
  padding: 15px 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  color: white;
  font-size: 16px;
  transition: all 0.3s ease;
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.form-group input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.save-btn {
  padding: 15px 30px;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-weight: 700;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
  position: relative;
  overflow: hidden;
}

.save-btn::before {
  content: '\f0c7';
  font-family: 'Font Awesome 6 Free';
  font-weight: 900;
  margin-right: 10px;
}

.save-btn:hover {
  background: linear-gradient(135deg, #45a049 0%, #4CAF50 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.5);
}

.register-tab {
  background: transparent;
}

.search-section {
  margin: 24px 0 32px 0;
  padding: 28px 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.search-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-weight: 600;
  color: white;
  margin-bottom: 2px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  font-size: 0.9rem;
}

.filter-group select,
.filter-group .price-input {
  padding: 10px 12px;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  min-width: 160px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  transition: all 0.3s ease;
}

.filter-group select:focus,
.filter-group .price-input:focus {
  border-color: #2196F3;
  outline: none;
  background: white;
  box-shadow: 0 0 10px rgba(33, 150, 243, 0.3);
  transform: translateY(-1px);
}

.price-input::placeholder {
  color: #666;
  font-style: italic;
}

.filter-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 10px;
}

.search-btn,
.clear-btn {
  padding: 12px 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  justify-content: center;
}

.search-btn {
  background: linear-gradient(135deg, #2196F3 0%, #4CAF50 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
}

.search-btn:hover {
  background: linear-gradient(135deg, #1976d2 0%, #388e3c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
}

.clear-btn {
  background: linear-gradient(135deg, #f44336 0%, #e91e63 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
}

.clear-btn:hover {
  background: linear-gradient(135deg, #d32f2f 0%, #c2185b 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
}

@media (max-width: 1200px) {
  .search-filters {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 768px) {
  .search-filters {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .filter-actions {
    grid-column: 1 / -1;
    flex-direction: column;
    align-items: center;
  }
  
  .search-btn,
  .clear-btn {
    width: 100%;
    max-width: 200px;
  }
}

@media (max-width: 480px) {
  .search-filters {
    grid-template-columns: 1fr;
  }
}

.search-results {
  margin-top: 24px;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 28px;
  margin-top: 18px;
}

.course-card {
  background: #fff;
  padding: 22px 18px 18px 18px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(33,150,243,0.10), 0 1.5px 4px rgba(0,0,0,0.04);
  border: 1.5px solid #e3e3e3;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: box-shadow 0.2s, border 0.2s, transform 0.2s;
  min-height: 210px;
}
.course-card:hover {
  box-shadow: 0 8px 32px rgba(33,150,243,0.18), 0 2px 8px rgba(0,0,0,0.10);
  border-color: #2196F3;
  transform: translateY(-4px) scale(1.02);
}
.course-card h5 {
  margin: 0 0 8px 0;
  color: #1976d2;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.course-card p {
  margin: 3px 0;
  color: #444;
  font-size: 0.99rem;
  line-height: 1.5;
}
.course-card p strong {
  color: #2196F3;
  font-weight: 600;
}
.register-btn {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  background: linear-gradient(90deg, #4CAF50 0%, #2196F3 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  box-shadow: 0 2px 8px rgba(33,150,243,0.08);
  transition: background 0.2s;
}
.register-btn:hover {
  background: linear-gradient(90deg, #388e3c 0%, #1976d2 100%);
}

.location-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.location-input {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 15px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.input-group label {
  font-weight: 500;
  color: #333;
}

.input-group input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.input-group input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.branches-list-section {
  margin: 24px 0 16px 0;
  padding: 18px 16px;
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(33,150,243,0.08);
}
.branches-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.branch-list-item {
  padding: 12px 18px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.08em;
  border: 2px solid transparent;
  transition: box-shadow 0.2s, border 0.2s, background 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
}
.branch-list-item.selected {
  border: 2px solid #4CAF50;
  background: #e8f5e9;
  font-weight: 600;
}
.branch-list-item:hover {
  background: #f1f8e9;
  border-color: #81c784;
}
.branch-distance {
  color: #2196F3;
  font-size: 0.98em;
  margin-left: 8px;
}
.branch-courses-section {
  margin: 24px 0 0 0;
  padding: 18px 16px;
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(33,150,243,0.08);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.loading-spinner p {
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #dc3545;
  margin-top: 10px;
  padding: 10px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #dc3545;
}

.course-list-section {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.course-list-section h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.2em;
}

.course-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  padding: 16px;
  min-width: 200px;
}

.course-card h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.course-card p {
  margin: 5px 0;
  color: #666;
}

.branches-grid {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}
.branch-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  padding: 16px;
  min-width: 120px;
  cursor: pointer;
  transition: box-shadow 0.2s, border 0.2s;
  border: 2px solid transparent;
}
.branch-card.selected {
  border: 2px solid #4CAF50;
  box-shadow: 0 4px 8px rgba(76,175,80,0.12);
}
.course-card.selected {
  border: 2px solid #2196F3;
  box-shadow: 0 4px 8px rgba(33,150,243,0.12);
}
.course-detail-section {
  margin-top: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}

.nearest-branch-card {
  margin: 20px 0 10px 0;
  padding: 18px 24px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(33,150,243,0.08);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.nearest-branch-card h3 {
  margin: 0 0 8px 0;
  color: #2196F3;
  font-size: 1.1rem;
}
.nearest-branch-card-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.branch-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}
.branch-distance {
  font-size: 0.95rem;
  color: #666;
}

.branch-selection {
  margin: 20px 0;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.branch-selection label {
  display: block;
  margin-bottom: 8px;
  color: #333;
}

.branch-select, .course-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  margin-top: 5px;
}

.course-selection {
  margin: 20px 0;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.course-selection label {
  display: block;
  margin-bottom: 8px;
  color: #333;
}

h3 {
  color: #333;
  margin-bottom: 15px;
}

.courses-tab {
  margin-bottom: 2rem;
}
.courses-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 20px;
}
.course-item {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(33,150,243,0.08), 0 1.5px 4px rgba(0,0,0,0.04);
  padding: 24px 20px 18px 20px;
  transition: box-shadow 0.2s, transform 0.2s;
  border: 1px solid #e3e3e3;
  position: relative;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.course-item:hover {
  box-shadow: 0 8px 24px rgba(33,150,243,0.16), 0 2px 8px rgba(0,0,0,0.08);
  transform: translateY(-4px) scale(1.02);
  border-color: #2196F3;
}
.course-item h3 {
  margin: 0 0 10px 0;
  color: #1976d2;
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.course-item p {
  margin: 4px 0;
  color: #444;
  font-size: 0.98rem;
  line-height: 1.5;
}
.course-item p strong {
  color: #2196F3;
  font-weight: 500;
}
@media (max-width: 700px) {
  .courses-list {
    grid-template-columns: 1fr;
  }
  .course-item {
    padding: 18px 10px 14px 10px;
  }
}

@media (max-width: 900px) {
  .courses-grid {
    grid-template-columns: 1fr;
  }
  .register-tab {
    padding: 16px 4px;
  }
  .search-section {
    padding: 16px 4px;
  }
}

/* Leaflet için özel stiller */
:deep(.leaflet-container) {
  height: 400px !important;
  width: 100% !important;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

:deep(.leaflet-control-zoom) {
  border: none !important;
  border-radius: 8px !important;
}

:deep(.leaflet-control-zoom a) {
  background-color: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid #ddd !important;
  color: #333 !important;
  font-size: 16px !important;
  line-height: 28px !important;
  text-decoration: none !important;
}

:deep(.leaflet-control-zoom a:hover) {
  background-color: #fff !important;
  color: #2196F3 !important;
}
</style> 