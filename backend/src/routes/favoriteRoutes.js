const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');

// Favoriye ekle
router.post('/', async (req, res) => {
  try {
    console.log('❤️ Favori ekleme isteği:', req.body);
    
    const { user_id, title, channel_title, thumbnail_url, video_id, youtubeUrl } = req.body;
    
    // Favori zaten var mı kontrol et
    const existingFavorite = await Favorite.findOne({
      where: { 
        user_id: user_id,
        video_id: video_id
      }
    });
    
    if (existingFavorite) {
      return res.status(400).json({ error: 'Bu müzik zaten favorilerinizde mevcut' });
    }
    
    const favorite = await Favorite.create({
      user_id,
      title,
      channel_title,
      thumbnail_url,
      video_id,
      youtubeUrl,
      created_at: new Date().toISOString()
    });
    
    console.log('✅ Favori eklendi:', favorite);
    res.json(favorite);
  } catch (error) {
    console.error('❌ Favori ekleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcının favorilerini getir
router.get('/user/:userId', async (req, res) => {
  try {
    console.log('🔍 Favori isteği - Token userId:', req.userId);
    console.log('🔍 Favori isteği - Param userId:', req.params.userId);
    console.log('🔍 Authorization header:', req.headers.authorization);
    
    // Token'dan gelen kullanıcı ID'si ile parametre ID'sini karşılaştır
    if (req.userId && req.userId !== req.params.userId) {
      console.log('❌ Yetkisiz erişim denemesi:', req.userId, '!=', req.params.userId);
      return res.status(403).json({ error: 'Bu kullanıcının favorilerine erişim yetkiniz yok' });
    }
    
    console.log('❤️ Favori listesi isteği:', req.params.userId);
    
    const favorites = await Favorite.findAll({
      where: { user_id: req.params.userId },
      order: [['created_at', 'DESC']]
    });
    
    console.log('✅ Favoriler getirildi:', favorites.length);
    res.json(favorites);
  } catch (error) {
    console.error('❌ Favori listesi hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Favoriden çıkar
router.delete('/:id', async (req, res) => {
  try {
    console.log('❌ Favori silme isteği:', req.params.id);
    console.log('🔍 Token userId:', req.userId);
    
    const favorite = await Favorite.findByPk(req.params.id);
    
    if (!favorite) {
      console.log('❌ Favori bulunamadı:', req.params.id);
      return res.status(404).json({ error: 'Favori bulunamadı' });
    }
    
    // Kullanıcı yetkisi kontrolü
    if (req.userId && req.userId !== favorite.user_id) {
      console.log('❌ Yetkisiz erişim:', req.userId, '!=', favorite.user_id);
      return res.status(403).json({ error: 'Bu favoriye erişim yetkiniz yok' });
    }
    
    await favorite.destroy();
    console.log('✅ Favori silindi');
    res.json({ message: 'Favori silindi' });
  } catch (error) {
    console.error('❌ Favori silme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
