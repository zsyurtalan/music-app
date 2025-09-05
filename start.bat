@echo off
echo 🎵 Müzik Çalar Uygulaması Başlatılıyor...
echo.

echo 📦 Backend başlatılıyor...
start "Backend" cmd /k "cd backend && npm run dev"

echo ⏳ 3 saniye bekleniyor...
timeout /t 3 /nobreak > nul

echo Frontend başlatılıyor...
start "Frontend" cmd /k "cd frontend\vue-project && npm run dev"

echo ⏳ 10 saniye bekleniyor (frontend başlasın diye)...
timeout /t 10 /nobreak > nul

echo 🌐 Tarayıcı açılıyor...
start http://localhost:5173

echo.
echo ✅ Uygulama başlatıldı!
echo 🌐 Backend: http://localhost:5000
echo 🎨 Frontend: http://localhost:5173
echo.
echo Kapatmak için bu pencereyi kapatın.
pause