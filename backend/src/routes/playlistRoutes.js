const express = require('express');
const router = express.Router();
// İlişkileri yükle
const { Playlist, Music, PlaylistMusic } = require('../models/associations');

// Test endpoint
router.get('/test', (req, res) => {
  console.log('🧪 Test endpoint çağrıldı!');
  console.log('🧪 Test endpoint çağrıldı!');
  console.log('🧪 Test endpoint çağrıldı!');
  console.log('🧪 Test endpoint çağrıldı!');
  console.log('🧪 Test endpoint çağrıldı!');
  res.json({ message: 'Test endpoint çalışıyor!', timestamp: new Date().toISOString() });
});

// Tüm playlist'leri getir (test için)
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Tüm playlist\'ler isteniyor');
    const playlists = await Playlist.findAll({
      include: [{
        model: Music,
        as: 'musics',
        through: {
          attributes: ['added_at', 'order_index']
        }
      }]
    });
    
    console.log('✅ Playlist\'ler getirildi:', playlists.length, 'adet');
    res.json(playlists);
  } catch (error) {
    console.error('❌ Playlist getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Playlist oluştur
router.post('/', async (req, res) => {
  try {
    console.log('🔄 Yeni playlist oluşturuluyor:', req.body);
    console.log('🔍 Token userId:', req.userId);
    
    const { user_id, name, description, is_public, is_fav } = req.body;
    
    if (!user_id || !name) {
      console.log('❌ Eksik parametreler:', { user_id, name });
      return res.status(400).json({ error: 'user_id ve name gerekli' });
    }
    
    const playlist = await Playlist.create({
      user_id,
      name,
      description: description || '',
      is_public: is_public || false,
      is_fav: is_fav || false
    });
    
    console.log('✅ Playlist oluşturuldu:', playlist.id);
    res.json(playlist);
  } catch (error) {
    console.error('❌ Playlist oluşturma hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcının playlistlerini getir
router.get('/user/:userId', async (req, res) => {
  try {
    console.log('🔍 Playlist isteği - Token userId:', req.userId);
    console.log('🔍 Playlist isteği - Param userId:', req.params.userId);
    
    // Token'dan gelen kullanıcı ID'si ile parametre ID'sini karşılaştır
    if (req.userId && req.userId !== req.params.userId) {
      console.log('❌ Yetkisiz erişim denemesi:', req.userId, '!=', req.params.userId);
      return res.status(403).json({ error: 'Bu kullanıcının playlistlerine erişim yetkiniz yok' });
    }
    
    const playlists = await Playlist.findAll({
      where: { user_id: req.params.userId },
      include: [{
        model: Music,
        as: 'musics',
        through: {
          attributes: ['added_at', 'order_index']
        }
      }]
    });
    
    console.log('✅ Playlist\'ler getirildi:', playlists.length, 'adet');
    res.json(playlists);
  } catch (error) {
    console.error('❌ Playlist getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Video ID ile müzik bul
router.get('/find-music/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    console.log('🔍 Müzik aranıyor:', videoId);
    
    const music = await Music.findOne({
      where: { video_id: videoId }
    });
    
    if (!music) {
      return res.status(404).json({ error: 'Müzik bulunamadı' });
    }
    
    console.log('✅ Müzik bulundu:', music.id);
    res.json(music);
  } catch (error) {
    console.error('❌ Müzik arama hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcının favori müziklerini getir
router.get('/user/:userId/favorite-musics', async (req, res) => {
  try {
    console.log('🔍 Favori müzik isteği - Token userId:', req.userId);
    console.log('🔍 Favori müzik isteği - Param userId:', req.params.userId);
    
    // Token'dan gelen kullanıcı ID'si ile parametre ID'sini karşılaştır
    if (req.userId && req.userId !== req.params.userId) {
      console.log('❌ Yetkisiz erişim denemesi:', req.userId, '!=', req.params.userId);
      return res.status(403).json({ error: 'Bu kullanıcının favori müziklerine erişim yetkiniz yok' });
    }

    const musics = await Music.findAll({
      where: {
        is_fav: true,
        user_id: req.params.userId
      },
      order: [['created_at', 'DESC']]
    });

    console.log('✅ Favori müzikler getirildi:', musics.length, 'adet');
    res.json(musics);
  } catch (error) {
    console.error('❌ Favori müzik getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcının favori playlistlerini getir
router.get('/user/:userId/favorites', async (req, res) => {
  try {
    console.log('🔍 Favori playlist isteği - Token userId:', req.userId);
    console.log('🔍 Favori playlist isteği - Param userId:', req.params.userId);
    
    // Token'dan gelen kullanıcı ID'si ile parametre ID'sini karşılaştır
    if (req.userId && req.userId !== req.params.userId) {
      console.log('❌ Yetkisiz erişim denemesi:', req.userId, '!=', req.params.userId);
      return res.status(403).json({ error: 'Bu kullanıcının favori playlistlerine erişim yetkiniz yok' });
    }
    
    const playlists = await Playlist.findAll({
      where: { 
        user_id: req.params.userId,
        is_fav: true
      },
      include: [{
        model: Music,
        as: 'musics',
        through: {
          attributes: ['added_at', 'order_index']
        }
      }]
    });
    
    console.log('✅ Favori playlist\'ler getirildi:', playlists.length, 'adet');
    res.json(playlists);
  } catch (error) {
    console.error('❌ Favori playlist getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Playlist'e müzik ekle
router.put('/:id/add-music', async (req, res) => {
  try {
    console.log('🎵 Playlist\'e müzik ekleme isteği:', req.body);
    console.log('🔍 Playlist ID:', req.params.id);
    
    const { id, title, channelTitle, thumbnail, videoId, youtubeUrl } = req.body;
    
    if (!videoId || !title) {
      return res.status(400).json({ error: 'videoId ve title gerekli' });
    }
    
    const playlist = await Playlist.findByPk(req.params.id);
    
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist bulunamadı' });
    }
    
    // Kullanıcı yetkisi kontrolü
    if (req.userId && req.userId !== playlist.user_id) {
      console.log('❌ Yetkisiz erişim:', req.userId, '!=', playlist.user_id);
      return res.status(403).json({ error: 'Bu playlist\'e erişim yetkiniz yok' });
    }
    
    // Müziği bul veya oluştur (kullanıcıya özgü)
    let music = await Music.findOne({ 
      where: { 
        video_id: videoId,
        user_id: req.userId || req.body.user_id
      } 
    });
    
    if (!music) {
      music = await Music.create({
        video_id: videoId,
        user_id: req.userId || req.body.user_id,
        title: title,
        channel_title: channelTitle,
        thumbnail_url: thumbnail,
        youtube_url: youtubeUrl,
        is_fav: false
      });
      console.log('✅ Yeni müzik oluşturuldu:', music.id);
    } else {
      console.log('✅ Mevcut müzik bulundu:', music.id);
    }
    
    // Playlist'e müzik ekle (junction table)
    const [playlistMusic, created] = await PlaylistMusic.findOrCreate({
      where: {
        playlist_id: playlist.id,
        music_id: music.id
      },
      defaults: {
        added_at: new Date(),
        order_index: 0
      }
    });
    
    if (!created) {
      console.log('⚠️ Müzik zaten playlist\'te mevcut');
      return res.status(400).json({ error: 'Bu müzik zaten playlist\'te mevcut' });
    }
    
    console.log('✅ Müzik playlist\'e eklendi');
    
    // Güncellenmiş playlist'i getir (müziklerle birlikte)
    const updatedPlaylist = await Playlist.findByPk(playlist.id, {
      include: [{
        model: Music,
        as: 'musics',
        through: {
          attributes: ['added_at', 'order_index']
        }
      }]
    });
    
    res.json(updatedPlaylist);
  } catch (error) {
    console.error('❌ Müzik ekleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Playlist'ten müzik çıkar
router.put('/:id/remove-music', async (req, res) => {
  try {
    console.log('🔄 Müzik çıkarma isteği:', req.params.id, req.body);
    
    const { videoId } = req.body;
    
    if (!videoId) {
      return res.status(400).json({ error: 'videoId gerekli' });
    }
    
    const playlist = await Playlist.findByPk(req.params.id);
    
    if (!playlist) {
      console.log('❌ Playlist bulunamadı:', req.params.id);
      return res.status(404).json({ error: 'Playlist bulunamadı' });
    }
    
    // Kullanıcı yetkisi kontrolü
    if (req.userId && req.userId !== playlist.user_id) {
      console.log('❌ Yetkisiz erişim:', req.userId, '!=', playlist.user_id);
      return res.status(403).json({ error: 'Bu playlist\'e erişim yetkiniz yok' });
    }
    
    // Müziği bul
    const music = await Music.findOne({ where: { video_id: videoId } });
    
    if (!music) {
      return res.status(404).json({ error: 'Müzik bulunamadı' });
    }
    
    // Junction table'dan sil
    const deleted = await PlaylistMusic.destroy({
      where: {
        playlist_id: playlist.id,
        music_id: music.id
      }
    });
    
    if (deleted === 0) {
      return res.status(404).json({ error: 'Müzik playlist\'te bulunamadı' });
    }
    
    console.log('✅ Müzik playlist\'ten çıkarıldı:', videoId);
    
    // Müziğin başka playlist'lerde olup olmadığını kontrol et
    const remainingPlaylists = await PlaylistMusic.count({
      where: {
        music_id: music.id
      }
    });
    
    // Eğer müzik hiçbir playlist'te yoksa, müziği tamamen sil
    if (remainingPlaylists === 0) {
      await Music.destroy({
        where: {
          id: music.id
        }
      });
      console.log('✅ Müzik tamamen silindi (hiçbir playlist\'te yok):', videoId);
    } else {
      console.log('✅ Müzik korundu (başka playlist\'lerde mevcut):', videoId);
    }
    
    // Güncellenmiş playlist'i getir (müziklerle birlikte)
    const updatedPlaylist = await Playlist.findByPk(playlist.id, {
      include: [{
        model: Music,
        as: 'musics',
        through: {
          attributes: ['added_at', 'order_index']
        }
      }]
    });
    
    res.json(updatedPlaylist);
  } catch (error) {
    console.error('❌ Müzik çıkarma hatası:', error);
    res.status(500).json({ error: error.message });
  }
});


// Müziği favori yap/çıkar
router.put('/music/:musicId/toggle-favorite', async (req, res) => {
  try {
    console.log('⭐ Müzik favori toggle isteği:', req.params.musicId);
    console.log('🔍 Token userId:', req.userId);

    const music = await Music.findByPk(req.params.musicId);

    if (!music) {
      console.log('❌ Müzik bulunamadı:', req.params.musicId);
      return res.status(404).json({ error: 'Müzik bulunamadı' });
    }

    // Favori durumunu tersine çevir
    const newFavoriteStatus = !music.is_fav;
    await music.update({ is_fav: newFavoriteStatus });

    console.log('✅ Müzik favori durumu güncellendi:', newFavoriteStatus);

    res.json({
      id: music.id,
      is_fav: newFavoriteStatus,
      message: newFavoriteStatus ? 'Müzik favorilere eklendi' : 'Müzik favorilerden çıkarıldı'
    });
  } catch (error) {
    console.error('❌ Müzik favori toggle hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Playlist'i favori olarak işaretle/çıkar
router.put('/:id/toggle-favorite', async (req, res) => {
  try {
    console.log('⭐ Favori toggle isteği:', req.params.id);
    console.log('🔍 Token userId:', req.userId);
    
    const playlist = await Playlist.findByPk(req.params.id);
    
    if (!playlist) {
      console.log('❌ Playlist bulunamadı:', req.params.id);
      return res.status(404).json({ error: 'Playlist bulunamadı' });
    }
    
    // Kullanıcı yetkisi kontrolü
    if (req.userId && req.userId !== playlist.user_id) {
      console.log('❌ Yetkisiz erişim:', req.userId, '!=', playlist.user_id);
      return res.status(403).json({ error: 'Bu playlist\'e erişim yetkiniz yok' });
    }
    
    // Favori durumunu tersine çevir
    const newFavoriteStatus = !playlist.is_fav;
    await playlist.update({ is_fav: newFavoriteStatus });
    
    console.log('✅ Playlist favori durumu güncellendi:', newFavoriteStatus);
    
    // Güncellenmiş playlist'i getir (müziklerle birlikte)
    const updatedPlaylist = await Playlist.findByPk(playlist.id, {
      include: [{
        model: Music,
        as: 'musics',
        through: {
          attributes: ['added_at', 'order_index']
        }
      }]
    });
    
    res.json(updatedPlaylist);
  } catch (error) {
    console.error('❌ Favori toggle hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Playlist sil
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Playlist silme isteği:', req.params.id);
    console.log('🔍 Token userId:', req.userId);
    
    const playlist = await Playlist.findByPk(req.params.id);
    
    if (!playlist) {
      console.log('❌ Playlist bulunamadı:', req.params.id);
      return res.status(404).json({ error: 'Playlist bulunamadı' });
    }
    
    // Kullanıcı yetkisi kontrolü
    if (req.userId && req.userId !== playlist.user_id) {
      console.log('❌ Yetkisiz erişim:', req.userId, '!=', playlist.user_id);
      return res.status(403).json({ error: 'Bu playlist\'e erişim yetkiniz yok' });
    }
    
    await playlist.destroy();
    console.log('✅ Playlist silindi');
    res.json({ message: 'Playlist silindi' });
  } catch (error) {
    console.error('❌ Playlist silme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
