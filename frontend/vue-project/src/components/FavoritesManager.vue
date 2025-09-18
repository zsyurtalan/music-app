<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const favorites = ref([])
const searchQuery = ref('')
const filteredFavorites = ref([])

// Favori müzikleri database'den yükle (yeni yapı)
const loadFavorites = async () => {
  try {
    // Keycloak'dan kullanıcı ID'sini al
    const userId = window.$keycloak?.subject || 'guest'
    const token = localStorage.getItem('keycloak-token')
    
    console.log('🔍 Frontend Favorites - Keycloak subject:', window.$keycloak?.subject)
    console.log('🔍 Frontend Favorites - User ID:', userId)
    console.log('🔍 Frontend Favorites - Token var mı:', !!token)
    
    if (userId === 'guest') {
      console.log('👤 Misafir kullanıcı - favoriler yüklenmiyor')
      favorites.value = []
      filteredFavorites.value = []
      return
    }
    
    console.log('🔄 Favori müzikler yükleniyor, kullanıcı ID:', userId)
    
    // Backend API'den favori müzikleri çek
    const response = await fetch(`http://localhost:5000/api/playlists/user/${userId}/favorite-musics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('⭐ Favori müzikler:', data)
      
      // Direkt favori müzikleri kullan
      favorites.value = data.map(music => ({
        id: { videoId: music.video_id },
        snippet: {
          title: music.title,
          channelTitle: music.channel_title,
          thumbnails: {
            medium: { url: music.thumbnail_url }
          }
        },
        youtubeUrl: music.youtube_url,
        addedAt: music.created_at,
        musicId: music.id
      }))
      filteredFavorites.value = [...favorites.value]
      console.log('✅ Favori müzikler yüklendi:', favorites.value.length, 'adet')
    } else {
      console.error('❌ Favori müzikler yüklenemedi:', response.status)
      // Fallback: localStorage'dan yükle
      loadFavoritesFromLocalStorage()
    }
  } catch (error) {
    console.error('❌ Favori müzik yükleme hatası:', error)
    // Fallback: localStorage'dan yükle
    loadFavoritesFromLocalStorage()
  }
}

// Fallback: localStorage'dan yükle
const loadFavoritesFromLocalStorage = () => {
  const saved = localStorage.getItem('music-favorites')
  if (saved) {
    favorites.value = JSON.parse(saved)
    filteredFavorites.value = [...favorites.value]
    console.log('📱 localStorage\'dan yüklendi:', favorites.value.length, 'adet')
  }
}

// Favori müziklerde arama yap
const searchFavorites = () => {
  console.log('🔍 Favori arama başlatılıyor:', searchQuery.value)
  console.log('📝 Mevcut favoriler:', favorites.value.length)
  
  if (!searchQuery.value.trim()) {
    filteredFavorites.value = [...favorites.value]
    console.log('✅ Arama temizlendi, tüm favoriler gösteriliyor:', filteredFavorites.value.length)
    return
  }
  
  const query = searchQuery.value.toLowerCase()
  filteredFavorites.value = favorites.value.filter(music => {
    const title = (music.snippet?.title || music.title || '').toLowerCase()
    const channel = (music.snippet?.channelTitle || music.channelTitle || '').toLowerCase()
    const matches = title.includes(query) || channel.includes(query)
    console.log(`🎵 "${title}" - "${channel}" -> ${matches ? '✅' : '❌'}`)
    return matches
  })
  
  console.log('✅ Arama tamamlandı, sonuç sayısı:', filteredFavorites.value.length)
  
  // Arama sonucu 0 ise özel mesaj göster
  if (filteredFavorites.value.length === 0 && searchQuery.value.trim()) {
    console.log('❌ Arama sonucu bulunamadı:', searchQuery.value)
  }
}

// localStorage değişikliklerini dinle
const handleStorageChange = () => {
  loadFavorites()
}

// Favorilere müzik ekle (Database'e)
const addToFavorites = async (musicData) => {
  try {
    const userId = window.$keycloak?.subject || 'guest'
    
    if (userId === 'guest') {
      console.log('👤 Misafir kullanıcı - favori eklenemiyor')
      return
    }
    
    console.log('🔄 Favorilere ekleniyor:', musicData.snippet?.title)
    
    // Video ID'yi al
    const videoId = musicData.id?.videoId || musicData.videoId || musicData.id
    
    if (!videoId) {
      console.error('❌ Video ID bulunamadı')
      return
    }
    
    // Video ID ile müziği favori yap
    const response = await fetch(`http://localhost:5000/api/music/toggle-favorite/${videoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('keycloak-token')}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Favorilere eklendi:', data)
      // Favorileri yeniden yükle
      await loadFavorites()
      // Event dispatch et
      window.dispatchEvent(new CustomEvent('favorites-updated'))
    } else {
      const errorData = await response.json()
      console.error('❌ Favori ekleme hatası:', errorData)
      // Fallback: localStorage'a ekle
      addToFavoritesLocalStorage(musicData)
    }
  } catch (error) {
    console.error('❌ Favori ekleme hatası:', error)
    // Fallback: localStorage'a ekle
    addToFavoritesLocalStorage(musicData)
  }
}

