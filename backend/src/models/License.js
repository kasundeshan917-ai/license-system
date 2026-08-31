const pool = require('../config/database');
const crypto = require('crypto');
const logger = require('../config/logger');
const { generateHWIDHash } = require('../services/hwidService');

class License {
    static generateKey() {
        const segments = [];
        for (let i = 0; i < 4; i++) {
            const segment = crypto.randomBytes(5)
                .toString('hex')
                .toUpperCase()
                .slice(0, 5);
            segments.push(segment);
        }
        return segments.join('-');
    }

    static async create(userId, duration = 365, maxActivations = 1) {
        const licenseKey = this.generateKey();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + duration);

        try {
            const result = await pool.query(
                `INSERT INTO licenses (license_key, user_id, expires_at, max_activations) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING id, license_key, expires_at, created_at, status`,
                [licenseKey, userId, expiresAt, maxActivations]
            );
            return result.rows[0];
        } catch (error) {
            logger.error('License creation error:', error);
            throw error;
        }
    }

    static async validate(key, hwid) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get license with user info
            const licenseResult = await client.query(
                `SELECT l.*, u.id as user_id, u.is_verified, u.subscription_tier 
                 FROM licenses l 
                 JOIN users u ON l.user_id = u.id 
                 WHERE l.license_key = $1`,
                [key]
            );

            if (licenseResult.rows.length === 0) {
                return { valid: false, message: 'License not found' };
            }

            const license = licenseResult.rows[0];

            // Check if user is verified
            if (!license.is_verified) {
                return { valid: false, message: 'User email not verified' };
            }

            // Check status
            if (license.status !== 'active') {
                return { valid: false, message: `License is ${license.status}` };
            }

            // Check expiration
            if (new Date(license.expires_at) < new Date()) {
                await client.query(
                    'UPDATE licenses SET status = $1 WHERE id = $2',
                    ['expired', license.id]
                );
                return { valid: false, message: 'License expired' };
            }

            // Hash the provided HWID for comparison
            const hashedHWID = generateHWIDHash(hwid);

            // Check HWID
            if (!license.hwid) {
                // First activation
                await client.query(
                    `UPDATE licenses 
                     SET hwid = $1, last_used = CURRENT_TIMESTAMP, 
                         activation_count = activation_count + 1 
                     WHERE id = $2`,
                    [hashedHWID, license.id]
                );
                await client.query('COMMIT');
                return { 
                    valid: true, 
                    message: 'License activated',
                    user: { id: license.user_id, tier: license.subscription_tier }
                };
            } else if (license.hwid === hashedHWID) {
                // Valid HWID
                await client.query(
                    `UPDATE licenses SET last_used = CURRENT_TIMESTAMP WHERE id = $1`,
                    [license.id]
                );
                await client.query('COMMIT');
                return { 
                    valid: true, 
                    message: 'License validated',
                    user: { id: license.user_id, tier: license.subscription_tier }
                };
            } else {
                // HWID mismatch
                await client.query('COMMIT');
                return { valid: false, message: 'HWID mismatch' };
            }
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('License validation error:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    static async getUserLicenses(userId) {
        try {
            const result = await pool.query(
                `SELECT id, license_key, status, hwid, activation_count, 
                        expires_at, created_at, last_used 
                 FROM licenses 
                 WHERE user_id = $1 
                 ORDER BY created_at DESC`,
                [userId]
            );
            return result.rows;
        } catch (error) {
            logger.error('Get user licenses error:', error);
            throw error;
        }
    }

    static async revoke(licenseKey, userId) {
        try {
            const result = await pool.query(
                `UPDATE licenses 
                 SET status = 'revoked' 
                 WHERE license_key = $1 AND user_id = $2 
                 RETURNING *`,
                [licenseKey, userId]
            );
            return result.rows[0];
        } catch (error) {
            logger.error('Revoke license error:', error);
            throw error;
        }
    }
}

module.exports = License;