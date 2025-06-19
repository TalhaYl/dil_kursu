<template>
  <div class="home">
    <nav class="navbar">
      <div class="left-links">
        <button @click="scrollToSection('announcements')">Duyurular</button>
        <button @click="scrollToSection('courses')">Kurslar</button>
        <button @click="scrollToSection('branches')">Şubeler</button>
        <button @click="scrollToSection('about')">Hakkımızda</button>
        <button @click="scrollToSection('contact')">İletişim</button>
      </div>
      <div class="right-links">
        <button @click="goToLogin">Giriş Yap</button>
        <button @click="goToRegister">Kayıt Ol</button>
      </div>
    </nav>

    <div class="content">
      <h1>Bir İnsan Dil Kursu</h1>
      <p>En iyi dil öğrenme platformu!</p>
    </div>

    <section id="announcements" class="section">
      <h2>Duyurular</h2>
      <div v-if="announcements.length > 0" class="announcements-list">
        <div v-for="announcement in announcements" :key="announcement.id" class="announcement-card">
          <h3>{{ announcement.title }}</h3>
          <p>{{ announcement.content }}</p>
          <div class="announcement-date">{{ formatDate(announcement.created_at) }}</div>
        </div>
      </div>
      <p v-else>Henüz duyuru bulunmuyor.</p>
    </section>

    <section id="courses" class="section">
      <h2>Kurslar</h2>
      <div v-if="courses.length > 0" class="carousel-container">
        <button class="carousel-btn carousel-btn-left" @click="scrollCarousel('courses', -1)" :disabled="courseScrollPosition <= 0">
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="carousel-wrapper">
          <div class="course-list" ref="coursesCarousel">
        <div v-for="course in courses" :key="course.id" class="course-card">
          <img :src="getImageUrl(course.image_path)" :alt="course.name" class="course-image" />
          <div class="course-content">
            <h3>{{ course.name }}</h3>
            <div class="course-info">
              <div class="course-info-item">
                <i class="fas fa-language"></i>
                <span>{{ course.language }}</span>
              </div>
              <div class="course-info-item" v-if="course.level">
                <i class="fas fa-level-up-alt"></i>
                <span>{{ course.level }}</span>
              </div>
              <div class="course-info-item" v-if="course.teacher_name">
                <i class="fas fa-user-tie"></i>
                <span>{{ course.teacher_name }}</span>
              </div>
              <div class="course-info-item">
                <i class="fas fa-calendar-alt"></i>
                <span>{{ formatDate(course.start_date) }} - {{ formatDate(course.end_date) }}</span>
              </div>
              <div class="course-info-item">
                <i class="fas fa-clock"></i>
                <span>{{ formatSchedule(course.schedule) }}</span>
              </div>
              <div class="course-info-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>{{ getBranchName(course.branch_id) }} - {{ getClassroomName(course.classroom_id) }}</span>
              </div>
              <div class="course-info-item" v-if="course.max_students">
                <i class="fas fa-users"></i>
                <span>Max {{ course.max_students }} Öğrenci</span>
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
        <button class="carousel-btn carousel-btn-right" @click="scrollCarousel('courses', 1)" :disabled="courseScrollPosition >= Math.max(0, courses.length - getVisibleCards())">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <p v-else>Henüz kurs bulunmuyor.</p>
    </section>

    <section id="branches" class="section">
      <h2>Şubeler</h2>
      <div v-if="branches.length > 0" class="carousel-container">
        <button class="carousel-btn carousel-btn-left" @click="scrollCarousel('branches', -1)" :disabled="branchScrollPosition <= 0">
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="carousel-wrapper">
          <div class="branch-container" ref="branchesCarousel">
        <div v-for="branch in branches" :key="branch.id" class="branch-card">
          <img :src="getImageUrl(branch.image_path)" alt="branch.name" class="branch-image" />
          <div class="branch-content">
            <h3>{{ branch.name }}</h3>
            
            <!-- Temel Bilgiler -->
            <div class="info-section">
              <div class="info-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>{{ branch.address }}</span>
              </div>
              <div class="info-item">
                <i class="fas fa-phone"></i>
                <span>{{ branch.phone }}</span>
              </div>
              <div class="info-item">
                <i class="fas fa-envelope"></i>
                <span>{{ branch.email }}</span>
              </div>
            </div>

            <!-- Ulaşım Bilgileri -->
            <div class="info-section" v-if="branch.transportation">
              <h4><i class="fas fa-bus"></i> Ulaşım Bilgileri</h4>
              <div class="info-item">
                <span>{{ branch.transportation }}</span>
              </div>
            </div>

            <!-- Sosyal İmkanlar -->
            <div class="info-section" v-if="branch.social_facilities">
              <h4><i class="fas fa-coffee"></i> Sosyal Olanaklar</h4>
              <div class="info-item">
                <span>{{ branch.social_facilities }}</span>
              </div>
            </div>

            <!-- İstatistikler -->
            <div class="stats-section">
              <div class="stat-item">
                <span class="stat-number">{{ branch.classroom_count }}</span>
                <span class="stat-label">Derslik</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ branch.capacity }}</span>
                <span class="stat-label">Toplam Kapasite</span>
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
        <button class="carousel-btn carousel-btn-right" @click="scrollCarousel('branches', 1)" :disabled="branchScrollPosition >= Math.max(0, branches.length - getVisibleCards())">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <p v-else>Henüz şube bulunmuyor.</p>
    </section>

    <section id="about" class="section">
      <h2>Hakkımızda</h2>
      <div v-if="aboutData" class="about-content">
        <h3>{{ aboutData.title }}</h3>
        <p>{{ aboutData.content }}</p>
      </div>
      <p v-else>Hakkımızda bilgisi bulunmuyor.</p>
    </section>

    <section id="contact" class="section">
      <h2>İletişim</h2>
      <div v-if="contactInfo.length > 0" class="contact-list">
        <div v-for="contact in contactInfo" :key="contact.id" class="contact-card">
          <h3>{{ contact.branch_id ? getBranchName(contact.branch_id) : 'Merkez' }}</h3>
          <div class="contact-details">
            <p><i class="fas fa-map-marker-alt"></i> {{ contact.address }}</p>
            <p><i class="fas fa-phone"></i> {{ contact.phone }}</p>
            <p><i class="fas fa-envelope"></i> {{ contact.email }}</p>
            <p><i class="fas fa-clock"></i> {{ contact.working_hours }}</p>
          </div>
          <div v-if="contact.map_embed" class="map-container" v-html="contact.map_embed"></div>
          <div v-if="contact.social_media" class="social-media">
            <a v-for="(url, platform) in JSON.parse(contact.social_media)" 
               :key="platform" 
               :href="url" 
               target="_blank"
               class="social-link">
              <i :class="getSocialIcon(platform)"></i>
            </a>
          </div>
        </div>
      </div>
      <p v-else>İletişim bilgisi bulunmuyor.</p>
    </section>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'

