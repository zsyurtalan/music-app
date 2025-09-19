const express = require('express');
const router = express.Router();
const { getMusicList, getUserMusicHistory } = require('../controllers/musicController');
const Music = require('../models/Music');

// Genel müzik listesi
router.get('/', getMusicList);

// Kullanıcının müzik geçmişi
router.get('/history/:userId', getUserMusicHistory);

// Son 5 arama geçmişini getir
router.get('/search-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const searchHistory = await Music.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 5,
      attributes: ['id', 'video_id', 'title', 'channel_title', 'thumbnail_url', 'youtube_url', 'created_at']
    });

    console.log('🔍 Arama geçmişi getirildi:', searchHistory.length, 'müzik');
    res.json(searchHistory);
  } catch (error) {
    console.error('❌ Arama geçmişi hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Müzik oluştur
router.post('/create', async (req, res) => {
  try {
    console.log('🎵 Müzik oluşturma isteği:', req.body);
    console.log('🔍 Token userId:', req.userId);
    
    const { video_id, title, channel_title, thumbnail_url, youtube_url, is_fav } = req.body;
    
    if (!video_id || !title) {
      return res.status(400).json({ error: 'video_id ve title gerekli' });
    }
    
    if (!req.userId) {
      return res.status(401).json({ error: 'Kullanıcı kimliği gerekli' });
    }
    
    // Müzik zaten var mı kontrol et (aynı kullanıcı için)
    const existingMusic = await Music.findOne({ 
      where: { 
        video_id: video_id,
        user_id: req.userId 
      } 
    });
    
    if (existingMusic) {
      // Müzik zaten varsa, favori durumunu güncelle
      await existingMusic.update({ is_fav: is_fav || false });
      console.log('✅ Mevcut müzik güncellendi:', existingMusic.id);
      return res.json(existingMusic);
    }
    
    // Yeni müzik oluştur
    const music = await Music.create({
      video_id,
      user_id: req.userId,
      title,
      channel_title: channel_title || null,
      thumbnail_url: thumbnail_url || null,
      youtube_url: youtube_url || null,
      is_fav: is_fav || false
    });
    
    console.log('✅ Yeni müzik oluşturuldu:', music.id);
    console.log('🔍 Müzik is_fav değeri:', music.is_fav);
    res.json(music);
  } catch (error) {
    console.error('❌ Müzik oluşturma hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Video ID ile müziği favori yap/çıkar
router.put('/toggle-favorite/:videoId', async (req, res) => {
  try {
    console.log('⭐ Video ID ile müzik favori toggle isteği:', req.params.videoId);
    console.log('🔍 Token userId:', req.userId);

    if (!req.userId) {
      return res.status(401).json({ error: 'Kullanıcı kimliği gerekli' });
    }

    const music = await Music.findOne({
      where: { 
        video_id: req.params.videoId,
        user_id: req.userId 
      }
    });

    if (!music) {
      console.log('❌ Müzik bulunamadı:', req.params.videoId);
      return res.status(404).json({ error: 'Müzik bulunamadı' });
    }

    // Favori durumunu tersine çevir
    const newFavoriteStatus = !music.is_fav;
    await music.update({ is_fav: newFavoriteStatus });

    console.log('✅ Müzik favori durumu güncellendi:', newFavoriteStatus);

    res.json({
      id: music.id,
      video_id: music.video_id,
      is_fav: newFavoriteStatus,
      message: newFavoriteStatus ? 'Müzik favorilere eklendi' : 'Müzik favorilerden çıkarıldı'
    });
  } catch (error) {
    console.error('❌ Favori toggle hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
