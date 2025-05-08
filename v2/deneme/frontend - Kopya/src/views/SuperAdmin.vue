<template>
  <div id="super-admin">
    <h1>Super Admin Panel</h1>
    
    <div class="section">
      <h2>Yeni Kullanıcı Ekle</h2>
      <form @submit.prevent="addUser">
        <input v-model="newUser.name" placeholder="Ad" required />
        <input v-model="newUser.email" placeholder="E-posta" required />
        <input type="password" v-model="newUser.password" placeholder="Şifre" required />
        <select v-model="newUser.role" required>
          <option value="">Rol seçiniz</option>
          <option value="student">Öğrenci</option>
          <option value="teacher">Öğretmen</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Kullanıcı Ekle</button>
      </form>
    </div>

    <div class="section">
      <h2>Duyuru Ekle</h2>
      <form @submit.prevent="addAnnouncement">
        <input v-model="newAnnouncement.title" placeholder="Duyuru Başlığı" required />
        <textarea v-model="newAnnouncement.content" placeholder="Duyuru İçeriği" required></textarea>
        <button type="submit">Duyuru Ekle</button>
      </form>
    </div>

    <div class="section">
      <h2>Kurs Ekle</h2>
      <form @submit.prevent="addCourse">
        <input v-model="newCourse.name" placeholder="Kurs Adı" required />
        <input v-model="newCourse.language" placeholder="Dil" required />
        <button type="submit">Kurs Ekle</button>
      </form>
    </div>

    <div class="section">
      <h2>Şube Ekle</h2>
      <form @submit.prevent="addBranch">
        <input v-model="newBranch.name" placeholder="Şube Adı" required />
        <input v-model="newBranch.address" placeholder="Adres" required />
        <button type="submit">Şube Ekle</button>
      </form>
    </div>

    <!-- You can add more sections as needed -->
  </div>
</template>

<script>
import api from '../services/api';

export default {
  name: "SuperAdminPage",
  data() {
    return {
      newUser: { name: "", email: "", password: "", role: "" },
      newAnnouncement: { title: "", content: "" },
      newCourse: { name: "", language: "" },
      newBranch: { name: "", address: "" },
    };
  },
  methods: {
    async addUser() {
      try {
        const { data } = await api.post('/users/register', this.newUser);
        console.log('User added:', data);
        this.newUser = { name: "", email: "", password: "", role: "" };
      } catch (error) {
        console.error('Error adding user:', error);
      }
    },
    addAnnouncement() {
      console.log("Adding announcement:", this.newAnnouncement);
      // Implement API call or logic to save the announcement
      this.newAnnouncement = { title: "", content: "" }; // Clear form
    },
    async addCourse() {
      try {
        const { data } = await api.post('/courses', this.newCourse);
        console.log('Course added:', data);
        this.newCourse = { name: "", language: "" };
      } catch (error) {
        console.error('Error adding course:', error);
      }
    },
    async addBranch() {
      try {
        const { data } = await api.post('/branches', this.newBranch);
        console.log('Branch added:', data);
        this.newBranch = { name: "", address: "" };
      } catch (error) {
        console.error('Error adding branch:', error);
      }
    },
  },
};
</script>

<style scoped>
#super-admin {
  text-align: center;
}

.section {
  margin: 20px;
}

input, textarea {
  display: block;
  margin: 10px auto;
  padding: 8px;
  font-size: 1rem;
  width: 200px;
}

button {
  padding: 10px 20px;
  font-size: 1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #2980b9;
}
</style>
