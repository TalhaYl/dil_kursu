const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

// Hakkımızda bilgisini getir
router.get('/about', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM about');
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Hakkımızda bilgisi bulunamadı' });
        }
        
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching about info:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Hakkımızda bilgisini güncelle (admin yetkisi gerekli)
router.put('/about', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'İçerik alanı zorunludur' });
        }
        
        const [checkResult] = await db.query('SELECT * FROM about');
        
        if (checkResult.length === 0) {
            // Kayıt yoksa ekle
            await db.query('INSERT INTO about (id, content) VALUES (1, ?)', [content]);
        } else {
            // Kayıt varsa güncelle
            await db.query('UPDATE about SET content = ? WHERE id = 1', [content]);
        }
        
        res.json({ 
            id: 1, 
            content,
            message: 'Hakkımızda bilgisi başarıyla güncellendi'
        });
    } catch (error) {
        console.error('Error updating about info:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// İletişim bilgisini getir
router.get('/contact', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM contact');
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'İletişim bilgisi bulunamadı' });
        }
        
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching contact info:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// İletişim bilgisini güncelle (admin yetkisi gerekli)
router.put('/contact', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'İçerik alanı zorunludur' });
        }
        
        const [checkResult] = await db.query('SELECT * FROM contact');
        
        if (checkResult.length === 0) {
            // Kayıt yoksa ekle
            await db.query('INSERT INTO contact (id, content) VALUES (1, ?)', [content]);
        } else {
            // Kayıt varsa güncelle
            await db.query('UPDATE contact SET content = ? WHERE id = 1', [content]);
        }
        
        res.json({ 
            id: 1, 
            content,
            message: 'İletişim bilgisi başarıyla güncellendi'
        });
    } catch (error) {
        console.error('Error updating contact info:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;