const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const Favorite = require('../models/Favorite');

// Playlist oluştur
router.post('/', async (req, res) => {
  try {
    const { user_id, name, description, is_public } = req.body;
    const playlist = await Playlist.create({
      user_id,
      name,
      description,
      is_public: is_public || false,
      videos: []
    });
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcının playlistlerini getir
router.get('/user/:userId', async (req, res) => {
  try {
    console.log('🔍 Playlist isteği - Token userId:', req.userId);
    console.log('🔍 Playlist isteği - Param userId:', req.params.userId);
    console.log('🔍 Authorization header:', req.headers.authorization);
    
    // Token'dan gelen kullanıcı ID'si ile parametre ID'sini karşılaştır
    if (req.userId && req.userId !== req.params.userId) {
      console.log('❌ Yetkisiz erişim denemesi:', req.userId, '!=', req.params.userId);
      return res.status(403).json({ error: 'Bu kullanıcının playlistlerine erişim yetkiniz yok' });
    }
    
    const playlists = await Playlist.findAll({
      where: { user_id: req.params.userId }
    });
    
    console.log('✅ Playlist\'ler getirildi:', playlists.length, 'adet');
    res.json(playlists);
  } catch (error) {
    console.error('❌ Playlist getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Playlist'e müzik ekle
router.put('/:id/add-music', async (req, res) => {
  try {
    console.log('🎵 Playlist\'e müzik ekleme isteği:', req.body);
    
    const { id, title, channelTitle, thumbnail, videoId, youtubeUrl } = req.body;
    const playlist = await Playlist.findByPk(req.params.id);
    
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist bulunamadı' });
    }
    
    const videos = playlist.videos || [];
    
    // Müzik zaten var mı kontrol et
    const existingVideo = videos.find(video => video.videoId === videoId || video.id === id);
    if (existingVideo) {
      return res.status(400).json({ error: 'Bu müzik zaten playlist\'te mevcut' });
    }
    
    const newVideo = {
      id: id || videoId,
      videoId: videoId || id,
      title: title,
      channelTitle: channelTitle,
      thumbnail: thumbnail,
      youtubeUrl: youtubeUrl,
      addedAt: new Date().toISOString()
    };
    
    videos.push(newVideo);
    
    await playlist.update({ videos });
    console.log('✅ Müzik playlist\'e eklendi:', newVideo);
    res.json(playlist);
  } catch (error) {
    console.error('❌ Müzik ekleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Playlist'ten müzik çıkar
router.put('/:id/remove-music', async (req, res) => {
  try {
    const { videoId } = req.body;
    const playlist = await Playlist.findByPk(req.params.id);
    
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist bulunamadı' });
    }
    
    const videos = playlist.videos || [];
    const updatedVideos = videos.filter(video => video.videoId !== videoId);
    
    await playlist.update({ videos: updatedVideos });
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Playlist sil
router.delete('/:id', async (req, res) => {
  try {
    await Playlist.destroy({
      where: { id: req.params.id }
    });
    res.json({ message: 'Playlist silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
