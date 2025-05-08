const express = require('express');
const router = express.Router();
const { login, register, getProfile } = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/profile', verifyToken, getProfile);

// Admin routes
router.get('/admin/users', verifyToken, checkRole(['admin']), (req, res) => {
    // Admin kullanıcı listesi endpoint'i burada olacak
    res.json({ message: 'Admin kullanıcı listesi' });
});

module.exports = router; 