// Fallback: localStorage'a ekle
const addToFavoritesLocalStorage = (musicData) => {
  const favoriteData = {
    id: musicData.id?.videoId || musicData.videoId || musicData.id,
    snippet: musicData.snippet || {
      title: musicData.title,
      channelTitle: musicData.channelTitle,
      thumbnails: {
        medium: { url: musicData.thumbnail }
      }
    },
    addedAt: new Date().toISOString()
  }
  
  favorites.value.push(favoriteData)
  filteredFavorites.value = [...favorites.value]
  localStorage.setItem('music-favorites', JSON.stringify(favorites.value))
  console.log('📱 localStorage\'a eklendi:', favoriteData.snippet.title)
}

// Tüm favorileri çal
const playAllFavorites = () => {
  if (favorites.value.length === 0) {
    alert('❌ Çalacak favori müziğiniz yok!')
    return
  }
  
  // İlk favoriyi çal
  const firstFavorite = favorites.value[0]
  const videoId = firstFavorite.id?.videoId || firstFavorite.videoId || firstFavorite.id
  
  if (videoId) {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`
    window.open(youtubeUrl, '_blank')
    console.log('🎵 Tüm favoriler çalınıyor, ilk müzik:', firstFavorite.snippet?.title || firstFavorite.title)
  } else {
    alert('❌ Video ID bulunamadı!')
  }
}


// Favorilerden müzik çıkar (Database'den)
const removeFromFavorites = async (videoId) => {
  if (confirm('Bu müziği favorilerden çıkarmak istediğinizden emin misiniz?')) {
    try {
      console.log('🔄 Favorilerden çıkarılıyor:', videoId)
      
      // Video ID ile müziği favori yap/çıkar (toggle)
      const response = await fetch(`http://localhost:5000/api/music/toggle-favorite/${videoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('keycloak-token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Favorilerden çıkarıldı:', data)
        // Favorileri yeniden yükle
        await loadFavorites()
        // Event dispatch et
        window.dispatchEvent(new CustomEvent('favorites-updated'))
      } else {
        const errorData = await response.json()
        console.error('❌ Favori çıkarma hatası:', errorData)
        // Fallback: localStorage'dan çıkar
        removeFromFavoritesLocalStorage(videoId)
      }
    } catch (error) {
      console.error('❌ Favori çıkarma hatası:', error)
      // Fallback: localStorage'dan çıkar
      removeFromFavoritesLocalStorage(videoId)
    }
  }
}

// Fallback: localStorage'dan çıkar
const removeFromFavoritesLocalStorage = (videoId) => {
  favorites.value = favorites.value.filter(v => v.id !== videoId)
  filteredFavorites.value = [...favorites.value]
  localStorage.setItem('music-favorites', JSON.stringify(favorites.value))
  console.log('📱 localStorage\'dan çıkarıldı:', videoId)
}

