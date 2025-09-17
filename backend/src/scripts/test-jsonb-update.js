const sequelize = require('../config/database');
const Playlist = require('../models/Playlist');

async function testJsonbUpdate() {
  try {
    console.log('🔍 JSONB güncelleme testi...');
    
    // Bağlantıyı test et
    await sequelize.authenticate();
    console.log('✅ PostgreSQL bağlantısı başarılı!');
    
    // Test verisi
    const testVideos = [
      {
        id: 'test123',
        videoId: 'test123',
        title: 'Test Müzik',
        channelTitle: 'Test Kanal',
        thumbnail: 'https://example.com/thumb.jpg',
        youtubeUrl: 'https://youtube.com/watch?v=test123',
        addedAt: new Date().toISOString()
      }
    ];
    
    // İlk playlist'i bul
    const playlist = await Playlist.findByPk(1);
    if (!playlist) {
      console.log('❌ Playlist bulunamadı!');
      return;
    }
    
    console.log('📝 Mevcut playlist:', playlist.name);
    console.log('📝 Mevcut videos:', playlist.videos);
    
    // JSONB alanını güncelle
    console.log('🔄 JSONB alanı güncelleniyor...');
    await playlist.update({ 
      videos: testVideos 
    }, {
      fields: ['videos']
    });
    
    // Tekrar oku
    await playlist.reload();
    console.log('✅ Güncellenmiş videos:', playlist.videos);
    console.log('✅ Videos tipi:', typeof playlist.videos);
    console.log('✅ Videos uzunluğu:', Array.isArray(playlist.videos) ? playlist.videos.length : 'Array değil');
    
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
    console.error('Detaylar:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Bağlantı kapatıldı.');
  }
}

// Script doğrudan çalıştırılırsa
if (require.main === module) {
  testJsonbUpdate();
}

module.exports = testJsonbUpdate;
