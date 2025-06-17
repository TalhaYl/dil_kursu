const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT secret'ı .env'den al
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Kullanıcı girişi
const login = async (req, res) => {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email, password: '***' }); // Giriş denemesini logla
    
    if (!email || !password) {
        console.log('Missing email or password');
        return res.status(400).json({ error: 'Email ve şifre gerekli' });
    }
    
    try {
        // Önce kullanıcıyı bulalım
        const [users] = await db.pool.query(
            'SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?', 
            [email]
        );
        
        console.log('Found users:', users.map(u => ({ ...u, password: '***' }))); // Bulunan kullanıcıları logla

        if (users.length === 0) {
            console.log('No user found with email:', email);
            return res.status(401).json({ error: 'Geçersiz email veya şifre' });
        }

        const user = users[0];
        console.log('User found:', { 
            id: user.id, 
            email: user.email, 
            role: user.role,
            hashedPassword: user.password 
        });

        // Şifre kontrolü
        console.log('Comparing passwords...');
        console.log('Input password:', password);
        console.log('Stored hashed password:', user.password);
        
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Password validation result:', validPassword);

        if (!validPassword) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ error: 'Geçersiz email veya şifre' });
        }

        // Token oluştur
        console.log('Creating JWT token...');
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role 
            }, 
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('Login successful, token generated');

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
    const { 
        email, 
        password, 
        role, 
        name, 
        phone, 
        // Öğrenci alanları
        address, 
        branch_id,
        // Öğretmen alanları
        languages, 
        working_days
    } = req.body;
    
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
            // Email kontrolü
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
                    [userId, phone, address, branch_id ? branch_id : null]
                );
            } else if (role === 'teacher') {
                await connection.query(
                    'INSERT INTO teachers (user_id, working_days, branch_id) VALUES (?, ?, ?)',
                    [userId, JSON.stringify(working_days || []), branch_id]
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
            success: true,
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
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
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
                [userId, phone, address, branch_id ? branch_id : null]
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
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
    }
};

