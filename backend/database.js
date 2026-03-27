const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Supabase connection
});

// ── Smart Bridge for SQLite Routes ──
const convertQuery = (sql) => {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
};

const db = {
  all: (sql, params, cb) => {
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(convertQuery(sql), params, (err, res) => cb(err, res ? res.rows : null));
  },
  get: (sql, params, cb) => {
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(convertQuery(sql), params, (err, res) => cb(err, res ? res.rows[0] : null));
  },
  run: function(sql, params, cb) {
    if (typeof params === 'function') { cb = params; params = []; }
    let query = convertQuery(sql);
    
    // Automatically capture the newly generated ID for INSERT statements
    if (query.trim().toUpperCase().startsWith('INSERT') && !query.toUpperCase().includes('RETURNING')) {
      query += ' RETURNING id';
    }
    
    pool.query(query, params, (err, res) => {
      const context = { lastID: res?.rows?.[0]?.id };
      if (cb) cb.call(context, err);
    });
  },
  serialize: (cb) => {
    // In Postgres pool, we don't need to manually serialize.
    cb();
  }
};

// ── Database Initialization (PostgreSQL Schema) ──
const initDB = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS employees (
            id SERIAL PRIMARY KEY,
            name TEXT, department TEXT, contact_number TEXT, relative_contact_number TEXT,
            address TEXT, date_of_birth TEXT, passport_number TEXT, passport_issue TEXT,
            passport_expiry TEXT, visa_number TEXT, visa_issue TEXT, visa_expiry TEXT,
            insurance_provider TEXT, insurance_number TEXT, insurance_expiry TEXT,
            medical_status TEXT, medical_expiry TEXT, custom_fields TEXT, files TEXT,
            photo TEXT, documents TEXT
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS company_documents (
            id SERIAL PRIMARY KEY,
            company_name TEXT, trade_license TEXT, vat_details TEXT, audit_reports TEXT,
            category TEXT, legal_docs TEXT, custom_fields TEXT, files TEXT,
            documents TEXT, photo TEXT
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS vehicles (
            id SERIAL PRIMARY KEY,
            vehicle_number TEXT, vehicle_type TEXT, mulkiya_number TEXT, mulkiya_expiry TEXT,
            insurance_number TEXT, insurance_start TEXT, insurance_expiry TEXT,
            driver_name TEXT, driver_phone TEXT, custom_fields TEXT, files TEXT,
            documents TEXT, photo TEXT
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS alert_logs (
            id SERIAL PRIMARY KEY,
            entity_type TEXT, entity_id INTEGER, entity_name TEXT, alert_field TEXT,
            expiry_date TEXT, status TEXT, notified_at TEXT
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS cheques_v2 (
            id SERIAL PRIMARY KEY,
            received_date TEXT, name TEXT NOT NULL, cheque_date TEXT, amount NUMERIC,
            custodian TEXT, deposit_date TEXT, deposited_bank TEXT,
            status TEXT DEFAULT 'Pending', remark TEXT, cheque_image TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Seed default admin
        const userRes = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
        if (userRes.rowCount === 0) {
            const hash = bcrypt.hashSync('admin123', 8);
            await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['admin', hash]);
        }

    } catch (err) {
        console.error("Database Migration Schema Error:", err.message);
    }
};

initDB();

module.exports = db;
