const jwt = require('jsonwebtoken');
const redis = require('../config/redis');
const logger = require('../config/logger');

const auth = async (req, res, next) => {
    try {
        const token = req.header('x-auth-token');
        
        if (!token) {
            return res.status(401).json({ 
                error: 'No token, authorization denied' 
            });
        }

        // Check if token is blacklisted
        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
            return res.status(401).json({ 
                error: 'Token revoked' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        logger.warn('Auth error:', error.message);
        return res.status(401).json({ 
            error: 'Token is not valid' 
        });
    }
};

const adminAuth = async (req, res, next) => {
    await auth(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                error: 'Admin access required' 
            });
        }
        next();
    });
};

module.exports = { auth, adminAuth };