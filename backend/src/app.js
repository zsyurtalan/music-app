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
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

// Middleware - JSON parsing önce olmalı
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Keycloak middleware
app.use(keycloak.middleware());

// Kullanıcı ID'sini token'dan çıkaran middleware
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      // JWT token'ı decode et (basit decode, production'da jwt library kullanın)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      req.userId = payload.sub; // Keycloak'ta kullanıcı ID'si 'sub' field'ında
      req.userEmail = payload.email;
      req.userName = payload.preferred_username;
    } catch (error) {
      console.error('❌ Token decode hatası:', error);
    }
  }
  next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/music', require('./routes/musicRoutes'));
app.use('/api/youtube', require('./routes/youtubeRoutes'));
app.use('/api/playlists', require('./routes/playlistRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));

// Ana route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Müzik Çalar API\'si çalışıyor!',
    version: '1.0.0'
  });
});

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Bir hata oluştu!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint bulunamadı!' 
  });
});

module.exports = app;