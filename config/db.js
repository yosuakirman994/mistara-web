const mysql = require('mysql2/promise');

let pool = null;

async function getDb() {
    if (pool) return pool;
    
    try {
        // Create a connection pool using environment variables
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'misdinar_st_clara',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Auto-setup database tables for MySQL
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(100) DEFAULT 'Pengurus',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS schedules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                time TIME NOT NULL,
                color VARCHAR(50) DEFAULT '#8B5A2B',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS members (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                attendance_score INT DEFAULT 100,
                behavior_score INT DEFAULT 100,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS rosters (
                id INT AUTO_INCREMENT PRIMARY KEY,
                week_start DATE NOT NULL,
                schedule_data JSON NOT NULL,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Seed default Admin if not exists
        const adminEmail = 'admin@mistara.id';
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [adminEmail]);
        if (rows.length === 0) {
            await pool.query(
                'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
                [adminEmail, 'MistaraAdmin2026', 'Ketua Misdinar', 'Admin']
            );
            console.log('Seeded default admin user for MySQL.');
        }

        return pool;
    } catch (err) {
        console.error("MySQL initialization error:", err);
        throw err;
    }
}

module.exports = getDb;
