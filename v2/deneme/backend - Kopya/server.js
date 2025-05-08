const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route dosyalarını içe aktar
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const branchRoutes = require('./routes/branchRoutes');
const infoRoutes = require('./routes/infoRoutes');

// Veritabanı bağlantısını kontrol et
require('./config/db');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/info', infoRoutes);

// Ana sayfa
app.get('/', (req, res) => {
    res.json({ message: 'Dil Kursu API çalışıyor' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Sayfa bulunamadı' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Sunucu hatası' });
});

// Server'ı başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
});