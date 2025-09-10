@echo off
echo 🎵 Müzik Çalar Uygulaması Başlatılıyor...
echo.



echo 📦 Backend başlatılıyor...
start "Backend" cmd /k "cd backend && npm run dev"

echo ⏳ 5 saniye bekleniyor...
timeout /t 5 /nobreak > nul

echo Frontend başlatılıyor...
start "Frontend" cmd /k "cd frontend\vue-project && npm run dev"

echo ⏳ 15 saniye bekleniyor (frontend başlasın diye)...
timeout /t 15 /nobreak > nul

echo 🌐 Tarayıcı açılıyor...
start http://localhost:5173

echo.
echo ✅ Uygulama başlatıldı!
echo 🐳 Keycloak: http://localhost:8080
echo 🌐 Backend: http://localhost:5000
echo 🎨 Frontend: http://localhost:5173
echo.
echo Kapatmak için bu pencereyi kapatın.
pause