export default {
  name: "HomePage",
  setup() {
    const announcements = ref([])
    const courses = ref([])
    const branches = ref([])
    const aboutData = ref(null)
    const contactInfo = ref([])
    const classrooms = ref([])
    const courseScrollPosition = ref(0)
    const branchScrollPosition = ref(0)
    const coursesCarousel = ref(null)
    const branchesCarousel = ref(null)

    const getVisibleCards = () => {
      if (window.innerWidth <= 480) {
        return 1;
      } else if (window.innerWidth <= 768) {
        return 2;
      } else {
        return 3;
      }
    }

    const scrollCarousel = (type, direction) => {
      // Dinamik kart genişliği hesaplama
      let cardWidth = 340; // Varsayılan: 320px kart + 20px gap
      let visibleCards = getVisibleCards();
      
      if (window.innerWidth <= 480) {
        cardWidth = 260; // 260px kart
      } else if (window.innerWidth <= 768) {
        cardWidth = 300; // 280px kart + 20px gap
      } else if (window.innerWidth <= 1200) {
        cardWidth = 320; // 300px kart + 20px gap
      } else {
        cardWidth = 340; // 320px kart + 20px gap
      }
      
      if (type === 'courses') {
        const newPosition = courseScrollPosition.value + direction;
        const maxPosition = Math.max(0, courses.value.length - visibleCards);
        if (newPosition >= 0 && newPosition <= maxPosition) {
          courseScrollPosition.value = newPosition;
          if (coursesCarousel.value) {
            coursesCarousel.value.style.transform = `translateX(-${newPosition * cardWidth}px)`;
          }
        }
      } else if (type === 'branches') {
        const newPosition = branchScrollPosition.value + direction;
        const maxPosition = Math.max(0, branches.value.length - visibleCards);
        if (newPosition >= 0 && newPosition <= maxPosition) {
          branchScrollPosition.value = newPosition;
          if (branchesCarousel.value) {
            branchesCarousel.value.style.transform = `translateX(-${newPosition * cardWidth}px)`;
          }
        }
      }
    }

    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get('/api/announcements')
        announcements.value = response.data
      } catch (error) {
        console.error('Error fetching announcements:', error)
      }
    }

    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/courses')
        courses.value = response.data
      } catch (error) {
        console.error('Error fetching courses:', error)
      }
    }

    const fetchBranches = async () => {
      try {
        const response = await axios.get('/api/branches')
        branches.value = response.data
        console.log('Fetched branches:', branches.value)
      } catch (error) {
        console.error('Error fetching branches:', error)
      }
    }

    const fetchAbout = async () => {
      try {
        const response = await axios.get('/api/about')
        aboutData.value = response.data
      } catch (error) {
        console.error('Error fetching about data:', error)
      }
    }

    const fetchContactInfo = async () => {
      try {
        const response = await axios.get('/api/contact-info')
        contactInfo.value = response.data
      } catch (error) {
        console.error('Error fetching contact info:', error)
      }
    }

    const fetchClassrooms = async () => {
      try {
        const response = await axios.get('/api/classrooms')
        classrooms.value = response.data
      } catch (error) {
        console.error('Error fetching classrooms:', error)
      }
    }

    const getBranchName = (branchId) => {
      const branch = branches.value.find(b => b.id === branchId)
      return branch ? branch.name : 'Bilinmeyen Şube'
    }

    const getClassroomName = (classroomId) => {
      const classroom = classrooms.value.find(c => c.id === classroomId)
      return classroom ? classroom.name : 'Bilinmeyen Sınıf'
    }

    const getSocialIcon = (platform) => {
      const icons = {
        facebook: 'fab fa-facebook',
        twitter: 'fab fa-twitter',
        instagram: 'fab fa-instagram',
        linkedin: 'fab fa-linkedin'
      }
      return icons[platform] || 'fas fa-link'
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const formatSchedule = (schedule) => {
      if (!schedule) return 'Program belirtilmemiş'
      
      try {
        const scheduleObj = typeof schedule === 'string' ? JSON.parse(schedule) : schedule
        const dayNames = {
          'Pazartesi': 'Pzt',
          'Salı': 'Sal',
          'Çarşamba': 'Çar',
          'Perşembe': 'Per',
          'Cuma': 'Cum',
          'Cumartesi': 'Cmt',
          'Pazar': 'Paz'
        }
        
        const activeDays = Object.entries(scheduleObj)
          .filter(([, times]) => times && times.start && times.end)
          .map(([day, times]) => `${dayNames[day] || day}: ${times.start}-${times.end}`)
        
        return activeDays.length > 0 ? activeDays.join(', ') : 'Program belirtilmemiş'
      } catch (error) {
        console.error('Error parsing schedule:', error)
        return 'Program belirtilmemiş'
      }
    }

    const getImageUrl = (path) => {
      if (!path) return 'https://via.placeholder.com/200x200?text=Yok';
      if (path.startsWith('http')) return path;
      return `http://localhost:3000${path}`;
    };

    onMounted(() => {
      fetchAnnouncements()
      fetchCourses()
      fetchBranches()
      fetchAbout()
      fetchContactInfo()
      fetchClassrooms()
    })

    return {
      announcements,
      courses,
      branches,
      aboutData,
      contactInfo,
      getBranchName,
      getClassroomName,
      getSocialIcon,
      formatDate,
      formatSchedule,
      getImageUrl,
      courseScrollPosition,
      branchScrollPosition,
      coursesCarousel,
      branchesCarousel,
      scrollCarousel,
      getVisibleCards
    }
  },
  methods: {
    goToLogin() {
      this.$router.push('/login')
    },
    goToRegister() {
      this.$router.push('/register')
    },
    scrollToSection(sectionId) {
      const section = document.getElementById(sectionId)
      if (section) {
        section.scrollIntoView({ behavior: "smooth" })
      }
    }
  }
}
</script>

