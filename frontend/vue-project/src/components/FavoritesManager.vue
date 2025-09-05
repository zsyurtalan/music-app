<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const favorites = ref([])
const showAddForm = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)

// Favori müzikleri localStorage'dan yükle
const loadFavorites = () => {
  const saved = localStorage.getItem('music-favorites')
  if (saved) {
    favorites.value = JSON.parse(saved)
  }
}

// localStorage değişikliklerini dinle
const handleStorageChange = () => {
  loadFavorites()
}

// Favori müzik arama formunu göster/gizle
const toggleAddForm = () => {
  showAddForm.value = !showAddForm.value
  if (showAddForm.value) {
    searchQuery.value = ''
    searchResults.value = []
  }
}

// YouTube'da müzik ara
const searchMusic = async () => {
  if (!searchQuery.value.trim()) return
  
  searchLoading.value = true
  try {
    const response = await fetch(`http://localhost:5000/api/youtube/search?q=${searchQuery.value}&maxResults=10`)
    const data = await response.json()
    searchResults.value = data.data
  } catch (error) {
    console.error('Arama hatası:', error)
    alert('Müzik araması yapılamadı!')
  } finally {
    searchLoading.value = false
  }
}

// Favorilere müzik ekle
const addToFavorites = (video) => {
  if (!favorites.value.find(v => v.id === video.id)) {
    const favoriteMusic = {
      ...video,
      addedDate: new Date().toISOString()
    }
    favorites.value.unshift(favoriteMusic)
    saveFavorites()
    alert(`❤️ ${video.title} favorilere eklendi!`)
  } else {
    alert('⚠️ Bu müzik zaten favorilerinizde!')
  }
}

// Favorilerden müzik çıkar
const removeFromFavorites = (videoId) => {
  if (confirm('Bu müziği favorilerden çıkarmak istediğinizden emin misiniz?')) {
    favorites.value = favorites.value.filter(v => v.id !== videoId)
    saveFavorites()
  }
}

// Favorileri localStorage'a kaydet
const saveFavorites = () => {
  localStorage.setItem('music-favorites', JSON.stringify(favorites.value))
  window.dispatchEvent(new CustomEvent('favorites-updated'))
}

// Favori müziği çal
const playFavorite = (video) => {
  window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')
}

// Tüm favorileri temizle
const clearAllFavorites = () => {
  if (confirm('Tüm favori müzikleri silmek istediğinizden emin misiniz?')) {
    favorites.value = []
    saveFavorites()
  }
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
    <div class="favorites-header">
      <h2>❤️ Favori Müziklerim</h2>
      <div class="header-actions">
        <button @click="toggleAddForm" class="add-btn">
          {{ showAddForm ? '❌ İptal' : '➕ Müzik Ekle' }}
        </button>
        <button 
          v-if="favorites.length > 0"
          @click="clearAllFavorites" 
          class="clear-btn"
        >
          🗑️ Tümünü Temizle
        </button>
      </div>
    </div>

    <!-- Müzik Ekleme Formu -->
    <div v-if="showAddForm" class="add-form">
      <div class="search-section">
        <h4>�� Müzik Ara ve Favorilere Ekle</h4>
        <div class="search-box">
          <input 
            v-model="searchQuery"
            @keyup.enter="searchMusic"
            type="text" 
            placeholder="Müzik ara... (örn: Ed Sheeran)"
            class="search-input"
          />
          <button 
            @click="searchMusic" 
            :disabled="searchLoading"
            class="search-btn"
          >
            {{ searchLoading ? 'Aranıyor...' : '🔍 Ara' }}
          </button>
        </div>
      </div>

      <!-- Arama Sonuçları -->
      <div v-if="searchResults.length > 0" class="search-results">
        <h5>Arama Sonuçları:</h5>
        <div class="music-grid">
          <div 
            v-for="video in searchResults" 
            :key="video.id"
            class="music-card"
          >
            <img :src="video.thumbnail" :alt="video.title" class="music-thumbnail" />
            <div class="music-info">
              <h6>{{ video.title }}</h6>
              <p>{{ video.channelTitle }}</p>
            </div>
            <button 
              @click="addToFavorites(video)"
              class="add-favorite-btn"
            >
              ❤️ Favorilere Ekle
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Favori Müzikler Listesi -->
    <div v-if="favorites.length === 0" class="empty-state">
      <p>❤️ Henüz favori müziğiniz yok</p>
      <p>Yukarıdaki "Müzik Ekle" butonuna tıklayarak başlayın!</p>
    </div>

    <div v-else class="favorites-list">
      <div class="favorites-stats">
        <p>Toplam {{ favorites.length }} favori müzik</p>
      </div>
      
      <div class="favorites-grid">
        <div 
          v-for="music in favorites" 
          :key="music.id"
          class="favorite-item"
        >
          <img :src="music.thumbnail" :alt="music.title" class="favorite-thumbnail" />
          
          <div class="favorite-info">
            <h4>{{ music.title }}</h4>
            <p class="channel">{{ music.channelTitle }}</p>
            <p class="added-date">{{ new Date(music.addedDate).toLocaleDateString('tr-TR') }} tarihinde eklendi</p>
          </div>
          
          <div class="favorite-actions">
            <button @click="playFavorite(music)" class="play-btn">
              ▶️ Çal
            </button>
            <button @click="addToPlaylist(music)" class="playlist-btn">
              📝 Playlist'e Ekle
            </button>
            <button @click="removeFromFavorites(music.id)" class="remove-btn">
              ❌ Kaldır
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.favorites-manager {
  width: 100%;
}

.favorites-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.favorites-header h2 {
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.add-btn, .clear-btn {
  border: none;
  border-radius: 25px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.add-btn {
  background: #e91e63;
  color: white;
}

.add-btn:hover {
  background: #c2185b;
  transform: translateY(-2px);
}

.clear-btn {
  background: #dc3545;
  color: white;
}

.clear-btn:hover {
  background: #c82333;
  transform: translateY(-2px);
}

.add-form {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
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
  border: 2px solid #ddd;
  border-radius: 25px;
  outline: none;
  font-size: 1rem;
}

.search-input:focus {
  border-color: #e91e63;
}

.search-btn {
  background: #e91e63;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
}

.search-btn:hover:not(:disabled) {
  background: #c2185b;
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
  border-radius: 5px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.8rem;
  width: 100%;
  margin-top: 0.75rem;
  transition: all 0.3s ease;
}

.add-favorite-btn:hover {
  background: #c2185b;
  transform: scale(1.02);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.favorites-stats {
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: linear-gradient(45deg, #e91e63, #f06292);
  color: white;
  border-radius: 10px;
}

.favorites-stats p {
  margin: 0;
  font-size: 1.1rem;
  font-weight: bold;
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
  background: #f8f9fa;
  border-radius: 15px;
  padding: 1rem;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.favorite-item:hover {
  transform: translateX(5px);
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
  border-radius: 5px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.play-btn {
  background: #28a745;
  color: white;
}

.play-btn:hover {
  background: #218838;
}

.playlist-btn {
  background: #6f42c1;
  color: white;
}

.playlist-btn:hover {
  background: #5a32a3;
}

.remove-btn {
  background: #dc3545;
  color: white;
}

.remove-btn:hover {
  background: #c82333;
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
}
</style>
