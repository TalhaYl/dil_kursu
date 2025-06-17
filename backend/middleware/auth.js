const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        console.log('Token bulunamadı');
        return res.status(401).json({ error: 'Yetkilendirme token\'ı gerekli' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log('Token doğrulandı. Kullanıcı bilgileri:', {
            id: req.user.id,
            role: req.user.role,
            email: req.user.email
        });
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
            console.log('Kullanıcı bilgisi bulunamadı');
            return res.status(401).json({ error: 'Yetkilendirme gerekli' });
        }
        
        console.log('Rol kontrolü yapılıyor:', {
            kullanıcıRolü: req.user.role,
            izinVerilenRoller: roles,
            kullanıcıBilgileri: req.user
        });
        
        if (!roles.includes(req.user.role)) {
            console.log('Yetki reddedildi. Kullanıcının rolü:', req.user.role);
            return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
        }
        
        console.log('Rol kontrolü başarılı');
        next();
    };
};

module.exports = {
    verifyToken,
    checkRole
}; 