const express = require('express');
const router = express.Router();
const db = require('../config/db'); // DB bağlantısı
const { verifyToken, checkRole } = require('../middleware/auth');

// Hakkımızda sayfası verilerini getir
router.get('/', async (req, res) => {
    try {
        const [results] = await db.pool.query('SELECT * FROM pages WHERE slug = ?', ['about']);
        if (results.length === 0) {
            return res.json({
                title: 'Hakkımızda',
                content: 'Dil Kursu hakkında bilgi içeriği burada yer alacak.',
                image: null
            });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching about page data:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yeni hakkımızda sayfası ekle
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { title, content } = req.body;
        
        // Önce kayıt var mı kontrol et
        const [checkResult] = await db.pool.query('SELECT * FROM pages WHERE slug = ?', ['about']);
        
        if (checkResult.length > 0) {
            return res.status(400).json({ error: 'Hakkımızda sayfası zaten mevcut' });
        }

        // Yeni kayıt ekle
        await db.pool.query(
            'INSERT INTO pages (slug, title, content) VALUES (?, ?, ?)',
            ['about', title, content]
        );

        res.status(201).json({ 
            slug: 'about',
            title,
            content,
            message: 'Hakkımızda sayfası başarıyla eklendi!'
        });
    } catch (error) {
        console.error('Error creating about page:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Hakkımızda sayfasını güncelle
router.put('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { title, content } = req.body;
        
        // Önce kayıt var mı kontrol et
        const [checkResult] = await db.pool.query('SELECT * FROM pages WHERE slug = ?', ['about']);
        
        if (checkResult.length === 0) {
            // Kayıt yoksa ekle
            await db.pool.query(
                'INSERT INTO pages (slug, title, content) VALUES (?, ?, ?)',
                ['about', title, content]
            );
        } else {
            // Kayıt varsa güncelle
            await db.pool.query(
                'UPDATE pages SET title = ?, content = ? WHERE slug = ?',
                [title, content, 'about']
            );
        }

        res.json({ 
            slug: 'about',
            title,
            content,
            message: 'Hakkımızda sayfası başarıyla güncellendi!'
        });
    } catch (error) {
        console.error('Error updating about page data:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Hakkımızda sayfasını sil
router.delete('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const [result] = await db.pool.query('DELETE FROM pages WHERE slug = ?', ['about']);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Hakkımızda sayfası bulunamadı' });
        }

        res.json({ message: 'Hakkımızda sayfası başarıyla silindi!' });
    } catch (error) {
        console.error('Error deleting about page:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
