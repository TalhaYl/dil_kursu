const db = require('../config/db');

// Öğretmen müsaitlik kontrolü
const validateTeacherAvailability = async (teacherId, day, startTime, endTime) => {
  try {
    // Öğretmenin çalışma saatlerini getir
    const [teachers] = await db.pool.query(
      'SELECT working_days, working_hours FROM teachers WHERE id = ?',
      [teacherId]
    );

    if (teachers.length === 0) {
      throw new Error('Öğretmen bulunamadı');
    }

    let workingDays = {};
    let workingHours = {};

    try {
      workingDays = typeof teachers[0].working_days === 'string' ? 
        JSON.parse(teachers[0].working_days) : teachers[0].working_days || {};
    } catch (e) {
      workingDays = {};
    }

    try {
      workingHours = typeof teachers[0].working_hours === 'string' ? 
        JSON.parse(teachers[0].working_hours) : teachers[0].working_hours || {};
    } catch (e) {
      workingHours = {};
    }
    
    // Seçilen gün için çalışma saatlerini kontrol et
    if (!workingDays[day] || !Array.isArray(workingDays[day]) || workingDays[day].length === 0) {
      throw new Error('Öğretmen bu gün müsait değil');
    }

    if (!workingHours[day] || !workingHours[day].start || !workingHours[day].end) {
      throw new Error('Öğretmenin bu gün için çalışma saatleri tanımlanmamış');
    }

    const teacherStart = workingHours[day].start;
    const teacherEnd = workingHours[day].end;

    // Saat değerlerinin string olduğundan emin ol
    let courseStart, courseEnd;
    
    if (typeof startTime === 'string') {
      courseStart = startTime;
    } else if (typeof startTime === 'object' && startTime !== null) {
      throw new Error(`Geçersiz başlangıç saati formatı: ${JSON.stringify(startTime)}`);
    } else {
      courseStart = String(startTime);
    }
    
    if (typeof endTime === 'string') {
      courseEnd = endTime;
    } else if (typeof endTime === 'object' && endTime !== null) {
      throw new Error(`Geçersiz bitiş saati formatı: ${JSON.stringify(endTime)}`);
    } else {
      courseEnd = String(endTime);
    }

    // Kurs saatlerinin öğretmenin müsait olduğu saatler içinde olup olmadığını kontrol et
    if (courseStart < teacherStart || courseEnd > teacherEnd) {
      throw new Error(`Kurs saatleri (${courseStart}-${courseEnd}) öğretmenin müsait olduğu saatler (${teacherStart}-${teacherEnd}) dışında`);
    }

    return true;
  } catch (error) {
    throw error;
  }
};

// Öğretmen çakışma kontrolü
const checkTeacherTimeConflict = async (teacherId, day, startTime, endTime, courseStartDate, courseEndDate, excludeCourseId = null) => {
  let query = `
    SELECT c.*, u.name as teacher_name FROM courses c
    LEFT JOIN teachers t ON c.teacher_id = t.id
    LEFT JOIN users u ON t.user_id = u.id
    WHERE c.teacher_id = ? 
    AND JSON_EXTRACT(c.schedule, '$."${day}".start') IS NOT NULL
    AND c.status = 'active'
  `;
  
  const params = [teacherId];
  
  if (excludeCourseId) {
    query += ' AND c.id != ?';
    params.push(excludeCourseId);
  }

  const [existingCourses] = await db.pool.query(query, params);

  for (const course of existingCourses) {
    // 1. Tarih aralığı çakışma kontrolü
    const existingStartDate = new Date(course.start_date);
    const existingEndDate = new Date(course.end_date);
    const newStartDate = new Date(courseStartDate);
    const newEndDate = new Date(courseEndDate);

    const dateOverlap = (
      (newStartDate <= existingEndDate && newEndDate >= existingStartDate)
    );

    if (!dateOverlap) {
      continue; // Tarih aralıkları çakışmıyor, bu kursu atlayabiliriz
    }

    // 2. Saat çakışma kontrolü
    let schedule;
    try {
      if (typeof course.schedule === 'string') {
        schedule = JSON.parse(course.schedule);
      } else if (typeof course.schedule === 'object' && course.schedule !== null) {
        schedule = course.schedule;
      } else {
        continue;
      }
    } catch (error) {
      continue;
    }
    
    if (schedule[day]) {
      const courseStart = schedule[day].start;
      const courseEnd = schedule[day].end;

      const timeOverlap = (
        (startTime >= courseStart && startTime < courseEnd) || 
        (endTime > courseStart && endTime <= courseEnd) || 
        (startTime <= courseStart && endTime >= courseEnd)
      );

      if (timeOverlap) {
        const formatDate = (date) => new Date(date).toLocaleDateString('tr-TR');
        throw new Error(
          `ÖĞRETMEN ÇAKIŞMASI!\n\n` +
          `Öğretmen: ${course.teacher_name || 'Bilinmeyen'}\n` +
          `Gün: ${day}\n` +
          `Saat Çakışması: ${startTime}-${endTime} ⟷ ${courseStart}-${courseEnd}\n` +
          `Tarih Çakışması: ${formatDate(newStartDate)}-${formatDate(newEndDate)} ⟷ ${formatDate(existingStartDate)}-${formatDate(existingEndDate)}\n\n` +
          `Mevcut Kurs: "${course.name}"\n\n` +
          `Bu öğretmenin aynı gün ve saatte başka bir kursu var!`
        );
      }
    }
  }

  return true;
};

