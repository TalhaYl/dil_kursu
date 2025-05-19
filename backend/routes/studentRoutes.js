const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

// Tüm öğrencileri getir
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT s.id, s.user_id, s.ad, s.soyad, s.phone, s.address, s.branch_id, b.name as branch_name, s.created_at, s.updated_at
            FROM students s
            LEFT JOIN branches b ON s.branch_id = b.id
        `);
        
        res.json(results);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğrenci detaylarını getir
router.get('/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        
        const query = `
            SELECT s.id, s.user_id, s.ad, s.soyad, s.phone, s.address, s.branch_id, b.name as branch_name, s.created_at, s.updated_at
            FROM students s
            LEFT JOIN branches b ON s.branch_id = b.id
            WHERE s.id = ?
        `;
        
        const [results] = await db.query(query, [studentId]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Öğrenci bulunamadı' });
        }
        
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching student details:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yeni öğrenci ekle (sadece admin)
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { user_id, ad, soyad, phone, address, branch_id } = req.body;
         // Eksik alan kontrolü
         if (!user_id || !ad || !soyad || !branch_id) {
            return res.status(400).json({ error: 'Ad, soyad, kullanıcı ID ve şube ID zorunludur' });
        }
        
        // Veriyi ekle
        const [result] = await db.query(
            'INSERT INTO students (user_id, ad, soyad, phone, address, branch_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())', 
            [user_id, ad, soyad, phone, address, branch_id]
        );
        
        // Eklenen öğrenciyi getir
        const [studentResults] = await db.query(`
            SELECT s.id, s.user_id, s.ad, s.soyad, s.phone, s.address, s.branch_id, b.name as branch_name, s.created_at, s.updated_at
            FROM students s
            LEFT JOIN branches b ON s.branch_id = b.id
            WHERE s.id = ?
        `, [result.insertId]);
        
        res.status(201).json(studentResults[0]);
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğrenci güncelle (sadece admin)
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const studentId = req.params.id;
        const { ad, soyad, phone, address, branch_id } = req.body;
        
        // Öğrenci bilgilerini güncelle
        await db.query(
            'UPDATE students SET ad = ?, soyad = ?, phone = ?, address = ?, branch_id = ?, updated_at = NOW() WHERE id = ?', 
            [ad, soyad, phone, address, branch_id, studentId]
        );
        
        // Güncellenmiş öğrenciyi getir
        const [results] = await db.query(`
            SELECT s.id, s.user_id, s.ad, s.soyad, s.phone, s.address, s.branch_id, b.name as branch_name, s.created_at, s.updated_at
            FROM students s
            LEFT JOIN branches b ON s.branch_id = b.id
            WHERE s.id = ?
        `, [studentId]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Öğrenci bulunamadı' });
        }
        
        res.json(results[0]);
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Öğrenci sil (sadece admin)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const studentId = req.params.id;
        
        // Öğrenciyi sil
        const [results] = await db.query('DELETE FROM students WHERE id = ?', [studentId]);
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Öğrenci bulunamadı' });
        }

        res.json({ message: 'Öğrenci başarıyla silindi' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
