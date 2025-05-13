const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

// Tüm öğretmenleri getir
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT t.*, u.name, u.email, b.name as branch_name
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN branches b ON t.branch_id = b.id
        `);
        
        // JSON olarak saklanan değerleri parse et
        const teachers = results.map(teacher => ({
            ...teacher,
            languages: JSON.parse(teacher.languages || '[]'),
            working_days: JSON.parse(teacher.working_days || '[]')
        }));
        
        res.json(teachers);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğretmen detaylarını getir
router.get('/:id', async (req, res) => {
    try {
        const teacherId = req.params.id;
        
        const query = `
            SELECT t.*, u.name, u.email, b.name as branch_name
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN branches b ON t.branch_id = b.id
            WHERE t.id = ?
        `;
        
        const [results] = await db.query(query, [teacherId]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Öğretmen bulunamadı' });
        }
        
        // JSON olarak saklanan değerleri parse et
        const teacher = {
            ...results[0],
            languages: JSON.parse(results[0].languages || '[]'),
            working_days: JSON.parse(results[0].working_days || '[]')
        };
        
        res.json(teacher);
    } catch (error) {
        console.error('Error fetching teacher details:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yeni öğretmen ekle (sadece admin)
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { user_id, languages, working_days, branch_id } = req.body;
        
        // Dizi değerleri JSON olarak sakla
        const [result] = await db.query(
            'INSERT INTO teachers (user_id, languages, working_days, branch_id) VALUES (?, ?, ?, ?)', 
            [user_id, JSON.stringify(languages), JSON.stringify(working_days), branch_id]
        );
        
        // Eklenen öğretmeni getir
        const [teacherResults] = await db.query(`
            SELECT t.*, u.name, u.email, b.name as branch_name
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN branches b ON t.branch_id = b.id
            WHERE t.id = ?
        `, [result.insertId]);
        
        const teacher = {
            ...teacherResults[0],
            languages: JSON.parse(teacherResults[0].languages || '[]'),
            working_days: JSON.parse(teacherResults[0].working_days || '[]')
        };
        
        res.status(201).json(teacher);
    } catch (error) {
        console.error('Error creating teacher:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğretmen güncelle (sadece admin)
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { name, languages, working_days, branch_id } = req.body;
        const teacherId = req.params.id;
        
        // Öğretmen bilgilerini güncelle
        await db.query(
            'UPDATE teachers SET languages = ?, working_days = ?, branch_id = ? WHERE id = ?', 
            [JSON.stringify(languages), JSON.stringify(working_days), branch_id, teacherId]
        );
        
        // Kullanıcı adını güncelle
        if (name) {
            const [teacherData] = await db.query('SELECT user_id FROM teachers WHERE id = ?', [teacherId]);
            if (teacherData.length === 0) {
                return res.status(404).json({ error: 'Öğretmen bulunamadı' });
            }
            await db.query('UPDATE users SET name = ? WHERE id = ?', [name, teacherData[0].user_id]);
        }
        
        
        // Güncellenmiş öğretmeni getir
        const [results] = await db.query(`
            SELECT t.*, u.name, u.email, b.name as branch_name
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN branches b ON t.branch_id = b.id
            WHERE t.id = ?
        `, [teacherId]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Öğretmen bulunamadı' });
        }
        
        const teacher = {
            ...results[0],
            languages: JSON.parse(results[0].languages || '[]'),
            working_days: JSON.parse(results[0].working_days || '[]')
        };
        
        res.json(teacher);
    } catch (error) {
        console.error('Error updating teacher:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğretmen sil (sadece admin)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const teacherId = req.params.id;
        
        // Öğretmenin user_id'sini al
        const [teacherData] = await db.query('SELECT user_id FROM teachers WHERE id = ?', [teacherId]);
        if (teacherData.length === 0) {
            return res.status(404).json({ error: 'Öğretmen bulunamadı' });
        }
        
        const userId = teacherData[0].user_id;
        
        // Önce öğretmen kaydını sil
        await db.query('DELETE FROM teachers WHERE id = ?', [teacherId]);
        
        // Sonra user kaydını sil
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        
        res.json({ message: 'Öğretmen başarıyla silindi' });
    } catch (error) {
        console.error('Error deleting teacher:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;