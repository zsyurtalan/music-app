<script setup>
import { onMounted, ref, computed } from 'vue'
import MusicPlayer from './components/MusicPlayer.vue'
import YouTubeSearch from './components/YouTubeSearch.vue'
import PlaylistManager from './components/PlaylistManager.vue' 
import FavoritesManager from './components/FavoritesManager.vue' 

// Keycloak durumu
const isAuthenticated = ref(false)
const keycloak = ref(null)
const isDarkMode = ref(false)

onMounted(() => {
  console.log('🎵 Müzik Çalar Uygulaması başlatıldı!')
  
  // Tab değiştirme event'ini dinle
  window.addEventListener('switch-tab', (event) => {
    console.log('🔄 Tab değiştiriliyor:', event.detail)
    // Bu event'i component'lerde dinleyebiliriz
  })
  
  // Keycloak durumunu kontrol et
  if (window.$keycloak) {
    keycloak.value = window.$keycloak
    isAuthenticated.value = window.$keycloak.authenticated
    
    // Keycloak durumu değişikliklerini dinle
    keycloak.value.onAuthSuccess = () => {
      console.log('✅ Login başarılı!')
      isAuthenticated.value = true
      
      // Token'ı kaydet
      if (window.$keycloak.token) {
        localStorage.setItem('keycloak-token', window.$keycloak.token)
        console.log('🔑 Token kaydedildi:', window.$keycloak.token.substring(0, 50) + '...')
      }
      
      // Login event'ini dispatch et
      window.dispatchEvent(new CustomEvent('keycloak-login'))
      
      // Kullanıcı verilerini temizle ve yeniden yükle
      clearUserData()
      window.location.reload() // Sayfayı yenile
    }
    
    keycloak.value.onAuthError = () => {
      console.log('❌ Login hatası!')
      isAuthenticated.value = false
    }
    
    keycloak.value.onAuthLogout = () => {
      console.log('👋 Logout başarılı!')
      isAuthenticated.value = false
      // Kullanıcı verilerini temizle
      clearUserData()
      window.location.reload() // Sayfayı yenile
    }
  }
})

// Login fonksiyonu
const login = () => {
  if (keycloak.value) {
    console.log(' Login başlatılıyor...')
    keycloak.value.login({
      redirectUri: window.location.origin
    })
  } else {
    console.error('❌ Keycloak bulunamadı!')
    alert('Giriş yapılamıyor. Lütfen sayfayı yenileyin.')
  }
}

// Logout fonksiyonu
const logout = () => {
  if (keycloak.value) {
    console.log('👋 Logout başlatılıyor...')
    keycloak.value.logout({
      redirectUri: window.location.origin
    })
  } else {
    console.error('❌ Keycloak bulunamadı!')
    alert('Çıkış yapılamıyor. Lütfen sayfayı yenileyin.')
  }
}

// Kullanıcı adı
const username = computed(() => {
  if (keycloak.value && keycloak.value.authenticated) {
    return keycloak.value.tokenParsed?.preferred_username || 
           keycloak.value.tokenParsed?.name || 
           'Kullanıcı'
  }
  return null
})

// Kullanıcı verilerini temizle
const clearUserData = () => {
  console.log('🧹 Kullanıcı verileri temizleniyor...')
  // localStorage'dan kullanıcıya özgü verileri temizle
  localStorage.removeItem('music-playlists')
  localStorage.removeItem('music-favorites')
  localStorage.removeItem('keycloak-token')
  console.log('✅ Kullanıcı verileri temizlendi')
}

// Tema değiştirici
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
}
</script>

<template>
  <div id="app" :class="{ 'dark-theme': isDarkMode }">
    <div class="sun-animation"></div>
    <div class="clouds"></div>
    
    <header class="app-header">
      <h1 class="app-title">ZeynApp Music</h1>
      
      <div class="header-controls">
        <!-- Kullanıcı durumu -->
        <div v-if="isAuthenticated" class="user-info">
          <span class="welcome-text">Hoş geldin, {{ username }}!</span>
          <button @click="logout" class="logout-btn">Çıkış Yap</button>
        </div>
        
        <div v-else class="guest-info">
          <span class="guest-text">Misafir Modu</span>
          <button @click="login" class="login-btn">Giriş Yap</button>
        </div>
        
        <!-- Tema değiştirici -->
        <button @click="toggleTheme" class="theme-btn">
          {{ isDarkMode ? '🌑' : '☀️' }}
        </button>
      </div>
    </header>

    <main class="app-main">
      <div class="container">
        <!-- YouTube Arama Bölümü - Herkese açık -->
        <section class="youtube-section">
          <YouTubeSearch />
        </section>
        
        <!-- Login olunca görünecek özellikler -->
        <div v-if="isAuthenticated" class="authenticated-features">
          <!-- Playlist Yönetimi -->
          <section class="playlist-section">
            <PlaylistManager />
          </section>
          
          <!-- Favori Müzikler -->
          <section class="favorites-section">
            <FavoritesManager />
          </section>
        </div>
        
        <!-- Misafir modu uyarısı -->
        <div v-else class="guest-notice">
          <div class="notice-card">
            <h3>🔒 Giriş Yapın</h3>
            <p>Playlist oluşturmak ve favori müziklerinizi kaydetmek için giriş yapın!</p>
            <button @click="login" class="login-btn-large">Giriş Yap</button>
          </div>
        </div>
      </div>
    </main>

    <!-- Müzik Çalar (Alt kısımda sabit) -->
    <MusicPlayer />
  </div>
</template>

<style>
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

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info, .guest-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.welcome-text, .guest-text {
  font-size: 1rem;
  color: var(--text);
  font-weight: 500;
}

.login-btn, .logout-btn {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.login-btn:hover, .logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
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

.container {
  max-width: 1200px;
  margin: 0 auto;
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

.authenticated-features {
  display: block;
}

.guest-notice {
  margin: 2rem 0;
}

.notice-card {
  background: var(--card);
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.notice-card h3 {
  color: var(--primary);
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.notice-card p {
  color: var(--text);
  margin-bottom: 1.5rem;
  opacity: 0.8;
}

.login-btn-large {
  background: linear-gradient(45deg, var(--primary), var(--secondary));
  color: white;
  border: none;
  border-radius: 30px;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.login-btn-large:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
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
}

/* Smooth Transitions */
* {
  transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
}
</style>