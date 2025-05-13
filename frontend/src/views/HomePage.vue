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
      <p>Burada en son duyurularımızı bulabilirsiniz.</p>
    </section>

    <section id="courses" class="section">
      <h2>Kurslar</h2>
      <div class="course-list">
        <div v-for="course in courses" :key="course.id" class="course-card">
          <img :src="course.image" alt="course.name" class="course-image" />
          <h3>{{ course.name }}</h3>
          <p><strong>Dil:</strong> {{ course.language }}</p>
          <p><strong>Seviye:</strong> {{ course.level }}</p>
          <p><strong>Başlangıç Tarihi:</strong> {{ course.startDate }}</p>
          <p><strong>Bitiş Tarihi:</strong> {{ course.endDate }}</p>
          <p><strong>Günler ve Saatler:</strong> {{ course.schedule }}</p>
          <p><strong>Toplam Süre:</strong> {{ course.totalDuration }}</p>
          <p><strong>Şube ve Sınıf:</strong> {{ course.branch }} - {{ course.room }}</p>
        </div>
      </div>
    </section>

    <section id="branches" class="section">
      <h2>Şubeler</h2>
      <div class="branch-list">
        <div v-for="branch in branches" :key="branch.id" class="branch-card">
          <img :src="branch.image" alt="branch.name" class="branch-image" />
          <h3>{{ branch.name }}</h3>
          <p><strong>Adres:</strong> {{ branch.address }}</p>
          <p><strong>Derslik Sayısı:</strong> {{ branch.classrooms }}</p>
          <p><strong>Toplam Kapasite:</strong> {{ branch.capacity }}</p>
          <p><strong>Ulaşım Bilgileri:</strong> {{ branch.transportation }}</p>
          <p><strong>Sosyal Olanaklar:</strong> {{ branch.socialFacilities }}</p>
        </div>
      </div>
    </section>

    <section id="about" class="section">
      <h2>Hakkımızda</h2>
      <p>Şirketimizin misyonu ve vizyonu hakkında bilgi burada.</p>
    </section>

    <section id="contact" class="section">
      <h2>İletişim</h2>
      <p>Bize ulaşmak için iletişim bilgilerimiz burada yer almakta.</p>
    </section>
  </div>
</template>

<script>
export default {
  name: "HomePage",
  methods: {
    // Giriş sayfasına yönlendir
    goToLogin() {
      this.$router.push('/login');
    },
    goToRegister() {
      this.$router.push('/register');
    },
    // Bölüme kaydır
    scrollToSection(sectionId) {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    },
  },
  data() {
    return { 
      courses: [
        {
          id: 1,
          name: "İngilizce Başlangıç Seviyesi",
          language: "İngilizce",
          level: "Başlangıç (A1)",
          startDate: "01 Ocak 2024",
          endDate: "31 Mart 2024",
          schedule: "Pazartesi ve Çarşamba 18:00-19:30",
          totalDuration: "12 hafta",
          branch: "Kadıköy Şubesi",
          room: "Sınıf 101",
          image: "https://www.britishenglish.com.tr/wp-content/uploads/2019/10/ingilizce-ogrenmek.jpg.webp",
        },
        {
          id: 2,
          name: "Fransızca Orta Seviye",
          language: "Fransızca",
          level: "Orta (B1)",
          startDate: "15 Ocak 2024",
          endDate: "15 Nisan 2024",
          schedule: "Salı ve Perşembe 19:00-20:30",
          totalDuration: "12 hafta",
          branch: "Beşiktaş Şubesi",
          room: "Sınıf 202",
          image: "https://www.edubook.com.tr/files/Blog/french.png",
        },
        {
          id: 3,
          name: "Almanca Orta Seviye",
          language: "Almanca",
          level: "Orta (B1-B2)",
          startDate: "10 Nisan 2024",
          endDate: "26 Haziran 2024",
          schedule: "Çarşamba ve Cumartesi 19:00-20:30",
          totalDuration: "12 hafta",
          branch: "Üsküdar Şubesi",
          room: "Sınıf 102",
          image: "https://avatars.mds.yandex.net/i?id=ec339b7c55bcd408eaf8e87e5e592e3c7456a2e3-9242682-images-thumbs&n=13",
        },
      ],
      branches: [
        {
          id: 1,
          name: "Kadıköy Şubesi",
          address: "Kadıköy, İstanbul",
          classrooms: 12,
          capacity: 300,
          transportation: "Kadıköy Metro İstasyonu'na 5 dakika yürüyüş mesafesinde.",
          socialFacilities: "Kafeterya, dinlenme alanı, etüt odaları.",
          image: "https://imageio.forbes.com/specials-images/imageserve/6616fad0b8a7964bde32cf55/0x0.jpg?format=jpg&height=900&width=1600&fit=bounds",
        },
        {
          id: 2,
          name: "Beşiktaş Şubesi",
          address: "Beşiktaş, İstanbul",
          classrooms: 10,
          capacity: 250,
          transportation: "Beşiktaş İskelesi'ne 3 dakika mesafede.",
          socialFacilities: "Kafeterya, okuma alanı, sosyal kulüpler.",
          image: "https://visitturkey.in/wp-content/uploads/2024/07/besiktas-istanbul-turkey-1200x900.webp",
        },
        {
          id: 3,
          name: "Şişli Şubesi",
          address: "Şişli, İstanbul",
          classrooms: 15,
          capacity: 350,
          transportation: "Şişli Metro İstasyonu'na 10 dakika yürüme mesafesinde.",
          socialFacilities: "Kafeterya, spor salonu, sinema salonu.",
          image: "https://istanbul.tips/wp-content/uploads/2023/03/Sisli.jpeg",
        },
      ],
    };
  },  
};
</script>

<style scoped>
.home {
  text-align: center;
}

.navbar {
  display: flex;
  justify-content: space-between;
  position: sticky;
  top: 0;
  background-color: white;
  padding: 10px 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.left-links button,
.right-links button {
  margin: 0 10px;
  padding: 8px 15px;
  font-size: 1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.left-links button:hover,
.right-links button:hover {
  background-color: #2980b9;
}

.content {
  margin-top: 50px;
}

h1 {
  font-size: 2rem;
  color: #2c3e50;
}

p {
  font-size: 1.2rem;
  color: #7f8c8d;
}

.section {
  margin: 50px auto;
  padding: 20px;
  max-width: 800px;
  text-align: left;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.section h2 {
  font-size: 1.5rem;
  color: #2c3e50;
}

.section p {
  font-size: 1rem;
  color: #7f8c8d;
}

.course-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.course-card {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
  text-align: left;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.course-image {
  width: 100%;
  height: auto;
  border-radius: 5px;
  margin-bottom: 15px;
}

.course-card h3 {
  font-size: 1.2rem;
  color: #2c3e50;
}

.course-card p {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 5px 0;
}

.branch-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.branch-card {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
  text-align: left;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.branch-image {
  width: 100%;
  height: auto;
  border-radius: 5px;
  margin-bottom: 15px;
}

.branch-card h3 {
  font-size: 1.2rem;
  color: #2c3e50;
}

.branch-card p {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 5px 0;
}

.branch-card p strong {
  color: #2c3e50;
}
</style>
