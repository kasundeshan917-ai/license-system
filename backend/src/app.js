require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { limiter } = require('./middleware/rateLimiter');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', limiter);

// Routes
const authRoutes = require('./routes/auth');
const licenseRoutes = require('./routes/license');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/license', licenseRoutes);
app.use('/api/admin', adminRoutes);

// Serve static files from frontend folder
const frontendPath = path.join(__dirname, '../../frontend');
console.log('📁 Serving frontend from:', frontendPath);

app.use(express.static(frontendPath));

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});