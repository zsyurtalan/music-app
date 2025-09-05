<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const playlists = ref([])
const newPlaylistName = ref('')
const showCreateForm = ref(false)
const showAddMusicForm = ref({})
const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)

// Playlist'leri localStorage'dan yükle
const loadPlaylists = () => {
  const saved = localStorage.getItem('music-playlists')
  if (saved) {
    playlists.value = JSON.parse(saved)
  }
}

// localStorage değişikliklerini dinle
const handleStorageChange = () => {
  loadPlaylists()
}

// Müzik arama formunu göster/gizle
const toggleAddMusicForm = (playlistId) => {
  showAddMusicForm.value[playlistId] = !showAddMusicForm.value[playlistId]
  if (showAddMusicForm.value[playlistId]) {
    searchQuery.value = ''
    searchResults.value = []
  }
}

// YouTube'da müzik ara
const searchMusic = async (playlistId) => {
  if (!searchQuery.value.trim()) return
  
  searchLoading.value = true
  try {
    const response = await fetch(`http://localhost:5000/api/youtube/search?q=${searchQuery.value}&maxResults=5`)
    const data = await response.json()
    searchResults.value = data.data
  } catch (error) {
    console.error('Arama hatası:', error)
    alert('Müzik araması yapılamadı!')
  } finally {
    searchLoading.value = false
  }
}

// Playlist'e müzik ekle
const addMusicToPlaylist = (playlistId, video) => {
  const playlist = playlists.value.find(p => p.id === playlistId)
  if (playlist && !playlist.videos.find(v => v.id === video.id)) {
    playlist.videos.push(video)
    savePlaylists()
    alert(`✅ ${video.title} "${playlist.name}" playlist'ine eklendi!`)
    showAddMusicForm.value[playlistId] = false
    searchQuery.value = ''
    searchResults.value = []
  } else if (playlist && playlist.videos.find(v => v.id === video.id)) {
    alert('⚠️ Bu müzik zaten bu playlist\'te!')
  }
}

// Yeni playlist oluştur
const createPlaylist = () => {
  if (!newPlaylistName.value.trim()) return
  
  const newPlaylist = {
    id: Date.now(),
    name: newPlaylistName.value,
    videos: [],
    created: new Date().toISOString(),
    description: ''
  }
  
  playlists.value.push(newPlaylist)
  savePlaylists()
  newPlaylistName.value = ''
  showCreateForm.value = false
}

// Playlist'leri localStorage'a kaydet
const savePlaylists = () => {
  localStorage.setItem('music-playlists', JSON.stringify(playlists.value))
  window.dispatchEvent(new CustomEvent('playlists-updated'))
}

// Playlist'ten müzik çıkar
const removeFromPlaylist = (playlistId, videoId) => {
  const playlist = playlists.value.find(p => p.id === playlistId)
  if (playlist) {
    playlist.videos = playlist.videos.filter(v => v.id !== videoId)
    savePlaylists()
  }
}

// Playlist'i sil
const deletePlaylist = (playlistId) => {
  if (confirm('Bu playlist\'i silmek istediğinizden emin misiniz?')) {
    playlists.value = playlists.value.filter(p => p.id !== playlistId)
    savePlaylists()
  }
}

// Playlist'i çal
const playPlaylist = (playlist) => {
  if (playlist.videos.length === 0) {
    alert('Bu playlist boş!')
    return
  }
  
  const firstVideo = playlist.videos[0]
  window.open(`https://www.youtube.com/watch?v=${firstVideo.id}`, '_blank')
}

onMounted(() => {
  loadPlaylists()
  window.addEventListener('storage', handleStorageChange)
  window.addEventListener('playlists-updated', handleStorageChange)
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
  window.removeEventListener('playlists-updated', handleStorageChange)
})
</script>