<style scoped>
.home {
  text-align: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background-color: rgba(255, 255, 255, 0.95);
  padding: 15px 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.left-links button,
.right-links button {
  margin: 0 10px;
  padding: 10px 20px;
  font-size: 1rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.left-links button:hover,
.right-links button:hover {
  background-color: #357abd;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.content {
  margin-top: 80px;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 15px;
  margin: 80px 20px 40px;
}

h1 {
  font-size: 3rem;
  color: #2c3e50;
  margin-bottom: 20px;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

p {
  font-size: 1.3rem;
  color: #34495e;
  line-height: 1.6;
}

.section {
  margin: 60px auto;
  padding: 30px;
  max-width: 1200px;
  text-align: left;
  background-color: #ffffff;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.section:hover {
  transform: translateY(-5px);
}

.section h2 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 30px;
  position: relative;
  padding-bottom: 10px;
}

.section h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 3px;
  background: #4a90e2;
  border-radius: 3px;
}

.announcements-list {
  display: grid;
  gap: 25px;
}

.announcement-card {
  background-color: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #eef2f7;
}

.announcement-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.announcement-card h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.4rem;
}

.announcement-date {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-top: 15px;
  font-style: italic;
}

.carousel-container {
  position: relative;
  margin: 0 auto;
  max-width: 1100px;
  overflow: visible;
  padding: 0 50px;
  width: 100%;
}

