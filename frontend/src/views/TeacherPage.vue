<template>
  <div class="teacher-container">
    <header class="teacher-header">
      <div class="header-left">
        <div class="teacher-avatar">
          <img 
            v-if="profile.image_path" 
            :src="`http://localhost:3000${profile.image_path}`" 
            :alt="teacherName"
            class="avatar-img"
          />
          <div v-else class="avatar-placeholder">
            <i class="fas fa-user"></i>
          </div>
        </div>
        <div class="header-info">
          <h1>Öğretmen Paneli</h1>
          <div class="welcome-message">Hoş geldin, {{ teacherName }}</div>
        </div>
      </div>
      <button @click="handleLogout" class="logout-btn">
        <i class="fas fa-sign-out-alt"></i>
        Çıkış Yap
      </button>
    </header>
    
    <div class="teacher-content">
      <nav class="teacher-nav">
        <div class="nav-header">
          <h3>Menü</h3>
        </div>
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['nav-btn', { active: currentTab === tab.id }]"
          @click="currentTab = tab.id"
        >
          <i :class="tab.icon"></i>
          <span>{{ tab.name }}</span>
        </button>
      </nav>

      <div class="tab-content">
        <!-- Dersler Tab -->
        <div v-if="currentTab === 'courses'" class="courses-tab">
          <div class="tab-header">
            <h2><i class="fas fa-book"></i> Derslerim</h2>
            <div class="course-count">{{ teacherCourses.length }} Ders</div>
          </div>
          <div class="courses-grid">
            <div v-for="course in teacherCourses" :key="course.id" class="course-card">
              <div class="course-header">
                <h3>{{ course.name }}</h3>
                <span class="course-language">{{ course.language }}</span>
              </div>
              <div class="course-details">
                <div class="detail-item">
                  <i class="fas fa-calendar-start"></i>
                  <span>{{ formatDate(course.start_date) }}</span>
                </div>
                <div class="detail-item">
                  <i class="fas fa-calendar-check"></i>
                  <span>{{ formatDate(course.end_date) }}</span>
                </div>
                <div class="detail-item" v-if="course.level">
                  <i class="fas fa-star"></i>
                  <span>{{ course.level }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Öğrenciler Tab -->
        <div v-if="currentTab === 'students'" class="students-tab">
          <div class="tab-header">
            <h2><i class="fas fa-users"></i> Öğrencilerim</h2>
            <div class="student-count">{{ teacherStudents.length }} Öğrenci</div>
          </div>
          <div class="students-grid">
            <div v-for="student in teacherStudents" :key="student.id" class="student-card">
              <div class="student-header">
                <div class="student-avatar">
                  <img 
                    v-if="student.image_path" 
                    :src="`http://localhost:3000${student.image_path}`" 
                    :alt="student.name"
                    class="student-img"
                  />
                  <div v-else class="student-placeholder">
                    <i class="fas fa-user"></i>
                  </div>
                </div>
                <div class="student-info">
                  <h3>{{ student.name }}</h3>
                  <div class="contact-info">
                    <div class="contact-item">
                      <i class="fas fa-envelope"></i>
                      <span>{{ student.email }}</span>
                    </div>
                    <div class="contact-item" v-if="student.phone">
                      <i class="fas fa-phone"></i>
                      <span>{{ student.phone }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="enrolled-courses" v-if="student.courses && student.courses.length">
                <h4><i class="fas fa-book"></i> Kayıtlı Kurslar</h4>
                <div class="course-tags">
                  <span v-for="course in student.courses" :key="course.id" class="course-tag">
                    {{ course.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Program Tab -->
        <div v-if="currentTab === 'schedule'" class="schedule-tab">
          <div class="tab-header">
            <h2><i class="fas fa-calendar-alt"></i> Ders Programı</h2>
          </div>
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
                    <span @click="toggleCourseStudents(course.id)">
                      {{ course.name }}
                    </span>
                    <ul v-if="expandedCourseId === course.id && course.students && course.students.length" class="student-list">
                      <li v-for="student in course.students" :key="student.id">
                        {{ student.name }}
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bilgilerim Tab -->
        <div v-if="currentTab === 'profile'" class="profile-tab">
          <div class="tab-header">
            <h2><i class="fas fa-user-edit"></i> Bilgilerim</h2>
          </div>
          <div class="profile-content">
            <div class="profile-avatar-section">
              <div class="large-avatar">
                <img 
                  v-if="profile.image_path" 
                  :src="`http://localhost:3000${profile.image_path}`" 
                  :alt="profile.name"
                  class="profile-img"
                />
                <div v-else class="profile-placeholder">
                  <i class="fas fa-user"></i>
                </div>
              </div>
            </div>
            <form @submit.prevent="updateProfile" class="profile-form">
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-user"></i> Ad Soyad</label>
                  <input type="text" v-model="profile.name" required>
                </div>
                <div class="form-group">
                  <label><i class="fas fa-envelope"></i> E-posta</label>
                  <input type="email" v-model="profile.email" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-phone"></i> Telefon</label>
                  <input type="tel" v-model="profile.phone">
                </div>
                <div class="form-group">
                  <label><i class="fas fa-lock"></i> Yeni Şifre</label>
                  <input type="password" v-model="profile.newPassword" placeholder="Şifre değiştirmek istemiyorsanız boş bırakın">
                </div>
              </div>
              <button type="submit" class="save-btn">
                <i class="fas fa-save"></i>
                Bilgileri Güncelle
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import toast from '@/utils/toast';

export default {
  name: 'TeacherPage',
  data() {
    return {
      currentTab: 'courses',
      tabs: [
        { id: 'courses', name: 'Derslerim', icon: 'fas fa-book' },
        { id: 'students', name: 'Öğrencilerim', icon: 'fas fa-users' },
        { id: 'schedule', name: 'Ders Programı', icon: 'fas fa-calendar-alt' },
        { id: 'profile', name: 'Bilgilerim', icon: 'fas fa-user-edit' }
      ],
      teacherName: '',
      teacherCourses: [],
      teacherStudents: [],
      profile: {
        name: '',
        email: '',
        phone: '',
        newPassword: ''
      },
      weekDays: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
      hours: [
        '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
      ],
      expandedCourseId: null
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
    async fetchTeacherData() {
      try {
        const response = await axios.get('/api/teachers/profile');
        this.teacherName = response.data.name;
        this.profile = { ...response.data };
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      }
    },
    async fetchTeacherCourses() {
      try {
        const response = await axios.get('/api/teachers/courses');
        this.teacherCourses = response.data;
      } catch (error) {
        console.error('Error fetching teacher courses:', error);
      }
    },
    async fetchTeacherStudents() {
      try {
        console.log('Öğrenciler getiriliyor...');
        const response = await axios.get('/api/teachers/students');
        console.log('Öğrenci verileri:', response.data);
        this.teacherStudents = response.data;
      } catch (error) {
        console.error('Error fetching teacher students:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
        }
      }
    },
    async updateProfile() {
      try {
        const response = await axios.put('/api/teachers/profile', this.profile);
        if (response.data) {
          this.teacherName = response.data.name;
          this.profile = { ...response.data };
          toast.success('Bilgileriniz başarıyla güncellendi.');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        if (error.response?.data?.error) {
          toast.error(error.response.data.error);
        } else {
          toast.error('Bilgileriniz güncellenirken bir hata oluştu.');
        }
      }
    },
    getCoursesAt(day, hour) {
      // hour: '09:00' gibi string
      // course.schedule[day].start ve end saatlerini kontrol et
      return this.teacherCourses.filter(course => {
        if (!course.schedule || !course.schedule[day]) return false;
        const start = this.formatHour(course.schedule[day].start);
        const end = this.formatHour(course.schedule[day].end);
        if (!start || !end) return false;
        // hour >= start && hour < end ise o saatte bu ders var
        return hour >= start && hour < end;
      });
    },
    formatHour(time) {
      if (!time) return null;
      // Eğer time bir Date string ise, saat:dakika kısmını al
      if (typeof time === 'string' && time.includes('T')) {
        const d = new Date(time);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
      }
      // Eğer doğrudan saat formatında ise (örn: '09:00'), direkt döndür
      if (typeof time === 'string' && time.match(/^\d{2}:\d{2}$/)) {
        return time;
      }
      return null;
    },
    toggleCourseStudents(courseId) {
      this.expandedCourseId = this.expandedCourseId === courseId ? null : courseId;
    }
  },
  mounted() {
    this.fetchTeacherData();
    this.fetchTeacherCourses();
    this.fetchTeacherStudents();
  }
}
</script>

<style scoped>
.teacher-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.teacher-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.teacher-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 24px;
}

.header-info h1 {
  margin: 0 0 0.25rem 0;
  color: #2d3748;
  font-size: 1.8rem;
  font-weight: 600;
}

.welcome-message {
  font-size: 1rem;
  color: #667eea;
  font-weight: 500;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
}

.logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.teacher-content {
  padding: 2rem;
  display: flex;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.teacher-nav {
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 0;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  height: fit-content;
}

.nav-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
}

.nav-header h3 {
  margin: 0;
  color: #2d3748;
  font-weight: 600;
  font-size: 1.1rem;
}

.nav-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  font-weight: 500;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.nav-btn:hover {
  background: rgba(102, 126, 234, 0.05);
  color: #667eea;
  border-left-color: rgba(102, 126, 234, 0.2);
}

.nav-btn.active {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border-left-color: #667eea;
}

.nav-btn i {
  width: 20px;
  text-align: center;
}

.tab-content {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

h2 {
  margin-top: 0;
  color: #2d3748;
  margin-bottom: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
}

.course-count {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 500;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.course-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.course-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.2rem;
  font-weight: 600;
  flex: 1;
}

.course-language {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.course-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.9rem;
}

.detail-item i {
  color: #667eea;
  width: 16px;
  text-align: center;
}

.profile-content {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.profile-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.large-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #667eea;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.profile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 40px;
}

.change-photo-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.change-photo-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
}

.profile-form {
  flex: 1;
  max-width: none;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 0;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #2d3748;
  font-weight: 500;
  font-size: 0.95rem;
}

.form-group label i {
  color: #667eea;
  width: 16px;
  text-align: center;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: white;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  margin-top: 1rem;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.student-count {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 500;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.student-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.student-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.student-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.student-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.student-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.student-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 20px;
}

.student-info {
  flex: 1;
}

.student-info h3 {
  color: #2d3748;
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.9rem;
}

.contact-item i {
  color: #667eea;
  width: 16px;
  text-align: center;
}

.enrolled-courses {
  padding-top: 1rem;
  border-top: 1px solid rgba(102, 126, 234, 0.1);
}

.enrolled-courses h4 {
  color: #2d3748;
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.course-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.course-tag {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  color: #667eea;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.weekly-schedule-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.weekly-schedule-table th {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 1rem 0.5rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
}

.weekly-schedule-table th:first-child {
  border-top-left-radius: 16px;
}

.weekly-schedule-table th:last-child {
  border-top-right-radius: 16px;
}

.weekly-schedule-table td {
  border: 1px solid rgba(102, 126, 234, 0.1);
  padding: 0.75rem 0.5rem;
  text-align: center;
  min-width: 100px;
  min-height: 60px;
  vertical-align: top;
  background: rgba(255, 255, 255, 0.5);
}

.weekly-schedule-table td:first-child {
  background: rgba(102, 126, 234, 0.05);
  font-weight: 600;
  color: #667eea;
}

.course-cell {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  margin: 2px 0;
  padding: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.course-cell:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
  transform: scale(1.02);
}

.student-list {
  background: rgba(255, 255, 255, 0.95);
  color: #2d3748;
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  margin-top: 0.5rem;
  padding: 0.5rem;
  font-size: 0.8rem;
  list-style: none;
  text-align: left;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.student-list li {
  padding: 0.25rem 0;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
}

.student-list li:last-child {
  border-bottom: none;
}
</style> 