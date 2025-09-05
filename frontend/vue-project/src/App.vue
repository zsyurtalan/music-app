<script setup>
import { onMounted } from 'vue'
import MusicPlayer from './components/MusicPlayer.vue'
import YouTubeSearch from './components/YouTubeSearch.vue'
import PlaylistManager from './components/PlaylistManager.vue' 
import FavoritesManager from './components/FavoritesManager.vue' 

onMounted(() => {
  console.log('🎵 Müzik Çalar Uygulaması başlatıldı!')
})

</script>

<template>
  <div id="app">
    <div class="sun-animation"></div>
    <div class="clouds"></div>
    <header class="app-header">
      <h1 class="app-title">ZeynApp Music</h1>
      <div class="theme-controls">
        <button @click="toggleTheme" class="theme-btn">
          {{ isDarkMode ? '��' : '☀️' }}
        </button>
      </div>
    </header>

    <main class="app-main">
      <div class="container">
        <!-- YouTube Arama Bölümü -->
        <section class="youtube-section">
          <YouTubeSearch />
        </section>
         <!-- Playlist Yönetimi -->
         <section class="playlist-section">
          <PlaylistManager />
        </section>
        <!-- Favori Müzikler -->
        <section class="favorites-section">
          <FavoritesManager />
        </section>

        <!-- Müzik Listesi -->
        <section class="music-list-section">
          <MusicList />
        </section>
      </div>
    </main>

    <!-- Müzik Çalar (Alt kısımda sabit) -->
    <MusicPlayer />
  </div>
</template>

<style>

.youtube-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
.playlist-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
.favorites-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
/* CSS Variables - Dinamik Renkler */
:root {
  /* Güneş Doğuyor - Sarı Tonları */
  --primary-sunrise: #ffd700;
  --secondary-sunrise: #ffa500;
  --accent-sunrise: #ff8c00;
  --background-sunrise: linear-gradient(135deg, #ffd700 0%, #ffa500 50%, #ff8c00 100%);
  --text-sunrise: #2c3e50;
  --card-sunrise: rgba(255, 255, 255, 0.9);
  --sun-sunrise: #ffd700;
  --sun-glow-sunrise: rgba(255, 215, 0, 0.6);
  
  /* Güneş Batıyor - Turuncu-Kırmızı Tonları */
  --primary-sunset: #ff6b35;
  --secondary-sunset: #ff8c00;
  --accent-sunset: #ff4757;
  --background-sunset: linear-gradient(135deg, #ff6b35 0%, #ff8c00 50%, #ff4757 100%);
  --text-sunset: #2c3e50;
  --card-sunset: rgba(255, 255, 255, 0.9);
  --sun-sunset: #ff6b35;
  --sun-glow-sunset: rgba(255, 107, 53, 0.6);
  
  /* Light Theme - Sarı Tonları */
  --primary-light: #ffd700;
  --secondary-light: #ffa500;
  --accent-light: #ff8c00;
  --background-light: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
  --text-light: #2c3e50;
  --card-light: rgba(255, 255, 255, 0.95);
  --sun-light: #ffd700;
  --sun-glow-light: rgba(255, 215, 0, 0.4);
  
  /* Dark Theme - Koyu Sarı Tonları */
  --primary-dark: #b8860b;
  --secondary-dark: #daa520;
  --accent-dark: #ffd700;
  --background-dark: linear-gradient(135deg, #2c3e50 0%, #b8860b 100%);
  --text-dark: #ecf0f1;
  --card-dark: rgba(52, 73, 94, 0.9);
  --sun-dark: #ffd700;
  --sun-glow-dark: rgba(255, 215, 0, 0.3);
  
  /* Varsayılan değerler */
  --primary: var(--primary-light);
  --secondary: var(--secondary-light);
  --accent: var(--accent-light);
  --background: var(--background-light);
  --text: var(--text-light);
  --card: var(--card-light);
  --sun: var(--sun-light);
  --sun-glow: var(--sun-glow-light);
}

/* Güneş Doğuyor Teması */
.sunrise {
  --primary: var(--primary-sunrise);
  --secondary: var(--secondary-sunrise);
  --accent: var(--accent-sunrise);
  --background: var(--background-sunrise);
  --text: var(--text-sunrise);
  --card: var(--card-sunrise);
  --sun: var(--sun-sunrise);
  --sun-glow: var(--sun-glow-sunrise);
}

/* Güneş Batıyor Teması */
.sunset {
  --primary: var(--primary-sunset);
  --secondary: var(--secondary-sunset);
  --accent: var(--accent-sunset);
  --background: var(--background-sunset);
  --text: var(--text-sunset);
  --card: var(--card-sunset);
  --sun: var(--sun-sunset);
  --sun-glow: var(--sun-glow-sunset);
}

/* Dark Theme */
.dark-theme {
  --primary: var(--primary-dark);
  --secondary: var(--secondary-dark);
  --accent: var(--accent-dark);
  --background: var(--background-dark);
  --text: var(--text-dark);
  --card: var(--card-dark);
  --sun: var(--sun-dark);
  --sun-glow: var(--sun-glow-dark);
}

/* Ana App Stilleri */
#app {
  min-height: 100vh;
  background: var(--background);
  color: var(--text);
  transition: all 0.5s ease;
  position: relative;
  overflow-x: hidden;
}

/* Güneş Animasyonu - Doğuş */
.sunrise .sun-animation {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, var(--sun) 0%, var(--accent) 100%);
  border-radius: 50%;
  box-shadow: 0 0 50px var(--sun-glow);
  animation: sunRise 3s ease-in-out infinite alternate;
  z-index: 1;
}

/* Güneş Animasyonu - Batış */
.sunset .sun-animation {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, var(--sun) 0%, var(--accent) 100%);
  border-radius: 50%;
  box-shadow: 0 0 50px var(--sun-glow);
  animation: sunSet 3s ease-in-out infinite alternate;
  z-index: 1;
}

