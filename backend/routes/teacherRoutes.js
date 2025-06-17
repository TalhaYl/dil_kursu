const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const { addTeacher, updateTeacher } = require('../controllers/userController');

// Öğretmenin kendi profilini güncellemesi
router.put('/profile', verifyToken, async (req, res) => {
    const connection = await db.pool.getConnection();
    try {
        const { name, email, phone, newPassword } = req.body;
        
        // Önce öğretmeni bul
        const [teacher] = await connection.query('SELECT user_id FROM teachers WHERE user_id = ?', [req.user.id]);
        
        if (teacher.length === 0) {
            return res.status(404).json({ error: 'Öğretmen bulunamadı' });
        }

        // E-posta kontrolü (kendi e-postası hariç)
        const [existingUser] = await connection.query(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, req.user.id]
        );
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor' });
        }

        // Transaction başlat
        await connection.beginTransaction();

        try {
            // Şifre değişikliği varsa
            if (newPassword) {
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                await connection.query(
                    'UPDATE users SET name = ?, email = ?, phone = ?, password = ? WHERE id = ?',
                    [name.trim(), email.trim(), phone?.trim() || null, hashedPassword, req.user.id]
                );
            } else {
                await connection.query(
                    'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
                    [name.trim(), email.trim(), phone?.trim() || null, req.user.id]
                );
            }
            
            // Transaction'ı onayla
            await connection.commit();

            // Güncellenmiş öğretmeni getir
            const [results] = await connection.query(`
                SELECT t.*, u.email, u.phone, u.name, b.name as branch_name,
                GROUP_CONCAT(DISTINCT c.name) as courses,
                GROUP_CONCAT(DISTINCT l.name) as languages
                FROM teachers t
                JOIN users u ON t.user_id = u.id
                LEFT JOIN branches b ON t.branch_id = b.id
                LEFT JOIN courses c ON t.id = c.teacher_id
                LEFT JOIN teacher_languages tl ON t.id = tl.teacher_id
                LEFT JOIN languages l ON tl.language_id = l.id
                WHERE t.user_id = ?
                GROUP BY t.id
            `, [req.user.id]);
            
            const updatedTeacher = results[0];
            updatedTeacher.languages = updatedTeacher.languages ? updatedTeacher.languages.split(',') : [];
            updatedTeacher.courses = updatedTeacher.courses ? updatedTeacher.courses.split(',') : [];
            
            res.json(updatedTeacher);
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error updating teacher profile:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    } finally {
        connection.release();
    }
});

