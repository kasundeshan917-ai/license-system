const express = require('express');
const serverless = require('serverless-http');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
//  DATABASE CONNECTION
// ============================================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL error:', err.message);
});

// ============================================================
//  HEALTH CHECK
// ============================================================
app.get('/.netlify/functions/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        message: 'API is working!'
    });
});

// ============================================================
//  AUTH ROUTES
// ============================================================

// REGISTER
app.post('/.netlify/functions/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user exists
        const existing = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email.toLowerCase(), username]
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, role) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, username, email, role, created_at`,
            [username, email.toLowerCase(), hashedPassword, 'user']
        );
        
        const user = result.rows[0];
        
        // Generate token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(201).json({ token, user });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// LOGIN
app.post('/.netlify/functions/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase()]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET CURRENT USER
app.get('/.netlify/functions/api/auth/me', async (req, res) => {
    try {
        const token = req.headers['x-auth-token'];
        if (!token) {
            return res.status(401).json({ message: 'No token' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const result = await pool.query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
            [decoded.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get user error:', err);
        res.status(401).json({ message: 'Invalid token' });
    }
});

// ============================================================
//  LICENSE ROUTES
// ============================================================

// GENERATE LICENSE
app.post('/.netlify/functions/api/license/generate', async (req, res) => {
    try {
        const token = req.headers['x-auth-token'];
        if (!token) {
            return res.status(401).json({ message: 'No token' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        // Generate license key
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let key = '';
        for (let i = 0; i < 20; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
            if (i % 5 === 4 && i < 19) key += '-';
        }
        
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        
        const result = await pool.query(
            `INSERT INTO licenses (license_key, user_id, expires_at) 
             VALUES ($1, $2, $3) 
             RETURNING license_key, expires_at, created_at`,
            [key, userId, expiresAt]
        );
        
        res.status(201).json({
            success: true,
            license_key: result.rows[0].license_key,
            expires_at: result.rows[0].expires_at
        });
    } catch (err) {
        console.error('Generate license error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET USER LICENSES
app.get('/.netlify/functions/api/license/my-licenses', async (req, res) => {
    try {
        const token = req.headers['x-auth-token'];
        if (!token) {
            return res.status(401).json({ message: 'No token' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        const result = await pool.query(
            `SELECT id, license_key, status, expires_at, created_at, last_used 
             FROM licenses 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('Get licenses error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================================
//  ADMIN ROUTES - USER MANAGEMENT
// ============================================================

// GET ALL USERS (Admin only)
app.get('/.netlify/functions/api/admin/users', async (req, res) => {
    try {
        const token = req.headers['x-auth-token'];
        if (!token) {
            return res.status(401).json({ message: 'No token' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        const result = await pool.query(
            'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// CREATE USER (Admin only)
app.post('/.netlify/functions/api/admin/users', async (req, res) => {
    try {
        const token = req.headers['x-auth-token'];
        if (!token) {
            return res.status(401).json({ message: 'No token' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        const { username, email, password, role } = req.body;
        
        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email and password are required' });
        }
        
        // Check if user exists
        const existing = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email.toLowerCase(), username]
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, role) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, username, email, role, created_at`,
            [username, email.toLowerCase(), hashedPassword, role || 'user']
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE USER (Admin only)
app.delete('/.netlify/functions/api/admin/users/:id', async (req, res) => {
    try {
        const token = req.headers['x-auth-token'];
        if (!token) {
            return res.status(401).json({ message: 'No token' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        const userId = parseInt(req.params.id);
        if (userId === decoded.id) {
            return res.status(400).json({ message: 'Cannot delete yourself' });
        }
        
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// UPDATE USER ROLE (Admin only)
app.put('/.netlify/functions/api/admin/users/:id/role', async (req, res) => {
    try {
        const token = req.headers['x-auth-token'];
        if (!token) {
            return res.status(401).json({ message: 'No token' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        const userId = parseInt(req.params.id);
        const { role } = req.body;
        
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        
        if (userId === decoded.id) {
            return res.status(400).json({ message: 'Cannot change your own role' });
        }
        
        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role',
            [role, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update user role error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================================
//  EXPORT
// ============================================================
exports.handler = serverless(app);