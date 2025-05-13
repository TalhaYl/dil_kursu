<template>
  <div id="super-admin">
    <h1>Super Admin Panel</h1>
    
    <div class="section">
      <h2>Yeni Kullanıcı Ekle</h2>
      <form @submit.prevent="addUser">
        <input v-model="newUser.name" placeholder="Ad" required />
        <input v-model="newUser.email" placeholder="E-posta" required />
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
export default {
  name: "SuperAdminPage",
  data() {
    return {
      // For managing user addition
      newUser: {
        name: "",
        email: "",
      },
      // For managing announcements
      newAnnouncement: {
        title: "",
        content: "",
      },
      // For managing courses
      newCourse: {
        name: "",
        language: "",
      },
      // For managing branches
      newBranch: {
        name: "",
        address: "",
      },
    };
  },
  methods: {
    // Handle adding a user
    addUser() {
      console.log("Adding user:", this.newUser);
      // Implement API call or logic to save the user
      this.newUser = { name: "", email: "" }; // Clear form
    },
    // Handle adding an announcement
    addAnnouncement() {
      console.log("Adding announcement:", this.newAnnouncement);
      // Implement API call or logic to save the announcement
      this.newAnnouncement = { title: "", content: "" }; // Clear form
    },
    // Handle adding a course
    addCourse() {
      console.log("Adding course:", this.newCourse);
      // Implement API call or logic to save the course
      this.newCourse = { name: "", language: "" }; // Clear form
    },
    // Handle adding a branch
    addBranch() {
      console.log("Adding branch:", this.newBranch);
      // Implement API call or logic to save the branch
      this.newBranch = { name: "", address: "" }; // Clear form
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
