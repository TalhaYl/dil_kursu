const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

// Tüm sınıfları getir
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT c.*, 
                   b.name as branch_name
            FROM classrooms c
            LEFT JOIN branches b ON c.branch_id = b.id
        `);
        res.json(results);
    } catch (error) {
        console.error('Error fetching classrooms:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sınıf detaylarını getir
router.get('/:id', async (req, res) => {
    try {
        const classroomId = parseInt(req.params.id);
        if (isNaN(classroomId)) {
            return res.status(400).json({ error: 'Geçersiz sınıf ID' });
        }
        
        const query = `
            SELECT c.*, 
                   b.name as branch_name
            FROM classrooms c
            LEFT JOIN branches b ON c.branch_id = b.id
            WHERE c.id = ?
        `;
        
        const [results] = await db.query(query, [classroomId]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Sınıf bulunamadı' });
        }
        
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching classroom details:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yeni sınıf ekle (sadece admin)
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { name, capacity, branch_id } = req.body;
        
        if (!name || !capacity || !branch_id) {
            return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
        }

        const [result] = await db.query(
            'INSERT INTO classrooms (name, capacity, branch_id) VALUES (?, ?, ?)', 
            [name, capacity, branch_id]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            name, 
            capacity, 
            branch_id,
            message: 'Sınıf başarıyla eklendi'
        });
    } catch (error) {
        console.error('Error creating classroom:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sınıf güncelle (sadece admin)
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const classroomId = parseInt(req.params.id);
        if (isNaN(classroomId)) {
            return res.status(400).json({ error: 'Geçersiz sınıf ID' });
        }

        const { name, capacity, branch_id } = req.body;
        
        if (!name || !capacity || !branch_id) {
            return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
        }

        await db.query(
            'UPDATE classrooms SET name = ?, capacity = ?, branch_id = ? WHERE id = ?', 
            [name, capacity, branch_id, classroomId]
        );
        
        res.json({ 
            id: classroomId, 
            name, 
            capacity, 
            branch_id,
            message: 'Sınıf başarıyla güncellendi'
        });
    } catch (error) {
        console.error('Error updating classroom:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sınıf sil (sadece admin)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const classroomId = parseInt(req.params.id);
        if (isNaN(classroomId)) {
            return res.status(400).json({ error: 'Geçersiz sınıf ID' });
        }

        await db.query('DELETE FROM classrooms WHERE id = ?', [classroomId]);
        res.json({ message: 'Sınıf başarıyla silindi' });
    } catch (error) {
        console.error('Error deleting classroom:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Eksik export
module.exports = router;
