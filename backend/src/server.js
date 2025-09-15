const app = require('./app');
const sequelize = require('./config/database');
const Playlist = require('./models/Playlist');
const Favorite = require('./models/Favorite');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Database bağlantısı ve server başlatma
async function startServer() {
  try {
    // Database bağlantısını test et
    await sequelize.authenticate();
    console.log('✅ MySQL bağlantısı başarılı!');
    
    // Tabloları oluştur/sync et
    await sequelize.sync({ force: false }); // force: true = tabloları siler ve yeniden oluşturur
    console.log('✅ Database tabloları sync edildi!');
    
    // Server'ı başlat
    app.listen(PORT, () => {
      console.log(`🚀 Server ${PORT} portunda çalışıyor`);
      console.log(`📁 Müzik dosyaları: http://localhost:${PORT}/uploads`);
      console.log(`🎵 YouTube API: http://localhost:${PORT}/api/youtube`);
      console.log(`📝 Playlist API: http://localhost:${PORT}/api/playlists`);
      console.log(`❤️ Favorites API: http://localhost:${PORT}/api/favorites`);
    });
    
  } catch (error) {
    console.error('❌ Server başlatma hatası:', error);
    process.exit(1);
  }
}

startServer();
