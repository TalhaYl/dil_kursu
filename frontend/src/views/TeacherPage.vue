<template>
  <div class="teacher-container">
    <header class="teacher-header">
      <h1>Öğretmen Paneli</h1>
      <div class="welcome-message">Hoş geldin, {{ teacherName }}</div>
      <button @click="handleLogout" class="logout-btn">Çıkış Yap</button>
    </header>
    
    <div class="teacher-content">
      <nav class="teacher-nav">
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
        <!-- Dersler Tab -->
        <div v-if="currentTab === 'courses'" class="courses-tab">
          <h2>Derslerim</h2>
          <div class="courses-list">
            <div v-for="course in teacherCourses" :key="course.id" class="course-item">
              <h3>{{ course.name }}</h3>
              <p>Dil: {{ course.language }}</p>
              <p>Seviye: {{ course.level }}</p>
              <p>Başlangıç: {{ formatDate(course.start_date) }}</p>
              <p>Bitiş: {{ formatDate(course.end_date) }}</p>
            </div>
          </div>
        </div>

        <!-- Öğrenciler Tab -->
        <div v-if="currentTab === 'students'" class="students-tab">
          <h2>Öğrencilerim</h2>
          <div class="students-list">
            <div v-for="student in teacherStudents" :key="student.id" class="student-item">
              <h3>{{ student.name }}</h3>
              <p>E-posta: {{ student.email }}</p>
              <p>Telefon: {{ student.phone }}</p>
              <div class="enrolled-courses">
                <h4>Kayıtlı Olduğu Kurslar:</h4>
                <ul>
                  <li v-for="course in student.courses" :key="course.id">
                    {{ course.name }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Program Tab -->
        <div v-if="currentTab === 'schedule'" class="schedule-tab">
          <h2>Ders Programı</h2>
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
                    <div v-else-if="expandedCourseId === course.id && (!course.students || !course.students.length)" class="student-list">
                      Kayıtlı öğrenci yok
                    </div>
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
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'TeacherPage',
  data() {
    return {
      currentTab: 'courses',
      tabs: [
        { id: 'courses', name: 'Derslerim' },
        { id: 'students', name: 'Öğrencilerim' },
        { id: 'schedule', name: 'Ders Programı' },
        { id: 'profile', name: 'Bilgilerim' }
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
          alert('Bilgileriniz başarıyla güncellendi.');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        if (error.response?.data?.error) {
          alert(error.response.data.error);
        } else {
          alert('Bilgileriniz güncellenirken bir hata oluştu.');
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
  background-color: #f5f5f5;
}

.teacher-header {
  background-color: #fff;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.teacher-header h1 {
  margin: 0;
  color: #333;
}

.welcome-message {
  font-size: 1.2rem;
  color: #666;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.teacher-content {
  padding: 2rem;
  display: flex;
  gap: 2rem;
}

.teacher-nav {
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

.course-item, .student-item, .schedule-item {
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
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

.student-item {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
}

.student-item h3 {
  color: #333;
  margin: 0 0 1rem 0;
}

.student-item p {
  color: #666;
  margin: 0.5rem 0;
}

.enrolled-courses {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.enrolled-courses h4 {
  color: #333;
  margin: 0 0 0.5rem 0;
}

.enrolled-courses ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.enrolled-courses li {
  color: #666;
  padding: 0.25rem 0;
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

.student-list {
  background: #fff;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 4px;
  padding: 4px 8px;
  font-size: 0.95em;
  list-style: disc inside;
  text-align: left;
}
</style> 