// Admin için öğretmen ekleme
const addTeacher = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }

    const { 
        email, 
        password, 
        name, 
        phone, 
        languages, 
        working_days,
        working_hours,
        branch_id 
    } = req.body;

    // Debug logları - Gelen veri
    console.log('=== ÖĞRETMEN EKLEME - GELEN VERİ ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

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

            // Working days ve hours verilerini hazırla ve doğrula
            let workingDaysData;
            let workingHoursData;

            try {
                workingDaysData = typeof working_days === 'string' ? 
                    JSON.parse(working_days) : working_days;
                
                workingHoursData = typeof working_hours === 'string' ? 
                    JSON.parse(working_hours) : working_hours;

                // Veri yapısını doğrula
                if (!workingDaysData || typeof workingDaysData !== 'object') {
                    throw new Error('Geçersiz working_days formatı');
                }
                if (!workingHoursData || typeof workingHoursData !== 'object') {
                    throw new Error('Geçersiz working_hours formatı');
                }
            } catch (error) {
                console.error('JSON parse hatası:', error);
                throw new Error('Çalışma günleri veya saatleri geçersiz formatta');
            }

            // Debug log - JSON dönüşümleri
            console.log('İşlenmiş veriler:', {
                workingDays: workingDaysData,
                workingHours: workingHoursData
            });

            // Teachers tablosuna ekle
            const [teacherResult] = await connection.query(
                'INSERT INTO teachers (user_id, working_days, working_hours, branch_id) VALUES (?, ?, ?, ?)',
                [userId, JSON.stringify(workingDaysData), JSON.stringify(workingHoursData), branch_id]
            );

            // Eklenen veriyi doğrula
            const [verifyData] = await connection.query(
                'SELECT working_days, working_hours FROM teachers WHERE id = ?',
                [teacherResult.insertId]
            );

            console.log('Veritabanına kaydedilen veri:', {
                working_days: verifyData[0].working_days,
                working_hours: verifyData[0].working_hours
            });

            // Dilleri ekle
            if (languages && languages.length > 0) {
                for (const languageId of languages) {
                    await connection.query(
                        'INSERT INTO teacher_languages (teacher_id, language_id) VALUES (?, ?)',
                        [teacherResult.insertId, languageId]
                    );
                }
            }

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
        console.error('Öğretmen ekleme hatası:', {
            message: error.message,
            stack: error.stack,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
    }
};

// Kullanıcı profili getir
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [users] = await db.pool.query(`
            SELECT u.*, r.name as role 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = ?
        `, [userId]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        const user = users[0];
        delete user.password; // Şifreyi yanıttan çıkar

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

// Test endpoint for admin user
const testAdmin = async (req, res) => {
    try {
        const [users] = await db.pool.query(
            'SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?', 
            ['admin@dilkursu.com']
        );
        
        console.log('Admin user check:', users);
        
        // Admin kullanıcısı varsa şifresini güncelle, yoksa oluştur
        const hashedPassword = await bcrypt.hash('admin123', 12);
        const [roles] = await db.pool.query('SELECT id FROM roles WHERE name = ?', ['admin']);
        
        if (roles.length === 0) {
            return res.status(500).json({ error: 'Admin rolü bulunamadı' });
        }

        if (users.length === 0) {
            // Admin kullanıcısı yoksa oluştur
            const [result] = await db.pool.query(
                'INSERT INTO users (email, password, role_id, name, phone) VALUES (?, ?, ?, ?, ?)',
                ['admin@dilkursu.com', hashedPassword, roles[0].id, 'Admin User', '1234567890']
            );
            
            return res.json({ 
                message: 'Admin kullanıcısı oluşturuldu',
                user: {
                    id: result.insertId,
                    email: 'admin@dilkursu.com',
                    role: 'admin'
                }
            });
        } else {
            // Admin kullanıcısı varsa şifresini güncelle
            await db.pool.query(
                'UPDATE users SET password = ? WHERE email = ?',
                [hashedPassword, 'admin@dilkursu.com']
            );
            
            return res.json({ 
                message: 'Admin şifresi güncellendi',
                user: {
                    id: users[0].id,
                    email: 'admin@dilkursu.com',
                    role: 'admin'
                }
            });
        }
    } catch (error) {
        console.error('Test admin error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

// Admin şifresini doğrudan güncelle
const updateAdminPassword = async (req, res) => {
    try {
        // Önce admin rolünü kontrol et
        const [roles] = await db.pool.query('SELECT id FROM roles WHERE name = ?', ['admin']);
        if (roles.length === 0) {
            return res.status(500).json({ error: 'Admin rolü bulunamadı' });
        }

        // Yeni şifreyi hashle
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        // Admin kullanıcısını güncelle veya oluştur
        const [result] = await db.pool.query(
            `INSERT INTO users (email, password, role_id, name, phone) 
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE password = ?`,
            ['admin@dilkursu.com', hashedPassword, roles[0].id, 'Admin User', '1234567890', hashedPassword]
        );
        
        res.json({ 
            message: 'Admin şifresi güncellendi',
            newPassword: newPassword
        });
    } catch (error) {
        console.error('Update admin password error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

// Dil adlarını ID'lere çeviren yardımcı fonksiyon
const getLanguageIds = async (languageNames, connection) => {
    if (!languageNames || languageNames.length === 0) {
        return [];
    }

    const languageIds = [];
    for (const langName of languageNames) {
        // Önce dil var mı kontrol et
        const [existingLang] = await connection.query(
            'SELECT id FROM languages WHERE name = ?',
            [langName]
        );

        if (existingLang.length > 0) {
            languageIds.push(existingLang[0].id);
        } else {
            // Dil yoksa ekle
            const [result] = await connection.query(
                'INSERT INTO languages (name) VALUES (?)',
                [langName]
            );
            languageIds.push(result.insertId);
        }
    }
    return languageIds;
};

// Öğretmen güncelleme
const updateTeacher = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }

    const { id } = req.params;
    const { 
        email, 
        name, 
        phone, 
        languages, 
        working_days,
        working_hours,
        branch_id 
    } = req.body;

    // Debug logları - Gelen veri
    console.log('=== ÖĞRETMEN GÜNCELLEME - GELEN VERİ ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Languages received:', languages, 'type:', typeof languages);

    try {
        await db.executeTransaction(async (connection) => {
            // Working days ve hours verilerini hazırla ve doğrula
            let workingDaysData;
            let workingHoursData;

            try {
                workingDaysData = typeof working_days === 'string' ? 
                    JSON.parse(working_days) : working_days;
                
                workingHoursData = typeof working_hours === 'string' ? 
                    JSON.parse(working_hours) : working_hours;

                // Veri yapısını doğrula
                if (!workingDaysData || typeof workingDaysData !== 'object') {
                    throw new Error('Geçersiz working_days formatı');
                }
                if (!workingHoursData || typeof workingHoursData !== 'object') {
                    throw new Error('Geçersiz working_hours formatı');
                }
            } catch (error) {
                console.error('JSON parse hatası:', error);
                throw new Error('Çalışma günleri veya saatleri geçersiz formatta');
            }

            // Debug log - JSON dönüşümleri
            console.log('İşlenmiş veriler:', {
                workingDays: workingDaysData,
                workingHours: workingHoursData
            });

            // Kullanıcı bilgilerini güncelle
            await connection.query(
                'UPDATE users SET email = ?, name = ?, phone = ? WHERE id = ?',
                [email, name, phone, id]
            );

            // Öğretmen bilgilerini güncelle
            await connection.query(
                'UPDATE teachers SET working_days = ?, working_hours = ?, branch_id = ? WHERE user_id = ?',
                [JSON.stringify(workingDaysData), JSON.stringify(workingHoursData), branch_id, id]
            );

            // Güncellenen veriyi doğrula
            const [verifyData] = await connection.query(
                'SELECT working_days, working_hours FROM teachers WHERE user_id = ?',
                [id]
            );

            console.log('Veritabanına kaydedilen veri:', {
                working_days: verifyData[0].working_days,
                working_hours: verifyData[0].working_hours
            });

            // Öğretmenin ID'sini al
            const [teacherInfo] = await connection.query(
                'SELECT id FROM teachers WHERE user_id = ?',
                [id]
            );

            if (teacherInfo.length > 0) {
                const teacherId = teacherInfo[0].id;

                // Mevcut dilleri sil
                await connection.query(
                    'DELETE FROM teacher_languages WHERE teacher_id = ?',
                    [teacherId]
                );

                // Yeni dilleri ekle
                if (languages && languages.length > 0) {
                    for (const languageId of languages) {
                        await connection.query(
                            'INSERT INTO teacher_languages (teacher_id, language_id) VALUES (?, ?)',
                            [teacherId, languageId]
                        );
                    }
                }
            }
        });

        res.json({
            message: 'Öğretmen başarıyla güncellendi',
            teacher: {
                id,
                email,
                name,
                role: 'teacher'
            }
        });
    } catch (error) {
        console.error('Öğretmen güncelleme hatası:', {
            message: error.message,
            stack: error.stack,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
    }
};

module.exports = {
    login,
    register,
    getProfile,
    addStudent,
    addTeacher,
    updateTeacher,
    testAdmin,
    updateAdminPassword
};