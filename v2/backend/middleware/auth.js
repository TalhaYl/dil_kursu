const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Yetkilendirme token\'ı gerekli' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token doğrulama hatası:', error);
        return res.status(401).json({ error: 'Geçersiz token' });
    }
};

// Rol bazlı yetkilendirme middleware'i
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Yetkilendirme gerekli' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
        }
        
        next();
    };
};

module.exports = {
    verifyToken,
    checkRole
}; 