/* Güneş Doğuş Animasyonu */
@keyframes sunRise {
  0% {
    transform: translateY(0) scale(1) rotate(0deg);
    box-shadow: 0 0 30px var(--sun-glow);
  }
  100% {
    transform: translateY(-10px) scale(1.1) rotate(360deg);
    box-shadow: 0 0 60px var(--sun-glow);
  }
}

/* Güneş Batış Animasyonu */
@keyframes sunSet {
  0% {
    transform: translateY(0) scale(1) rotate(0deg);
    box-shadow: 0 0 30px var(--sun-glow);
  }
  100% {
    transform: translateY(10px) scale(1.2) rotate(-360deg);
    box-shadow: 0 0 80px var(--sun-glow);
  }
}

/* Bulutlar - Doğuş */
.sunrise .clouds {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="15" fill="rgba(255,255,255,0.4)"/><circle cx="35" cy="15" r="20" fill="rgba(255,255,255,0.3)"/><circle cx="50" cy="20" r="18" fill="rgba(255,255,255,0.35)"/><circle cx="70" cy="15" r="16" fill="rgba(255,255,255,0.3)"/><circle cx="85" cy="20" r="14" fill="rgba(255,255,255,0.4)"/></svg>') repeat-x;
  animation: cloudMove 20s linear infinite;
  z-index: 0;
}

/* Bulutlar - Batış */
.sunset .clouds {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="15" fill="rgba(255,255,255,0.2)"/><circle cx="35" cy="15" r="20" fill="rgba(255,255,255,0.15)"/><circle cx="50" cy="20" r="18" fill="rgba(255,255,255,0.18)"/><circle cx="70" cy="15" r="16" fill="rgba(255,255,255,0.15)"/><circle cx="85" cy="20" r="14" fill="rgba(255,255,255,0.2)"/></svg>') repeat-x;
  animation: cloudMove 25s linear infinite;
  z-index: 0;
}

@keyframes cloudMove {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Header */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background: var(--card);
  backdrop-filter: blur(10px);
  border-radius: 0 0 20px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  position: relative;
  z-index: 10;
}

.app-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(45deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.theme-controls {
  display: flex;
  gap: 1rem;
}

.theme-btn {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.theme-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

/* Main Content */
.app-main {
  padding: 0 2rem 2rem;
  position: relative;
  z-index: 5;
}

.section {
  background: var(--card);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.section:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

/* Footer */
.app-footer {
  text-align: center;
  padding: 2rem;
  background: var(--card);
  backdrop-filter: blur(10px);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
  position: relative;
  z-index: 10;
}

.app-footer p {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text);
  opacity: 0.8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .app-title {
    font-size: 2rem;
  }
  
  .app-main {
    padding: 0 1rem 1rem;
  }
  
  .section {
    padding: 1.5rem;
  }
  
  .sun-animation {
    width: 60px;
    height: 60px;
    top: 10px;
    right: 10px;
  }
}

/* Smooth Transitions */
* {
  transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
}
</style>