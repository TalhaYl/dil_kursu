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

// Zaman çakışması kontrolü fonksiyonu
async function checkScheduleConflict(studentId, newCourseId, connection) {
    try {
        // Öğrencinin mevcut kurslarını ve programlarını al
        const [existingCourses] = await connection.query(`
            SELECT c.id, c.name, c.schedule, c.start_date, c.end_date
            FROM student_courses sc
            JOIN courses c ON sc.course_id = c.id
            WHERE sc.student_id = ? AND c.status = 'active'
        `, [studentId]);

        // Yeni kursun programını al
        const [newCourse] = await connection.query(`
            SELECT id, name, schedule, start_date, end_date
            FROM courses
            WHERE id = ? AND status = 'active'
        `, [newCourseId]);

        if (newCourse.length === 0) {
            return { hasConflict: true, message: 'Kurs bulunamadı veya aktif değil' };
        }

        const newCourseData = newCourse[0];
        let newSchedule;
        
        try {
            newSchedule = typeof newCourseData.schedule === 'string' 
                ? JSON.parse(newCourseData.schedule) 
                : newCourseData.schedule;
        } catch (e) {
            return { hasConflict: true, message: 'Yeni kursun program bilgisi geçersiz' };
        }

        // Tarih aralığı çakışması kontrolü
        const newStartDate = new Date(newCourseData.start_date);
        const newEndDate = new Date(newCourseData.end_date);

        for (const existingCourse of existingCourses) {
            const existingStartDate = new Date(existingCourse.start_date);
            const existingEndDate = new Date(existingCourse.end_date);

            // Tarih aralıkları çakışıyor mu?
            const dateOverlap = (newStartDate <= existingEndDate) && (newEndDate >= existingStartDate);
            
            if (dateOverlap) {
                let existingSchedule;
                try {
                    existingSchedule = typeof existingCourse.schedule === 'string' 
                        ? JSON.parse(existingCourse.schedule) 
                        : existingCourse.schedule;
                } catch (e) {
                    continue; // Geçersiz schedule'u atla
                }

                // Günlük saat çakışması kontrolü
                for (const [day, newTimeSlot] of Object.entries(newSchedule)) {
                    if (existingSchedule[day] && newTimeSlot && existingSchedule[day]) {
                        // Önce slot bazlı kontrol yap (daha detaylı)
                        if (newTimeSlot.slots && existingSchedule[day].slots) {
                            for (const newSlot of newTimeSlot.slots) {
                                for (const existingSlot of existingSchedule[day].slots) {
                                    const [newSlotStart, newSlotEnd] = newSlot.split('-');
                                    const [existingSlotStart, existingSlotEnd] = existingSlot.split('-');
                                    
                                    if (newSlotStart && newSlotEnd && existingSlotStart && existingSlotEnd) {
                                        const slotOverlap = (newSlotStart < existingSlotEnd) && (newSlotEnd > existingSlotStart);
                                        
                                        if (slotOverlap) {
                                            return {
                                                hasConflict: true,
                                                message: `"${existingCourse.name}" kursu ile zaman çakışması var. ${day} günü ${existingSlot} saatleri çakışıyor.`,
                                                conflictingCourse: existingCourse.name,
                                                conflictDay: day,
                                                conflictTime: existingSlot
                                            };
                                        }
                                    }
                                }
                            }
                        } else {
                            // Slot yoksa genel start-end kontrolü yap
                            const newStart = newTimeSlot.start;
                            const newEnd = newTimeSlot.end;
                            const existingStart = existingSchedule[day].start;
                            const existingEnd = existingSchedule[day].end;

                            if (newStart && newEnd && existingStart && existingEnd) {
                                const timeOverlap = (newStart < existingEnd) && (newEnd > existingStart);
                                
                                if (timeOverlap) {
                                    return {
                                        hasConflict: true,
                                        message: `"${existingCourse.name}" kursu ile zaman çakışması var. ${day} günü ${existingStart}-${existingEnd} saatleri çakışıyor.`,
                                        conflictingCourse: existingCourse.name,
                                        conflictDay: day,
                                        conflictTime: `${existingStart}-${existingEnd}`
                                    };
                                }
                            }
                        }
                    }
                }
            }
        }

        return { hasConflict: false };
    } catch (error) {
        console.error('Schedule conflict check error:', error);
        return { hasConflict: true, message: 'Zaman çakışması kontrolü sırasında hata oluştu' };
    }
}

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

