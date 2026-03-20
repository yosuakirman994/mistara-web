const express = require('express');
const router = express.Router();
const getDb = require('../config/db');

// Middleware untuk membatasi akses hanya untuk Pengurus dan Admin
const requireAdminOrPengurus = (req, res, next) => {
    if (req.session && req.session.user && (req.session.user.role === 'Admin' || req.session.user.role === 'Pengurus')) {
         return next();
    }
    res.redirect('/dashboard');
};

router.use(requireAdminOrPengurus);

// Tampilkan halaman roster dan anggota
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const [members] = await db.query("SELECT * FROM members ORDER BY name ASC");
        const [rosters] = await db.query("SELECT * FROM rosters ORDER BY created_at DESC LIMIT 10");
        res.render('roster', { title: 'Sistem Jadwal Pintar', user: req.session.user, members, rosters });
    } catch(err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// Tambah anggota anak misdinar
router.post('/members/add', async (req, res) => {
    try {
        const db = await getDb();
        const { name } = req.body;
        await db.query("INSERT INTO members (name) VALUES (?)", [name]);
        res.redirect('/roster');
    } catch(err) {
        console.error(err);
        res.redirect('/roster');
    }
});

// Update nilai (skor) anggota
router.post('/members/update/:id', async (req, res) => {
    try {
        const db = await getDb();
        let { attendance_score, behavior_score, is_active } = req.body;
        // Checkbox HTML sends 'on' if checked, nothing if unchecked
        const active = (is_active === 'on') ? 1 : 0;
        
        // Ensure scores don't exceed 100
        attendance_score = Math.min(100, Math.max(0, parseInt(attendance_score) || 0));
        behavior_score = Math.min(100, Math.max(0, parseInt(behavior_score) || 0));

        await db.query(
            "UPDATE members SET attendance_score = ?, behavior_score = ?, is_active = ? WHERE id = ?",
            [attendance_score, behavior_score, active, req.params.id]
        );
        res.redirect('/roster');
    } catch(err) {
        console.error(err);
        res.redirect('/roster');
    }
});

// Hapus anggota
router.post('/members/delete/:id', async (req, res) => {
    try {
        const db = await getDb();
        await db.query("DELETE FROM members WHERE id = ?", [req.params.id]);
        res.redirect('/roster');
    } catch(err) {
        console.error(err);
        res.redirect('/roster');
    }
});

// Algoritma Utama Penjadwalan
router.post('/generate', async (req, res) => {
    try {
        const db = await getDb();
        const { week_date } = req.body; // YYYY-MM-DD
        
        // 1. Ambil semua anak yang statusnya "Aktif"
        const [members] = await db.query("SELECT * FROM members WHERE is_active = 1");
        
        if (members.length === 0) {
            return res.status(400).send("Tidak ada anggota aktif untuk dijadwalkan! Tambahkan anggota dulu.");
        }

        // 2. Sesuai aturan: Anak yang kehadirannya (absensi) di bawah 50%, TIDAK MENDAPATKAN TUGAS
        const eligibleMembers = members.filter(m => m.attendance_score >= 50);
        
        if (eligibleMembers.length === 0) {
            return res.status(400).send("Tidak ada anak yang memenuhi standar kehadiran minimum (>50%) untuk bertugas minggu ini.");
        }

        // 3. Fungsi Acak (Fisher-Yates Shuffle)
        const shuffle = (array) => {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        };

        // 4. Kita pisahkan anak bintang (rata-rata nilai > 85) untuk diberi prioritas tugas
        const starKids = eligibleMembers.filter(m => m.behavior_score >= 85);
        const normalKids = eligibleMembers.filter(m => m.behavior_score < 85);

        // Gabungkan kumpulan pool acak: anak bintang di urutan lebih atas sehingga kesempatan terpilih lebih besar
        let pool = [...shuffle(starKids), ...shuffle(normalKids)];
        
        // Daftar 4 Misa Standar beserta Kapasitas Pasti
        const shifts = [
            { name: "Sabtu Sore (17:00)", kids: [], capacity: 10 },
            { name: "Minggu Pagi 1 (06:00)", kids: [], capacity: 10 },
            { name: "Minggu Pagi 2 (09:00)", kids: [], capacity: 12 },
            { name: "Minggu Sore (17:00)", kids: [], capacity: 10 }
        ];

        let poolIndex = 0;

        // Distribusi
        for (let shift of shifts) {
            for (let i = 0; i < shift.capacity; i++) {
                if (poolIndex >= pool.length) {
                    // Jika anak habis, kita ulang kumpulan secara acak penuh (akan ada anak tugas 2x minggu tsb)
                    pool = shuffle(eligibleMembers);
                    poolIndex = 0;
                }
                shift.kids.push(pool[poolIndex].name);
                poolIndex++;
            }
        }

        // Simpan Hasil JSON ke Database MySQL
        const scheduleData = JSON.stringify(shifts);

        await db.query(
            "INSERT INTO rosters (week_start, schedule_data, created_by) VALUES (?, ?, ?)",
            [week_date || new Date().toISOString().split('T')[0], scheduleData, req.session.user.id]
        );

        res.redirect('/roster');

    } catch(err) {
        console.error(err);
        res.redirect('/roster');
    }
});

router.post('/delete/:id', async (req, res) => {
    try {
        const db = await getDb();
        await db.query("DELETE FROM rosters WHERE id = ?", [req.params.id]);
        res.redirect('/roster');
    } catch(err) {
        console.error(err);
        res.redirect('/roster');
    }
});

module.exports = router;
