const express = require('express');
const router = express.Router();
const { login, register, getProfile, addStudent, addTeacher, testAdmin, updateAdminPassword } = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/register', register);
router.get('/test-admin', testAdmin);
router.post('/update-admin-password', updateAdminPassword);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.post('/students', verifyToken, addStudent);
router.post('/teachers', verifyToken, addTeacher);

// Admin routes
router.get('/admin/users', verifyToken, checkRole(['admin']), (req, res) => {
    // Admin kullanıcı listesi endpoint'i burada olacak
    res.json({ message: 'Admin kullanıcı listesi' });
});

router.post('/admin/students', verifyToken, checkRole(['admin']), addStudent);
router.post('/admin/teachers', verifyToken, checkRole(['admin']), addTeacher);

module.exports = router; 