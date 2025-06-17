const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

// Tüm iletişim bilgilerini getir
router.get('/', async (req, res) => {
    try {
        const [contactInfo] = await db.pool.query(
            'SELECT * FROM contact_info WHERE status = "active"'
        );
        res.json(contactInfo);
    } catch (error) {
        console.error('Error fetching contact info:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yeni iletişim bilgisi ekle
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { branch_id, address, phone, email, working_hours, map_embed, social_media } = req.body;
        
        const [result] = await db.pool.query(
            'INSERT INTO contact_info (branch_id, address, phone, email, working_hours, map_embed, social_media) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [branch_id, address, phone, email, working_hours, map_embed, JSON.stringify(social_media)]
        );

        const [newContactInfo] = await db.pool.query(
            'SELECT * FROM contact_info WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            ...newContactInfo[0],
            message: 'İletişim bilgileri başarıyla eklendi!'
        });
    } catch (error) {
        console.error('Error creating contact info:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// İletişim bilgilerini güncelle
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { branch_id, address, phone, email, working_hours, map_embed, social_media, status } = req.body;

        const [result] = await db.pool.query(
            'UPDATE contact_info SET branch_id = ?, address = ?, phone = ?, email = ?, working_hours = ?, map_embed = ?, social_media = ?, status = ? WHERE id = ?',
            [branch_id, address, phone, email, working_hours, map_embed, JSON.stringify(social_media), status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'İletişim bilgileri bulunamadı' });
        }

        const [updatedContactInfo] = await db.pool.query(
            'SELECT * FROM contact_info WHERE id = ?',
            [id]
        );

        res.json({
            ...updatedContactInfo[0],
            message: 'İletişim bilgileri başarıyla güncellendi!'
        });
    } catch (error) {
        console.error('Error updating contact info:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// İletişim bilgilerini sil
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.pool.query(
            'DELETE FROM contact_info WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'İletişim bilgileri bulunamadı' });
        }

        res.json({ message: 'İletişim bilgileri başarıyla silindi!' });
    } catch (error) {
        console.error('Error deleting contact info:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router; 