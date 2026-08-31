const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { auth } = require('../middleware/auth');

// Get all users (Admin only)
router.get('/users', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
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

// Create new user (Admin only)
router.post('/users', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        const { username, email, password, role } = req.body;
        
        // Check if user exists
        const existing = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
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
            [username, email, hashedPassword, role || 'user']
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user (Admin only)
router.delete('/users/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        const userId = parseInt(req.params.id);
        if (userId === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete yourself' });
        }
        
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;