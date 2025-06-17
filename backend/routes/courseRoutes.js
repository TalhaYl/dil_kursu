const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');
const courseController = require('../controllers/courseController');
const { searchCoursesFlexible, searchCoursesByDay } = require('../controllers/courseSearchController');
const upload = require('../middleware/upload');
const branchController = require('../controllers/branchController');

// Tüm kursları getir
router.get('/', verifyToken, courseController.getAllCourses);

// Şubeye göre sınıfları getir
router.get('/classrooms/:branchId', verifyToken, courseController.getClassroomsByBranch);

// StudentPage için kurs arama
router.get('/student-search', searchCoursesFlexible);

// Kurs detaylarını getir
router.get('/:id', verifyToken, courseController.getCourse);

// Müsait öğretmenleri getir
router.get('/available-teachers/:branch_id/:language/:day/:time', verifyToken, async (req, res) => {
    try {
        const { branch_id, language, day, time } = req.params;
        
        // Öğretmenlerin ders programlarını kontrol et
        const [teachers] = await db.pool.query(`
            SELECT t.id, 
                   u.name as teacher_name,
                   t.languages,
                   t.working_days,
                   t.working_hours,
                   GROUP_CONCAT(DISTINCT c.schedule) as current_schedules
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN courses c ON t.id = c.teacher_id 
                AND c.status = 'active'
                AND c.start_date <= CURDATE() 
                AND c.end_date >= CURDATE()
            WHERE t.branch_id = ?
            AND JSON_CONTAINS(t.languages, ?)
            AND JSON_CONTAINS(t.working_days, ?)
            GROUP BY t.id
        `, [branch_id, JSON.stringify(language), JSON.stringify(day)]);

        // Öğretmenlerin müsaitlik durumunu kontrol et
        const availableTeachers = teachers.filter(teacher => {
            try {
                const workingHours = JSON.parse(teacher.working_hours || '{}');
                const currentSchedules = teacher.current_schedules ? 
                    teacher.current_schedules.split(',').map(s => JSON.parse(s)) : [];

                // Çalışma saatlerini kontrol et
                const dayHours = workingHours[day];
                if (!dayHours) return false;

                const [startTime, endTime] = time.split('-');
                if (!startTime || !endTime) return false;

                // Öğretmenin çalışma saatleri içinde mi kontrol et
                if (dayHours.start > startTime || dayHours.end < endTime) {
                    return false;
                }

                // Mevcut ders programıyla çakışma kontrolü
                for (const schedule of currentSchedules) {
                    if (schedule[day] && schedule[day].start && schedule[day].end) {
                        if (
                            (startTime >= schedule[day].start && startTime < schedule[day].end) ||
                            (endTime > schedule[day].start && endTime <= schedule[day].end) ||
                            (startTime <= schedule[day].start && endTime >= schedule[day].end)
                        ) {
                            return false;
                        }
                    }
                }

                return true;
            } catch (error) {
                console.error('Error checking teacher availability:', error);
                return false;
            }
        });

        res.json(availableTeachers);
    } catch (error) {
        console.error('Error fetching available teachers:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Boş sınıfları getir
router.get('/available-classrooms/:branch_id/:day/:time', verifyToken, async (req, res) => {
    try {
        const { branch_id, day, time } = req.params;
        const [classrooms] = await db.pool.query(`
            SELECT c.id, 
                   c.name as classroom_name, 
                   c.capacity,
                   GROUP_CONCAT(DISTINCT co.schedule) as current_schedules
            FROM classrooms c
            LEFT JOIN courses co ON c.id = co.classroom_id 
                AND co.status = 'active'
                AND co.start_date <= CURDATE() 
                AND co.end_date >= CURDATE()
            WHERE c.branch_id = ?
            GROUP BY c.id
        `, [branch_id]);

        // Sınıfların müsaitlik durumunu kontrol et
        const availableClassrooms = classrooms.filter(classroom => {
            try {
                const currentSchedules = classroom.current_schedules ? 
                    classroom.current_schedules.split(',').map(s => JSON.parse(s)) : [];

                const [startTime, endTime] = time.split('-');
                if (!startTime || !endTime) return false;

                // Mevcut ders programıyla çakışma kontrolü
                for (const schedule of currentSchedules) {
                    if (schedule[day] && schedule[day].start && schedule[day].end) {
                        if (
                            (startTime >= schedule[day].start && startTime < schedule[day].end) ||
                            (endTime > schedule[day].start && endTime <= schedule[day].end) ||
                            (startTime <= schedule[day].start && endTime >= schedule[day].end)
                        ) {
                            return false;
                        }
                    }
                }

                return true;
            } catch (error) {
                console.error('Error checking classroom availability:', error);
                return false;
            }
        });

        res.json(availableClassrooms);
    } catch (error) {
        console.error('Error fetching available classrooms:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Geçici kurs resmi yükleme endpointi
router.post('/temp/image', verifyToken, checkRole(['admin']), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Resim yüklenmedi' });
        }
        const imagePath = `/uploads/${req.file.filename}`;
        res.json({ image_path: imagePath });
    } catch (error) {
        console.error('Error uploading temporary course image:', error);
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
    }
});

// Kurs resmi yükle
router.post('/:id/image', verifyToken, checkRole(['admin']), upload.single('image'), async (req, res) => {
    try {
        const courseId = req.params.id;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Resim yüklenmedi' });
        }

        const imagePath = `/uploads/${req.file.filename}`;
        await db.pool.query(
            'UPDATE courses SET image_path = ? WHERE id = ?',
            [imagePath, courseId]
        );

        const [updatedCourse] = await db.pool.query('SELECT * FROM courses WHERE id = ?', [courseId]);
        res.json(updatedCourse[0]);
    } catch (error) {
        console.error('Error uploading course image:', error);
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
    }
});

// Yeni kurs oluştur
router.post('/', verifyToken, checkRole(['admin']), courseController.createCourse);

// Kurs güncelle
router.put('/:id', verifyToken, checkRole(['admin']), courseController.updateCourse);

// Kurs sil
router.delete('/:id', verifyToken, checkRole(['admin']), courseController.deleteCourse);

// Kurs arama endpoint'i
router.get('/search/by-day', searchCoursesByDay);

// Öğretmenin müsait saatlerini getir
router.get('/teacher-hours/:teacherId', verifyToken, async (req, res) => {
    try {
        const { teacherId } = req.params;
        
        // Öğretmenin çalışma saatlerini getir
        const [teachers] = await db.pool.query(
            `SELECT t.working_days, t.working_hours, 
                    GROUP_CONCAT(DISTINCT c.schedule) as current_schedules
             FROM teachers t
             LEFT JOIN courses c ON t.id = c.teacher_id 
                 AND c.status = 'active'
                 AND c.start_date <= CURDATE() 
                 AND c.end_date >= CURDATE()
             WHERE t.id = ?
             GROUP BY t.id`,
            [teacherId]
        );

        if (teachers.length === 0) {
            return res.status(404).json({ error: 'Öğretmen bulunamadı' });
        }

        const teacher = teachers[0];
        
        // JSON parse işlemlerini try-catch bloklarına alıyoruz
        let workingDays = {};
        let workingHours = {};
        let currentSchedules = [];

        try {
            workingDays = typeof teacher.working_days === 'string' ? 
                JSON.parse(teacher.working_days) : (teacher.working_days || {});
        } catch (e) {
            console.error('Error parsing working_days:', e);
            workingDays = {};
        }

        try {
            workingHours = typeof teacher.working_hours === 'string' ? 
                JSON.parse(teacher.working_hours) : (teacher.working_hours || {});
        } catch (e) {
            console.error('Error parsing working_hours:', e);
            workingHours = {};
        }

        try {
            currentSchedules = teacher.current_schedules ? 
                teacher.current_schedules.split(',').map(s => {
                    try {
                        return JSON.parse(s);
                    } catch (e) {
                        console.error('Error parsing schedule:', e);
                        return null;
                    }
                }).filter(Boolean) : [];
        } catch (e) {
            console.error('Error parsing current_schedules:', e);
            currentSchedules = [];
        }

        // Her gün için müsait saatleri hesapla
        const availableHours = {};
        
        // workingDays ve workingHours null kontrolü
        if (workingDays && typeof workingDays === 'object' && workingHours && typeof workingHours === 'object') {
            Object.keys(workingDays).forEach(day => {
                if (workingDays[day] && Array.isArray(workingDays[day]) && workingDays[day].length > 0 && workingHours[day]) {
                    availableHours[day] = {
                        start: workingHours[day].start,
                        end: workingHours[day].end,
                        busy_slots: currentSchedules
                            .filter(schedule => schedule && schedule[day])
                            .map(schedule => ({
                                start: schedule[day].start,
                                end: schedule[day].end
                            }))
                    };
                }
            });
        }

        res.json({
            working_days: workingDays,
            available_hours: availableHours
        });
    } catch (error) {
        console.error('Error fetching teacher hours:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;