.carousel-wrapper {
  overflow: hidden;
  width: 100%;
  max-width: calc(3 * 320px + 2 * 20px); /* 3 kart + 2 gap = 1000px */
  margin: 0 auto;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #4a90e2;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.carousel-btn i {
  font-size: 1.2rem;
  color: #4a90e2;
  transition: color 0.3s ease;
}

.carousel-btn:hover:not(:disabled) {
  background: #4a90e2;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 12px 35px rgba(74, 144, 226, 0.4);
}

.carousel-btn:hover:not(:disabled) i {
  color: white;
}

.carousel-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: rgba(200, 200, 200, 0.6);
  border-color: #ccc;
}

.carousel-btn:disabled i {
  color: #999;
}

.carousel-btn-left {
  left: 10px;
}

.carousel-btn-right {
  right: 10px;
}

.course-list, .branch-container {
  display: flex;
  gap: 20px;
  padding: 20px 0;
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  overflow: visible;
  width: max-content;
  margin: 0;
}

.course-card, .branch-card {
  flex: 0 0 320px;
  min-width: 320px;
  max-width: 320px;
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.course-card:hover, .branch-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.12);
  border-color: rgba(74, 144, 226, 0.3);
}

.course-image, .branch-image {
  width: 100%;
  height: 140px;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.course-card:hover .course-image,
.branch-card:hover .branch-image {
  transform: scale(1.05);
}

.course-content, .branch-content {
  padding: 15px;
  flex: 1;
  background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 100%);
}

.course-card h3, .branch-content h3 {
  color: #1a237e;
  margin-bottom: 12px;
  font-size: 1.3rem;
  font-weight: 600;
  position: relative;
  padding-bottom: 8px;
  line-height: 1.3;
}

