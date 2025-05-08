const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

// Tüm kursları getir
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM courses');
        res.json(results);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Müsait öğretmenleri getir
router.get('/available-teachers/:branch_id/:language/:day', async (req, res) => {
    try {
        const { branch_id, language, day } = req.params;
        const query = `
            SELECT t.id AS teacher_id, CONCAT(t.first_name, ' ', t.last_name) AS teacher_name, 
                   t.languages, t.working_days
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            WHERE FIND_IN_SET(?, t.languages) 
            AND FIND_IN_SET(?, t.working_days)
            AND t.branch_id = ?
            AND t.id NOT IN (
                SELECT teacher_id 
                FROM courses 
                WHERE start_date <= CURDATE() AND end_date >= CURDATE()
            )
        `;
        
        const [results] = await db.query(query, [language, day, branch_id]);
        res.json(results);
    } catch (error) {
        console.error('Error fetching available teachers:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Boş sınıfları getir
router.get('/available-classrooms/:branch_id', async (req, res) => {
    try {
        const { branch_id } = req.params;
        const query = `
            SELECT c.id AS classroom_id, c.name AS classroom_name, c.capacity 
            FROM classrooms c
            WHERE c.branch_id = ?
            AND c.id NOT IN (
                SELECT classroom_id 
                FROM courses 
                WHERE start_date <= CURDATE() AND end_date >= CURDATE()
            )
        `;
        
        const [results] = await db.query(query, [branch_id]);
        res.json(results);
    } catch (error) {
        console.error('Error fetching available classrooms:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kurs ekle
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { name, language, teacher_id, branch_id, classroom_id, course_type, start_date, end_date, price } = req.body;
        
        const [result] = await db.query(
            'INSERT INTO courses (name, language, teacher_id, branch_id, classroom_id, course_type, start_date, end_date, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, language, teacher_id, branch_id, classroom_id, course_type || 'Physical', start_date, end_date, price]
        );
        
        res.status(201).json({ 
            id: result.insertId,
            name,
            language,
            teacher_id,
            branch_id,
            classroom_id,
            course_type: course_type || 'Physical',
            start_date,
            end_date,
            price,
            message: 'Kurs başarıyla eklendi'
        });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kurs güncelle
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { name, language, teacher_id, branch_id, classroom_id, course_type, start_date, end_date, price } = req.body;
        
        await db.query(
            'UPDATE courses SET name = ?, language = ?, teacher_id = ?, branch_id = ?, classroom_id = ?, course_type = ?, start_date = ?, end_date = ?, price = ? WHERE id = ?',
            [name, language, teacher_id, branch_id, classroom_id, course_type, start_date, end_date, price, req.params.id]
        );
        
        res.json({ 
            id: parseInt(req.params.id),
            name,
            language,
            teacher_id,
            branch_id,
            classroom_id,
            course_type,
            start_date,
            end_date,
            price,
            message: 'Kurs başarıyla güncellendi'
        });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kurs sil
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        await db.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
        res.json({ message: 'Kurs başarıyla silindi' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;