const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const db = require('./config/db');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const courseRoutes = require('./routes/courseRoutes');
const classroomRoutes = require('./routes/classroomRoutes');
const branchRoutes = require('./routes/branchRoutes');
const pageRoutes = require('./routes/pageRoutes');
const aboutRoutes = require('./routes/aboutRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const contactInfoRoutes = require('./routes/contactInfoRoutes');
const languageRoutes = require('./routes/languageRoutes');

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.RAILWAY_FRONTEND_URL]
    : ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik dosyalar için public klasörünü kullan
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Health check endpoint for DigitalOcean
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/contact-info', contactInfoRoutes);
app.use('/api/languages', languageRoutes);

// Veritabanı bağlantısını test et
db.pool.getConnection((err, connection) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err);
        return;
    }
    console.log('Veritabanına başarıyla bağlandı!');
    connection.release();
});

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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
