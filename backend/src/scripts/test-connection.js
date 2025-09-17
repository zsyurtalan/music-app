const sequelize = require('../config/database');

async function testConnection() {
  try {
    console.log('🔍 PostgreSQL bağlantısı test ediliyor...');
    console.log('Konfigürasyon:');
    console.log(`- Host: ${sequelize.config.host}`);
    console.log(`- Port: ${sequelize.config.port}`);
    console.log(`- Database: ${sequelize.config.database}`);
    console.log(`- Username: ${sequelize.config.username}`);
    
    // Bağlantıyı test et
    await sequelize.authenticate();
    console.log('✅ PostgreSQL bağlantısı başarılı!');
    
    // Veritabanı versiyonunu al
    const [results] = await sequelize.query('SELECT version()');
    console.log('📊 PostgreSQL Versiyonu:', results[0].version);
    
    // Mevcut tabloları listele
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Mevcut tablolar:', tables.length > 0 ? tables : 'Henüz tablo yok');
    
  } catch (error) {
    console.error('❌ PostgreSQL bağlantı hatası:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Çözüm önerileri:');
      console.log('1. PostgreSQL servisinin çalıştığından emin olun');
      console.log('2. .env dosyasındaki bağlantı bilgilerini kontrol edin');
      console.log('3. PostgreSQL\'in 5432 portunda dinlediğinden emin olun');
    } else if (error.message.includes('password authentication failed')) {
      console.log('💡 Şifre hatası - .env dosyasındaki DB_PASSWORD\'ü kontrol edin');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('💡 Veritabanı bulunamadı - önce "music_app" veritabanını oluşturun');
    }
    
  } finally {
    await sequelize.close();
    console.log('Bağlantı kapatıldı.');
  }
}

// Script doğrudan çalıştırılırsa
if (require.main === module) {
  testConnection();
}

module.exports = testConnection;




