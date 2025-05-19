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
    const { email, password, role, name, phone, address, branch_id, languages, working_days } = req.body;
    
    if (!email || !password || !role || !name) {
        return res.status(400).json({ error: 'Email, şifre, rol ve isim gerekli' });
    }

    // Geçerli rol kontrolü
    const validRoles = ['student', 'teacher', 'admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Geçersiz rol' });
    }

    try {
        const result = await db.executeTransaction(async (connection) => {
            const [existingUsers] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);

            if (existingUsers.length > 0) {
                throw new Error('Bu email zaten kullanımda');
            }

            // Şifreyi hashle
            const hashedPassword = await bcrypt.hash(password, 12);

            // Rolün ID'sini al
            const [roles] = await connection.query('SELECT id FROM roles WHERE name = ?', [role]);

            if (roles.length === 0) {
                throw new Error('Geçersiz rol');
            }

            // Yeni kullanıcıyı veritabanına ekle
            const [userResult] = await connection.query(
                'INSERT INTO users (email, password, role_id, name, phone) VALUES (?, ?, ?, ?, ?)',
                [email, hashedPassword, roles[0].id, name, phone]
            );

            const userId = userResult.insertId;

            // Role göre ilgili tabloya kayıt ekle
            if (role === 'student') {
                await connection.query(
                    'INSERT INTO students (user_id, phone, address, branch_id) VALUES (?, ?, ?, ?)',
                    [userId, phone, address, branch_id]
                );
            } else if (role === 'teacher') {
                await connection.query(
                    'INSERT INTO teachers (user_id, ad, email, phone, languages, working_days, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [userId, name, email, phone, JSON.stringify(languages), JSON.stringify(working_days), branch_id]
                );
            }

            return { userId, email, role, name };
        });

        // JWT Token oluştur
        const token = jwt.sign(
            { 
                id: result.userId, 
                email: result.email, 
                role: result.role 
            }, 
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Başarılı yanıt
        res.status(201).json({
            message: 'Kullanıcı başarıyla oluşturuldu',
            token,
            user: {
                id: result.userId,
                email: result.email,
                role: result.role,
                name: result.name
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.message === 'Bu email zaten kullanımda' || error.message === 'Geçersiz rol') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

// Admin için öğrenci ekleme
const addStudent = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }

    const { email, password, name, phone, address, branch_id } = req.body;

    try {
        const result = await db.executeTransaction(async (connection) => {
            // Önce users tablosuna ekle
            const hashedPassword = await bcrypt.hash(password, 12);
            const [roles] = await connection.query('SELECT id FROM roles WHERE name = ?', ['student']);
            
            const [userResult] = await connection.query(
                'INSERT INTO users (email, password, role_id, name, phone) VALUES (?, ?, ?, ?, ?)',
                [email, hashedPassword, roles[0].id, name, phone]
            );

            const userId = userResult.insertId;

            // Sonra students tablosuna ekle
            await connection.query(
                'INSERT INTO students (user_id, phone, address, branch_id) VALUES (?, ?, ?, ?)',
                [userId, phone, address, branch_id]
            );

            return { userId, email, name };
        });

        res.status(201).json({
            message: 'Öğrenci başarıyla eklendi',
            student: {
                id: result.userId,
                email: result.email,
                name: result.name,
                role: 'student'
            }
        });
    } catch (error) {
        console.error('Add student error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

// Admin için öğretmen ekleme
const addTeacher = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }

    const { email, password, name, phone, languages, working_days, branch_id } = req.body;

    try {
        const result = await db.executeTransaction(async (connection) => {
            // Önce users tablosuna ekle
            const hashedPassword = await bcrypt.hash(password, 12);
            const [roles] = await connection.query('SELECT id FROM roles WHERE name = ?', ['teacher']);
            
            const [userResult] = await connection.query(
                'INSERT INTO users (email, password, role_id, name, phone) VALUES (?, ?, ?, ?, ?)',
                [email, hashedPassword, roles[0].id, name, phone]
            );

            const userId = userResult.insertId;

            // Sonra teachers tablosuna ekle
            await connection.query(
                'INSERT INTO teachers (user_id, ad, email, phone, languages, working_days, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, name, email, phone, JSON.stringify(languages), JSON.stringify(working_days), branch_id]
            );

            return { userId, email, name };
        });

        res.status(201).json({
            message: 'Öğretmen başarıyla eklendi',
            teacher: {
                id: result.userId,
                email: result.email,
                name: result.name,
                role: 'teacher'
            }
        });
    } catch (error) {
        console.error('Add teacher error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

// Kullanıcı profili
const getProfile = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT u.id, u.email, u.name, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        const user = users[0];

        // Role göre ek bilgileri getir
        if (user.role === 'student') {
            const [students] = await db.query(
                'SELECT * FROM students WHERE user_id = ?',
                [user.id]
            );
            if (students.length > 0) {
                user.studentInfo = students[0];
            }
        } else if (user.role === 'teacher') {
            const [teachers] = await db.query(
                'SELECT * FROM teachers WHERE user_id = ?',
                [user.id]
            );
            if (teachers.length > 0) {
                user.teacherInfo = teachers[0];
            }
        }

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

module.exports = {
    login,
    register,
    getProfile,
    addStudent,
    addTeacher
};