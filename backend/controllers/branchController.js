const db = require('../config/db');
const { executeTransaction } = require('../config/db');

// Tüm şubeleri getir
const getAllBranches = async (req, res) => {
    try {
        const [branches] = await db.pool.query(`
            SELECT 
                b.id,
                b.name,
                b.address,
                b.phone,
                b.email,
                b.latitude,
                b.longitude,
                b.image_path,
                b.transportation,
                b.social_facilities,
                COUNT(DISTINCT c.id) as classroom_count,
                COALESCE(SUM(c.capacity), 0) as capacity
            FROM branches b
            LEFT JOIN classrooms c ON b.id = c.branch_id
            GROUP BY b.id, b.name, b.address, b.phone, b.email, b.latitude, b.longitude, b.image_path, b.transportation, b.social_facilities
        `);
        res.json(branches);
    } catch (error) {
        res.status(500).json({ message: 'Şubeler getirilirken bir hata oluştu', error: error.message });
    }
};

// Yeni şube ekle
const createBranch = async (req, res) => {
    const { name, address, phone, email, latitude, longitude, image_path, transportation, social_facilities } = req.body;
    
    try {
        const [result] = await db.pool.query(
            'INSERT INTO branches (name, address, phone, email, latitude, longitude, image_path, transportation, social_facilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, address, phone, email, latitude, longitude, image_path || null, transportation || null, social_facilities || null]
        );
        
        res.status(201).json({ 
            message: 'Şube başarıyla oluşturuldu',
            branchId: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ message: 'Şube oluşturulurken bir hata oluştu', error: error.message });
    }
};

// Şube güncelle
const updateBranch = async (req, res) => {
    const { id } = req.params;
    const { name, address, phone, email, latitude, longitude, image_path, transportation, social_facilities } = req.body;
    
    try {
        await db.pool.query(
            'UPDATE branches SET name = ?, address = ?, phone = ?, email = ?, latitude = ?, longitude = ?, image_path = ?, transportation = ?, social_facilities = ? WHERE id = ?',
            [name, address, phone, email, latitude, longitude, image_path || null, transportation || null, social_facilities || null, id]
        );
        
        res.json({ message: 'Şube başarıyla güncellendi' });
    } catch (error) {
        res.status(500).json({ message: 'Şube güncellenirken bir hata oluştu', error: error.message });
    }
};

// Şube sil
const deleteBranch = async (req, res) => {
    const { id } = req.params;
    
    try {
        await db.pool.query('DELETE FROM branches WHERE id = ?', [id]);
        res.json({ message: 'Şube başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ message: 'Şube silinirken bir hata oluştu', error: error.message });
    }
};

// İki nokta arasındaki mesafeyi hesapla (Haversine formülü)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Dünya'nın yarıçapı (km)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Number(distance.toFixed(1)); // Sadece sayı, km yazısı yok
}

function toRad(value) {
    return value * Math.PI / 180;
}

// En yakın şubeyi bul
const findNearestBranch = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ 
                success: false,
                message: 'Enlem ve boylam bilgileri gereklidir' 
            });
        }

        // Tüm şubeleri getir
        const [branches] = await db.pool.query(`
            SELECT b.*, 
                   COUNT(DISTINCT c.id) as course_count,
                   COUNT(DISTINCT t.id) as teacher_count
            FROM branches b
            LEFT JOIN courses c ON b.id = c.branch_id AND c.status = 'active'
            LEFT JOIN teachers t ON b.id = t.branch_id
            GROUP BY b.id
        `);

        if (branches.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Hiç şube bulunamadı' 
            });
        }

        // Her şube için mesafeyi hesapla
        const branchesWithDistance = branches.map(branch => ({
            ...branch,
            distance: calculateDistance(
                latitude,
                longitude,
                branch.latitude,
                branch.longitude
            )
        }));

        // Mesafeye göre sırala
        const sortedBranches = branchesWithDistance.sort((a, b) => a.distance - b.distance);

        // En yakın şubeyi ve diğer şubeleri ayır
        const nearestBranch = sortedBranches[0];
        const otherBranches = sortedBranches.slice(1);

        res.json({
            success: true,
            nearestBranch,
            allBranches: sortedBranches
        });

    } catch (error) {
        console.error('Error finding nearest branch:', error);
        res.status(500).json({ 
            success: false,
            message: 'En yakın şube bulunurken bir hata oluştu' 
        });
    }
};

// Şubenin kurslarını getir
const getBranchCourses = async (req, res) => {
    const { branchId } = req.params;

    try {
        const [courses] = await db.pool.query(`
            SELECT *, max_students FROM courses 
            WHERE branch_id = ? AND status = 'active'
        `, [branchId]);

        res.json(courses);
    } catch (error) {
        console.error('Kurslar getirilemedi:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

// Kurs arama fonksiyonu
const searchCourses = async (req, res) => {
    try {
        const { language, day, time } = req.query;
        let query = `
            SELECT 
                c.*,
                b.name as branch_name,
                b.address as branch_address,
                CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
                cl.name as classroom_name,
                c.max_students
            FROM courses c
            JOIN branches b ON c.branch_id = b.id
            JOIN teachers t ON c.teacher_id = t.id
            JOIN users u ON t.user_id = u.id
            LEFT JOIN classrooms cl ON c.classroom_id = cl.id
            WHERE c.is_active = 1
        `;

        const params = [];

        if (language) {
            query += ' AND c.language = ?';
            params.push(language);
        }

        if (day) {
            query += ' AND JSON_EXTRACT(c.schedule, "$.day") = ?';
            params.push(day);
        }

        if (time) {
            query += ' AND JSON_EXTRACT(c.schedule, "$.time") = ?';
            params.push(time);
        }

        const [courses] = await db.pool.query(query, params);

        if (courses.length === 0) {
            return res.status(404).json({ error: 'Kurs bulunamadı' });
        }

        // Schedule'ı JSON olarak parse et
        const formattedCourses = courses.map(course => ({
            ...course,
            schedule: JSON.parse(course.schedule)
        }));

        res.json({
            success: true,
            courses: formattedCourses
        });
    } catch (error) {
        console.error('Kurs arama hatası:', error);
        res.status(500).json({ error: 'Kurs arama sırasında bir hata oluştu' });
    }
};

module.exports = {
    getAllBranches,
    createBranch,
    updateBranch,
    deleteBranch,
    findNearestBranch,
    getBranchCourses,
    searchCourses
}; 