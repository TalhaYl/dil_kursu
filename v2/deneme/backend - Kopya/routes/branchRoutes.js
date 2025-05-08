const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

// Tüm şubeleri getir
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM branches');
        res.json(results);
    } catch (error) {
        console.error('Error fetching branches:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Şube detaylarını getir
router.get('/:id', async (req, res) => {
    try {
        const branchId = req.params.id;
        
        const query = `
            SELECT b.*, 
                COUNT(DISTINCT c.id) AS classroom_count,
                SUM(c.capacity) AS total_capacity
            FROM branches b
            LEFT JOIN classrooms c ON b.id = c.branch_id
            WHERE b.id = ?
            GROUP BY b.id
        `;
        
        const [results] = await db.query(query, [branchId]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Şube bulunamadı' });
        }
        
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching branch details:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Şubenin sınıflarını getir
router.get('/:id/classrooms', async (req, res) => {
    try {
        const branchId = req.params.id;
        
        const query = `
            SELECT c.*, 
                COUNT(co.id) AS active_courses
            FROM classrooms c
            LEFT JOIN courses co ON c.id = co.classroom_id 
                AND co.start_date <= CURDATE() 
                AND co.end_date >= CURDATE()
            WHERE c.branch_id = ?
            GROUP BY c.id
        `;
        
        const [results] = await db.query(query, [branchId]);
        
        res.json(results);
    } catch (error) {
        console.error('Error fetching branch classrooms:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yeni şube ekle (sadece admin)
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { name, address, transportation, social_facilities } = req.body;
        
        const [result] = await db.query(
            'INSERT INTO branches (name, address, transportation, social_facilities) VALUES (?, ?, ?, ?)', 
            [name, address, transportation, social_facilities]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            name, 
            address, 
            transportation, 
            social_facilities,
            message: 'Şube başarıyla eklendi'
        });
    } catch (error) {
        console.error('Error creating branch:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Şube güncelle (sadece admin)
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { name, address, transportation, social_facilities } = req.body;
        
        await db.query(
            'UPDATE branches SET name = ?, address = ?, transportation = ?, social_facilities = ? WHERE id = ?', 
            [name, address, transportation, social_facilities, req.params.id]
        );
        
        res.json({ 
            id: parseInt(req.params.id), 
            name, 
            address, 
            transportation, 
            social_facilities,
            message: 'Şube başarıyla güncellendi'
        });
    } catch (error) {
        console.error('Error updating branch:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Şube sil (sadece admin)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        await db.query('DELETE FROM branches WHERE id = ?', [req.params.id]);
        res.json({ message: 'Şube başarıyla silindi' });
    } catch (error) {
        console.error('Error deleting branch:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;