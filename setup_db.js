const mysql = require('mysql2/promise');
require('dotenv').config();

async function setup() {
    try {
        console.log("Connecting to MySQL server...");
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || ''
        });

        const dbName = process.env.DB_NAME || 'misdinar_st_clara';

        console.log(`Creating database ${dbName} if it doesn't exist...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await connection.query(`USE \`${dbName}\``);

        console.log("Creating 'users' table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                role ENUM('Admin', 'Pengurus') DEFAULT 'Pengurus',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Creating 'schedules' table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS schedules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                time VARCHAR(50) NOT NULL,
                color VARCHAR(20) DEFAULT '#8B5A2B',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Seed default Admin
        const adminEmail = 'admin@mistara.id';
        const [users] = await connection.query(`SELECT * FROM users WHERE email = ?`, [adminEmail]);
        if (users.length === 0) {
            console.log("Seeding default Admin user...");
            // Non-hashed password for prototype explicitly requested by user to be simple, 
            // but in real app we'd use bcrypt.
            await connection.query(
                `INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`,
                [adminEmail, 'MistaraAdmin2026', 'Ketua Misdinar', 'Admin']
            );
            console.log(`Admin seeded: ${adminEmail} / MistaraAdmin2026`);
        } else {
            console.log("Admin user already exists.");
        }

        console.log("✅ Database Setup Completed Successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Database setup failed:", err.message);
        process.exit(1);
    }
}

setup();