// Favorileri localStorage'a kaydet
const saveFavorites = () => {
  localStorage.setItem('music-favorites', JSON.stringify(favorites.value))
  window.dispatchEvent(new CustomEvent('favorites-updated'))
}

// Favori müziği çal
const playFavorite = (video) => {
  const videoId = video.id?.videoId || video.videoId || video.id
  if (!videoId) {
    alert('❌ Video ID bulunamadı!')
    return
  }
  
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`
  window.open(youtubeUrl, '_blank')
  
  // Event dispatch et
  window.dispatchEvent(new CustomEvent('play-music', {
    detail: {
      video: video,
      title: video.snippet?.title || video.title,
      channel: video.snippet?.channelTitle || video.channelTitle,
      thumbnail: video.snippet?.thumbnails?.medium?.url || video.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      videoId: videoId,
      youtubeUrl: youtubeUrl
    }
  }))
}

// Tüm favorileri temizle (Database'den)
const clearAllFavorites = async () => {
  if (confirm('Tüm favori müzikleri silmek istediğinizden emin misiniz?')) {
    try {
      console.log('🔄 Tüm favoriler temizleniyor...')
      
      // Her favori müziği tek tek toggle yaparak favori olmaktan çıkar
      const userId = window.$keycloak?.subject || 'guest'
      const response = await fetch(`http://localhost:5000/api/playlists/user/${userId}/favorite-musics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('keycloak-token')}`
        }
      })
      
      if (response.ok) {
        const favoriteMusics = await response.json()
        console.log('📋 Favori müzikler bulundu:', favoriteMusics.length, 'adet')
        
        // Her favori müziği toggle yap
        for (const music of favoriteMusics) {
          const toggleResponse = await fetch(`http://localhost:5000/api/music/toggle-favorite/${music.video_id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('keycloak-token')}`
            }
          })
          
          if (toggleResponse.ok) {
            console.log('✅ Favori çıkarıldı:', music.title)
          } else {
            console.error('❌ Favori çıkarma hatası:', music.title)
          }
        }
        
        console.log('✅ Tüm favoriler temizlendi')
        // Favorileri yeniden yükle
        await loadFavorites()
        // Event dispatch et
        window.dispatchEvent(new CustomEvent('favorites-updated'))
      } else {
        console.error('❌ Favori listesi alınamadı:', response.status)
        // Fallback: localStorage'ı temizle
        clearAllFavoritesLocalStorage()
      }
    } catch (error) {
      console.error('❌ Favori temizleme hatası:', error)
      // Fallback: localStorage'ı temizle
      clearAllFavoritesLocalStorage()
    }
  }
}

// Fallback: localStorage'ı temizle
const clearAllFavoritesLocalStorage = () => {
  favorites.value = []
  filteredFavorites.value = []
  localStorage.setItem('music-favorites', JSON.stringify([]))
  console.log('📱 localStorage temizlendi')
}


onMounted(() => {
  loadFavorites()
  window.addEventListener('storage', handleStorageChange)
  window.addEventListener('favorites-updated', handleStorageChange)
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
  window.removeEventListener('favorites-updated', handleStorageChange)
})
</script>