// Sınıf çakışma kontrolü - Tarih aralığı ve saat kontrolü
const checkClassroomTimeConflict = async (classroomId, day, startTime, endTime, courseStartDate, courseEndDate, excludeCourseId = null) => {
  console.log('🔍 SINIF ÇAKIŞMA KONTROLÜ BAŞLADI');
  console.log('Parametreler:', {
    classroomId,
    day,
    startTime,
    endTime,
    courseStartDate,
    courseEndDate,
    excludeCourseId
  });

  let query = `
    SELECT c.*, u.name as teacher_name, cl.name as classroom_name FROM courses c
    LEFT JOIN teachers t ON c.teacher_id = t.id
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN classrooms cl ON c.classroom_id = cl.id
    WHERE c.classroom_id = ? 
    AND JSON_EXTRACT(c.schedule, '$."${day}".start') IS NOT NULL
    AND c.status = 'active'
  `;
  
  const params = [classroomId];
  
  if (excludeCourseId) {
    query += ' AND c.id != ?';
    params.push(excludeCourseId);
  }

  console.log('SQL Query:', query);
  console.log('SQL Params:', params);

  const [existingCourses] = await db.pool.query(query, params);
  console.log(`Bulunan mevcut kurslar: ${existingCourses.length}`);

  for (const course of existingCourses) {
    // 1. Tarih aralığı çakışma kontrolü
    const existingStartDate = new Date(course.start_date);
    const existingEndDate = new Date(course.end_date);
    const newStartDate = new Date(courseStartDate);
    const newEndDate = new Date(courseEndDate);

    const dateOverlap = (
      (newStartDate <= existingEndDate && newEndDate >= existingStartDate)
    );

    if (!dateOverlap) {
      continue; // Tarih aralıkları çakışmıyor, bu kursu atlayabiliriz
    }

    // 2. Saat çakışma kontrolü
    let schedule;
    try {
      if (typeof course.schedule === 'string') {
        schedule = JSON.parse(course.schedule);
      } else if (typeof course.schedule === 'object' && course.schedule !== null) {
        schedule = course.schedule;
      } else {
        continue;
      }
    } catch (error) {
      continue;
    }
    
    if (schedule[day]) {
      const courseStart = schedule[day].start;
      const courseEnd = schedule[day].end;

      console.log('⏰ Saat çakışma kontrolü:', {
        mevcut: `${courseStart}-${courseEnd}`,
        yeni: `${startTime}-${endTime}`
      });

      const timeOverlap = (
        (startTime >= courseStart && startTime < courseEnd) || 
        (endTime > courseStart && endTime <= courseEnd) || 
        (startTime <= courseStart && endTime >= courseEnd)
      );

      console.log('Saat çakışması var mı:', timeOverlap);

      if (timeOverlap) {
        console.log('🚫 SINIF ÇAKIŞMASI TESPİT EDİLDİ!');
        const formatDate = (date) => new Date(date).toLocaleDateString('tr-TR');
        throw new Error(
          `ÇAKIŞMA TESPİT EDİLDİ!\n\n` +
          `Sınıf: ${course.classroom_name}\n` +
          `Gün: ${day}\n` +
          `Saat Çakışması: ${startTime}-${endTime} ⟷ ${courseStart}-${courseEnd}\n` +
          `Tarih Çakışması: ${formatDate(newStartDate)}-${formatDate(newEndDate)} ⟷ ${formatDate(existingStartDate)}-${formatDate(existingEndDate)}\n\n` +
          `Mevcut Kurs: "${course.name}"\n` +
          `Öğretmen: ${course.teacher_name || 'Bilinmiyor'}\n\n` +
          `Bu sınıfta aynı gün ve saatte başka bir kurs mevcut!`
        );
      }
    } else {
      console.log(`📅 Bu kursta ${day} günü ders yok, çakışma yok`);
    }
  }

  console.log('✅ Sınıf çakışma kontrolü tamamlandı - çakışma yok');
  return true;
};

