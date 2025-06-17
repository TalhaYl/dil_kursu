const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole, authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const { geocodeAddress, findNearestBranch } = require('../utils/geocoding');
const studentController = require('../controllers/studentController');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// 1. Öğrenci kendi profil fotoğrafını güncelleyebilsin
router.post('/profile/image', verifyToken, upload.single('image'), async (req, res) => {
    try {
        // Öğrencinin id'sini bul
        const [student] = await db.pool.query('SELECT id, image_path FROM students WHERE user_id = ?', [req.user.id]);
        if (student.length === 0) {
            return res.status(404).json({ error: 'Öğrenci bulunamadı' });
        }
        const studentId = student[0].id;

        if (!req.file) {
            return res.status(400).json({ error: 'Resim yüklenmedi' });
        }

        const imagePath = `/uploads/${req.file.filename}`;
        
        // Önce eski resmi sil
        if (student[0].image_path) {
            const oldImagePath = student[0].image_path;
            const fullOldPath = path.join(__dirname, '..', 'public', oldImagePath.replace(/^\//, ''));
            if (fs.existsSync(fullOldPath)) {
                fs.unlinkSync(fullOldPath);
            }
        }

        // Yeni resmi kaydet
        await db.pool.query(
            'UPDATE students SET image_path = ? WHERE id = ?',
            [imagePath, studentId]
        );

        res.json({ image_path: imagePath });
    } catch (error) {
        console.error('Error uploading student image:', error);
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
    }
});

// Öğrenci resmi yükle (admin)
router.post('/:id/image', verifyToken, checkRole(['admin']), upload.single('image'), async (req, res) => {
    try {
        const studentId = req.params.id;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Resim yüklenmedi' });
        }

        const imagePath = `/uploads/${req.file.filename}`;
        await db.pool.query(
            'UPDATE students SET image_path = ? WHERE id = ?',
            [imagePath, studentId]
        );

        const [updatedStudent] = await db.pool.query('SELECT * FROM students WHERE id = ?', [studentId]);
        res.json(updatedStudent[0]);
    } catch (error) {
        console.error('Error uploading student image:', error);
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
    }
});

// Geçici resim yükleme (admin)
router.post('/temp/image', verifyToken, checkRole(['admin']), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Resim yüklenmedi' });
        }

        const imagePath = `/uploads/${req.file.filename}`;
        res.json({ image_path: imagePath });
    } catch (error) {
        console.error('Error uploading temporary image:', error);
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
    }
});

