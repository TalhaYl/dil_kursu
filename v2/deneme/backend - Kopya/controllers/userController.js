const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Kullanıcı girişi
const login = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email ve şifre gerekli' });
    }
    
    try {
        const [users] = await db.query('SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Geçersiz email veya şifre' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Geçersiz email veya şifre' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role 
            }, 
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

// Kullanıcı kaydı
const register = async (req, res) => {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email ve şifre gerekli' });
    }
    
    try {
        const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Bu email zaten kullanımda' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [roles] = await db.query('SELECT id FROM roles WHERE name = ?', [role || 'student']);

        if (roles.length === 0) {
            return res.status(400).json({ error: 'Geçersiz rol' });
        }

        const [result] = await db.query(
            'INSERT INTO users (email, password, role_id) VALUES (?, ?, ?)',
            [email, hashedPassword, roles[0].id]
        );

        const token = jwt.sign(
            { 
                id: result.insertId, 
                email: email, 
                role: role || 'student' 
            }, 
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Kullanıcı başarıyla oluşturuldu',
            token,
            user: {
                id: result.insertId,
                email: email,
                role: role || 'student'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

// Kullanıcı profili
const getProfile = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT u.id, u.email, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

module.exports = {
    login,
    register,
    getProfile
};