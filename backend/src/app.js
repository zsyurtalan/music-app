const express = require('express');
const cors = require('cors');
const path = require('path');
const { keycloak, memoryStore } = require('./middleware/keycloak');
const session = require('express-session');
require('dotenv').config();

const app = express();

// CORS ayarları
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

// Keycloak middleware
app.use(keycloak.middleware());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/music', require('./routes/musicRoutes'));
app.use('/api/youtube', require('./routes/youtubeRoutes'));

// Keycloak korumalı route
app.get('/api/user', keycloak.protect(), (req, res) => {
  try {
    res.json({
      user: req.kauth.grant.access_token.content.preferred_username,
      email: req.kauth.grant.access_token.content.email
    });
  } catch (error) {
    console.error('❌ User profile error:', error);
    res.status(500).json({ error: 'User profile alınamadı' });
  }
});

module.exports = app;