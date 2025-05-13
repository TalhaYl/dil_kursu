const express = require('express');
const router = express.Router();
const db = require('../config/db'); // DB bağlantısı

// Hakkımızda sayfası verilerini getir
router.get('/about', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM about_page WHERE id = 1');
        if (results.length === 0) {
            return res.status(404).json({ error: 'Hakkımızda sayfası bulunamadı' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching about page data:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Hakkımızda sayfasını güncelle
router.put('/about', async (req, res) => {
    try {
        const { title, content, mission, vision } = req.body;
        const [result] = await db.query(
            'UPDATE about_page SET title = ?, content = ?, mission = ?, vision = ? WHERE id = 1',
            [title, content, mission, vision]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Hakkımızda sayfası bulunamadı' });
        }

        res.json({ message: 'Hakkımızda sayfası başarıyla güncellendi!' });
    } catch (error) {
        console.error('Error updating about page data:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
