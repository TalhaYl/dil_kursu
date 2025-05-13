const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

// Tüm öğrencileri getir
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT s.*, u.name, u.email, b.name as branch_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN branches b ON s.branch_id = b.id
        `);
        
        // JSON olarak saklanan değerleri parse et
        const students = results.map(student => ({
            ...student,
            courses: JSON.parse(student.courses || '[]'),
            enrolled_days: JSON.parse(student.enrolled_days || '[]')
        }));
        
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğrenci detaylarını getir
router.get('/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        
        const query = `
            SELECT s.*, u.name, u.email, b.name as branch_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN branches b ON s.branch_id = b.id
            WHERE s.id = ?
        `;
        
        const [results] = await db.query(query, [studentId]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Öğrenci bulunamadı' });
        }
        
        // JSON olarak saklanan değerleri parse et
        const student = {
            ...results[0],
            courses: JSON.parse(results[0].courses || '[]'),
            enrolled_days: JSON.parse(results[0].enrolled_days || '[]')
        };
        
        res.json(student);
    } catch (error) {
        console.error('Error fetching student details:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yeni öğrenci ekle (sadece admin)
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { user_id, courses, enrolled_days, branch_id } = req.body;
        
        // Dizi değerleri JSON olarak sakla
        const [result] = await db.query(
            'INSERT INTO students (user_id, courses, enrolled_days, branch_id) VALUES (?, ?, ?, ?)', 
            [user_id, JSON.stringify(courses), JSON.stringify(enrolled_days), branch_id]
        );
        
        // Eklenen öğrenciyi getir
        const [studentResults] = await db.query(`
            SELECT s.*, u.name, u.email, b.name as branch_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN branches b ON s.branch_id = b.id
            WHERE s.id = ?
        `, [result.insertId]);
        
        const student = {
            ...studentResults[0],
            courses: JSON.parse(studentResults[0].courses || '[]'),
            enrolled_days: JSON.parse(studentResults[0].enrolled_days || '[]')
        };
        
        res.status(201).json(student);
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğrenci güncelle (sadece admin)
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { name, courses, enrolled_days, branch_id } = req.body;
        const studentId = req.params.id;
        
        // Öğrenci bilgilerini güncelle
        await db.query(
            'UPDATE students SET courses = ?, enrolled_days = ?, branch_id = ? WHERE id = ?', 
            [JSON.stringify(courses), JSON.stringify(enrolled_days), branch_id, studentId]
        );
        
        // Kullanıcı adını güncelle
        if (name) {
            const [studentData] = await db.query('SELECT user_id FROM students WHERE id = ?', [studentId]);
            if (studentData.length === 0) {
                return res.status(404).json({ error: 'Öğrenci bulunamadı' });
            }
            await db.query('UPDATE users SET name = ? WHERE id = ?', [name, studentData[0].user_id]);
        }
        
        // Güncellenmiş öğrenciyi getir
        const [results] = await db.query(`
            SELECT s.*, u.name, u.email, b.name as branch_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN branches b ON s.branch_id = b.id
            WHERE s.id = ?
        `, [studentId]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Öğrenci bulunamadı' });
        }
        
        const student = {
            ...results[0],
            courses: JSON.parse(results[0].courses || '[]'),
            enrolled_days: JSON.parse(results[0].enrolled_days || '[]')
        };
        
        res.json(student);
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğrenci sil (sadece admin)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const studentId = req.params.id;
        
        // Öğrencinin user_id'sini al
        const [studentData] = await db.query('SELECT user_id FROM students WHERE id = ?', [studentId]);
        if (studentData.length === 0) {
            return res.status(404).json({ error: 'Öğrenci bulunamadı' });
        }
        
        const userId = studentData[0].user_id;
        
        // Önce öğrenci kaydını sil
        await db.query('DELETE FROM students WHERE id = ?', [studentId]);
        
        // Sonra user kaydını sil
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        
        res.json({ message: 'Öğrenci başarıyla silindi' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
