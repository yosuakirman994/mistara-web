const express = require('express');
const router = express.Router();

const getDb = require('../config/db');

// Authentication Middleware
const requireAuth = (req, res, next) => {
     if (req.session && req.session.user) {
          return next();
     }
     res.redirect('/login');
};

// Home Page
router.get('/', async (req, res) => {
     try {
          const db = await getDb();
          const rows = await db.all("SELECT * FROM schedules WHERE date >= date('now', 'localtime') ORDER BY date ASC, time ASC LIMIT 3");
          res.render('home', { title: 'Beranda', schedule: rows });
     } catch (err) {
          console.log("Database offline or error, falling back to empty schedule.", err);
          res.render('home', { title: 'Beranda', schedule: [] });
     }
});

// Schedule Page
router.get('/schedule', async (req, res) => {
     try {
          const db = await getDb();
          const rows = await db.all('SELECT * FROM schedules ORDER BY date ASC, time ASC');
          // Map binary formats or format dates if needed, but the current EJS handles JS Dates fine.
          res.render('schedule', { title: 'Jadwal Kegiatan', schedule: rows });
     } catch (err) {
          console.error("Database error on /schedule:", err);
          res.render('schedule', { title: 'Jadwal Kegiatan', schedule: [] });
     }
});

// Add Schedule Route (Protected)
router.post('/schedule/add', requireAuth, async (req, res) => {
     try {
          const db = await getDb();
          const { title, date, time, color } = req.body;
          await db.run(
               "INSERT INTO schedules (title, date, time, color) VALUES (?, ?, ?, ?)",
               [title, date, time, color || '#8B5A2B']
          );
          res.redirect('/schedule');
     } catch(err) {
          console.error("Database error on /schedule/add:", err);
          res.redirect('/schedule');
     }
});

// Edit Schedule Route (Protected)
router.post('/schedule/edit/:id', requireAuth, async (req, res) => {
     try {
          const db = await getDb();
          const { title, date, time, color } = req.body;
          await db.run(
               "UPDATE schedules SET title = ?, date = ?, time = ?, color = ? WHERE id = ?",
               [title, date, time, color || '#8B5A2B', req.params.id]
          );
          res.redirect('/schedule');
     } catch(err) {
          console.error("Database error on /schedule/edit:", err);
          res.redirect('/schedule');
     }
});

// Delete Schedule Route (Protected)
router.post('/schedule/delete/:id', requireAuth, async (req, res) => {
     try {
          const db = await getDb();
          await db.run("DELETE FROM schedules WHERE id = ?", [req.params.id]);
          res.redirect('/schedule');
     } catch(err) {
          console.error("Database error on /schedule/delete:", err);
          res.redirect('/schedule');
     }
});

// Profile Pages
router.get('/vision-mission', (req, res) => {
     res.render('vision', { title: 'Visi & Misi' });
});

router.get('/structure', (req, res) => {
     res.render('structure', { title: 'Struktur Organisasi' });
});

// Contact Page
router.get('/contact', (req, res) => {
     res.render('contact', { title: 'Hubungi Kami' });
});

// Attendance Redirect
router.get('/attendance', (req, res) => {
     const attendanceUrl = process.env.ATTENDANCE_URL || 'https://absensi.misdinarstclara.my.id/login.php';
     res.redirect(attendanceUrl);
});

// Authentication Routes
router.get('/login', (req, res) => {
     if (req.session.user) return res.redirect('/dashboard');
     res.render('login', { title: 'Login', error: null });
});

router.post('/login', async (req, res) => {
     try {
          const db = await getDb();
          const { email, password } = req.body;
          const users = await db.all('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
          
          if (users.length > 0) {
               const user = users[0];
               req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role };
               return res.redirect('/dashboard');
          }
          res.render('login', { title: 'Login', error: 'Email atau password salah.' });
     } catch (err) {
          console.error("Database error on /login:", err);
          res.render('login', { title: 'Login', error: 'Sedang ada gangguan koneksi database (Sistem Offline).' });
     }
});

router.get('/logout', (req, res) => {
     req.session.destroy();
     res.redirect('/login');
});

// Protected Dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
     try {
          const db = await getDb();
          const row = await db.get("SELECT COUNT(*) as count FROM schedules WHERE date >= date('now', 'localtime')");
          res.render('dashboard', { title: 'Dashboard', user: req.session.user, scheduleCount: row.count });
     } catch(err) {
          res.render('dashboard', { title: 'Dashboard', user: req.session.user, scheduleCount: 0 });
     }
});

module.exports = router;
