const sequelize = require('../config/database');
// İlişkileri yükle
const { Playlist, Music, PlaylistMusic } = require('../models/associations');

async function testDataPersistence() {
  try {
    console.log('🔍 Veri kalıcılığı test ediliyor...');
    
    // Bağlantıyı test et
    await sequelize.authenticate();
    console.log('✅ PostgreSQL bağlantısı başarılı!');
    
    // Tüm playlist'leri listele
    const playlists = await Playlist.findAll();
    console.log('📋 Toplam playlist sayısı:', playlists.length);
    
    playlists.forEach((playlist, index) => {
      console.log(`\n📝 Playlist ${index + 1}:`);
      console.log(`   ID: ${playlist.id}`);
      console.log(`   User ID: ${playlist.user_id}`);
      console.log(`   Name: ${playlist.name}`);
      console.log(`   Videos: ${playlist.videos ? playlist.videos.length : 0} adet`);
      if (playlist.videos && playlist.videos.length > 0) {
        console.log(`   İlk video: ${playlist.videos[0].title || 'Başlık yok'}`);
      }
    });
    
    // Tüm müzikleri listele
    const musics = await Music.findAll();
    console.log('\n🎵 Toplam müzik sayısı:', musics.length);
    
    musics.forEach((music, index) => {
      console.log(`\n🎶 Müzik ${index + 1}:`);
      console.log(`   ID: ${music.id}`);
      console.log(`   Video ID: ${music.video_id}`);
      console.log(`   Title: ${music.title}`);
      console.log(`   Channel: ${music.channel_title}`);
    });
    
    // Kullanıcı ID'lerini analiz et
    const userIds = [...new Set(playlists.map(p => p.user_id))];
    console.log('\n👥 Kullanıcı ID\'leri:', userIds);
    
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
    console.error('Detaylar:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Bağlantı kapatıldı.');
  }
}

// Script doğrudan çalıştırılırsa
if (require.main === module) {
  testDataPersistence();
}

module.exports = testDataPersistence;