<template>
  <div class="favorites-manager">
    <div class="favorites-header">
      <div class="header-left">
        <h2>❤️ Favori Müziklerim</h2>
        <span class="count-badge">{{ favorites.length }}</span>
      </div>
      <div class="header-actions">
        <button 
          v-if="favorites.length > 0"
          @click="playAllFavorites" 
          class="action-btn play-all-btn"
          title="Tüm Favorileri Çal"
        >
          <span class="btn-icon">▶️</span>
          <span class="btn-text">Tümünü Çal</span>
        </button>
        <button 
          v-if="favorites.length > 0"
          @click="clearAllFavorites" 
          class="action-btn clear-btn"
          title="Tümünü Temizle"
        >
          <span class="btn-icon">🗑️</span>
          <span class="btn-text">Temizle</span>
        </button>
      </div>
    </div>

    <!-- Favori Arama Kutusu -->
    <div v-if="favorites.length > 0" class="search-section">
      <div class="search-box">
        <input 
          v-model="searchQuery"
          @input="searchFavorites"
          type="text" 
          placeholder="Favori müziklerinizde ara... (örn: Ed Sheeran)"
          class="search-input"
        />
        <button 
          @click="searchFavorites" 
          class="search-btn"
        >
          🔍 Ara
        </button>
      </div>
    </div>

    <!-- Favori Müzikler Listesi -->
    <div v-if="favorites.length === 0" class="empty-state">
      <p>❤️ Henüz favori müziğiniz yok</p>
      <p>YouTube arama kısmından müzik arayıp favorilere ekleyebilirsiniz!</p>
    </div>

    <div v-else class="favorites-list">
      <div class="favorites-stats">
        <p>Toplam {{ favorites.length }} favori müzik</p>
        <p v-if="searchQuery && filteredFavorites.length !== favorites.length">
          {{ filteredFavorites.length }} sonuç bulundu
        </p>
      </div>
      
      <!-- Favori Müzikler Listesi -->
      <div class="favorites-grid">
        <div v-if="filteredFavorites && filteredFavorites.length > 0" class="minimal-favorites-list">
          
          <div 
            v-for="music in filteredFavorites" 
            :key="music.id"
            class="minimal-favorite-item"
          >
            <div class="music-thumbnail-mini">
              <img :src="music.snippet?.thumbnails?.medium?.url || music.thumbnail || `https://img.youtube.com/vi/${music.id?.videoId || music.videoId || music.id}/hqdefault.jpg`" 
                   :alt="music.snippet?.title || music.title" />
            </div>
            
            <div class="music-details">
              <h5 class="music-title">{{ music.snippet?.title || music.title }}</h5>
              <p class="music-channel">{{ music.snippet?.channelTitle || music.channelTitle }}</p>
              <small v-if="music.playlistName" class="playlist-name-mini">📁 {{ music.playlistName }}</small>
            </div>
            
            <div class="music-actions-mini">
              <button @click="playFavorite(music)" class="action-btn-mini play-mini" title="Çal">
                ▶️
              </button>
              <button @click="removeFromFavorites(music.id?.videoId || music.videoId || music.id)" class="action-btn-mini remove-mini" title="Kaldır">
                ❌
              </button>
            </div>
          </div>
        </div>
        <div v-else-if="searchQuery && filteredFavorites.length === 0" class="no-results">
          <div class="no-results-content">
            <div class="no-results-icon">🔍</div>
            <h3>Arama Sonucu Bulunamadı</h3>
            <p>"<strong>{{ searchQuery }}</strong>" için favori müziklerinizde sonuç bulunamadı</p>
            <p class="search-tip">💡 Farklı anahtar kelimeler deneyin veya arama kutusunu temizleyin</p>
          </div>
        </div>
        <div v-else class="no-music">
          <p>📭 Henüz favori müziğiniz yok</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.favorites-manager {
  width: 100%;
  padding: 1.5rem;
  background: var(--card);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 2rem;
  backdrop-filter: blur(15px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.favorites-manager::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary), var(--secondary), var(--accent));
  border-radius: 20px 20px 0 0;
}

.favorites-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(255, 215, 0, 0.2);
}

