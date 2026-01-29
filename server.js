const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // لتقديم ملف index.html

// إعداد الاتصال
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// دالة تهيئة القاعدة
async function initDb() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS records (
                id SERIAL PRIMARY KEY,
                qwe TEXT,
                asd INTEGER DEFAULT 0,
                asdText TEXT,
                unit TEXT,
                score INTEGER,
                zxc TEXT,
                nmk TEXT,
                frequency TEXT,
                attr TEXT,
                likes INTEGER DEFAULT 0,
                uoi BIGINT,
                type TEXT DEFAULT 'record'
            )
        `);
        console.log('Database connected & table is ready.');
    } catch (err) {
        console.error('Error initializing database:', err.message);
        throw err; // إيقاف السيرفر إذا فشلت القاعدة
    }
}

// API Routes (نفس الأكواد الموجودة لديك)
app.get('/api/records', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM records ORDER BY uoi DESC');
        res.json({ "message": "success", "data": result.rows });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

app.post('/api/records', async (req, res) => {
    try {
        const data = req.body;
        const timestamp = data.uoi || Date.now();
        // التأكد من وجود unit لعدم حدوث أخطاء
        const unitValue = data.unit || (data.frequency === 'monthly' ? 'جزء' : 'صفحة');

        const query = `
            INSERT INTO records (qwe, asd, asdText, unit, score, zxc, nmk, frequency, attr, likes, uoi, type) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
        `;
        
        const values = [
            data.qwe, data.asd, data.asdText, unitValue, data.score, data.zxc, 
            data.nmk, data.frequency, data.attr, 0, timestamp, data.type || 'record'
        ];

        const result = await pool.query(query, values);
        res.json({ "message": "success", "data": { id: result.rows[0].id } });
    } catch (err) {
        console.error('Error adding record:', err);
        res.status(500).json({ "error": err.message });
    }
});

app.put('/api/records/:id', async (req, res) => {
    try {
        const data = req.body;
        const unitValue = data.unit || (data.frequency === 'monthly' ? 'جزء' : 'صفحة');
        
        const query = `
            UPDATE records 
            SET qwe=$1, asd=$2, asdText=$3, unit=$4, score=$5, zxc=$6, nmk=$7, frequency=$8, attr=$9, uoi=$10 
            WHERE id=$11
        `;
        
        const values = [
            data.qwe, data.asd, data.asdText, unitValue, data.score, data.zxc, 
            data.nmk, data.frequency, data.attr, data.uoi, req.params.id
        ];

        await pool.query(query, values);
        res.json({ "message": "success" });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

app.delete('/api/records/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM records WHERE id = $1', [req.params.id]);
        res.json({ "message": "deleted" });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

app.post('/api/records/:id/like', async (req, res) => {
    try {
        await pool.query('UPDATE records SET likes = likes + 1 WHERE id = $1', [req.params.id]);
        res.json({ "message": "liked" });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// تشغيل السيرفر
(async () => {
    await initDb();
    app.listen(PORT, () => {
        console.log(`Server is running successfully on port ${PORT}`);
    });
})();
