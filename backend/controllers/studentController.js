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

    // Zaman çakışması kontrolü (checkScheduleConflict fonksiyonunu import etmek gerekebilir)
    // Bu fonksiyon için studentRoutes.js'deki fonksiyonu kullanacağız
    const connection = await pool.getConnection();
    try {
      // Öğrencinin mevcut kurslarını ve programlarını al
      const [existingCourses] = await connection.query(`
        SELECT c.id, c.name, c.schedule, c.start_date, c.end_date
        FROM student_courses sc
        JOIN courses c ON sc.course_id = c.id
        WHERE sc.student_id = ? AND c.status = 'active'
      `, [studentDbId]);

      // Yeni kursun programını al
      const [newCourse] = await connection.query(`
        SELECT id, name, schedule, start_date, end_date
        FROM courses
        WHERE id = ? AND status = 'active'
      `, [courseId]);

      if (newCourse.length > 0) {
        const newCourseData = newCourse[0];
        let newSchedule;
        
        try {
          newSchedule = typeof newCourseData.schedule === 'string' 
            ? JSON.parse(newCourseData.schedule) 
            : newCourseData.schedule;
        } catch (e) {
          return res.status(400).json({ message: 'Kursun program bilgisi geçersiz' });
        }

        // Tarih aralığı ve saat çakışması kontrolü
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
                           return res.status(400).json({ 
                             message: `"${existingCourse.name}" kursu ile zaman çakışması var. ${day} günü ${existingSlot} saatleri çakışıyor.`
                           });
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
                       return res.status(400).json({ 
                         message: `"${existingCourse.name}" kursu ile zaman çakışması var. ${day} günü ${existingStart}-${existingEnd} saatleri çakışıyor.`
                       });
                     }
                   }
                 }
               }
             }
          }
        }
      }

      // Öğrenciyi kursa kaydet
      await connection.query(
        'INSERT INTO student_courses (student_id, course_id) VALUES (?, ?)',
        [studentDbId, courseId]
      );
    } finally {
      connection.release();
    }

    res.json({ message: 'Kursa başarıyla kaydoldunuz' });
  } catch (error) {
    console.error('Kurs kaydı hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
}; 