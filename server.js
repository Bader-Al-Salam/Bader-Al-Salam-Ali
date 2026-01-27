const express = require('express');
const { Pool } = require('pg'); // مكتبة الاتصال بقاعدة بيانات PostgreSQL
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. إعدادات الوسيط (Middleware)
app.use(cors());
app.use(express.json());
// لجعل السيرفر يخدم ملفات الموقع (HTML, CSS, Images) الموجودة في نفس المجلد
app.use(express.static(__dirname)); 

// 2. إعداد الاتصال بقاعدة البيانات
// في السحابة (مثل Render) سيتم استخدام متغير البيئة DATABASE_URL تلقائياً
// في الكمبيوتر المحلي، إذا لم يوجد متغير، سيربط بقاعدة محلية (اختياري)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/halaqah',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// 3. تهيئة الجدول (يتأكد من وجوده وينشئه إذا لم يكن موجوداً)
async function initDb() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS records (
                id SERIAL PRIMARY KEY,         -- معرف تلقائي
                qwe TEXT,                      -- اسم الطالب
                asd INTEGER DEFAULT 0,         -- المقدار الرقمي
                asdText TEXT,                 -- نص المقدار
                unit TEXT,                    -- الوحدة (جزء، صفحة، إلخ)
                score INTEGER,                -- الدرجة
                zxc TEXT,                     -- التقييم (ممتاز، جيد...)
                nmk TEXT,                     -- الملاحظات
                frequency TEXT,               -- نوع المتابعة (يومي، شهري...)
                attr TEXT,                    -- الحضور/غياب
                likes INTEGER DEFAULT 0,      -- عدد الإعجابات
                uoi BIGINT,                   -- الطابع الزمني (Timestamp)
                type TEXT DEFAULT 'record'    -- نوع السجل (عادي أو فاصل)
            )
        `;
        await pool.query(createTableQuery);
        console.log('Database connected & table is ready.');
    } catch (err) {
        console.error('Error initializing database:', err.message);
    }
}

initDb();

// --- API Routes ---

// (1) جلب جميع السجلات
app.get('/api/records', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM records ORDER BY uoi DESC');
        res.json({ "message": "success", "data": result.rows });
    } catch (err) {
        console.error('Error fetching records:', err);
        res.status(500).json({ "error": err.message });
    }
});

// (2) إضافة سجل جديد
app.post('/api/records', async (req, res) => {
    try {
        const data = req.body;
        // استخدام الوقت الحالي إذا لم يرسله الموقع
        const timestamp = data.uoi || Date.now();
        
        const query = `
            INSERT INTO records (qwe, asd, asdText, unit, score, zxc, nmk, frequency, attr, likes, uoi, type) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
        `;
        
        const values = [
            data.qwe, data.asd, data.asdText, data.unit, data.score, data.zxc, 
            data.nmk, data.frequency, data.attr, 0, timestamp, data.type || 'record'
        ];

        const result = await pool.query(query, values);
        res.json({ "message": "success", "data": { id: result.rows[0].id } });
    } catch (err) {
        console.error('Error adding record:', err);
        res.status(500).json({ "error": err.message });
    }
});

// (3) تعديل سجل موجود
app.put('/api/records/:id', async (req, res) => {
    try {
        const data = req.body;
        const query = `
            UPDATE records 
            SET qwe=$1, asd=$2, asdText=$3, unit=$4, score=$5, zxc=$6, nmk=$7, frequency=$8, attr=$9, uoi=$10 
            WHERE id=$11
        `;
        
        const values = [
            data.qwe, data.asd, data.asdText, data.unit, data.score, data.zxc, 
            data.nmk, data.frequency, data.attr, data.uoi, req.params.id
        ];

        await pool.query(query, values);
        res.json({ "message": "success", "changes": 1 });
    } catch (err) {
        console.error('Error updating record:', err);
        res.status(500).json({ "error": err.message });
    }
});

// (4) حذف سجل
app.delete('/api/records/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM records WHERE id = $1', [req.params.id]);
        res.json({ "message": "deleted" });
    } catch (err) {
        console.error('Error deleting record:', err);
        res.status(500).json({ "error": err.message });
    }
});

// (5) زيادة الإعجاب (Like)
app.post('/api/records/:id/like', async (req, res) => {
    try {
        await pool.query('UPDATE records SET likes = likes + 1 WHERE id = $1', [req.params.id]);
        res.json({ "message": "liked" });
    } catch (err) {
        console.error('Error liking record:', err);
        res.status(500).json({ "error": err.message });
    }
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}`);
});
