const db = require('../config/db');

// Öğretmen müsaitlik kontrolü
const validateTeacherAvailability = async (teacherId, day, startTime, endTime) => {
  try {
    console.log(`\n=== validateTeacherAvailability for ${day} ===`);
    console.log('Teacher ID:', teacherId);
    console.log('Day:', day);
    console.log('Start time:', startTime, 'type:', typeof startTime);
    console.log('End time:', endTime, 'type:', typeof endTime);
    
    // Öğretmenin çalışma saatlerini getir
    const [teachers] = await db.pool.query(
      'SELECT working_days, working_hours FROM teachers WHERE id = ?',
      [teacherId]
    );

    if (teachers.length === 0) {
      throw new Error('Öğretmen bulunamadı');
    }

    console.log('Raw teacher data:', {
      working_days: teachers[0].working_days,
      working_hours: teachers[0].working_hours
    });

    let workingDays = {};
    let workingHours = {};

    try {
      workingDays = typeof teachers[0].working_days === 'string' ? 
        JSON.parse(teachers[0].working_days) : teachers[0].working_days || {};
      console.log('Parsed working_days:', workingDays);
    } catch (e) {
      console.error('Error parsing working_days:', e);
      workingDays = {};
    }

    try {
      workingHours = typeof teachers[0].working_hours === 'string' ? 
        JSON.parse(teachers[0].working_hours) : teachers[0].working_hours || {};
      console.log('Parsed working_hours:', workingHours);
    } catch (e) {
      console.error('Error parsing working_hours:', e);
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

    console.log('Teacher working hours for', day, ':', teacherStart, '-', teacherEnd);

    // Saat değerlerinin string olduğundan emin ol
    let courseStart, courseEnd;
    
    // StartTime kontrolü
    if (typeof startTime === 'string') {
      courseStart = startTime;
    } else if (typeof startTime === 'object' && startTime !== null) {
      console.error('StartTime is object:', startTime);
      throw new Error(`Geçersiz başlangıç saati formatı: ${JSON.stringify(startTime)}`);
    } else {
      courseStart = String(startTime);
    }
    
    // EndTime kontrolü  
    if (typeof endTime === 'string') {
      courseEnd = endTime;
    } else if (typeof endTime === 'object' && endTime !== null) {
      console.error('EndTime is object:', endTime);
      throw new Error(`Geçersiz bitiş saati formatı: ${JSON.stringify(endTime)}`);
    } else {
      courseEnd = String(endTime);
    }

    console.log('Course times:', courseStart, '-', courseEnd);

    // Kurs saatlerinin öğretmenin müsait olduğu saatler içinde olup olmadığını kontrol et
    if (courseStart < teacherStart || courseEnd > teacherEnd) {
      throw new Error(`Kurs saatleri (${courseStart}-${courseEnd}) öğretmenin müsait olduğu saatler (${teacherStart}-${teacherEnd}) dışında`);
    }

    console.log('Teacher availability validation passed');
    return true;
  } catch (error) {
    console.error('validateTeacherAvailability error:', error);
    throw error;
  }
};

// Çakışma kontrolü
const checkTimeConflict = async (teacherId, day, startTime, endTime, excludeCourseId = null) => {
  console.log(`\n=== checkTimeConflict for ${day} ===`);
  console.log('Teacher ID:', teacherId);
  console.log('Day:', day);
  console.log('Start time:', startTime, 'type:', typeof startTime);
  console.log('End time:', endTime, 'type:', typeof endTime);
  console.log('Exclude course ID:', excludeCourseId);
  
  let query = `
    SELECT * FROM courses 
    WHERE teacher_id = ? 
    AND JSON_EXTRACT(schedule, '$."${day}".start') IS NOT NULL
    AND status = 'active'
  `;
  
  const params = [teacherId];
  
  if (excludeCourseId) {
    query += ' AND id != ?';
    params.push(excludeCourseId);
  }

  console.log('Executing query:', query);
  console.log('Query params:', params);

  const [existingCourses] = await db.pool.query(query, params);
  
  console.log(`Found ${existingCourses.length} existing courses for teacher ${teacherId}`);

  for (const course of existingCourses) {
    console.log(`\nChecking course ${course.id}:`);
    console.log('Raw schedule data:', course.schedule);
    console.log('Schedule type:', typeof course.schedule);
    
    let schedule;
    try {
      if (typeof course.schedule === 'string') {
        schedule = JSON.parse(course.schedule);
        console.log('Parsed schedule:', schedule);
      } else if (typeof course.schedule === 'object' && course.schedule !== null) {
        schedule = course.schedule;
        console.log('Schedule is already object:', schedule);
      } else {
        console.log('Invalid schedule format, skipping course');
        continue;
      }
    } catch (error) {
      console.error('Error parsing schedule for course', course.id, ':', error);
      console.error('Raw schedule data that failed:', course.schedule);
      continue; // Bu kursu atla, diğerlerini kontrol et
    }
    
    if (schedule[day]) {
      const courseStart = schedule[day].start;
      const courseEnd = schedule[day].end;
      
      console.log(`Course ${course.id} ${day} schedule:`, courseStart, '-', courseEnd);
      console.log('New course schedule:', startTime, '-', endTime);

      if (
        (startTime >= courseStart && startTime < courseEnd) || // Yeni kurs mevcut kursun içinde başlıyor
        (endTime > courseStart && endTime <= courseEnd) || // Yeni kurs mevcut kursun içinde bitiyor
        (startTime <= courseStart && endTime >= courseEnd) // Yeni kurs mevcut kursu kapsıyor
      ) {
        console.log('Time conflict detected!');
        throw new Error('Öğretmenin bu saatte başka bir kursu var');
      } else {
        console.log('No conflict with this course');
      }
    } else {
      console.log(`Course ${course.id} has no schedule for ${day}`);
    }
  }

  console.log('No time conflicts found');
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
    console.log('=== CREATE COURSE BACKEND DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      name,
      teacher_id,
      branch_id,
      classroom_id,
      language,
      schedule,
      max_students,
      course_type = 'Physical',
      start_date,
      end_date,
      status = 'active',
      image_path
    } = req.body;

    console.log('Extracted schedule:', schedule);
    console.log('Schedule type:', typeof schedule);
    
    if (schedule) {
      console.log('Schedule entries:');
      Object.entries(schedule).forEach(([day, times]) => {
        console.log(`  ${day}:`, times, 'start type:', typeof times?.start, 'end type:', typeof times?.end);
      });
    }

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
      console.log(`\n=== Validating ${day} ===`);
      console.log('Times object:', times);
      console.log('Start value:', times.start, 'type:', typeof times.start);
      console.log('End value:', times.end, 'type:', typeof times.end);
      
      try {
        await validateTeacherAvailability(teacher_id, day, times.start, times.end);
        await checkTimeConflict(teacher_id, day, times.start, times.end);
        console.log(`${day} validation passed`);
      } catch (error) {
        console.error(`${day} validation failed:`, error.message);
        return res.status(400).json({ 
          error: `${day} günü için hata: ${error.message}` 
        });
      }
    }

    console.log('All validations passed, inserting to database...');
    
    const [result] = await db.pool.query(
      `INSERT INTO courses (
        name, teacher_id, branch_id, classroom_id, 
        language, schedule, max_students, course_type,
        start_date, end_date, status, image_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, teacher_id, branch_id, classroom_id,
        language, JSON.stringify(schedule), max_students || 20, course_type,
        start_date, end_date, status, image_path || null
      ]
    );

    console.log('Course inserted successfully with ID:', result.insertId);

    // Oluşturulan kursu getir
    const [courseResults] = await db.pool.query(
      `SELECT c.*, 
              b.name as branch_name,
              cl.name as classroom_name,
              CONCAT(u.name) as teacher_name
       FROM courses c
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN classrooms cl ON c.classroom_id = cl.id
       LEFT JOIN teachers t ON c.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Kurs başarıyla oluşturuldu',
      course: courseResults[0]
    });

  } catch (error) {
    console.error('Kurs oluşturma hatası:', error);
    console.error('Error stack:', error.stack);
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
        await validateTeacherAvailability(teacher_id, day, times.start, times.end);
        await checkTimeConflict(teacher_id, day, times.start, times.end, id);
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
        language, JSON.stringify(schedule), max_students || 20, course_type,
        start_date, end_date, status, image_path || null, id
      ]
    );

    // Güncellenen kursu getir
    const [courseResults] = await db.pool.query(
      `SELECT c.*, 
              b.name as branch_name,
              cl.name as classroom_name,
              CONCAT(u.name) as teacher_name
       FROM courses c
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN classrooms cl ON c.classroom_id = cl.id
       LEFT JOIN teachers t ON c.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
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
    console.error('Kurs güncelleme hatası:', error);
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
    console.error('Kurs silme hatası:', error);
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
              t.branch_id as teacher_branch_id
       FROM courses c
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN classrooms cl ON c.classroom_id = cl.id
       LEFT JOIN teachers t ON c.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
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
      console.error('Error parsing schedule for course', course.id, ':', error);
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
      console.error('Error parsing teacher working days:', error);
      teacherWorkingDays = {};
    }
    
    try {
      if (course.teacher_working_hours) {
        teacherWorkingHours = typeof course.teacher_working_hours === 'string' ? 
          JSON.parse(course.teacher_working_hours) : course.teacher_working_hours;
      }
    } catch (error) {
      console.error('Error parsing teacher working hours:', error);
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
    console.error('Kurs getirme hatası:', error);
    res.status(500).json({ 
      error: 'Kurs bilgileri getirilirken bir hata oluştu: ' + error.message 
    });
  }
};

// Tüm kursları getir - Alternatif yaklaşım
const getAllCoursesAlternative = async (req, res) => {
  try {
    console.log('Fetching all courses from database...');
    
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
              cl.capacity as classroom_capacity
       FROM courses c
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN classrooms cl ON c.classroom_id = cl.id
       ${whereClause}
       ORDER BY c.id DESC`
    );

    console.log(`Found ${courses.length} courses in database`);

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
        console.error('Error parsing schedule for course', course.id, ':', error);
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
              console.error('Error parsing working_days for teacher', teacherData.id, ':', e);
              workingDays = {};
            }
            
            try {
              workingHours = typeof teacherData.working_hours === 'string' ? 
                JSON.parse(teacherData.working_hours) : (teacherData.working_hours || {});
            } catch (e) {
              console.error('Error parsing working_hours for teacher', teacherData.id, ':', e);
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
          console.error('Error fetching teacher data for course', course.id, ':', error);
        }
      }

      return {
        ...course,
        teacher_name: teacher ? teacher.name : null,
        schedule: schedule,
        teacher: teacher
      };
    }));

    console.log('Courses formatted successfully, sending response');
    if (formattedCourses.length > 0) {
      console.log('=== SAMPLE COURSE WITH TEACHER ===');
      console.log('Course ID:', formattedCourses[0].id);
      console.log('Course teacher_id:', formattedCourses[0].teacher_id);
      console.log('Course teacher_name:', formattedCourses[0].teacher_name);
      console.log('Teacher object:', formattedCourses[0].teacher);
      console.log('=== END SAMPLE ===');
    }
    
    res.json(formattedCourses);
  } catch (error) {
    console.error('Kursları getirme hatası:', error);
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
    console.error('Sınıfları getirme hatası:', error);
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