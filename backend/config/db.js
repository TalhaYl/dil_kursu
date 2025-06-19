const mysql = require('mysql2/promise');
require('dotenv').config();

// Veritabanı bağlantı havuzu oluştur
const pool = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'your_database_name',
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Veritabanı bağlantısını test et
pool.getConnection()
    .then(connection => {
        console.log('Veritabanına başarıyla bağlandı');
        connection.release();
    })
    .catch(err => {
        console.error('Veritabanı bağlantı hatası:', err);
    });

// Transaction işlemleri için yardımcı fonksiyon
const executeTransaction = async (callback) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    pool,
    executeTransaction
};