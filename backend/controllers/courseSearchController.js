const db = require('../config/db');

// StudentPage için kurs arama fonksiyonu
const searchCoursesFlexible = async (req, res) => {
  try {
    const { language, day } = req.query;
    let query = `
      SELECT 
        c.*, 
        b.name as branch_name, 
        b.address as branch_address, 
        u.name as teacher_name, 
        cl.name as classroom_name,
        c.max_students
      FROM courses c
      JOIN branches b ON c.branch_id = b.id
      JOIN teachers t ON c.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      LEFT JOIN classrooms cl ON c.classroom_id = cl.id
      WHERE c.status = 'active'
    `;
    const params = [];
    
    // Dil "Tümü" değilse filtrele
    if (language && language !== 'Tümü') {
      query += ' AND c.language = ?';
      params.push(language);
    }

    if (day) {
      query += ` AND JSON_TYPE(JSON_EXTRACT(c.schedule, '$."${day}"')) = 'OBJECT'`;
      query += ` AND JSON_UNQUOTE(JSON_EXTRACT(c.schedule, '$."${day}".start')) IS NOT NULL`;
      query += ` AND JSON_UNQUOTE(JSON_EXTRACT(c.schedule, '$."${day}".start')) != ''`;
    }

    const [courses] = await db.pool.query(query, params);
    if (courses.length === 0) {
      return res.status(404).json({ error: 'Kurs bulunamadı' });
    }

    // Schedule'ı JSON olarak parse et
    const formattedCourses = courses.map(course => ({
      ...course,
      schedule: typeof course.schedule === 'string' ? JSON.parse(course.schedule) : course.schedule
    }));

    res.json({
      success: true,
      courses: formattedCourses
    });
  } catch (error) {
    console.error('Kurs arama hatası:', error);
    res.status(500).json({ error: 'Kurs arama sırasında bir hata oluştu' });
  }
};

// Sadece güne göre kurs arama fonksiyonu
const searchCoursesByDay = async (req, res) => {
  try {
    const { day } = req.query;
    
    if (!day) {
      return res.status(400).json({ error: 'Gün parametresi gereklidir' });
    }

    const query = `
      SELECT 
        c.*, 
        b.name as branch_name, 
        b.address as branch_address, 
        u.name as teacher_name, 
        cl.name as classroom_name,
        c.max_students
      FROM courses c
      JOIN branches b ON c.branch_id = b.id
      JOIN teachers t ON c.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      LEFT JOIN classrooms cl ON c.classroom_id = cl.id
      WHERE c.status = 'active'
      AND JSON_EXTRACT(c.schedule, \'$."' + day + '"\') IS NOT NULL
    `;

    const [courses] = await db.pool.query(query);
    
    if (courses.length === 0) {
      return res.status(404).json({ error: 'Bu güne ait kurs bulunamadı' });
    }

    // Schedule'ı JSON olarak parse et
    const formattedCourses = courses.map(course => ({
      ...course,
      schedule: typeof course.schedule === 'string' ? JSON.parse(course.schedule) : course.schedule
    }));

    res.json({
      success: true,
      courses: formattedCourses
    });
  } catch (error) {
    console.error('Kurs arama hatası:', error);
    res.status(500).json({ error: 'Kurs arama sırasında bir hata oluştu' });
  }
};

module.exports = { 
  searchCoursesFlexible,
  searchCoursesByDay 
}; 