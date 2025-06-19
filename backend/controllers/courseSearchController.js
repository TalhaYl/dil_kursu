const db = require('../config/db');
const { calculateDistance } = require('../utils/geocoding');

// StudentPage için kurs arama fonksiyonu
const searchCoursesFlexible = async (req, res) => {
  try {
    const { 
      language, 
      day, 
      level, 
      branch, 
      teacher, 
      status, 
      timeSlot, 
      maxStudents 
    } = req.query;
    
    let query = `
      SELECT 
        c.*, 
        b.name as branch_name, 
        b.address as branch_address, 
        u.name as teacher_name, 
        cl.name as classroom_name,
        c.max_students,
        (SELECT COUNT(*) FROM student_courses sc WHERE sc.course_id = c.id) as student_count
      FROM courses c
      JOIN branches b ON c.branch_id = b.id
      JOIN teachers t ON c.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      LEFT JOIN classrooms cl ON c.classroom_id = cl.id
      WHERE 1=1
    `;
    const params = [];
    
    // Durum filtresi - varsayılan olarak sadece aktif kurslar
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    } else {
      query += ' AND c.status = ?';
      params.push('active');
    }
    
    // Dil filtresi
    if (language && language !== 'Tümü') {
      query += ' AND c.language = ?';
      params.push(language);
    }

    // Seviye filtresi
    if (level && level !== 'Tümü') {
      query += ' AND c.level = ?';
      params.push(level);
    }

    // Şube filtresi
    if (branch) {
      query += ' AND c.branch_id = ?';
      params.push(branch);
    }

    // Öğretmen filtresi
    if (teacher) {
      query += ' AND c.teacher_id = ?';
      params.push(teacher);
    }

    // Gün filtresi
    if (day) {
      query += ` AND JSON_TYPE(JSON_EXTRACT(c.schedule, '$."${day}"')) = 'OBJECT'`;
      query += ` AND JSON_UNQUOTE(JSON_EXTRACT(c.schedule, '$."${day}".start')) IS NOT NULL`;
      query += ` AND JSON_UNQUOTE(JSON_EXTRACT(c.schedule, '$."${day}".start')) != ''`;
    }

    const [courses] = await db.pool.query(query, params);
    
    let filteredCourses = courses;

    // Zaman dilimi filtresi (schedule JSON alanında arama)
    if (timeSlot) {
      filteredCourses = courses.filter(course => {
        try {
          const schedule = typeof course.schedule === 'string' 
            ? JSON.parse(course.schedule) 
            : course.schedule;
          
          // Zaman dilimi kontrolü
          for (const day in schedule) {
            const daySchedule = schedule[day];
            if (daySchedule && daySchedule.start) {
              const startHour = parseInt(daySchedule.start.split(':')[0]);
              
              switch (timeSlot) {
                case '09:00-12:00':
                  if (startHour >= 9 && startHour < 12) return true;
                  break;
                case '13:00-16:00':
                  if (startHour >= 13 && startHour < 16) return true;
                  break;
                case '17:00-20:00':
                  if (startHour >= 17 && startHour < 20) return true;
                  break;
              }
            }
          }
          return false;
        } catch (e) {
          return false;
        }
      });
    }

    // Maksimum öğrenci sayısı filtresi
    if (maxStudents) {
      filteredCourses = filteredCourses.filter(course => {
        const maxCount = course.max_students || 0;
        switch (maxStudents) {
          case '1-10':
            return maxCount >= 1 && maxCount <= 10;
          case '11-20':
            return maxCount >= 11 && maxCount <= 20;
          case '21-30':
            return maxCount >= 21;
          default:
            return true;
        }
      });
    }
    
    if (filteredCourses.length === 0) {
      return res.status(404).json({ error: 'Kurs bulunamadı' });
    }

    // Schedule'ı JSON olarak parse et
    const formattedCourses = filteredCourses.map(course => ({
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

// Akıllı kurs önerisi algoritması - "Bir Lisan Bir İnsan" için
const smartCourseRecommendation = async (req, res) => {
    try {
        const { 
            latitude, 
            longitude, 
            preferred_language, 
            preferred_days, 
            preferred_time_slot, // 'morning', 'afternoon', 'evening'
            level, // 'beginner', 'intermediate', 'advanced'
            budget_max 
        } = req.body;

        console.log('🔍 AKILLI KURS ÖNERİSİ BAŞLATILIYOR');
        console.log('Kullanıcı tercihleri:', {
            konum: `${latitude}, ${longitude}`,
            dil: preferred_language,
            günler: preferred_days,
            zaman: preferred_time_slot,
            seviye: level,
            bütçe: budget_max
        });

        // 1. Tüm aktif kursları ve şube bilgilerini al
        const [courses] = await db.pool.query(`
            SELECT 
                c.*,
                b.name as branch_name,
                b.address as branch_address,
                b.latitude,
                b.longitude,
                b.transportation,
                b.social_facilities,
                CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
                cl.name as classroom_name,
                (c.max_students - COALESCE(enrollment.current_students, 0)) as available_spots,
                COALESCE(enrollment.current_students, 0) as current_students
            FROM courses c
            JOIN branches b ON c.branch_id = b.id
            JOIN teachers t ON c.teacher_id = t.id
            JOIN users u ON t.user_id = u.id
            LEFT JOIN classrooms cl ON c.classroom_id = cl.id
            LEFT JOIN (
                SELECT 
                    course_id, 
                    COUNT(*) as current_students 
                FROM student_courses 
                GROUP BY course_id
            ) enrollment ON c.id = enrollment.course_id
            WHERE c.status = 'active' 
            AND c.start_date > CURDATE()
            AND (c.max_students - COALESCE(enrollment.current_students, 0)) > 0
        `);

        if (courses.length === 0) {
            return res.json({
                success: false,
                message: 'Şu anda uygun kurs bulunamadı',
                recommendations: []
            });
        }

        // 2. Her kurs için puan hesaplama algoritması
        const scoredCourses = courses.map(course => {
            let score = 0;
            let scoreBreakdown = {
                distance: 0,
                language: 0,
                schedule: 0,
                level: 0,
                price: 0,
                availability: 0,
                branch_quality: 0
            };

            // 2.1 Mesafe puanı (40 puan)
            if (latitude && longitude && course.latitude && course.longitude) {
                const distance = calculateDistance(latitude, longitude, course.latitude, course.longitude);
                course.distance = distance;
                
                if (distance <= 5) scoreBreakdown.distance = 40;
                else if (distance <= 10) scoreBreakdown.distance = 30;
                else if (distance <= 20) scoreBreakdown.distance = 20;
                else if (distance <= 50) scoreBreakdown.distance = 10;
                else scoreBreakdown.distance = 0;
            }

            // 2.2 Dil tercihi puanı (25 puan)
            if (preferred_language && course.language) {
                if (course.language.toLowerCase() === preferred_language.toLowerCase()) {
                    scoreBreakdown.language = 25;
                }
            }

            // 2.3 Program uygunluğu puanı (20 puan)
            if (preferred_days && course.schedule) {
                try {
                    const schedule = typeof course.schedule === 'string' 
                        ? JSON.parse(course.schedule) 
                        : course.schedule;
                    
                    let dayMatch = 0;
                    const preferredDaysArray = Array.isArray(preferred_days) ? preferred_days : [preferred_days];
                    
                    preferredDaysArray.forEach(preferredDay => {
                        if (schedule[preferredDay]) {
                            dayMatch++;
                        }
                    });
                    
                    scoreBreakdown.schedule = (dayMatch / preferredDaysArray.length) * 20;
                } catch (e) {
                    scoreBreakdown.schedule = 0;
                }
            }

            // 2.4 Seviye uygunluğu puanı (10 puan)
            if (level && course.level) {
                if (course.level.toLowerCase() === level.toLowerCase()) {
                    scoreBreakdown.level = 10;
                } else if (
                    (level === 'beginner' && course.level === 'intermediate') ||
                    (level === 'intermediate' && ['beginner', 'advanced'].includes(course.level))
                ) {
                    scoreBreakdown.level = 5;
                }
            }

            // 2.5 Fiyat puanı (3 puan)
            if (budget_max && course.price) {
                if (course.price <= budget_max * 0.7) scoreBreakdown.price = 3;
                else if (course.price <= budget_max) scoreBreakdown.price = 2;
                else scoreBreakdown.price = 0;
            }

            // 2.6 Müsaitlik puanı (2 puan)
            const availabilityRatio = course.available_spots / course.max_students;
            if (availabilityRatio > 0.5) scoreBreakdown.availability = 2;
            else if (availabilityRatio > 0.2) scoreBreakdown.availability = 1;
            else scoreBreakdown.availability = 0;

            // Toplam puan hesaplama
            score = Object.values(scoreBreakdown).reduce((a, b) => a + b, 0);

            return {
                ...course,
                score,
                scoreBreakdown,
                recommendation_reason: generateRecommendationReason(scoreBreakdown, course)
            };
        });

        // 3. Puana göre sıralama
        const sortedCourses = scoredCourses.sort((a, b) => b.score - a.score);

        // 4. Sonuçları kategorize et
        const excellent = sortedCourses.filter(c => c.score >= 80);
        const good = sortedCourses.filter(c => c.score >= 60 && c.score < 80);
        const fair = sortedCourses.filter(c => c.score >= 40 && c.score < 60);

        console.log('✅ ÖNERİ SONUÇLARI:');
        console.log(`Mükemmel eşleşme: ${excellent.length}`);
        console.log(`İyi eşleşme: ${good.length}`);
        console.log(`Orta eşleşme: ${fair.length}`);

        res.json({
            success: true,
            message: 'Kurs önerileri başarıyla hazırlandı',
            total_found: sortedCourses.length,
            categories: {
                excellent: excellent.slice(0, 3), // En iyi 3
                good: good.slice(0, 5), // En iyi 5
                fair: fair.slice(0, 3), // En iyi 3
            },
            all_courses: sortedCourses.slice(0, 10), // Tüm sonuçlardan en iyi 10
            search_criteria: {
                location: latitude && longitude ? `${latitude}, ${longitude}` : null,
                language: preferred_language,
                days: preferred_days,
                time_slot: preferred_time_slot,
                level: level,
                max_budget: budget_max
            }
        });

    } catch (error) {
        console.error('❌ Akıllı kurs önerisi hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Kurs önerileri hazırlanırken bir hata oluştu',
            error: error.message
        });
    }
};

// Öneri sebebini açıklayan yardımcı fonksiyon
function generateRecommendationReason(scoreBreakdown, course) {
    const reasons = [];
    
    if (scoreBreakdown.distance >= 30) {
        reasons.push(`📍 Size çok yakın (${course.distance?.toFixed(1)} km)`);
    } else if (scoreBreakdown.distance >= 20) {
        reasons.push(`📍 Makul mesafede (${course.distance?.toFixed(1)} km)`);
    }
    
    if (scoreBreakdown.language === 25) {
        reasons.push(`🗣️ İstediğiniz dil: ${course.language}`);
    }
    
    if (scoreBreakdown.schedule >= 15) {
        reasons.push('📅 Program tercihinizle uyumlu');
    }
    
    if (scoreBreakdown.level === 10) {
        reasons.push(`📚 Seviyenize uygun: ${course.level}`);
    }
    
    if (scoreBreakdown.availability === 2) {
        reasons.push(`👥 Bol kontenjan (${course.available_spots} boş yer)`);
    }
    
    if (scoreBreakdown.price >= 2) {
        reasons.push('💰 Bütçenize uygun');
    }
    
    return reasons.length > 0 ? reasons.join(' • ') : 'Genel kriterlere uygun';
}

// Gelişmiş kurs arama
const advancedCourseSearch = async (req, res) => {
    try {
        const {
            language,
            level,
            days,
            time_preference,
            branch_id,
            price_min,
            price_max,
            teacher_gender,
            class_size_preference // 'small', 'medium', 'large'
        } = req.query;

        let query = `
            SELECT 
                c.*,
                b.name as branch_name,
                b.address as branch_address,
                b.latitude,
                b.longitude,
                CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
                u.gender as teacher_gender,
                cl.name as classroom_name,
                cl.capacity as classroom_capacity,
                (c.max_students - COALESCE(enrollment.current_students, 0)) as available_spots,
                COALESCE(enrollment.current_students, 0) as current_students
            FROM courses c
            JOIN branches b ON c.branch_id = b.id
            JOIN teachers t ON c.teacher_id = t.id
            JOIN users u ON t.user_id = u.id
            LEFT JOIN classrooms cl ON c.classroom_id = cl.id
            LEFT JOIN (
                SELECT course_id, COUNT(*) as current_students 
                FROM student_courses 
                GROUP BY course_id
            ) enrollment ON c.id = enrollment.course_id
            WHERE c.status = 'active'
        `;

        const params = [];

        // Dil filtresi
        if (language) {
            query += ' AND c.language = ?';
            params.push(language);
        }

        // Seviye filtresi
        if (level) {
            query += ' AND c.level = ?';
            params.push(level);
        }

        // Şube filtresi
        if (branch_id) {
            query += ' AND c.branch_id = ?';
            params.push(branch_id);
        }

        // Fiyat aralığı filtresi
        if (price_min) {
            query += ' AND c.price >= ?';
            params.push(price_min);
        }
        if (price_max) {
            query += ' AND c.price <= ?';
            params.push(price_max);
        }

        // Öğretmen cinsiyet tercihi
        if (teacher_gender) {
            query += ' AND u.gender = ?';
            params.push(teacher_gender);
        }

        // Sınıf büyüklüğü tercihi
        if (class_size_preference) {
            switch (class_size_preference) {
                case 'small':
                    query += ' AND c.max_students <= 8';
                    break;
                case 'medium':
                    query += ' AND c.max_students BETWEEN 9 AND 15';
                    break;
                case 'large':
                    query += ' AND c.max_students > 15';
                    break;
            }
        }

        query += ' ORDER BY c.start_date ASC, c.price ASC';

        const [courses] = await db.pool.query(query, params);

        // Gün filtrelemesi (schedule JSON alanında arama)
        let filteredCourses = courses;
        if (days) {
            const searchDays = Array.isArray(days) ? days : days.split(',');
            filteredCourses = courses.filter(course => {
                try {
                    const schedule = typeof course.schedule === 'string' 
                        ? JSON.parse(course.schedule) 
                        : course.schedule;
                    
                    return searchDays.some(day => schedule[day.trim()]);
                } catch (e) {
                    return false;
                }
            });
        }

        res.json({
            success: true,
            total: filteredCourses.length,
            courses: filteredCourses,
            search_filters: {
                language,
                level,
                days,
                time_preference,
                branch_id,
                price_range: price_min || price_max ? `${price_min || 0} - ${price_max || '∞'}` : null,
                teacher_gender,
                class_size_preference
            }
        });

    } catch (error) {
        console.error('Gelişmiş arama hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Arama işlemi sırasında hata oluştu',
            error: error.message
        });
    }
};

module.exports = { 
  searchCoursesFlexible,
  searchCoursesByDay,
  smartCourseRecommendation,
  advancedCourseSearch
}; 