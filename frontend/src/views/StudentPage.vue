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
            <div class="form-group">
              <label>Profil Fotoğrafı</label>
              <ImageUploader
                v-model="profile.image_path"
                :upload-url="'/api/students/profile/image'"
                placeholder-text="Profil fotoğrafını buraya sürükleyin veya tıklayın"
                @upload-success="handleProfileImageUpload"
              />
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
                <label>Kurs:</label>
                <select v-model="searchFilters.language">
                  <option value="">Tümü</option>
                  <option value="İngilizce">İngilizce</option>
                  <option value="Almanca">Almanca</option>
                  <option value="Fransızca">Fransızca</option>
                  <option value="İspanyolca">İspanyolca</option>
                  <option value="Türkçe">Türkçe</option>
                </select>
              </div>
              <div class="filter-group">
                <label>Gün:</label>
                <select v-model="searchFilters.day">
                  <option value="">Tümü</option>
                  <option v-for="day in weekDays" :key="day" :value="day">{{ day }}</option>
                </select>
              </div>
              <button @click="searchCourses" class="search-btn">Ara</button>
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
                  <p><strong>Şube:</strong> {{ course.branch_name }}</p>
                  <p><strong>Adres:</strong> {{ course.branch_address }}</p>
                  <p><strong>Öğretmen:</strong> {{ course.teacher_name }}</p>
                  <p><strong>Gün/Saat:</strong> {{ formatSchedule(course.schedule) }}</p>
                  <p><strong>Maksimum Öğrenci:</strong> {{ course.max_students }}</p>
                  <button class="select-btn" @click="selectCourse(course)">Seç</button>
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
          </div>

          

          

          <div v-if="selectedCourse" class="course-detail-section">
            <h3>Kurs Detayları</h3>
            <p><strong>Kurs Adı:</strong> {{ selectedCourse.name }}</p>
            <p><strong>Dil:</strong> {{ selectedCourse.language }}</p>
            <p><strong>Şube:</strong> {{ selectedCourse.branch_name }}</p>
            <p><strong>Adres:</strong> {{ selectedCourse.branch_address }}</p>
            <p><strong>Öğretmen:</strong> {{ selectedCourse.teacher_name }}</p>
            <p><strong>Gün/Saat:</strong> {{ formatSchedule(selectedCourse.schedule) }}</p>
            <p><strong>Maksimum Öğrenci:</strong> {{ selectedCourse.max_students }}</p>
            <button class="register-btn" @click="registerToSelectedCourse">Kursa Kayıt Ol</button>
          </div>

          <!-- Şube Seçimi -->
          <div class="branch-selection" v-if="allBranches && allBranches.length > 0">
            <label for="branch-select"><strong>Şube Seçimi</strong></label>
            <select id="branch-select" v-model="selectedBranch" class="branch-select" @change="onBranchChange">
              <option value="">Şube Seçiniz</option>
              <option v-for="branch in allBranches" 
                      :key="branch.id" 
                      :value="branch">
                {{ capitalize(branch.name) }}
              </option>
            </select>
          </div>

          <!-- Kurs Seçimi -->
          <div class="course-selection" v-if="selectedBranch">
            <label for="course-select"><strong>Kurs Seçimi</strong></label>
            <select id="course-select" v-model="selectedCourse" class="course-select">
              <option value="">Kurs Seçiniz</option>
              <option v-for="course in availableCourses" 
                      :key="course.id" 
                      :value="course">
                {{ course.name }} - {{ course.language }}
              </option>
            </select>
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
import ImageUploader from '@/components/ImageUploader.vue';