<template>
  <div class="playlist-manager">
    <div class="playlist-header">
      <h2> Playlist'lerim</h2>
      <button @click="showCreateForm = !showCreateForm" class="create-btn">
        {{ showCreateForm ? '❌ İptal' : '➕ Yeni Playlist' }}
      </button>
    </div>

    <!-- Yeni Playlist Oluşturma Formu -->
    <div v-if="showCreateForm" class="create-form">
      <input 
        v-model="newPlaylistName"
        @keyup.enter="createPlaylist"
        type="text" 
        placeholder="Playlist adı girin..."
        class="playlist-input"
      />
      <button @click="createPlaylist" class="save-btn"> Oluştur</button>
    </div>

    <!-- Playlist Listesi -->
    <div v-if="playlists.length === 0" class="empty-state">
      <p> Henüz playlist oluşturmadınız</p>
      <p>Yukarıdaki "Yeni Playlist" butonuna tıklayarak başlayın!</p>
    </div>

    <div v-else class="playlists-grid">
      <div 
        v-for="playlist in playlists" 
        :key="playlist.id"
        class="playlist-card"
      >
        <div class="playlist-info">
          <h3>{{ playlist.name }}</h3>
          <p class="playlist-count">{{ playlist.videos.length }} müzik</p>
          <p class="playlist-date">{{ new Date(playlist.created).toLocaleDateString('tr-TR') }}</p>
        </div>
        
        <div class="playlist-actions">
          <button 
            @click="playPlaylist(playlist)" 
            :disabled="playlist.videos.length === 0"
            class="play-btn"
          >
            ▶️ Çal
          </button>
          <button 
            @click="toggleAddMusicForm(playlist.id)" 
            class="add-music-btn"
          >
            🎵 Müzik Ekle
          </button>
          <button @click="deletePlaylist(playlist.id)" class="delete-btn">
            🗑️ Sil
          </button>
        </div>

        <!-- Müzik Ekleme Formu -->
        <div v-if="showAddMusicForm[playlist.id]" class="add-music-form">
          <div class="search-section">
            <h4>🎵 Müzik Ara ve Ekle</h4>
            <div class="search-box">
              <input 
                v-model="searchQuery"
                @keyup.enter="searchMusic(playlist.id)"
                type="text" 
                placeholder="Müzik ara... (örn: Ed Sheeran)"
                class="search-input"
              />
              <button 
                @click="searchMusic(playlist.id)" 
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
            <div class="music-list">
              <div 
                v-for="video in searchResults" 
                :key="video.id"
                class="music-item"
              >
                <img :src="video.thumbnail" :alt="video.title" class="music-thumbnail" />
                <div class="music-info">
                  <h6>{{ video.title }}</h6>
                  <p>{{ video.channelTitle }}</p>
                </div>
                <button 
                  @click="addMusicToPlaylist(playlist.id, video)"
                  class="add-to-playlist-btn"
                >
                  ➕ Ekle
                </button>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button 
              @click="showAddMusicForm[playlist.id] = false"
              class="cancel-btn"
            >
              ❌ İptal
            </button>
          </div>
        </div>

        <!-- Playlist Müzikleri -->
        <div v-if="playlist.videos.length > 0" class="playlist-videos">
          <h4>Müzikler:</h4>
          <div class="video-list">
            <div 
              v-for="video in playlist.videos.slice(0, 3)" 
              :key="video.id"
              class="video-item"
            >
              <img :src="video.thumbnail" :alt="video.title" class="video-thumbnail" />
              <div class="video-details">
                <p class="video-title">{{ video.title }}</p>
                <p class="video-channel">{{ video.channelTitle }}</p>
              </div>
              <button 
                @click="removeFromPlaylist(playlist.id, video.id)"
                class="remove-btn"
              >
                ❌
              </button>
            </div>
            <div v-if="playlist.videos.length > 3" class="more-videos">
              <p>+{{ playlist.videos.length - 3 }} müzik daha...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ... mevcut stilleriniz ... */

.add-music-btn {
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.add-music-btn:hover {
  background: #138496;
}

.add-music-form {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e9ecef;
}

.search-section h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1rem;
}

.search-box {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  outline: none;
  font-size: 0.9rem;
}

.search-input:focus {
  border-color: #17a2b8;
}

.search-btn {
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.search-btn:hover:not(:disabled) {
  background: #138496;
}

.search-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.search-results h5 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 0.9rem;
}

.music-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.music-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: 5px;
  border: 1px solid #e9ecef;
}

.music-thumbnail {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.music-info {
  flex: 1;
}

.music-info h6 {
  margin: 0 0 0.25rem 0;
  color: #333;
  font-size: 0.8rem;
  font-weight: bold;
}

.music-info p {
  margin: 0;
  color: #666;
  font-size: 0.7rem;
}

.add-to-playlist-btn {
  background: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.add-to-playlist-btn:hover {
  background: #218838;
  transform: scale(1.05);
}

.form-actions {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.cancel-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.cancel-btn:hover {
  background: #c82333;
}

.playlist-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
}

@media (max-width: 768px) {
  .search-box {
    flex-direction: column;
  }
  
  .playlist-actions {
    flex-direction: column;
  }
}
</style>