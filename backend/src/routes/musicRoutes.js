const express = require('express');
const router = express.Router();
const { getMusicList, getUserMusicHistory } = require('../controllers/musicController');

// Genel müzik listesi
router.get('/', getMusicList);

// Kullanıcının müzik geçmişi
router.get('/history/:userId', getUserMusicHistory);

module.exports = router;
