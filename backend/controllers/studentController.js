const { pool } = require('../config/db');
const { executeTransaction } = require('../config/db');

// Öğrenciyi kursa kaydet
exports.registerToCourse = async (req, res) => {
  const studentId = req.user.id;
  const { courseId } = req.params;

  try {
    // Öğrenci ID'sini al
    const [students] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    const studentDbId = students[0].id;

    // Kursun var olduğunu ve müsait olduğunu kontrol et
    const [courses] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND status = "active"',
      [courseId]
    );

    if (courses.length === 0) {
      return res.status(404).json({ message: 'Kurs bulunamadı veya aktif değil' });
    }

    // Kapasite kontrolü
    const [capacityInfo] = await pool.query(
      `SELECT max_students, (SELECT COUNT(*) FROM student_courses WHERE course_id = ?) as current_count FROM courses WHERE id = ?`,
      [courseId, courseId]
    );
    if (!capacityInfo.length) {
      return res.status(404).json({ message: 'Kurs bulunamadı' });
    }
    if (capacityInfo[0].current_count >= capacityInfo[0].max_students) {
      return res.status(400).json({ message: 'Kursun kapasitesi dolu' });
    }

    // Öğrencinin zaten bu kursa kayıtlı olup olmadığını kontrol et
    const [existingRegistration] = await pool.query(
      'SELECT * FROM student_courses WHERE student_id = ? AND course_id = ?',
      [studentDbId, courseId]
    );

    if (existingRegistration.length > 0) {
      return res.status(400).json({ message: 'Bu kursa zaten kayıtlısınız' });
    }

    // Öğrenciyi kursa kaydet
    await pool.query(
      'INSERT INTO student_courses (student_id, course_id) VALUES (?, ?)',
      [studentDbId, courseId]
    );

    res.json({ message: 'Kursa başarıyla kaydoldunuz' });
  } catch (error) {
    console.error('Kurs kaydı hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
}; 