// Öğretmen profilini getir
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const [teachers] = await db.pool.query(`
            SELECT t.*, u.email, u.phone, u.name, b.name as branch_name,
            GROUP_CONCAT(DISTINCT c.name) as courses,
            GROUP_CONCAT(DISTINCT l.name) as languages
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN branches b ON t.branch_id = b.id
            LEFT JOIN courses c ON t.id = c.teacher_id
            LEFT JOIN teacher_languages tl ON t.id = tl.teacher_id
            LEFT JOIN languages l ON tl.language_id = l.id
            WHERE t.user_id = ?
            GROUP BY t.id
        `, [req.user.id]);

        if (teachers.length === 0) {
            return res.status(404).json({ error: 'Öğretmen bulunamadı' });
        }

        const teacher = teachers[0];
        teacher.languages = teacher.languages ? teacher.languages.split(',') : [];
        teacher.courses = teacher.courses ? teacher.courses.split(',') : [];

        res.json(teacher);
    } catch (error) {
        console.error('Error fetching teacher profile:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğretmenin kurslarını getir
router.get('/courses', verifyToken, async (req, res) => {
    try {
        const [courses] = await db.pool.query(`
            SELECT c.*, b.name as branch_name
            FROM courses c
            LEFT JOIN branches b ON c.branch_id = b.id
            WHERE c.teacher_id = (
                SELECT id FROM teachers WHERE user_id = ?
            )
        `, [req.user.id]);

        res.json(courses);
    } catch (error) {
        console.error('Error fetching teacher courses:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğretmenin öğrencilerini getir
router.get('/students', verifyToken, async (req, res) => {
    try {
        // Önce öğretmenin ID'sini al
        const [teacherResult] = await db.pool.query(
            'SELECT id FROM teachers WHERE user_id = ?',
            [req.user.id]
        );

        if (teacherResult.length === 0) {
            console.log('Öğretmen bulunamadı:', req.user.id);
            return res.status(404).json({ error: 'Öğretmen bulunamadı' });
        }

        const teacherId = teacherResult[0].id;
        console.log('Öğretmen ID:', teacherId);

        // Öğretmenin kurslarını kontrol et
        const [courses] = await db.pool.query(
            'SELECT id, name FROM courses WHERE teacher_id = ?',
            [teacherId]
        );
        console.log('Öğretmenin kursları:', courses);

        if (courses.length === 0) {
            console.log('Öğretmenin kursu bulunamadı');
            return res.json([]);
        }

        // Öğrencileri getir
        const [students] = await db.pool.query(`
            SELECT DISTINCT 
                s.id,
                s.user_id,
                u.name,
                u.email,
                u.phone,
                GROUP_CONCAT(DISTINCT c.name) as enrolled_courses,
                GROUP_CONCAT(DISTINCT c.id) as course_ids
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN student_courses e ON s.id = e.student_id
            JOIN courses c ON e.course_id = c.id
            WHERE c.teacher_id = ?
            GROUP BY s.id, s.user_id, u.name, u.email, u.phone
        `, [teacherId]);

        console.log('Bulunan öğrenci sayısı:', students.length);
        console.log('Öğrenci verileri:', students);

        // Kurs isimlerini diziye çevir
        const formattedStudents = students.map(student => ({
            ...student,
            enrolled_courses: student.enrolled_courses ? student.enrolled_courses.split(',') : [],
            course_ids: student.course_ids ? student.course_ids.split(',').map(Number) : []
        }));

        res.json(formattedStudents);
    } catch (error) {
        console.error('Error fetching teacher students:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Tüm öğretmenleri getir
router.get('/', verifyToken, async (req, res) => {
    try {
        const [teachers] = await db.pool.query(`
            SELECT t.*, u.email, u.phone, u.name, b.name as branch_name,
            GROUP_CONCAT(DISTINCT c.name) as courses,
            GROUP_CONCAT(DISTINCT l.name) as languages
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN branches b ON t.branch_id = b.id
            LEFT JOIN courses c ON t.id = c.teacher_id
            LEFT JOIN teacher_languages tl ON t.id = tl.teacher_id
            LEFT JOIN languages l ON tl.language_id = l.id
            GROUP BY t.id
        `);

        // Öğretmen verilerini düzenle
        const formattedTeachers = teachers.map(teacher => {
            return {
                ...teacher,
                languages: teacher.languages ? teacher.languages.split(',') : [],
                courses: teacher.courses ? teacher.courses.split(',') : []
            };
        });

        res.json(formattedTeachers);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğretmen detaylarını getir
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [teachers] = await db.pool.query(`
            SELECT t.*, u.email, u.phone, u.name, b.name as branch_name,
            GROUP_CONCAT(DISTINCT c.name) as courses,
            GROUP_CONCAT(DISTINCT c.language) as course_languages
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN branches b ON t.branch_id = b.id
            LEFT JOIN courses c ON t.id = c.teacher_id
            WHERE t.id = ?
            GROUP BY t.id
        `, [req.params.id]);

        if (teachers.length === 0) {
            return res.status(404).json({ error: 'Öğretmen bulunamadı' });
        }

        const teacher = teachers[0];

        // languages ve working_days alanlarını parse et
        let languages = [];
        let workingDays = null;

        try {
            if (teacher.languages) {
                languages = JSON.parse(teacher.languages);
            }
        } catch (e) {
            // Eğer JSON parse edilemezse, string olarak kullan
            languages = teacher.languages ? [teacher.languages] : [];
        }

        try {
            if (teacher.working_days) {
                workingDays = JSON.parse(teacher.working_days);
            }
        } catch (e) {
            // Eğer JSON parse edilemezse, null olarak bırak
            workingDays = null;
        }

        const formattedTeacher = {
            ...teacher,
            languages,
            working_days: workingDays,
            courses: teacher.courses ? teacher.courses.split(',') : [],
            course_languages: teacher.course_languages ? teacher.course_languages.split(',') : []
        };

        res.json(formattedTeacher);
    } catch (error) {
        console.error('Error fetching teacher:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğretmenin öğrencilerini getir
router.get('/:id/students', verifyToken, async (req, res) => {
    try {
        const [students] = await db.pool.query(`
            SELECT s.*, u.email, u.phone, u.name
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN enrollments e ON s.id = e.student_id
            JOIN courses c ON e.course_id = c.id
            WHERE c.teacher_id = ?
            GROUP BY s.id
        `, [req.params.id]);

        res.json(students);
    } catch (error) {
        console.error('Error fetching teacher students:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğretmen ekleme
router.post('/', verifyToken, addTeacher);

// Öğretmen güncelleme
router.put('/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }

    const teacherId = req.params.id;
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

    try {
        // Önce öğretmeni ve user_id'sini bul
        const [teacherInfo] = await db.pool.query(
            'SELECT user_id FROM teachers WHERE id = ?',
            [teacherId]
        );

        if (teacherInfo.length === 0) {
            return res.status(404).json({ error: 'Öğretmen bulunamadı' });
        }

        const userId = teacherInfo[0].user_id;

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
                [email, name, phone, userId]
            );

            // Öğretmen bilgilerini güncelle
            await connection.query(
                'UPDATE teachers SET working_days = ?, working_hours = ?, branch_id = ? WHERE id = ?',
                [
                    JSON.stringify(workingDaysData), 
                    JSON.stringify(workingHoursData), 
                    branch_id,
                    teacherId
                ]
            );

            // Güncellenen veriyi doğrula
            const [verifyData] = await connection.query(
                'SELECT working_days, working_hours FROM teachers WHERE id = ?',
                [teacherId]
            );

            if (!verifyData || verifyData.length === 0) {
                throw new Error('Öğretmen bilgileri güncellenemedi');
            }

            console.log('Veritabanına kaydedilen veri:', {
                working_days: verifyData[0].working_days,
                working_hours: verifyData[0].working_hours
            });
        });

        res.json({
            message: 'Öğretmen başarıyla güncellendi',
            teacher: {
                id: teacherId,
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
});

// Öğretmen sil (sadece admin)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const teacherId = req.params.id;
        
        // Önce öğretmeni bul
        const [teacher] = await db.pool.query('SELECT user_id FROM teachers WHERE id = ?', [teacherId]);
        
        if (teacher.length === 0) {
            return res.status(404).json({ error: 'Öğretmen bulunamadı' });
        }

        // Önce öğretmenin kurslarını kontrol et
        const [courses] = await db.pool.query('SELECT id FROM courses WHERE teacher_id = ? AND status = ?', [teacherId, 'active']);
        if (courses.length > 0) {
            return res.status(400).json({ error: 'Bu öğretmenin aktif kursları var. Önce kursları başka öğretmene atayın veya iptal edin.' });
        }

        // Transaction başlat
        const connection = await db.pool.getConnection();
        await connection.beginTransaction();

        try {
            // Önce öğretmenin kurslarını pasife çek
            await connection.query('UPDATE courses SET teacher_id = NULL WHERE teacher_id = ?', [teacherId]);
            
            // Sonra öğretmeni sil
            await connection.query('DELETE FROM teachers WHERE id = ?', [teacherId]);
            
            // Son olarak kullanıcıyı sil
            await connection.query('DELETE FROM users WHERE id = ?', [teacher[0].user_id]);
            
            // Transaction'ı onayla
            await connection.commit();
            
            res.json({ message: 'Öğretmen başarıyla silindi' });
        } catch (error) {
            // Hata durumunda transaction'ı geri al
            await connection.rollback();
            throw error;
        } finally {
            // Bağlantıyı serbest bırak
            connection.release();
        }
    } catch (error) {
        console.error('Error deleting teacher:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
