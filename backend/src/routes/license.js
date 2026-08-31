const express = require('express');
const router = express.Router();
const License = require('../models/License');

// Generate license
router.post('/generate', async (req, res) => {
    try {
        // Get token from header
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const license = await License.create(userId);
        res.status(201).json({ 
            success: true, 
            license_key: license.license_key,
            expires_at: license.expires_at
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Validate license (public)
router.post('/validate', async (req, res) => {
    try {
        const { license_key, hwid } = req.body;
        if (!license_key || !hwid) {
            return res.status(400).json({ 
                success: false, 
                message: 'License key and HWID required' 
            });
        }

        const result = await License.validate(license_key, hwid);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user's licenses
router.get('/my-licenses', async (req, res) => {
    try {
        // Get token from header
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const licenses = await License.getUserLicenses(userId);
        res.json(licenses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Revoke license
router.post('/revoke', async (req, res) => {
    try {
        const { license_key } = req.body;
        
        // Get token from header
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const license = await License.revoke(license_key, userId);
        if (!license) {
            return res.status(404).json({ message: 'License not found' });
        }
        res.json({ success: true, message: 'License revoked' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;