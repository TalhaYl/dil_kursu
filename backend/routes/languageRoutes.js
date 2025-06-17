const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Tüm dilleri getir
router.get('/', async (req, res) => {
    try {
        const [languages] = await db.pool.query('SELECT * FROM languages ORDER BY name');
        res.json(languages);
    } catch (error) {
        console.error('Diller getirilirken hata:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router; 