// Sınıf ve şube uyumluluğunu kontrol et
const validateClassroomBranch = async (classroomId, branchId) => {
  const [classrooms] = await db.pool.query(
    'SELECT * FROM classrooms WHERE id = ? AND branch_id = ?',
    [classroomId, branchId]
  );

  if (classrooms.length === 0) {
    throw new Error('Seçilen sınıf bu şubeye ait değil');
  }

  return true;
};

// Sınıf kapasitesi kontrolü
const validateClassroomCapacity = async (classroomId, maxStudents) => {
  const [classrooms] = await db.pool.query(
    'SELECT capacity FROM classrooms WHERE id = ?',
    [classroomId]
  );

  if (classrooms.length === 0) {
    throw new Error('Sınıf bulunamadı');
  }

  if (maxStudents > classrooms[0].capacity) {
    throw new Error(`Maksimum öğrenci sayısı sınıf kapasitesini (${classrooms[0].capacity}) geçemez`);
  }

  return true;
};

// Kurs oluştur
const createCourse = async (req, res) => {
  try {
    const { 
      name,
      teacher_id,
      branch_id,
      classroom_id,
      language,
      level,
      schedule,
      max_students,
      course_type = 'Physical',
      start_date,
      end_date,
      status = 'active',
      image_path
    } = req.body;



    // Zorunlu alan kontrolü
    if (!name || !teacher_id || !branch_id || !classroom_id || !language || !schedule || !start_date || !end_date) {
      return res.status(400).json({ 
        error: 'Kurs adı, öğretmen, şube, sınıf, dil, program, başlangıç ve bitiş tarihi zorunludur' 
      });
    }

    // Sınıf ve şube uyumluluğunu kontrol et
    try {
      await validateClassroomBranch(classroom_id, branch_id);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Sınıf kapasitesi kontrolü
    try {
      await validateClassroomCapacity(classroom_id, max_students || 20);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Her gün için müsaitlik ve çakışma kontrolü
    for (const [day, times] of Object.entries(schedule)) {
      try {
        // Öğretmen müsaitlik kontrolü
        await validateTeacherAvailability(teacher_id, day, times.start, times.end);
        
        // Öğretmen çakışma kontrolü
        await checkTeacherTimeConflict(teacher_id, day, times.start, times.end, start_date, end_date);
        
        // Sınıf çakışma kontrolü (tarih aralığı dahil)
        await checkClassroomTimeConflict(classroom_id, day, times.start, times.end, start_date, end_date);
        
      } catch (error) {
        return res.status(400).json({ 
          error: `${day} günü için hata: ${error.message}` 
        });
      }
    }
    
    const [result] = await db.pool.query(
      `INSERT INTO courses (
        name, teacher_id, branch_id, classroom_id, 
        language, level, schedule, max_students, course_type,
        start_date, end_date, status, image_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, teacher_id, branch_id, classroom_id,
        language, level || 'A1', JSON.stringify(schedule), max_students || 20, course_type,
        start_date, end_date, status, image_path || null
      ]
    );



    // Oluşturulan kursu getir
    const [courseResults] = await db.pool.query(
      `SELECT c.*, 
              b.name as branch_name,
              cl.name as classroom_name,
              CONCAT(u.name) as teacher_name,
              COALESCE(enrollment.current_students, 0) as current_students
       FROM courses c
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN classrooms cl ON c.classroom_id = cl.id
       LEFT JOIN teachers t ON c.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN (
           SELECT course_id, COUNT(*) as current_students 
           FROM student_courses 
           GROUP BY course_id
       ) enrollment ON c.id = enrollment.course_id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Kurs başarıyla oluşturuldu',
      course: courseResults[0]
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Kurs oluşturulurken bir hata oluştu: ' + error.message 
    });
  }
};

// Kurs güncelle
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name,
      teacher_id,
      branch_id,
      classroom_id,
      language,
      level,
      schedule,
      max_students,
      course_type,
      start_date,
      end_date,
      status,
      image_path
    } = req.body;



    // Zorunlu alan kontrolü
    if (!name || !teacher_id || !branch_id || !classroom_id || !language || !schedule || !start_date || !end_date) {
      return res.status(400).json({ 
        error: 'Kurs adı, öğretmen, şube, sınıf, dil, program, başlangıç ve bitiş tarihi zorunludur' 
      });
    }

    // Sınıf ve şube uyumluluğunu kontrol et
    try {
      await validateClassroomBranch(classroom_id, branch_id);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Sınıf kapasitesi kontrolü
    try {
      await validateClassroomCapacity(classroom_id, max_students || 20);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Her gün için müsaitlik ve çakışma kontrolü
    for (const [day, times] of Object.entries(schedule)) {
      try {
        // Öğretmen müsaitlik kontrolü
        await validateTeacherAvailability(teacher_id, day, times.start, times.end);
        
        // Öğretmen çakışma kontrolü
        await checkTeacherTimeConflict(teacher_id, day, times.start, times.end, start_date, end_date, id);
        
        // Sınıf çakışma kontrolü (tarih aralığı dahil)
        await checkClassroomTimeConflict(classroom_id, day, times.start, times.end, start_date, end_date, id);
        
      } catch (error) {
        return res.status(400).json({ 
          error: `${day} günü için hata: ${error.message}` 
        });
      }
    }

    await db.pool.query(
      `UPDATE courses SET 
        name = ?, 
        teacher_id = ?,
        branch_id = ?,
        classroom_id = ?,
        language = ?,
        level = ?,
        schedule = ?,
        max_students = ?,
        course_type = ?,
        start_date = ?,
        end_date = ?,
        status = ?,
        image_path = ?
      WHERE id = ?`,
      [
        name, teacher_id, branch_id, classroom_id,
        language, level || 'A1', JSON.stringify(schedule), max_students || 20, course_type,
        start_date, end_date, status, image_path || null, id
      ]
    );

    // Güncellenen kursu getir
    const [courseResults] = await db.pool.query(
      `SELECT c.*, 
              b.name as branch_name,
              cl.name as classroom_name,
              CONCAT(u.name) as teacher_name,
              COALESCE(enrollment.current_students, 0) as current_students
       FROM courses c
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN classrooms cl ON c.classroom_id = cl.id
       LEFT JOIN teachers t ON c.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN (
           SELECT course_id, COUNT(*) as current_students 
           FROM student_courses 
           GROUP BY course_id
       ) enrollment ON c.id = enrollment.course_id
       WHERE c.id = ?`,
      [id]
    );

    if (courseResults.length === 0) {
      return res.status(404).json({ error: 'Kurs bulunamadı' });
    }

    res.json({
      message: 'Kurs başarıyla güncellendi',
      course: courseResults[0]
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Kurs güncellenirken bir hata oluştu: ' + error.message 
    });
  }
};

