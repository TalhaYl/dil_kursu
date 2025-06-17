const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');
const branchController = require('../controllers/branchController');
const { geocodeAddress } = require('../utils/geocoding');
const upload = require('../middleware/upload');

// Tüm şubeleri getir
router.get('/', branchController.getAllBranches);

// Tek bir şube getir
router.get('/:id', async (req, res) => {
    try {
        const [branches] = await db.pool.query('SELECT * FROM branches WHERE id = ?', [req.params.id]);
        
        if (branches.length === 0) {
            return res.status(404).json({ error: 'Şube bulunamadı' });
        }

        res.json(branches[0]);
    } catch (error) {
        console.error('Error fetching branch:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yeni şube ekle
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { name, address, phone, email, transportation, social_facilities } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Şube adı zorunludur' });
        }

        // Adres varsa koordinatları al
        let latitude = null;
        let longitude = null;
        let formattedAddress = address;

        if (address) {
            try {
                const geocodeResult = await geocodeAddress(address);
                latitude = geocodeResult.latitude;
                longitude = geocodeResult.longitude;
                formattedAddress = geocodeResult.formatted_address;
            } catch (error) {
                console.error('Geocoding error:', error);
                // Geocoding hatası durumunda işleme devam et
            }
        }

        const [result] = await db.pool.query(
            'INSERT INTO branches (name, address, phone, email, latitude, longitude, transportation, social_facilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, formattedAddress, phone || null, email || null, latitude, longitude, transportation || null, social_facilities || null]
        );

        const [newBranch] = await db.pool.query('SELECT * FROM branches WHERE id = ?', [result.insertId]);
        res.status(201).json(newBranch[0]);
    } catch (error) {
        console.error('Error creating branch:', error);
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
    }
});

// Şube güncelle
router.put('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { name, address, phone, email, transportation, social_facilities } = req.body;
        const branchId = req.params.id;

        if (!name) {
            return res.status(400).json({ error: 'Şube adı zorunludur' });
        }

        // Adres varsa koordinatları al
        let latitude = null;
        let longitude = null;
        let formattedAddress = address;

        if (address) {
            try {
                const geocodeResult = await geocodeAddress(address);
                latitude = geocodeResult.latitude;
                longitude = geocodeResult.longitude;
                formattedAddress = geocodeResult.formatted_address;
            } catch (error) {
                console.error('Geocoding error:', error);
                // Geocoding hatası durumunda işleme devam et
            }
        }

        await db.pool.query(
            'UPDATE branches SET name = ?, address = ?, phone = ?, email = ?, latitude = ?, longitude = ?, transportation = ?, social_facilities = ? WHERE id = ?',
            [name, formattedAddress, phone || null, email || null, latitude, longitude, transportation || null, social_facilities || null, branchId]
        );

        const [updatedBranch] = await db.pool.query('SELECT * FROM branches WHERE id = ?', [branchId]);
        res.json(updatedBranch[0]);
    } catch (error) {
        console.error('Error updating branch:', error);
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
    }
});

// Şube sil
router.delete('/:id', verifyToken, checkRole(['admin']), branchController.deleteBranch);

// En yakın şubeyi bul
router.post('/nearest', verifyToken, branchController.findNearestBranch);

// Şubenin kurslarını getir
router.get('/:branchId/courses', verifyToken, branchController.getBranchCourses);

// Şube resmi yükle
router.post('/:id/image', verifyToken, checkRole(['admin']), upload.single('image'), async (req, res) => {
    try {
        const branchId = req.params.id;
        if (!req.file) {
            return res.status(400).json({ error: 'Resim yüklenmedi' });
        }
        const imagePath = `/uploads/${req.file.filename}`;

        // Sadece o şubeyi güncelle
        await db.pool.query(
            'UPDATE branches SET image_path = ? WHERE id = ?',
            [imagePath, branchId]
        );

        // Sadece güncellenen şubeyi döndür
        const [updatedBranch] = await db.pool.query('SELECT * FROM branches WHERE id = ?', [branchId]);
        res.json(updatedBranch[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Geçici şube resmi yükleme endpointi
router.post('/temp/image', verifyToken, checkRole(['admin']), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Resim yüklenmedi' });
        }
        const imagePath = `/uploads/${req.file.filename}`;
        res.json({ image_path: imagePath });
    } catch (error) {
        console.error('Error uploading temporary branch image:', error);
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
    }
});

module.exports = router;
