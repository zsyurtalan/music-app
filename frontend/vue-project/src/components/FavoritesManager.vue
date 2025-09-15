<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const favorites = ref([])
const searchQuery = ref('')
const filteredFavorites = ref([])
const showFavoritesDetails = ref(false)

// Favori müzikleri database'den yükle
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
    
    // Backend API'den favorileri çek
    const response = await fetch(`/api/favorites/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      favorites.value = data.map(favorite => ({
        id: favorite.video_id,
        snippet: {
          title: favorite.title,
          channelTitle: favorite.channel_title,
          thumbnails: {
            medium: { url: favorite.thumbnail_url }
          }
        },
        addedAt: favorite.created_at
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
    
    const response = await fetch('/api/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('keycloak-token')}`
      },
      body: JSON.stringify({
        user_id: userId,
        video_id: musicData.id?.videoId || musicData.videoId || musicData.id,
        title: musicData.snippet?.title || musicData.title,
        channel_title: musicData.snippet?.channelTitle || musicData.channelTitle,
        thumbnail_url: musicData.snippet?.thumbnails?.medium?.url || musicData.thumbnail,
        youtubeUrl: `https://www.youtube.com/watch?v=${musicData.id?.videoId || musicData.videoId || musicData.id}`
      })
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
      // Önce favori ID'sini bul
      const favorite = favorites.value.find(f => f.id === videoId)
      if (!favorite) {
        console.error('❌ Favori bulunamadı:', videoId)
        return
      }
      
      console.log('🔄 Favorilerden çıkarılıyor:', videoId)
      
      // Backend'de favori ID'si ile silme yapılıyor, video_id değil
      // Bu durumda önce favoriyi bulup ID'sini almalıyız
      const userId = window.$keycloak?.subject || 'guest'
      const response = await fetch(`/api/favorites/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('keycloak-token')}`
        }
      })
      
      if (response.ok) {
        const userFavorites = await response.json()
        const favoriteToDelete = userFavorites.find(f => f.video_id === videoId)
        
        if (favoriteToDelete) {
          const deleteResponse = await fetch(`/api/favorites/${favoriteToDelete.id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('keycloak-token')}`
            }
          })
          
          if (deleteResponse.ok) {
            console.log('✅ Favorilerden çıkarıldı:', videoId)
            // Favorileri yeniden yükle
            await loadFavorites()
            // Event dispatch et
            window.dispatchEvent(new CustomEvent('favorites-updated'))
          } else {
            console.error('❌ Favori çıkarma hatası:', deleteResponse.status)
            // Fallback: localStorage'dan çıkar
            removeFromFavoritesLocalStorage(videoId)
          }
        } else {
          console.error('❌ Favori bulunamadı')
          removeFromFavoritesLocalStorage(videoId)
        }
      } else {
        console.error('❌ Favori listesi alınamadı:', response.status)
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

// Favori detaylarını göster/gizle
const toggleFavoritesDetails = () => {
  showFavoritesDetails.value = !showFavoritesDetails.value
}
// Tüm favorileri temizle (Database'den)
const clearAllFavorites = async () => {
  if (confirm('Tüm favori müzikleri silmek istediğinizden emin misiniz?')) {
    try {
      console.log('🔄 Tüm favoriler temizleniyor...')
      
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('keycloak-token')}`
        }
      })
      
      if (response.ok) {
        console.log('✅ Tüm favoriler temizlendi')
        // Favorileri yeniden yükle
        await loadFavorites()
        // Event dispatch et
        window.dispatchEvent(new CustomEvent('favorites-updated'))
      } else {
        console.error('❌ Favori temizleme hatası:', response.status)
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

// Favori müziği playlist'e ekle
const addToPlaylist = (video) => {
  const playlists = JSON.parse(localStorage.getItem('music-playlists') || '[]')
  if (playlists.length === 0) {
    alert('Önce bir playlist oluşturun!')
    return
  }
  
  const playlistNames = playlists.map(p => p.name).join('\n')
  const playlistName = prompt(`Hangi playlist'e eklemek istiyorsunuz?\n\nMevcut playlist'ler:\n${playlistNames}`)
  
  if (playlistName) {
    const playlist = playlists.find(p => p.name === playlistName)
    if (playlist && !playlist.videos.find(v => v.id === video.id)) {
      playlist.videos.push(video)
      localStorage.setItem('music-playlists', JSON.stringify(playlists))
      window.dispatchEvent(new CustomEvent('playlists-updated'))
      alert(`✅ ${video.title} "${playlist.name}" playlist'ine eklendi!`)
    } else if (playlist && playlist.videos.find(v => v.id === video.id)) {
      alert('⚠️ Bu müzik zaten bu playlist\'te!')
    } else {
      alert('❌ Playlist bulunamadı!')
    }
  }
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
    <div class="favorites-header-minimal">
      <div class="header-left">
        <h2>❤️ Favori Müziklerim</h2>
        <span class="count-badge">{{ favorites.length }}</span>
      </div>
      <div class="header-actions-minimal">
        <button 
          v-if="favorites.length > 0"
          @click="toggleFavoritesDetails" 
          class="modern-btn view-btn"
          :title="showFavoritesDetails ? 'Kompakt Görünüm' : 'Detaylı Görünüm'"
        >
          <span class="btn-icon">{{ showFavoritesDetails ? '📋' : '👁️' }}</span>
          <span class="btn-text">{{ showFavoritesDetails ? 'Gizle' : 'Görüntüle' }}</span>
        </button>
        <button 
          v-if="favorites.length > 0"
          @click="playAllFavorites" 
          class="modern-btn play-all-btn"
          title="Tüm Favorileri Çal"
        >
          <span class="btn-icon">▶️</span>
          <span class="btn-text">Tümünü Çal</span>
        </button>
        <button 
          v-if="favorites.length > 0"
          @click="clearAllFavorites" 
          class="modern-btn clear-btn"
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
      
      <!-- Favori Detay Görünümü -->
      <div v-if="showFavoritesDetails" class="favorites-details">
        <h4>🎵 Favori Müziklerim</h4>
        <div v-if="filteredFavorites && filteredFavorites.length > 0" class="music-list">
          <div v-for="(music, index) in filteredFavorites" :key="music.id || index" class="music-item">
            <img :src="music.snippet?.thumbnails?.medium?.url || music.thumbnail || `https://img.youtube.com/vi/${music.id?.videoId || music.videoId || music.id}/hqdefault.jpg`" 
                 :alt="music.snippet?.title || music.title" class="music-thumbnail">
            <div class="music-info">
              <h5>{{ music.snippet?.title || music.title }}</h5>
              <p>{{ music.snippet?.channelTitle || music.channelTitle }}</p>
            </div>
            <div class="music-actions">
              <button @click="playFavorite(music)" class="play-music-btn">▶️ Çal</button>
              <button @click="addToPlaylist(music)" class="playlist-music-btn">📝 Playlist'e Ekle</button>
              <button @click="removeFromFavorites(music.id?.videoId || music.videoId || music.id)" class="remove-music-btn">❌ Kaldır</button>
            </div>
          </div>
        </div>
        <div v-else-if="searchQuery" class="no-music">
          <p>❌ Arama kriterinize uygun müzik bulunamadı</p>
        </div>
        <div v-else class="no-music">
          <p>📭 Henüz favori müziğiniz yok</p>
        </div>
      </div>
      
      <!-- Kompakt Görünüm (Varsayılan) -->
      <div v-else class="favorites-grid">
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
            </div>
            
            <div class="music-actions-mini">
              <button @click="playFavorite(music)" class="action-btn-mini play-mini" title="Çal">
                ▶️
              </button>
              <button @click="addToPlaylist(music)" class="action-btn-mini playlist-mini" title="Playlist'e Ekle">
                📝
              </button>
              <button @click="removeFromFavorites(music.id?.videoId || music.videoId || music.id)" class="action-btn-mini remove-mini" title="Kaldır">
                ❌
              </button>
            </div>
          </div>
        </div>
        <div v-else-if="searchQuery" class="no-results">
          <p>❌ Arama kriterinize uygun müzik bulunamadı</p>
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
  padding: 0.75rem;
  background: var(--card);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.favorites-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.favorites-header h2 {
  color: var(--text);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.clear-btn, .view-btn {
  border: none;
  border-radius: 8px;
  padding: 1.2rem 1.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.clear-btn {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
}

.clear-btn:hover {
  background: linear-gradient(135deg, #c82333, #bd2130);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.view-btn {
  background: linear-gradient(135deg, #9c27b0, #7b1fa2);
  color: white;
}

.view-btn:hover {
  background: linear-gradient(135deg, #8e24aa, #6a1b9a);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
}

/* Arama Kutusu */
.search-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--card);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.search-box {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  outline: none;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
  backdrop-filter: blur(10px);
}

.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  background: rgba(255, 255, 255, 0.2);
}

.search-input::placeholder {
  color: var(--text);
  opacity: 0.7;
}

.search-btn {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-btn:hover {
  background: linear-gradient(135deg, var(--secondary), var(--accent));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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
  padding: 3rem;
  color: var(--text);
  opacity: 0.8;
}

.favorites-stats {
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.favorites-stats p {
  margin: 0;
  font-size: 1.1rem;
  font-weight: bold;
}

/* Minimal Favori Listesi */
.minimal-favorites-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.minimal-favorite-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--card);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.minimal-favorite-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border-color: var(--primary);
  background: rgba(255, 255, 255, 0.1);
}

.music-thumbnail-mini {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
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
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-channel {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text);
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-actions-mini {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-btn-mini {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.play-mini {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.play-mini:hover {
  background: linear-gradient(135deg, var(--secondary), var(--accent));
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.playlist-mini {
  background: linear-gradient(135deg, #9c27b0, #7b1fa2);
  color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.playlist-mini:hover {
  background: linear-gradient(135deg, #8e24aa, #6a1b9a);
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(156, 39, 176, 0.3);
}

.remove-mini {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.remove-mini:hover {
  background: linear-gradient(135deg, #c82333, #bd2130);
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(220, 53, 69, 0.3);
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
.view-btn {
  background: linear-gradient(135deg, #9c27b0, #7b1fa2);
  color: white;
}

.view-btn:hover {
  background: linear-gradient(135deg, #8e24aa, #6a1b9a);
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

/* Favori Detay Görünümü */
.favorites-details {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: white;
  border-radius: 10px;
  border: 1px solid #e9ecef;
}

.favorites-details h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.music-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.music-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.music-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: white;
}

.music-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.music-info {
  flex: 1;
}

.music-info h5 {
  margin: 0 0 0.25rem 0;
  color: #333;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.3;
}

.music-info p {
  margin: 0;
  color: #666;
  font-size: 0.8rem;
}

.music-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.play-music-btn, .playlist-music-btn, .remove-music-btn {
  border: none;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.play-music-btn {
  background: #f6b92c;
  color: white;
}

.play-music-btn:hover {
  background: #f5a21d;
  transform: translateY(-1px);
}

.playlist-music-btn {
  background: #9c27b0;
  color: white;
}

.playlist-music-btn:hover {
  background: #7b1fa2;
  transform: translateY(-1px);
}

.remove-music-btn {
  background: #dc3545;
  color: white;
}

.remove-music-btn:hover {
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
  padding: 2rem;
  color: #666;
}

.no-results p {
  margin: 0;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .favorites-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .search-box {
    flex-direction: column;
  }
  
  .favorite-item {
    flex-direction: column;
    text-align: center;
  }
  
  .favorite-actions {
    flex-direction: row;
    justify-content: center;
  }
  
  .music-grid {
    grid-template-columns: 1fr;
  }
  
  .music-actions {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .play-music-btn, .playlist-music-btn, .remove-music-btn {
    font-size: 0.7rem;
    padding: 0.4rem 0.6rem;
  }
  
  .minimal-favorite-item {
    padding: 0.75rem;
    gap: 0.75rem;
  }
  
  .music-thumbnail-mini {
    width: 40px;
    height: 40px;
  }
  
  .music-title {
    font-size: 0.8rem;
  }
  
  .music-channel {
    font-size: 0.7rem;
  }
  
  .action-btn-mini {
    width: 28px;
    height: 28px;
    font-size: 0.7rem;
  }
  
  .modern-btn {
    padding: 0.6rem 1rem;
    font-size: 0.8rem;
    gap: 0.4rem;
  }
  
  .btn-text {
    font-size: 0.8rem;
  }
  
  .btn-icon {
    font-size: 0.9rem;
  }
}
</style>
