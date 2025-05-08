const mysql = require('mysql2');
require('dotenv').config();

// Veritabanı bağlantı havuzu oluştur
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'talha2002',
    database: process.env.DB_NAME || 'dilkursu',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Veritabanı bağlantısını test et
const checkDbConnection = async () => {
    try {
        const connection = await pool.promise().getConnection();
        console.log('MySQL bağlantısı başarılı');
        connection.release();
        return true;
    } catch (error) {
        console.error('Veritabanı bağlantı hatası:', error);
        return false;
    }
};

// Veritabanını kontrol et
checkDbConnection().catch(console.error);

// Promise tabanlı havuzu diğer modüllerde kullanmak için dışa aktar
module.exports = pool.promise();