const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Hakkımızda sayfası içeriğini getir
router.get('/about', async (req, res) => {
    try {
        const [pages] = await db.pool.query(`
            SELECT * FROM pages WHERE slug = 'about'
        `);

        if (pages.length === 0) {
            // Eğer sayfa yoksa varsayılan içeriği döndür
            return res.json({
                title: 'Hakkımızda',
                content: 'Dil Kursu hakkında bilgi içeriği burada yer alacak.',
                image: null
            });
        }

        res.json(pages[0]);
    } catch (error) {
        console.error('Error fetching about page:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// İletişim sayfası içeriğini getir
router.get('/contact', async (req, res) => {
    try {
        const [pages] = await db.pool.query(`
            SELECT * FROM pages WHERE slug = 'contact'
        `);

        if (pages.length === 0) {
            // Eğer sayfa yoksa varsayılan içeriği döndür
            return res.json({
                title: 'İletişim',
                content: 'İletişim bilgileri burada yer alacak.',
                address: 'Örnek Adres',
                phone: '+90 123 456 7890',
                email: 'info@dilkursu.com',
                working_hours: 'Pazartesi - Cuma: 09:00 - 18:00'
            });
        }

        res.json(pages[0]);
    } catch (error) {
        console.error('Error fetching contact page:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sayfa içeriğini güncelle (sadece admin)
router.put('/:slug', verifyToken, async (req, res) => {
    try {
        const { slug } = req.params;
        const { title, content, image, address, phone, email, working_hours } = req.body;

        const [result] = await db.pool.query(
            'INSERT INTO pages (slug, title, content, image, address, phone, email, working_hours, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content), image = VALUES(image), address = VALUES(address), phone = VALUES(phone), email = VALUES(email), working_hours = VALUES(working_hours), updated_at = NOW()',
            [slug, title, content, image, address, phone, email, working_hours]
        );

        const [pages] = await db.pool.query('SELECT * FROM pages WHERE slug = ?', [slug]);
        res.json(pages[0]);
    } catch (error) {
        console.error('Error updating page:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router; 