// Tüm öğrencileri getir
router.get('/', verifyToken, async (req, res) => {
    try {
        const [students] = await db.pool.query(`
            SELECT s.*, u.email, u.phone, u.name, b.name as branch_name,
            GROUP_CONCAT(DISTINCT c.name) as courses
            FROM students s 
            JOIN users u ON s.user_id = u.id 
            LEFT JOIN branches b ON s.branch_id = b.id
            LEFT JOIN student_courses sc ON s.id = sc.student_id
            LEFT JOIN courses c ON sc.course_id = c.id
            GROUP BY s.id
        `);
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğrenci profilini getir
router.get('/profile', verifyToken, async (req, res) => {
    try {
      // Öğrencinin user_id'si ile bilgileri çek
      const [student] = await db.pool.query(`
        SELECT u.name, u.email, u.phone, s.id as student_id, s.branch_id, s.image_path
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE s.user_id = ?
        LIMIT 1
      `, [req.user.id]);
  
      if (student.length === 0) {
        return res.status(404).json({ error: 'Öğrenci bulunamadı' });
      }
  
      res.json(student[0]);
    } catch (error) {
      console.error('Error fetching student profile:', error);
      res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

// Öğrenci profilini güncelle (sadece öğrenci kendi profilini günceller)
router.put('/profile', verifyToken, async (req, res) => {
    try {
      const { name, email, phone, newPassword } = req.body;
      // Öğrencinin user_id'sini bul
      const [student] = await db.pool.query('SELECT user_id FROM students WHERE user_id = ?', [req.user.id]);
      if (student.length === 0) {
        return res.status(404).json({ error: 'Öğrenci bulunamadı' });
      }
      // E-posta kontrolü (kendi e-postası hariç)
      const [existingUser] = await db.pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.user.id]
      );
      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor' });
      }
      // Şifre güncelleme
      if (newPassword) {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.pool.query(
          'UPDATE users SET name = ?, email = ?, phone = ?, password = ? WHERE id = ?',
          [name, email, phone || null, hashedPassword, req.user.id]
        );
      } else {
        await db.pool.query(
          'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
          [name, email, phone || null, req.user.id]
        );
      }
      // Güncellenmiş bilgileri döndür
      const [users] = await db.pool.query('SELECT name, email, phone FROM users WHERE id = ?', [req.user.id]);
      res.json(users[0]);
    } catch (error) {
      console.error('Error updating student profile:', error);
      res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

// Öğrencinin kendi kurslarını getir
router.get('/my-courses', verifyToken, async (req, res) => {
    try {
      // Öğrencinin ID'sini bul
      const [studentResult] = await db.pool.query(
        'SELECT id FROM students WHERE user_id = ?',
        [req.user.id]
      );
      if (studentResult.length === 0) {
        return res.status(404).json({ error: 'Öğrenci bulunamadı' });
      }
      const studentId = studentResult[0].id;
  
      // Kursları getir
      const [courses] = await db.pool.query(`
        SELECT c.*, u.name as teacher_name
        FROM student_courses sc
        JOIN courses c ON sc.course_id = c.id
        LEFT JOIN teachers t ON c.teacher_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE sc.student_id = ?
      `, [studentId]);
  
      // Eğer kursların schedule'ı string olarak geliyorsa, parse et
      courses.forEach(course => {
        if (typeof course.schedule === 'string') {
          try {
            course.schedule = JSON.parse(course.schedule);
          } catch (e) {
            course.schedule = {};
          }
        }
      });
  
      res.json(courses);
    } catch (error) {
      console.error('Error fetching student courses:', error);
      res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

// Öğrenci detaylarını getir
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [students] = await db.pool.query(`
            SELECT s.*, u.email, u.phone, u.name, b.name as branch_name,
            GROUP_CONCAT(DISTINCT c.id) as course_ids,
            GROUP_CONCAT(DISTINCT c.name) as courses
            FROM students s 
            JOIN users u ON s.user_id = u.id 
            LEFT JOIN branches b ON s.branch_id = b.id
            LEFT JOIN student_courses sc ON s.id = sc.student_id
            LEFT JOIN courses c ON sc.course_id = c.id
            WHERE s.id = ?
            GROUP BY s.id
        `, [req.params.id]);

        if (students.length === 0) {
            return res.status(404).json({ error: 'Öğrenci bulunamadı' });
        }

        const student = students[0];
        student.course_ids = student.course_ids ? student.course_ids.split(',').map(Number) : [];
        student.courses = student.courses ? student.courses.split(',') : [];

        res.json(student);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yeni öğrenci ekle
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        console.log('Gelen veri:', req.body); // Debug için

        const { name, email, phone, address, branch_id, course_ids, image_path } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Öğrenci adı zorunludur' });
        }

        // Öğrenciyi ekle
        const [result] = await db.pool.query(
            'INSERT INTO students (name, email, phone, address, branch_id, image_path, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, email || null, phone || null, address || null, branch_id || null, image_path || null, 'active']
        );

        console.log('Eklenen öğrenci ID:', result.insertId); // Debug için
        console.log('Resim yolu:', image_path); // Debug için

        const studentId = result.insertId;

        // Kurs kayıtlarını ekle
        if (course_ids && course_ids.length > 0) {
            const courseValues = course_ids.map(courseId => [studentId, courseId]);
            await db.pool.query(
                'INSERT INTO student_courses (student_id, course_id) VALUES ?',
                [courseValues]
            );
            console.log('Kurs kayıtları eklendi:', courseValues); // Debug için
        }

        // Eklenen öğrenciyi getir
        const [newStudent] = await db.pool.query('SELECT * FROM students WHERE id = ?', [studentId]);
        console.log('Eklenen öğrenci:', newStudent[0]); // Debug için

        res.status(201).json(newStudent[0]);
    } catch (error) {
        console.error('Öğrenci ekleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
    }
});

// Öğrenci güncelle (sadece admin istediği öğrenciyi günceller)
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    const connection = await db.pool.getConnection();
    await connection.beginTransaction();

    try {
        const studentId = req.params.id;
        const { name, email, phone, address, branch_id, course_ids, status, latitude, longitude, image_path } = req.body;
        // Öğrenci ve kullanıcı bilgilerini güncelle
        const [student] = await connection.query('SELECT user_id FROM students WHERE id = ?', [studentId]);
        if (student.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Öğrenci bulunamadı' });
        }

        const userId = student[0].user_id;

        // Kullanıcı bilgilerini güncelle
        await connection.query(
            'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
            [name, email, phone || null, userId]
        );

        // Öğrenci bilgilerini güncelle
        await connection.query(
            'UPDATE students SET branch_id = ?, address = ?, status = ?, latitude = ?, longitude = ?, image_path = ? WHERE id = ?',
            [branch_id, address || null, status, latitude || null, longitude || null, image_path || null, studentId]
        );

        // Mevcut kurs ilişkilerini sil
        await connection.query('DELETE FROM student_courses WHERE student_id = ?', [studentId]);

        // Yeni kurs ilişkilerini ekle
        if (course_ids && Array.isArray(course_ids)) {
            for (const courseId of course_ids) {
                // Kapasite kontrolü
                const [courseInfo] = await connection.query(
                  `SELECT max_students, (SELECT COUNT(*) FROM student_courses WHERE course_id = ?) as current_count FROM courses WHERE id = ?`,
                  [courseId, courseId]
                );
                if (!courseInfo.length) {
                  await connection.rollback();
                  return res.status(404).json({ error: `Kurs bulunamadı (ID: ${courseId})` });
                }
                if (courseInfo[0].current_count >= courseInfo[0].max_students) {
                  await connection.rollback();
                  return res.status(400).json({ error: `Kursun kapasitesi dolu (ID: ${courseId})` });
                }
                await connection.query(
                    'INSERT INTO student_courses (student_id, course_id) VALUES (?, ?)',
                    [studentId, courseId]
                );
            }
        }

        await connection.commit();

        // Güncellenmiş öğrenci bilgilerini getir
        const [updatedStudent] = await connection.query(`
            SELECT s.*, u.email, u.phone, u.name, b.name as branch_name,
            GROUP_CONCAT(DISTINCT c.id) as course_ids,
            GROUP_CONCAT(DISTINCT c.name) as courses
            FROM students s 
            JOIN users u ON s.user_id = u.id 
            LEFT JOIN branches b ON s.branch_id = b.id
            LEFT JOIN student_courses sc ON s.id = sc.student_id
            LEFT JOIN courses c ON sc.course_id = c.id
            WHERE s.id = ?
            GROUP BY s.id
        `, [studentId]);

        const studentData = updatedStudent[0];
        studentData.course_ids = studentData.course_ids ? studentData.course_ids.split(',').map(Number) : [];
        studentData.courses = studentData.courses ? studentData.courses.split(',') : [];

        res.json(studentData);
    } catch (error) {
        await connection.rollback();
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    } finally {
        connection.release();
    }
});

// Öğrenciyi derse kaydet (sadece admin)
router.post('/:id/courses', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const studentId = req.params.id;
        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ error: 'Kurs ID zorunludur' });
        }

        // Öğrenci ve kurs var mı kontrol et
        const [student] = await db.pool.query('SELECT id FROM students WHERE id = ?', [studentId]);
        const [course] = await db.pool.query('SELECT id FROM courses WHERE id = ?', [course_id]);

        if (student.length === 0) {
            return res.status(404).json({ error: 'Öğrenci bulunamadı' });
        }
        if (course.length === 0) {
            return res.status(404).json({ error: 'Kurs bulunamadı' });
        }

        // Kapasite kontrolü
        const [courseInfo] = await db.pool.query(
          `SELECT max_students, (SELECT COUNT(*) FROM student_courses WHERE course_id = ?) as current_count FROM courses WHERE id = ?`,
          [course_id, course_id]
        );
        if (!courseInfo.length) {
          return res.status(404).json({ error: 'Kurs bulunamadı' });
        }
        if (courseInfo[0].current_count >= courseInfo[0].max_students) {
          return res.status(400).json({ error: 'Kursun kapasitesi dolu' });
        }
        // Öğrenciyi derse kaydet
        await db.pool.query(
            'INSERT INTO student_courses (student_id, course_id) VALUES (?, ?)',
            [studentId, course_id]
        );

        res.json({ message: 'Öğrenci başarıyla derse kaydedildi' });
    } catch (error) {
        console.error('Error enrolling student in course:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğrenciyi dersten sil (sadece admin)
router.delete('/:id/courses/:courseId', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id: studentId, courseId } = req.params;

        // Öğrenciyi dersten sil
        const [result] = await db.pool.query(
            'DELETE FROM student_courses WHERE student_id = ? AND course_id = ?',
            [studentId, courseId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Öğrenci veya kurs bulunamadı' });
        }

        res.json({ message: 'Öğrenci başarıyla dersten silindi' });
    } catch (error) {
        console.error('Error removing student from course:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğrenci sil (sadece admin)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const studentId = req.params.id;
        
        // Önce öğrenciyi bul
        const [student] = await db.pool.query('SELECT user_id FROM students WHERE id = ?', [studentId]);
        
        if (student.length === 0) {
            return res.status(404).json({ error: 'Öğrenci bulunamadı' });
        }

        // Transaction başlat
        const connection = await db.pool.getConnection();
        await connection.beginTransaction();

        try {
            // Önce öğrencinin kurs kayıtlarını sil
            await connection.query('DELETE FROM student_courses WHERE student_id = ?', [studentId]);
            
            // Sonra öğrenciyi sil
            await connection.query('DELETE FROM students WHERE id = ?', [studentId]);
            
            // Son olarak kullanıcıyı sil
            await connection.query('DELETE FROM users WHERE id = ?', [student[0].user_id]);
            
            // Transaction'ı onayla
            await connection.commit();
            
            res.json({ message: 'Öğrenci başarıyla silindi' });
        } catch (error) {
            // Hata durumunda transaction'ı geri al
            await connection.rollback();
            throw error;
        } finally {
            // Bağlantıyı serbest bırak
            connection.release();
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğrenciyi kursa kaydet
router.post('/courses/:courseId', verifyToken, studentController.registerToCourse);

module.exports = router;