export default {
  name: 'StudentPage',
  components: { ImageUploader },
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
      marker: null,
      mapLoaded: false,
      mapLoadError: false,
      mapLoadAttempted: false,
      isLoading: false,
      errorMessage: null,
      selectedBranch: null,
      searchFilters: {
        language: '',
        day: '',
        time: ''
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
      allBranches: []
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
      if (!date) return '';
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
      } catch (error) {
        console.error('Profil güncellenemedi:', error);
      }
    },
    loadGoogleMapsScript() {
      if (window.google && window.google.maps) {
        this.initMap();
        return;
      }

      window.initMap = () => {
        this.initMap();
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyA1q1I6HAQ_A_Hq1pzkBVXyIC8bBvnVMAQ&callback=initMap&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    },
    initMap() {
      const container = this.$refs.mapContainer;
      if (!container) return;

      const mapOptions = {
        center: { lat: 41.0082, lng: 28.9784 },
        zoom: 12,
        mapTypeId: 'roadmap'
      };

      this.map = new window.google.maps.Map(container, mapOptions);

      // Marker referansını sıfırla
      this.marker = null;

      this.map.addListener('click', (event) => {
        // Tüm markerları temizle (sadece bir marker olacak)
        if (this.marker) {
          this.marker.setMap(null);
        }

        this.marker = new window.google.maps.Marker({
          position: event.latLng,
          map: this.map,
          title: 'Seçilen Konum'
        });

        this.selectedLocation = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        this.getNearestBranch();
      });
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
        await this.fetchBranchCourses(this.selectedBranch.id);
      } catch (error) {
        console.error('Kurs kaydı hatası:', error);
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
        alert('Kurs dolu, kayıt yapılamaz.');
      } else {
        await this.registerToCourse(this.selectedCourse.id);
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
        if (this.searchFilters.day) params.day = this.searchFilters.day;
        if (this.searchFilters.time) params.time = this.searchFilters.time;

        const response = await axios.get('/api/courses/student-search', {
          params,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          this.searchedCourses = response.data.courses;
        } else {
          this.errorMessage = 'Kurslar getirilirken bir hata oluştu.';
          alert(this.errorMessage);
        }
      } catch (error) {
        console.error('Kurs arama hatası:', error);
        if (error.response && error.response.status === 404) {
          this.errorMessage = 'Kurs bulunamadı';
          alert('Kurs bulunamadı');
        } else {
          this.errorMessage = error.response?.data?.error || 'Kurs arama sırasında bir hata oluştu.';
          alert(this.errorMessage);
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
        alert('Kurs dolu, kayıt yapılamaz.');
      } else {
        await this.registerToCourse(course.id);
      }
    },
    getImageUrl(path) {
      if (!path) return 'https://via.placeholder.com/120x120?text=Profil';
      if (path.startsWith('http')) return path;
      return `http://localhost:3000${path}`;
    },
    async handleProfileImageUpload(imagePath) {
      try {
        this.profile.image_path = imagePath;
        // Profil bilgilerini güncelle
        await this.updateProfile();
        this.showSuccess('Profil fotoğrafı başarıyla güncellendi');
      } catch (error) {
        console.error('Profil fotoğrafı güncellenirken hata:', error);
        this.showError('Profil fotoğrafı güncellenirken bir hata oluştu');
      }
    },
    showSuccess(message) {
      alert(message); // veya daha güzel bir bildirim sistemi kullanabilirsiniz
    },
    showError(message) {
      alert(message); // veya daha güzel bir bildirim sistemi kullanabilirsiniz
    }
  },
  mounted() {
    this.fetchMyCourses();
    this.fetchStudentName();
    this.fetchStudentProfile();
  },
  watch: {
    currentTab(newTab) {
      if (newTab === 'register') {
        this.$nextTick(() => {
          this.loadGoogleMapsScript();
        });
      }
    },
    selectedLocation: {
      deep: true,
      handler(newLocation) {
        if (newLocation.lat && newLocation.lng) {
          this.getNearestBranch();
        }
      }
    }
  }
}
</script>

<style scoped>
.student-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.student-header {
  background-color: #fff;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.student-header h1 {
  margin: 0;
  color: #333;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.student-content {
  padding: 2rem;
  display: flex;
  gap: 2rem;
}

.student-nav {
  width: 200px;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.nav-btn {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  text-align: left;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
}

.nav-btn:hover {
  background-color: #f5f5f5;
}

.nav-btn.active {
  background-color: #2196F3;
  color: white;
}

.tab-content {
  flex: 1;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h2 {
  margin-top: 0;
  color: #333;
  margin-bottom: 1.5rem;
}

.weekly-schedule-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}
.weekly-schedule-table th, .weekly-schedule-table td {
  border: 1px solid #ddd;
  padding: 6px;
  text-align: center;
  min-width: 80px;
}
.course-cell {
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 6px;
  margin: 2px 0;
  padding: 2px 4px;
  font-size: 0.95em;
}

.welcome-message {
  font-size: 1.2rem;
  color: #666;
}

.profile-form {
  max-width: 500px;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
}
.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.save-btn {
  padding: 0.5rem 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.register-tab {
  max-width: 1200px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(33,150,243,0.10), 0 1.5px 4px rgba(0,0,0,0.04);
  padding: 32px 24px 32px 24px;
}

.search-section {
  margin: 24px 0 32px 0;
  padding: 28px 24px;
  background: #f4f8fb;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(33,150,243,0.06);
}

.search-filters {
  display: flex;
  gap: 24px;
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
  color: #1976d2;
  margin-bottom: 2px;
}

.filter-group select {
  padding: 10px;
  border: 1.5px solid #b3c6e0;
  border-radius: 6px;
  min-width: 160px;
  font-size: 15px;
  background: #fff;
  transition: border 0.2s;
}
.filter-group select:focus {
  border-color: #2196F3;
  outline: none;
}

.search-btn {
  padding: 10px 28px;
  background: linear-gradient(90deg, #2196F3 0%, #4CAF50 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  align-self: flex-end;
  box-shadow: 0 2px 8px rgba(33,150,243,0.08);
  transition: background 0.2s;
}
.search-btn:hover {
  background: linear-gradient(90deg, #1976d2 0%, #388e3c 100%);
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
.select-btn, .register-btn {
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
.select-btn:hover, .register-btn:hover {
  background: linear-gradient(90deg, #388e3c 0%, #1976d2 100%);
}

.location-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
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

.branches-section {
  margin: 20px 0;
  padding: 0 20px;
}

.nearest-branch {
  margin-bottom: 20px;
}

.branch-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.branch-item {
  padding: 12px 15px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.1em;
}

.branch-item:hover {
  background-color: #f5f5f5;
  transform: translateX(5px);
}

.branch-item.selected {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.2em;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
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
</style> 