.course-card h3::after, .branch-content h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #4a90e2 0%, #357abd 100%);
  border-radius: 3px;
}

.course-info {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.course-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(74, 144, 226, 0.06);
  border-radius: 8px;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  border-left: 3px solid transparent;
}

.course-info-item:hover {
  background: rgba(74, 144, 226, 0.12);
  transform: translateX(4px);
  border-left-color: #4a90e2;
}

.course-info-item i {
  color: #4a90e2;
  font-size: 1.1rem;
  min-width: 18px;
}

.course-info-item span {
  color: #2c3e50;
  font-weight: 500;
  line-height: 1.5;
}

.info-section {
  margin-bottom: 15px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(74, 144, 226, 0.1);
}

.info-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1a237e;
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.info-section h4 i {
  color: #4a90e2;
  font-size: 1.2rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.3s ease;
  margin-bottom: 4px;
  font-size: 0.85rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item:hover {
  background: rgba(74, 144, 226, 0.08);
  transform: translateX(4px);
}

.info-item i {
  color: #4a90e2;
  font-size: 1.1rem;
  min-width: 18px;
}

.info-item span {
  color: #34495e;
  font-weight: 500;
  line-height: 1.5;
}

.stats-section {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.05) 0%, rgba(53, 122, 189, 0.05) 100%);
  border-radius: 10px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  color: #4a90e2;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
}

.about-content {
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  line-height: 1.8;
}

.about-content h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.6rem;
}

.contact-list {
  display: grid;
  gap: 30px;
}

.contact-card {
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.contact-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.contact-card h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.4rem;
}

.contact-details {
  display: grid;
  gap: 15px;
}

.contact-details p {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 1.1rem;
}

.contact-details i {
  color: #4a90e2;
  width: 24px;
  font-size: 1.2rem;
}

.map-container {
  margin-top: 25px;
  border-radius: 8px;
  overflow: hidden;
}

.map-container iframe {
  width: 100%;
  height: 350px;
  border: none;
  border-radius: 8px;
}

.social-media {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  justify-content: center;
}

.social-link {
  color: #666;
  font-size: 24px;
  transition: all 0.3s ease;
  padding: 10px;
  border-radius: 50%;
  background-color: #f8f9fa;
}

.social-link:hover {
  color: #4a90e2;
  transform: translateY(-3px);
  background-color: #eef2f7;
}

@media (max-width: 1200px) {
  .carousel-container {
    max-width: 1000px;
    padding: 0 40px;
  }
  
  .carousel-wrapper {
    max-width: calc(3 * 300px + 2 * 20px); /* 3 kart + 2 gap */
  }
  
  .course-card, .branch-card {
    flex: 0 0 300px;
    min-width: 300px;
    max-width: 300px;
  }
}

@media (max-width: 768px) {
  .carousel-container {
    padding: 0 30px;
  }

  .carousel-wrapper {
    max-width: calc(2 * 280px + 1 * 20px); /* 2 kart + 1 gap */
  }

  .carousel-btn {
    width: 50px;
    height: 50px;
  }
  
  .carousel-btn-left {
    left: 5px;
  }
  
  .carousel-btn-right {
    right: 5px;
  }

  .course-card, .branch-card {
    flex: 0 0 280px;
    min-width: 280px;
    max-width: 280px;
  }

  .course-content, .branch-content {
    padding: 24px;
  }

  .course-list, .branch-container {
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .carousel-container {
    padding: 0 20px;
  }
  
  .carousel-wrapper {
    max-width: 260px; /* 1 kart */
  }
  
  .carousel-btn {
    width: 45px;
    height: 45px;
  }
  
  .carousel-btn i {
    font-size: 1rem;
  }

  .course-card, .branch-card {
    flex: 0 0 260px;
    min-width: 260px;
    max-width: 260px;
  }

  .course-content, .branch-content {
    padding: 20px;
  }
  
  .course-card h3, .branch-content h3 {
    font-size: 1.4rem;
  }

  .stats-section {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
