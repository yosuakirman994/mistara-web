const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let dbInstance = null;

async function getDb() {
    if (dbInstance) return dbInstance;
    
    try {
        dbInstance = await open({
            filename: path.join(__dirname, '../mistara.sqlite'),
            driver: sqlite3.Database
        });

        // Auto-setup database tables
        await dbInstance.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT DEFAULT 'Pengurus',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                color TEXT DEFAULT '#8B5A2B',
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Seed default Admin if not exists
        const adminEmail = 'admin@mistara.id';
        const row = await dbInstance.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
        if (!row) {
            await dbInstance.run(
                'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
                [adminEmail, 'MistaraAdmin2026', 'Ketua Misdinar', 'Admin']
            );
            console.log('Seeded default admin user for SQLite.');
        }

        return dbInstance;
    } catch (err) {
        console.error("SQLite initialization error:", err);
        throw err;
    }
}

module.exports = getDb;
