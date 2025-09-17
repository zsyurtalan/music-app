const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const Favorite = require('../models/Favorite');

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
    const playlists = await Playlist.findAll();
    
    // Videos'u array olarak döndür
    const playlistsWithVideos = playlists.map(playlist => {
      const playlistData = playlist.toJSON();
      // PostgreSQL JSONB alanı zaten obje olarak gelir
      playlistData.videos = playlistData.videos || [];
      return playlistData;
    });
    
    console.log('✅ Playlist\'ler getirildi:', playlistsWithVideos.length, 'adet');
    res.json(playlistsWithVideos);
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
    console.log('🔍 Authorization header:', req.headers.authorization);
    
    const { user_id, name, description, is_public } = req.body;
    
    if (!user_id || !name) {
      console.log('❌ Eksik parametreler:', { user_id, name });
      return res.status(400).json({ error: 'user_id ve name gerekli' });
    }
    
    const playlist = await Playlist.create({
      user_id,
      name,
      description: description || '',
      is_public: is_public || false,
      videos: []
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
    console.log('🔍 Authorization header:', req.headers.authorization);
    
    // Token'dan gelen kullanıcı ID'si ile parametre ID'sini karşılaştır
    if (req.userId && req.userId !== req.params.userId) {
      console.log('❌ Yetkisiz erişim denemesi:', req.userId, '!=', req.params.userId);
      return res.status(403).json({ error: 'Bu kullanıcının playlistlerine erişim yetkiniz yok' });
    }
    
    const playlists = await Playlist.findAll({
      where: { user_id: req.params.userId }
    });
    
    console.log('🔍 Database\'den gelen playlists:', playlists.length, 'adet');
    
    // Videos'u array olarak döndür
    const playlistsWithVideos = playlists.map(playlist => {
      const playlistData = playlist.toJSON();
      console.log('🔍 Raw playlist data:', playlistData.name, 'videos:', playlistData.videos);
      console.log('🔍 Videos type:', typeof playlistData.videos);
      console.log('🔍 Videos is array:', Array.isArray(playlistData.videos));
      
      // PostgreSQL JSONB alanı zaten obje olarak gelir
      playlistData.videos = playlistData.videos || [];
      console.log('🔍 Processed videos:', playlistData.videos.length, 'items');
      return playlistData;
    });
    
    console.log('✅ Playlist\'ler getirildi:', playlistsWithVideos.length, 'adet');
    res.json(playlistsWithVideos);
  } catch (error) {
    console.error('❌ Playlist getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Playlist'e müzik ekle
router.put('/:id/add-music', async (req, res) => {
  console.log('🎵 MÜZİK EKLEME ENDPOINT\'İ ÇAĞRILDI!');
  console.log('🎵 MÜZİK EKLEME ENDPOINT\'İ ÇAĞRILDI!');
  console.log('🎵 MÜZİK EKLEME ENDPOINT\'İ ÇAĞRILDI!');
  
  try {
    console.log('🎵 Playlist\'e müzik ekleme isteği:', req.body);
    console.log('🔍 Playlist ID:', req.params.id);
    console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Headers:', req.headers);
    console.log('🔍 Authorization:', req.headers.authorization);
    console.log('🔍 Content-Type:', req.headers['content-type']);
    console.log('🔍 Body type:', typeof req.body);
    console.log('🔍 Body is null:', req.body === null);
    console.log('🔍 Body is undefined:', req.body === undefined);
    
    // req.body kontrolü
    if (!req.body) {
      console.log('❌ req.body is null or undefined');
      return res.status(400).json({ error: 'Request body is missing' });
    }
    
    const { id, title, channelTitle, thumbnail, videoId, youtubeUrl } = req.body;
    console.log('🔍 Parsed data:', { id, title, channelTitle, thumbnail, videoId, youtubeUrl });
    
    const playlist = await Playlist.findByPk(req.params.id);
    
    console.log('🔍 Playlist bulundu:', !!playlist);
    
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist bulunamadı' });
    }
    
    // Kullanıcı yetkisi kontrolü
    if (req.userId && req.userId !== playlist.user_id) {
      console.log('❌ Yetkisiz erişim:', req.userId, '!=', playlist.user_id);
      return res.status(403).json({ error: 'Bu playlist\'e erişim yetkiniz yok' });
    }
    
    // PostgreSQL JSONB alanı zaten obje olarak gelir
    let videos = playlist.videos || [];
    console.log('✅ Videos loaded:', videos.length, 'items');
    console.log('🔍 Videos type:', typeof videos);
    console.log('🔍 Videos is array:', Array.isArray(videos));
    console.log('🔍 Videos content:', JSON.stringify(videos, null, 2));
    
    // videos'un array olduğundan emin ol
    if (!Array.isArray(videos)) {
      console.log('❌ Videos is not an array, converting...');
      videos = [];
    }
    
    // Müzik zaten var mı kontrol et
    const existingVideo = videos.find(video => video.videoId === videoId || video.id === id);
    if (existingVideo) {
      console.log('⚠️ Müzik zaten mevcut:', videoId);
      return res.status(400).json({ error: 'Bu müzik zaten playlist\'te mevcut' });
    }
    
    console.log('🔍 Mevcut videos sayısı:', videos.length);
    console.log('🔍 Mevcut videos:', videos.map(v => v.title));
    
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
    
    console.log('🔄 Database\'e kaydediliyor...')
    console.log('🔍 Videos to save:', JSON.stringify(videos))
    
    // PostgreSQL JSONB alanını güncelle - Direct SQL ile
    try {
      console.log('🔄 Sequelize update başlatılıyor...');
      const updateResult = await playlist.update({ 
        videos: videos 
      }, {
        fields: ['videos'] // Sadece videos alanını güncelle
      });
      console.log('✅ Sequelize update result:', updateResult);
      
      // Her durumda direct SQL de deneyelim
      console.log('🔄 Direct SQL update deniyor...');
      console.log('🔍 SQL videos data:', JSON.stringify(videos));
      const sequelize = require('../config/database');
      const sqlResult = await sequelize.query(
        'UPDATE playlists SET videos = :videos WHERE id = :id',
        {
          replacements: { 
            videos: JSON.stringify(videos), 
            id: playlist.id 
          },
          type: sequelize.QueryTypes.UPDATE
        }
      );
      console.log('✅ Direct SQL update result:', sqlResult);
      
      // Update sonrası database'i kontrol et
      const checkResult = await sequelize.query(
        'SELECT videos FROM playlists WHERE id = :id',
        {
          replacements: { id: playlist.id },
          type: sequelize.QueryTypes.SELECT
        }
      );
      console.log('🔍 Update sonrası database videos:', checkResult[0]?.videos);
      
      console.log('✅ Müzik playlist\'e eklendi:', newVideo);
    } catch (updateError) {
      console.error('❌ Update hatası:', updateError);
      throw updateError;
    }
    
    // Reload yerine güncellenmiş veriyi kullan
    console.log('🔍 Update sonrası playlist videos:', playlist.videos);
    console.log('🔍 Videos tipi:', typeof playlist.videos);
    console.log('🔍 Videos uzunluğu:', Array.isArray(playlist.videos) ? playlist.videos.length : 'Array değil');
    
    // Güncellenmiş videos'u manuel olarak set et
    playlist.videos = videos;
    console.log('🔍 Manuel set edilen videos:', playlist.videos);
    
    // Response'u düzelt - videos'u array olarak döndür
    const responsePlaylist = {
      ...playlist.toJSON(),
      videos: videos // Güncellenmiş videos array'ini kullan
    };
    
    console.log('📤 Frontend\'e gönderilen response:', JSON.stringify(responsePlaylist, null, 2));
    res.json(responsePlaylist);
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
    
    // PostgreSQL JSONB alanı zaten obje olarak gelir
    let videos = playlist.videos || [];
    console.log('🔍 Videos type:', typeof videos);
    console.log('🔍 Videos is array:', Array.isArray(videos));
    
    // videos'un array olduğundan emin ol
    if (!Array.isArray(videos)) {
      console.log('❌ Videos is not an array, converting...');
      videos = [];
    }
    
    const updatedVideos = videos.filter(video => video.videoId !== videoId);
    
    await playlist.update({ videos: updatedVideos });
    console.log('✅ Müzik playlist\'ten çıkarıldı:', videoId);
    
    // Response'u düzelt - videos'u array olarak döndür
    const responsePlaylist = {
      ...playlist.toJSON(),
      videos: updatedVideos
    };
    res.json(responsePlaylist);
  } catch (error) {
    console.error('❌ Müzik çıkarma hatası:', error);
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
