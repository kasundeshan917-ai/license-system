const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/.netlify/functions/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        message: 'API is working!',
        timestamp: new Date().toISOString()
    });
});

// Test route
app.get('/.netlify/functions/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Test route is working!' 
    });
});

// Test POST
app.post('/.netlify/functions/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'POST test is working!',
        data: req.body 
    });
});

// Export
exports.handler = serverless(app);