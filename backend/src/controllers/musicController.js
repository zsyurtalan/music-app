const Playlist = require('../models/Playlist');
const Favorite = require('../models/Favorite');

// Müzik listesi getir (genel)
const getMusicList = async (req, res) => {
  try {
    // Bu fonksiyon YouTube API'den gelen verileri kullanır
    // Ayrı bir müzik listesi tutmaya gerek yok
    res.json({ 
      message: 'Müzik listesi YouTube API\'den alınır',
      endpoint: '/api/youtube/search'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Kullanıcının müzik geçmişi
const getUserMusicHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kullanıcının playlistlerindeki tüm müzikleri getir
    const playlists = await Playlist.findAll({
      where: { user_id: userId }
    });
    
    const allMusic = [];
    playlists.forEach(playlist => {
      if (playlist.videos && Array.isArray(playlist.videos)) {
        playlist.videos.forEach(video => {
          allMusic.push({
            ...video,
            playlistName: playlist.name,
            addedAt: video.addedAt
          });
        });
      }
    });
    
    res.json(allMusic);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMusicList,
  getUserMusicHistory
};