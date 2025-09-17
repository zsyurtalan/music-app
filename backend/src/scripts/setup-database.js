const sequelize = require('../config/database');
const User = require('../models/Users');
const Playlist = require('../models/Playlist');
const Favorite = require('../models/Favorite');

async function setupDatabase() {
  try {
    console.log('PostgreSQL bağlantısı test ediliyor...');
    
    // Bağlantıyı test et
    await sequelize.authenticate();
    console.log('✅ PostgreSQL bağlantısı başarılı!');
    
    // Veritabanını senkronize et (tabloları oluştur/güncelle)
    console.log('Tablolar oluşturuluyor/güncelleniyor...');
    await sequelize.sync({ force: false }); // force: true tüm verileri siler
    console.log('✅ Tablolar başarıyla oluşturuldu!');
    
    // Tablo bilgilerini göster
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Mevcut tablolar:', tables);
    
  } catch (error) {
    console.error('❌ Veritabanı kurulum hatası:', error.message);
    console.error('Detaylar:', error);
  } finally {
    await sequelize.close();
    console.log('Veritabanı bağlantısı kapatıldı.');
  }
}

// Script doğrudan çalıştırılırsa
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;