.favorites-header h2 {
  color: var(--text);
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.count-badge {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
  margin-left: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.action-btn:hover::before {
  left: 100%;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}


.play-all-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

.play-all-btn:hover {
  background: linear-gradient(135deg, #218838, #1ea085);
}

.clear-btn {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
}

.clear-btn:hover {
  background: linear-gradient(135deg, #c82333, #bd2130);
}

/* Arama Kutusu */
.search-section {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border-radius: 15px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.search-box {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 1rem 1.5rem;
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  outline: none;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
}

.search-input::placeholder {
  color: var(--text);
  opacity: 0.6;
  font-style: italic;
}

.search-btn {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 2rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.search-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.search-btn:hover::before {
  left: 100%;
}

.search-btn:hover {
  background: linear-gradient(135deg, var(--secondary), var(--accent));
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
}

.add-form {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e9ecef;
}

.search-section h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
}

.search-box {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  outline: none;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #f6b92c;
  box-shadow: 0 0 0 2px rgba(246, 185, 44, 0.1);
}

.search-btn {
  background: #f6b92c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.search-btn:hover:not(:disabled) {
  background: #f5a21d;
  transform: translateY(-1px);
}

.search-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.search-results h5 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1rem;
}

.music-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.music-card {
  background: white;
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.music-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.music-thumbnail {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.music-info h6 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 0.9rem;
  font-weight: bold;
  line-height: 1.3;
}

.music-info p {
  margin: 0;
  color: #666;
  font-size: 0.8rem;
}

.add-favorite-btn {
  background: #e91e63;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.8rem;
  width: 100%;
  margin-top: 0.75rem;
  transition: all 0.3s ease;
  font-weight: 600;
}

.add-favorite-btn:hover {
  background: #c2185b;
  transform: translateY(-1px);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text);
  opacity: 0.8;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border-radius: 15px;
  border: 2px dashed rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(10px);
}

.empty-state p {
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0.5rem 0;
}

.favorites-stats {
  text-align: center;
  margin: 0 auto 1.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border-radius: 25px;
  box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3);
  position: relative;
  overflow: hidden;
  max-width: 400px;
  width: fit-content;
}

.favorites-stats::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.favorites-stats p {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

/* Minimal Favori Listesi */
.minimal-favorites-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.minimal-favorite-item {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  border-radius: 15px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  transition: all 0.3s ease;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.minimal-favorite-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, var(--primary), var(--secondary));
  border-radius: 15px 0 0 15px;
}

.minimal-favorite-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
  border-color: var(--primary);
  background: linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.9));
}

