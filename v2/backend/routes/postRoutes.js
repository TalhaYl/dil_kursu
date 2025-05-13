const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

// Tüm yazıları getir
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT p.*, u.name as admin_name
            FROM posts p
            JOIN users u ON p.admin = u.id
        `);
        
        res.json(results);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Belirli bir yazıyı getir
router.get('/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        
        const query = `
            SELECT p.*, u.name as admin_name
            FROM posts p
            JOIN users u ON p.admin = u.id
            WHERE p.id = ?
        `;
        
        const [results] = await db.query(query, [postId]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Yazı bulunamadı' });
        }
        
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching post details:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yeni yazı ekle (sadece admin)
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { title, content, admin } = req.body;

        // Veritabanına yeni yazıyı ekle
        const [result] = await db.query(
            'INSERT INTO posts (title, content, admin) VALUES (?, ?, ?)', 
            [title, content, admin]
        );

        // Yeni eklenen yazıyı döndür
        const [postResults] = await db.query(`
            SELECT p.*, u.name as admin_name
            FROM posts p
            JOIN users u ON p.admin = u.id
            WHERE p.id = ?
        `, [result.insertId]);
        
        res.status(201).json(postResults[0]);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yazıyı güncelle (sadece admin)
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { title, content } = req.body;
        const postId = req.params.id;
        
        // Yazıyı güncelle
        await db.query(
            'UPDATE posts SET title = ?, content = ? WHERE id = ?', 
            [title, content, postId]
        );
        
        // Güncellenmiş yazıyı getir
        const [results] = await db.query(`
            SELECT p.*, u.name as admin_name
            FROM posts p
            JOIN users u ON p.admin = u.id
            WHERE p.id = ?
        `, [postId]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Yazı bulunamadı' });
        }

        res.json(results[0]);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yazıyı sil (sadece admin)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const postId = req.params.id;
        
        // Yazıyı sil
        const [results] = await db.query('DELETE FROM posts WHERE id = ?', [postId]);
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Yazı bulunamadı' });
        }

        res.json({ message: 'Yazı başarıyla silindi' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
