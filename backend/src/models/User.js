const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create(username, email, password, role = 'user') {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, role) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, username, email, role, created_at`,
            [username, email, hashedPassword, role]
        );
        return result.rows[0];
    }

    static async findByEmail(email) {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async validatePassword(user, password) {
        return await bcrypt.compare(password, user.password_hash);
    }
}

module.exports = User;