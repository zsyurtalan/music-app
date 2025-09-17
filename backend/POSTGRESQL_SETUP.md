# PostgreSQL Kurulum Rehberi

## 1. PostgreSQL Kurulumu

PostgreSQL'i bilgisayarınıza kurduğunuzdan emin olun. Kurulum tamamlandıktan sonra:

1. PostgreSQL servisini başlatın
2. `psql` komut satırı aracını kullanarak veritabanı oluşturun:

```sql
CREATE DATABASE music_app;
```

## 2. Ortam Değişkenlerini Ayarlayın

`backend` klasöründe `.env` dosyası oluşturun ve aşağıdaki bilgileri ekleyin:

```env
# PostgreSQL Veritabanı Konfigürasyonu
DB_HOST=localhost
DB_PORT=5432
DB_NAME=music_app
DB_USER=postgres
DB_PASSWORD=your_password_here

# Uygulama Konfigürasyonu
NODE_ENV=development
PORT=3000
```

**Önemli:** `your_password_here` kısmını PostgreSQL kurulumunda belirlediğiniz şifre ile değiştirin.

## 3. Bağlantıyı Test Edin

```bash
cd backend
npm run test-connection
```

Bu komut PostgreSQL bağlantısını test edecek ve herhangi bir hata varsa çözüm önerileri sunacaktır.

## 4. Veritabanı Tablolarını Oluşturun

```bash
npm run setup-db
```

Bu komut:
- PostgreSQL bağlantısını test eder
- Gerekli tabloları oluşturur
- Mevcut tabloları listeler

## 5. Uygulamayı Başlatın

```bash
npm run dev
```

## Sorun Giderme

### Bağlantı Hatası
- PostgreSQL servisinin çalıştığından emin olun
- `.env` dosyasındaki bilgileri kontrol edin
- Firewall ayarlarını kontrol edin

### Veritabanı Bulunamadı Hatası
```sql
-- PostgreSQL'de veritabanını oluşturun
CREATE DATABASE music_app;
```

### Şifre Hatası
- `.env` dosyasındaki `DB_PASSWORD` değerini kontrol edin
- PostgreSQL kullanıcı şifresini doğrulayın

## Veri Tipleri Değişiklikleri

PostgreSQL'e geçişte aşağıdaki değişiklikler yapıldı:

- `videos` alanı `TEXT`'ten `JSONB`'ye çevrildi (daha iyi performans)
- Tüm tablolar `underscored: true` ile yapılandırıldı
- Connection pooling eklendi

## Faydalar

PostgreSQL'e geçiş ile:
- Daha iyi performans
- JSON veri tiplerinde daha iyi sorgu performansı
- Daha güçlü veri bütünlüğü
- Daha iyi ölçeklenebilirlik