// Kurs sil
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Önce kurs kayıtlarını sil
    await db.pool.query('DELETE FROM student_courses WHERE course_id = ?', [id]);
    
    // Sonra kursu sil
    const [result] = await db.pool.query('DELETE FROM courses WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Kurs bulunamadı' });
    }

    res.json({ message: 'Kurs başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Kurs silinirken bir hata oluştu: ' + error.message 
    });
  }
};

// Kurs detaylarını getir
const getCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [courses] = await db.pool.query(
      `SELECT c.*, 
              b.name as branch_name,
              cl.name as classroom_name,
              cl.capacity as classroom_capacity,
              CONCAT(u.name) as teacher_name,
              t.id as teacher_id,
              t.working_days as teacher_working_days,
              t.working_hours as teacher_working_hours,
              t.branch_id as teacher_branch_id,
              COALESCE(enrollment.current_students, 0) as current_students
       FROM courses c
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN classrooms cl ON c.classroom_id = cl.id
       LEFT JOIN teachers t ON c.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN (
           SELECT course_id, COUNT(*) as current_students 
           FROM student_courses 
           GROUP BY course_id
       ) enrollment ON c.id = enrollment.course_id
       WHERE c.id = ?`,
      [id]
    );

    if (courses.length === 0) {
      return res.status(404).json({ error: 'Kurs bulunamadı' });
    }

    const course = courses[0];
    
    // Schedule'ı güvenli bir şekilde parse et
    try {
      if (typeof course.schedule === 'object' && course.schedule !== null) {
        // Zaten obje ise olduğu gibi bırak
        course.schedule = course.schedule;
      } else if (typeof course.schedule === 'string') {
        // String ise parse et
        course.schedule = JSON.parse(course.schedule);
      } else {
        // Diğer durumlarda boş obje
        course.schedule = {};
      }
    } catch (error) {
      course.schedule = {};
    }



    // Öğretmen çalışma günleri ve saatlerini parse et
    let teacherWorkingDays = {};
    let teacherWorkingHours = {};
    
    try {
      if (course.teacher_working_days) {
        teacherWorkingDays = typeof course.teacher_working_days === 'string' ? 
          JSON.parse(course.teacher_working_days) : course.teacher_working_days;
      }
    } catch (error) {
      teacherWorkingDays = {};
    }
    
    try {
      if (course.teacher_working_hours) {
        teacherWorkingHours = typeof course.teacher_working_hours === 'string' ? 
          JSON.parse(course.teacher_working_hours) : course.teacher_working_hours;
      }
    } catch (error) {
      teacherWorkingHours = {};
    }

    // Öğretmen bilgilerini course objesine ekle
    course.teacher = {
      id: course.teacher_id,
      name: course.teacher_name,
      working_days: teacherWorkingDays,
      working_hours: teacherWorkingHours,
      branch_id: course.teacher_branch_id
    };

    res.json(course);
  } catch (error) {
    res.status(500).json({ 
      error: 'Kurs bilgileri getirilirken bir hata oluştu: ' + error.message 
    });
  }
};

