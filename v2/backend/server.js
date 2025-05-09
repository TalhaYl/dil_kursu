const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const branchRoutes = require('./routes/branchRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes =require('./routes/courseRoutes');
const infoRoutes =require('./routes/infoRoutes');


const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/branches', branchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courseroutes', courseRoutes);
app.use('/api/infoRouetes', infoRoutes);




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