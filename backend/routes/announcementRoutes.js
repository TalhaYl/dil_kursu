const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

// Tüm duyuruları getir
router.get('/', async (req, res) => {
    try {
        const [announcements] = await db.pool.query(
            'SELECT * FROM announcements ORDER BY created_at DESC'
        );
        res.json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Aktif duyuruları getir
router.get('/active', async (req, res) => {
    try {
        const [announcements] = await db.pool.query(
            'SELECT * FROM announcements WHERE status = "active" ORDER BY created_at DESC'
        );
        res.json(announcements);
    } catch (error) {
        console.error('Error fetching active announcements:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yeni duyuru ekle
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { title, content, status } = req.body;
        
        const [result] = await db.pool.query(
            'INSERT INTO announcements (title, content, status) VALUES (?, ?, ?)',
            [title, content, status || 'active']
        );

        const [newAnnouncement] = await db.pool.query(
            'SELECT * FROM announcements WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            ...newAnnouncement[0],
            message: 'Duyuru başarıyla eklendi!'
        });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Duyuru güncelle
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, status } = req.body;

        const [result] = await db.pool.query(
            'UPDATE announcements SET title = ?, content = ?, status = ? WHERE id = ?',
            [title, content, status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Duyuru bulunamadı' });
        }

        const [updatedAnnouncement] = await db.pool.query(
            'SELECT * FROM announcements WHERE id = ?',
            [id]
        );

        res.json({
            ...updatedAnnouncement[0],
            message: 'Duyuru başarıyla güncellendi!'
        });
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Duyuru sil
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.pool.query(
            'DELETE FROM announcements WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Duyuru bulunamadı' });
        }

        res.json({ message: 'Duyuru başarıyla silindi!' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router; 