// Geçici resim yükleme (admin) - yeni öğrenci için (ÖNEMLİ: /:id/image route'undan ÖNCE olmalı)
router.post('/temp/image', verifyToken, checkRole(['admin']), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Resim yüklenmedi' });
        }

        const imagePath = `/uploads/${req.file.filename}`;
        console.log('Geçici resim yüklendi:', imagePath); // Debug için
        res.json({ image_path: imagePath });
    } catch (error) {
        console.error('Error uploading temporary image:', error);
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
    const connection = await db.pool.getConnection();
    await connection.beginTransaction();

    try {
        console.log('Gelen veri:', req.body); // Debug için

        const { name, email, phone, address, branch_id, course_ids, status, latitude, longitude, image_path } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Öğrenci adı ve e-posta zorunludur' });
        }

        // E-posta kontrolü
        const [existingUser] = await connection.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        if (existingUser.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanılıyor' });
        }

        // Geçici şifre oluştur ve hash'le
        const tempPassword = '123456'; // Sabit geçici şifre
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        console.log(`Öğrenci için geçici şifre: ${tempPassword}`); // Debug için
        
        // Önce users tablosuna ekle (role_id: 3 = student)
        const [userResult] = await connection.query(
            'INSERT INTO users (name, email, phone, role_id, password) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone || null, 3, hashedPassword]
        );

        const userId = userResult.insertId;
        console.log('Eklenen user ID:', userId); // Debug için

        // Sonra students tablosuna ekle
        const [studentResult] = await connection.query(
            'INSERT INTO students (user_id, address, branch_id, latitude, longitude, image_path, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, address || null, branch_id || null, latitude || null, longitude || null, image_path || null, status || 'active']
        );

        const studentId = studentResult.insertId;
        console.log('Eklenen öğrenci ID:', studentId); // Debug için
        console.log('Resim yolu:', image_path); // Debug için

        // Kurs kayıtlarını ekle
        if (course_ids && course_ids.length > 0) {
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

                // Zaman çakışması kontrolü
                const conflictCheck = await checkScheduleConflict(studentId, courseId, connection);
                if (conflictCheck.hasConflict) {
                    await connection.rollback();
                    return res.status(400).json({ error: conflictCheck.message });
                }
                
                await connection.query(
                    'INSERT INTO student_courses (student_id, course_id) VALUES (?, ?)',
                    [studentId, courseId]
                );
            }
            console.log('Kurs kayıtları eklendi:', course_ids); // Debug için
        }

        await connection.commit();

        // Eklenen öğrenciyi getir
        const [newStudent] = await connection.query(`
            SELECT s.*, u.email, u.phone, u.name, b.name as branch_name
            FROM students s 
            JOIN users u ON s.user_id = u.id 
            LEFT JOIN branches b ON s.branch_id = b.id
            WHERE s.id = ?
        `, [studentId]);
        
        console.log('Eklenen öğrenci:', newStudent[0]); // Debug için

        res.status(201).json(newStudent[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Öğrenci ekleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
    } finally {
        connection.release();
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

                // Zaman çakışması kontrolü (güncellenecek kurslar için)
                const conflictCheck = await checkScheduleConflict(studentId, courseId, connection);
                if (conflictCheck.hasConflict) {
                    await connection.rollback();
                    return res.status(400).json({ error: conflictCheck.message });
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

        // Zaman çakışması kontrolü
        const connection = await db.pool.getConnection();
        try {
            const conflictCheck = await checkScheduleConflict(studentId, course_id, connection);
            if (conflictCheck.hasConflict) {
                return res.status(400).json({ error: conflictCheck.message });
            }

            // Öğrenciyi derse kaydet
            await connection.query(
                'INSERT INTO student_courses (student_id, course_id) VALUES (?, ?)',
                [studentId, course_id]
            );
        } finally {
            connection.release();
        }

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
