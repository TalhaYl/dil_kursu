const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

// Tüm sınıfları getir
router.get('/', async (req, res) => {
    try {
        const [classrooms] = await db.pool.query(`
            SELECT c.*, b.name as branch_name 
            FROM classrooms c
            LEFT JOIN branches b ON c.branch_id = b.id
        `);
        res.json(classrooms);
    } catch (error) {
        console.error('Error fetching classrooms:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sınıf detaylarını getir
router.get('/:id', async (req, res) => {
    try {
        const [classrooms] = await db.pool.query(`
            SELECT c.*, b.name as branch_name 
            FROM classrooms c
            LEFT JOIN branches b ON c.branch_id = b.id
            WHERE c.id = ?
        `, [req.params.id]);

        if (classrooms.length === 0) {
            return res.status(404).json({ error: 'Sınıf bulunamadı' });
        }

        res.json(classrooms[0]);
    } catch (error) {
        console.error('Error fetching classroom:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yeni sınıf ekle (sadece admin)
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { name, capacity, branch_id, status } = req.body;
        
        if (!name || !branch_id || !capacity) {
            return res.status(400).json({ error: 'Sınıf adı, kapasite ve şube ID zorunludur' });
        }

        const [result] = await db.pool.query(
            'INSERT INTO classrooms (name, capacity, branch_id, status) VALUES (?, ?, ?, ?)', 
            [name, capacity, branch_id, status || 'active']
        );

        const [classroomResults] = await db.pool.query(`
            SELECT c.*, b.name as branch_name 
            FROM classrooms c
            LEFT JOIN branches b ON c.branch_id = b.id
            WHERE c.id = ?
        `, [result.insertId]);

        res.status(201).json(classroomResults[0]);
    } catch (error) {
        console.error('Error creating classroom:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sınıf güncelle (sadece admin)
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const classroomId = req.params.id;
        const { name, capacity, branch_id, status } = req.body;

        if (!name || !branch_id || !capacity) {
            return res.status(400).json({ error: 'Sınıf adı, kapasite ve şube ID zorunludur' });
        }

        await db.pool.query(
            'UPDATE classrooms SET name = ?, capacity = ?, branch_id = ?, status = ? WHERE id = ?', 
            [name, capacity, branch_id, status, classroomId]
        );

        const [results] = await db.pool.query(`
            SELECT c.*, b.name as branch_name 
            FROM classrooms c
            LEFT JOIN branches b ON c.branch_id = b.id
            WHERE c.id = ?
        `, [classroomId]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'Sınıf bulunamadı' });
        }

        res.json(results[0]);
    } catch (error) {
        console.error('Error updating classroom:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sınıf sil (sadece admin)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const classroomId = req.params.id;
        
        // Önce sınıfın aktif kursları var mı kontrol et
        const [activeCourses] = await db.pool.query(
            'SELECT COUNT(*) as count FROM courses WHERE classroom_id = ? AND status = "active"',
            [classroomId]
        );

        if (activeCourses[0].count > 0) {
            return res.status(400).json({ error: 'Bu sınıfa ait aktif kurslar var. Önce kursları iptal edin veya tamamlayın.' });
        }

        const [results] = await db.pool.query('DELETE FROM classrooms WHERE id = ?', [classroomId]);
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Sınıf bulunamadı' });
        }

        res.json({ message: 'Sınıf başarıyla silindi' });
    } catch (error) {
        console.error('Error deleting classroom:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Şubeye göre sınıfları getir
router.get('/by-branch/:branchId', async (req, res) => {
  const { branchId } = req.params;
  try {
    const [classrooms] = await db.pool.query(
      'SELECT * FROM classrooms WHERE branch_id = ?',
      [branchId]
    );
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: 'Sınıflar getirilirken hata oluştu', error: error.message });
  }
});

module.exports = router;