// Tüm kursları getir - Alternatif yaklaşım
const getAllCoursesAlternative = async (req, res) => {
  try {
    // showInactive parametresini kontrol et
    const showInactive = req.query.showInactive === 'true';
    
    let whereClause = '';
    if (!showInactive) {
      whereClause = "WHERE c.status = 'active'";
    }
    
    // Önce temel kurs bilgilerini getir
    const [courses] = await db.pool.query(
      `SELECT c.*, 
              b.name as branch_name,
              cl.name as classroom_name,
              cl.capacity as classroom_capacity,
              COALESCE(enrollment.current_students, 0) as current_students
       FROM courses c
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN classrooms cl ON c.classroom_id = cl.id
       LEFT JOIN (
           SELECT course_id, COUNT(*) as current_students 
           FROM student_courses 
           GROUP BY course_id
       ) enrollment ON c.id = enrollment.course_id
       ${whereClause}
       ORDER BY c.id DESC`
    );

    // Her kurs için öğretmen bilgilerini getir
    const formattedCourses = await Promise.all(courses.map(async (course) => {
      let schedule = {};
      
      // Schedule'ı parse et
      try {
        if (typeof course.schedule === 'object' && course.schedule !== null) {
          schedule = course.schedule;
        } else if (typeof course.schedule === 'string') {
          schedule = JSON.parse(course.schedule);
        }
      } catch (error) {
        schedule = {};
      }

      // Öğretmen bilgilerini getir
      let teacher = null;
      if (course.teacher_id) {
        try {
          const [teacherResults] = await db.pool.query(
            `SELECT t.*, u.name as teacher_name 
             FROM teachers t 
             LEFT JOIN users u ON t.user_id = u.id 
             WHERE t.id = ?`,
            [course.teacher_id]
          );
          
          if (teacherResults.length > 0) {
            const teacherData = teacherResults[0];
            
            // Working days ve hours'ı parse et
            let workingDays = {};
            let workingHours = {};
            
            try {
              workingDays = typeof teacherData.working_days === 'string' ? 
                JSON.parse(teacherData.working_days) : (teacherData.working_days || {});
            } catch (e) {
              workingDays = {};
            }
            
            try {
              workingHours = typeof teacherData.working_hours === 'string' ? 
                JSON.parse(teacherData.working_hours) : (teacherData.working_hours || {});
            } catch (e) {
              workingHours = {};
            }
            
            teacher = {
              id: teacherData.id,
              name: teacherData.teacher_name,
              working_days: workingDays,
              working_hours: workingHours,
              branch_id: teacherData.branch_id
            };
          }
        } catch (error) {
          // Öğretmen bilgisi alınamadı, null olarak bırak
        }
      }

      return {
        ...course,
        teacher_name: teacher ? teacher.name : null,
        schedule: schedule,
        teacher: teacher
      };
    }));
    
    res.json(formattedCourses);
  } catch (error) {
    res.status(500).json({ 
      error: 'Kurslar getirilirken bir hata oluştu: ' + error.message 
    });
  }
};

// Şubeye göre sınıfları getir
const getClassroomsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const [classrooms] = await db.pool.query(
      'SELECT * FROM classrooms WHERE branch_id = ? AND status = "active"',
      [branchId]
    );

    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ 
      error: 'Sınıflar getirilirken bir hata oluştu: ' + error.message 
    });
  }
};

module.exports = {
  createCourse,
  updateCourse,
  deleteCourse,
  getCourse,
  getAllCourses: getAllCoursesAlternative,
  getClassroomsByBranch
}; 