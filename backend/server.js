const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const classroomRoutes = require('./routes/classroomRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const courseRoutes = require('./routes/courseRoutes');
const infoRoutes = require('./routes/infoRoutes');
const branchRoutes = require('./routes/branchRoutes');
const postRoutes = require('./routes/postRoutes');
const aboutRoutes = require('./routes/aboutRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes); // Kullanıcı route'ları
app.use('/api/classrooms', classroomRoutes); // Sınıf route'ları
app.use('/api/teachers', teacherRoutes); // Öğretmen route'ları
app.use('/api/courses', courseRoutes); // Kurs route'ları
app.use('/api/info', infoRoutes); // Bilgi route'ları
app.use('/api/branches', branchRoutes); // Branş route'ları
app.use('/api/posts', postRoutes); // Yeni eklenen post route'ları
app.use('/api/about', aboutRoutes); // Yeni eklenen about route'ları

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'İç sunucu hatası!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Sayfa bulunamadı'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