.music-thumbnail-mini {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.music-thumbnail-mini:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.music-thumbnail-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.music-details {
  flex: 1;
  min-width: 0;
}

.music-title {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: linear-gradient(135deg, var(--text), var(--primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.music-channel {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text);
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.playlist-name {
  display: block;
  margin-top: 4px;
  font-size: 0.7rem;
  color: var(--accent);
  opacity: 0.8;
  font-weight: 500;
}

.playlist-name-mini {
  display: block;
  margin-top: 2px;
  font-size: 0.6rem;
  color: var(--accent);
  opacity: 0.8;
  font-weight: 500;
}

.music-actions-mini {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.action-btn-mini {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.action-btn-mini::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.action-btn-mini:hover::before {
  left: 100%;
}

.action-btn-mini:hover {
  transform: scale(1.15) translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.play-mini {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
}

.play-mini:hover {
  background: linear-gradient(135deg, var(--secondary), var(--accent));
}

.playlist-mini {
  background: linear-gradient(135deg, #9c27b0, #7b1fa2);
  color: white;
}

.playlist-mini:hover {
  background: linear-gradient(135deg, #8e24aa, #6a1b9a);
}

.remove-mini {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
}

.remove-mini:hover {
  background: linear-gradient(135deg, #c82333, #bd2130);
}

.play-all-btn-minimal {
  background: #28a745;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.play-all-btn-minimal:hover {
  background: #218838;
  transform: scale(1.05);
}

/* Modern Buton Stilleri */
.modern-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.modern-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.modern-btn:hover::before {
  left: 100%;
}

.modern-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modern-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-icon {
  font-size: 1rem;
  line-height: 1;
}

.btn-text {
  font-weight: 600;
  letter-spacing: 0.025em;
}

/* Buton Renkleri */

.play-all-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

.play-all-btn:hover {
  background: linear-gradient(135deg, #218838, #1ea085);
}

.clear-btn {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
}

.clear-btn:hover {
  background: linear-gradient(135deg, #c82333, #bd2130);
}

.favorites-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.favorite-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

.favorite-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.favorite-thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.favorite-info {
  flex: 1;
}

.favorite-info h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1rem;
  line-height: 1.3;
}

.channel {
  color: #666;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.added-date {
  color: #999;
  font-size: 0.8rem;
  margin: 0.25rem 0;
  font-style: italic;
}

.favorite-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.play-btn, .playlist-btn, .remove-btn {
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.play-btn {
  background: #f6b92c;
  color: white;
}

.play-btn:hover {
  background: #f5a21d;
  transform: translateY(-1px);
}

.playlist-btn {
  background: #9c27b0;
  color: white;
}

.playlist-btn:hover {
  background: #7b1fa2;
  transform: translateY(-1px);
}

.remove-btn {
  background: #dc3545;
  color: white;
}

.remove-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
}


.no-music {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.no-music p {
  margin: 0;
  font-size: 1rem;
}

.no-results {
  text-align: center;
  padding: 3rem 2rem;
  color: #666;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border-radius: 15px;
  border: 2px dashed rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(10px);
  margin: 2rem 0;
}

.no-results-content {
  max-width: 400px;
  margin: 0 auto;
}

.no-results-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.no-results h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(135deg, #333, #666);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.no-results p {
  margin: 0.5rem 0;
  font-size: 1rem;
  line-height: 1.5;
}

.no-results strong {
  color: #f5a21d;
  font-weight: 700;
}

.search-tip {
  font-size: 0.9rem !important;
  color: #888 !important;
  font-style: italic;
  margin-top: 1rem !important;
  padding: 0.75rem 1rem;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
  border-left: 4px solid #f5a21d;
}

@media (max-width: 768px) {
  .favorites-manager {
    padding: 1rem;
    border-radius: 15px;
  }
  
  .favorites-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .favorites-header h2 {
    font-size: 1.5rem;
    text-align: center;
  }
  
  .count-badge {
    margin-left: 0;
    margin-top: 0.5rem;
    align-self: center;
  }
  
  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .action-btn {
    padding: 0.6rem 1rem;
    font-size: 0.8rem;
  }
  
  .search-box {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .search-input {
    padding: 0.875rem 1.25rem;
    font-size: 0.9rem;
  }
  
  .search-btn {
    padding: 0.875rem 1.5rem;
    font-size: 0.9rem;
  }
  
  .minimal-favorite-item {
    padding: 1rem;
    gap: 1rem;
    flex-direction: column;
    text-align: center;
  }
  
  .music-thumbnail-mini {
    width: 50px;
    height: 50px;
    align-self: center;
  }
  
  .music-details {
    text-align: center;
  }
  
  .music-title {
    font-size: 0.9rem;
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
  }
  
  .music-channel {
    font-size: 0.8rem;
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
  }
  
  .music-actions-mini {
    justify-content: center;
    gap: 0.5rem;
  }
  
  .action-btn-mini {
    width: 35px;
    height: 35px;
    font-size: 0.9rem;
  }
  
  .favorites-stats {
    padding: 0.75rem 1.5rem;
    max-width: 350px;
  }
  
  .favorites-stats p {
    font-size: 0.9rem;
  }
  
  .empty-state {
    padding: 2rem 1rem;
  }
  
  .empty-state p {
    font-size: 1rem;
  }
  
  .no-results {
    padding: 2rem 1rem;
    margin: 1rem 0;
  }
  
  .no-results-icon {
    font-size: 3rem;
  }
  
  .no-results h3 {
    font-size: 1.3rem;
  }
  
  .no-results p {
    font-size: 0.9rem;
  }
  
  .search-tip {
    font-size: 0.8rem !important;
    padding: 0.5rem 0.75rem;
  }
}

.favorite-music-btn {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #333;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
}

.favorite-music-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 215, 0, 0.4);
}

.action-btn-mini.favorite-mini {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #333;
}
</style>
