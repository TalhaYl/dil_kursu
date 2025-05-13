const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

// Tüm şubeleri getir
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT * FROM branches
            ORDER BY name
        `);
        res.json(results);
    } catch (error) {
        console.error('Error fetching branches:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Tek bir şube getir
router.get('/:id', async (req, res) => {
    try {
        const branchId = parseInt(req.params.id);
        if (isNaN(branchId)) {
            return res.status(400).json({ error: 'Geçersiz şube ID' });
        }

        const [results] = await db.query(
            'SELECT * FROM branches WHERE id = ?', 
            [branchId]
        );

        if (results.length === 0) {
            return res.status(404).json({ error: 'Şube bulunamadı' });
        }

        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching branch details:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yeni şube ekle (sadece admin)
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { name, location, description } = req.body;
        
        if (!name || !location) {
            return res.status(400).json({ error: 'Name ve location zorunludur' });
        }

        const [result] = await db.query(
            'INSERT INTO branches (name, location, description) VALUES (?, ?, ?)', 
            [name, location, description || '']
        );

        res.status(201).json({ 
            id: result.insertId, 
            name, 
            location, 
            description,
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
        const branchId = parseInt(req.params.id);
        if (isNaN(branchId)) {
            return res.status(400).json({ error: 'Geçersiz şube ID' });
        }

        const { name, location, description } = req.body;
        
        if (!name || !location) {
            return res.status(400).json({ error: 'Name ve location zorunludur' });
        }

        await db.query(
            'UPDATE branches SET name = ?, location = ?, description = ? WHERE id = ?', 
            [name, location, description || '', branchId]
        );

        res.json({ 
            id: branchId, 
            name, 
            location, 
            description,
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
        const branchId = parseInt(req.params.id);
        if (isNaN(branchId)) {
            return res.status(400).json({ error: 'Geçersiz şube ID' });
        }

        await db.query('DELETE FROM branches WHERE id = ?', [branchId]);
        res.json({ message: 'Şube başarıyla silindi' });
    } catch (error) {
        console.error('Error deleting branch:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Eksik export
module.exports = router;
