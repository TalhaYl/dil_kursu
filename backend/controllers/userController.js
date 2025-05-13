const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT secret'ı .env'den al
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Kullanıcı girişi
const login = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email ve şifre gerekli' });
    }
    
    try {
        const [users] = await db.query(`
            SELECT u.*, r.role_name as role 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.email = ?
        `, [email]);

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
    const { name, email, password, role, phone, address, branch_id, languages, working_days } = req.body;
    
    if (!email || !password || !name || !role) {
        return res.status(400).json({ error: 'Email, şifre, isim ve rol gerekli' });
    }

    const validRoles = ['student', 'teacher', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Geçersiz rol' });
    }

    try {
        const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Bu email zaten kullanımda' });
        }

        // Şifreyi hashle
        const hashedPassword = await bcrypt.hash(password, 12);  // 12 salt round ile daha güçlü şifreleme

        // Rolün ID'sini al
        const [roles] = await db.query('SELECT id FROM roles WHERE role_name = ?', [role]);

        if (roles.length === 0) {
            return res.status(400).json({ error: 'Geçersiz rol' });
        }

        // Yeni kullanıcıyı veritabanına ekle
        const [userResult] = await db.query(
            'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, roles[0].id]
        );

        const userId = userResult.insertId;

        // Role göre öğretmen veya öğrenci tablosuna ekle
        if (role === 'teacher') {
            await db.query(
                'INSERT INTO teachers (user_id, languages, working_days, branch_id) VALUES (?, ?, ?, ?)', 
                [userId, JSON.stringify(languages || []), JSON.stringify(working_days || []), branch_id || null]
            );
        } else if (role === 'student') {
            await db.query(
                'INSERT INTO students (user_id, phone, address, branch_id) VALUES (?, ?, ?, ?)', 
                [userId, phone || '', address || '', branch_id || null]
            );
        }

        // JWT Token oluştur
        const token = jwt.sign(
            { 
                id: userId, 
                email: email, 
                role: role 
            }, 
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Başarılı yanıt
        res.status(201).json({
            message: 'Kullanıcı başarıyla oluşturuldu',
            token,
            user: {
                id: userId,
                name: name,
                email: email,
                role: role
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
        const [users] = await db.query(`
            SELECT u.id, u.name, u.email, r.role_name as role 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = ?
        `, [req.user.id]);

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
