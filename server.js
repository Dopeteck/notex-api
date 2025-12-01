// server.js - Main Express server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080; // CHANGED FROM 8080 TO 3000

// Add this right after const app = express();
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/json', limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

app.use(cors({
  origin: [
    'https://notex-app.web.app',  // Your Firebase domain
    'https://notex-7f567.web.app', // Alternative Firebase domain
    'http://localhost:3001'        // For local testing
  ],
  credentials: true
}));

// Root and health check routes (ONLY ONCE!)
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'NoteX API',
    timestamp: new Date().toISOString()
  });
});

// In server.js
app.get('/api/health-check', async (req, res) => {
  try {
    // Test database
    const dbResult = await db.query('SELECT NOW()');
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: dbResult.rows[0].now,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const path = require('path');
app.use('/files', express.static(path.join(process.env.FILES_DIR || '/data/files')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/users', require('./routes/users'));
app.use('/webhooks', require('./routes/webhooks'));
app.use('/api/referrals', require('./routes/referrals'));


// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NoteX API running on port ${PORT}`);
});

module.exports = app;