<script>
import { youtubeAPI } from '../services/api.js'
import axios from 'axios'

export default {
  name: 'YouTubeSearch',
  data() {
    return {
      searchQuery: '',
      videos: [],
      loading: false,
      hasSearched: false,
      showPlaylistMenu: false,
      selectedVideo: null,
      playlists: [],
      isAuthenticated: false,
      currentVideo: null
    }
  },
  mounted() {
    this.loadPlaylists()
    window.addEventListener('playlists-updated', this.loadPlaylists)
    
    // Keycloak durumunu kontrol et
    if (window.$keycloak) {
      this.isAuthenticated = window.$keycloak.authenticated
    }
  },
  beforeUnmount() {
    window.removeEventListener('playlists-updated', this.loadPlaylists)
  },
  methods: {
    async searchYouTube() {
      if (!this.searchQuery.trim()) return
      this.loading = true
      this.hasSearched = true
      try {
        console.log(' Arama başlatılıyor:', this.searchQuery)
        console.log(' API URL:', `http://localhost:5000/api/youtube/search?q=${this.searchQuery}&maxResults=10`)
      
        const response = await youtubeAPI.search(this.searchQuery)
        console.log('🔍 Frontend Response:', response)
        console.log(' Response Status:', response.status)
        console.log(' Response Data:', response.data)
        console.log(' Response Type:', typeof response)
        console.log(' Is Array:', Array.isArray(response))
      
      // Response direkt array olarak geliyor
        if (Array.isArray(response)) {
          this.videos = response
          console.log('✅ Videolar yüklendi (Array):', this.videos.length)
        } else if (response.data && Array.isArray(response.data)) {
          this.videos = response.data
          console.log('✅ Videolar yüklendi (response.data):', this.videos.length)
        } else {
          console.error('❌ Beklenmeyen response formatı:', response)
          this.videos = []
          this.showMessage('❌ Arama sonuçları alınamadı')
        }
      } catch (error) {
        console.error('❌ YouTube arama hatası:', error)
        console.error('❌ Error response:', error.response)
        console.error('❌ Error message:', error.message)
        this.videos = []
        this.showMessage('❌ Arama hatası: ' + error.message)
      } finally {
        this.loading = false
      }
    },
  
    searchExample(example) {
      this.searchQuery = example
      this.searchYouTube()
    },
    
    onSearchInput() {
      // Arama kutusu temizlendiğinde default ekrana dön
      if (!this.searchQuery.trim()) {
        this.hasSearched = false
        this.videos = []
        this.loading = false
      }
    },
  
    playMusic(video) {
      console.log('🎵 Video objesi:', video)
      console.log('🎵 Video ID:', video.id?.videoId)
    
      if (!video.id?.videoId) {
        console.error('❌ Video ID bulunamadı!')
        this.showMessage('❌ Video ID bulunamadı!')
        return
      }
    
      const videoId = video.id.videoId
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`
    
      console.log('🔗 YouTube URL:', youtubeUrl)
    
      window.open(youtubeUrl, '_blank')
    
      this.currentVideo = video
      window.dispatchEvent(new CustomEvent('play-music', {
        detail: {
          video: video,
          title: video.snippet.title,
          channel: video.snippet.channelTitle,
          thumbnail: video.snippet.thumbnails.medium.url,
          videoId: video.id.videoId,
          youtubeUrl: youtubeUrl
        }
      }))
    
      this.showMessage('🎵 YouTube\'da açılıyor: ' + video.snippet.title)
    },
  
    openYouTube(videoId) {
      this.playMusic({ id: { videoId: videoId } })
    },
  
    addToFavorites(video) {
      if (!this.isAuthenticated) {
        alert('Favorilere eklemek için giriş yapın!')
        return
      }
      
      const videoId = video.id?.videoId || video.videoId
      if (!videoId) {
        this.showMessage('❌ Video ID bulunamadı!')
        return
      }
      
      // Favorileri yükle
      const saved = localStorage.getItem('music-favorites')
      const favorites = saved ? JSON.parse(saved) : []
      
      // Zaten var mı kontrol et
      const existingFavorite = favorites.find(fav => {
        const favId = fav.id?.videoId || fav.videoId || fav.id
        return favId === videoId
      })
      
      if (existingFavorite) {
        this.showMessage('⚠️ Bu müzik zaten favorilerinizde!')
        return
      }
      
      // Favori objesini oluştur
      const favoriteData = {
        id: {
          videoId: videoId
        },
        snippet: {
          title: video.snippet?.title || video.title,
          channelTitle: video.snippet?.channelTitle || video.channelTitle,
          thumbnails: {
            medium: {
              url: video.snippet?.thumbnails?.medium?.url || video.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            }
          }
        },
        videoId: videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        addedAt: new Date().toISOString()
      }
      
      // Favorilere ekle
      favorites.push(favoriteData)
      
      // localStorage'a kaydet
      localStorage.setItem('music-favorites', JSON.stringify(favorites))
      
      // Event dispatch et
      window.dispatchEvent(new CustomEvent('favorites-updated'))
      
      this.showMessage('❤️ Favorilere eklendi: ' + favoriteData.snippet.title)
    },
  
    togglePlaylistMenu(video) {
      if (!this.isAuthenticated) {
        this.showMessage('❌ Playlist oluşturmak için giriş yapın!', 'warning')
        return
      }
    
      this.selectedVideo = video
      this.showPlaylistMenu = !this.showPlaylistMenu
    },
  
    closePlaylistMenu() {
      this.showPlaylistMenu = false
      this.selectedVideo = null
    },
  
    async addToPlaylist(playlistId, video) {
      if (!this.isAuthenticated) {
        this.showMessage('❌ Playlist\'e eklemek için giriş yapın!', 'warning')
        return
      }
      
      // Playlist'i bul
      const playlist = this.playlists.find(p => p.id === playlistId)
      if (!playlist) {
        this.showMessage('❌ Playlist bulunamadı!')
        return
      }
      
      // Video ID'yi al
      const videoId = video.id?.videoId || video.videoId
      if (!videoId) {
        this.showMessage('❌ Video ID bulunamadı!')
        return
      }
      
      // Müzik zaten var mı kontrol et
      const existingVideo = playlist.videos?.find(v => {
        const vId = v.id?.videoId || v.videoId || v.id
        return vId === videoId
      })
      
      if (existingVideo) {
        this.showMessage('⚠️ Bu müzik zaten bu playlist\'te!')
        this.closePlaylistMenu()
        return
      }
      
      // Backend'e playlist'e ekle
      try {
        console.log('🔄 Müzik playlist\'e ekleniyor:', video.snippet?.title || video.title)
        
        const response = await fetch(`/api/playlists/${playlistId}/add-music`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('keycloak-token')}`
          },
          body: JSON.stringify({
            id: videoId,
            title: video.snippet?.title || video.title,
            channelTitle: video.snippet?.channelTitle || video.channelTitle,
            thumbnail: video.snippet?.thumbnails?.medium?.url || video.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            videoId: videoId,
            youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`
          })
        })
        
        if (response.ok) {
          const updatedPlaylist = await response.json()
          console.log('✅ Müzik playlist\'e eklendi')
          
          // Playlist'i güncelle
          const playlistIndex = this.playlists.findIndex(p => p.id === playlistId)
          if (playlistIndex !== -1) {
            this.playlists[playlistIndex] = {
              ...this.playlists[playlistIndex],
              videos: updatedPlaylist.videos || []
            }
          }
          
          this.showMessage(`✅ "${video.snippet?.title || video.title}" "${playlist.name}" playlist'ine eklendi!`)
          this.closePlaylistMenu()
        } else {
          const errorData = await response.json()
          console.error('❌ Müzik ekleme hatası:', errorData)
          this.showMessage(`❌ Müzik eklenemedi: ${errorData.error}`, 'error')
        }
      } catch (error) {
        console.error('❌ Müzik ekleme hatası:', error)
        this.showMessage('❌ Müzik eklenemedi!', 'error')
      }
      this.closePlaylistMenu()
    },
  
    async loadPlaylists() {
      // Sadece giriş yapmış kullanıcılar için playlist'leri yükle
      if (!this.isAuthenticated) {
        this.playlists = []
        return
      }
      
      try {
        const userId = window.$keycloak?.subject || 'guest'
        const token = localStorage.getItem('keycloak-token')
        
        console.log('🔍 YouTubeSearch - Keycloak subject:', window.$keycloak?.subject)
        console.log('🔍 YouTubeSearch - User ID:', userId)
        
        if (userId === 'guest') {
          console.log('👤 Misafir kullanıcı - playlist yüklenmiyor')
          this.playlists = []
          return
        }
        
        console.log('🔄 Playlist\'ler yükleniyor, kullanıcı ID:', userId)
        
        const response = await fetch(`/api/playlists/user/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          this.playlists = data.map(playlist => ({
            id: playlist.id,
            name: playlist.name,
            description: playlist.description || '',
            is_public: playlist.is_public || false,
            videos: playlist.videos || [],
            created: playlist.created_at || new Date().toISOString(),
            created_at: playlist.created_at || new Date().toISOString()
          }))
          console.log('✅ Playlist\'ler yüklendi:', this.playlists.length, 'adet')
        } else {
          console.error('❌ Playlist yükleme hatası:', response.status)
          // Fallback: localStorage'dan yükle
          const saved = localStorage.getItem('music-playlists')
          this.playlists = saved ? JSON.parse(saved) : []
          console.log('📱 Fallback: localStorage\'dan yüklendi:', this.playlists.length, 'adet')
        }
      } catch (error) {
        console.error('❌ Playlist yükleme hatası:', error)
        // Fallback: localStorage'dan yükle
        const saved = localStorage.getItem('music-playlists')
        this.playlists = saved ? JSON.parse(saved) : []
        console.log('📱 Fallback: localStorage\'dan yüklendi:', this.playlists.length, 'adet')
      }
    },
    showLoginPrompt(message) {
      const confirmed = confirm(message + '\n\nGiriş yapmak ister misiniz?')
      if (confirmed) {
        this.login()
      }
    },
    
    login() {
      if (window.$keycloak) {
        console.log('�� Login başlatılıyor...')
        window.$keycloak.login({
          redirectUri: window.location.origin
        })
      } else {
        console.error('❌ Keycloak bulunamadı!')
        alert('Giriş yapılamıyor. Lütfen sayfayı yenileyin.')
      }
    },
  
    showMessage(message) {
      const messageDiv = document.createElement('div')
      messageDiv.textContent = message
      messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `
    
      document.body.appendChild(messageDiv)
    
      setTimeout(() => {
        messageDiv.remove()
      }, 3000)
    }
  }
}

</script>
<template>
  <div class="youtube-search">
    <h2>🎵 Müzik Arama</h2>
    
    <div class="search-container">
      <input 
        v-model="searchQuery" 
        @keyup.enter="searchYouTube"
        @input="onSearchInput"
        placeholder="Müzik ara..."
        class="search-input"
      >
      <button @click="searchYouTube" class="search-btn">Ara</button>
    </div>

     <!-- İlk açılış durumu -->
     <div v-if="!hasSearched && !loading" class="welcome-message">
      <h3>🎵 Müzik Arama</h3>
    </div>
    <div v-if="loading" class="loading">
      <p>🔍 Arama yapılıyor...</p>
    </div>

    <div v-else-if="hasSearched && videos && videos.length === 0" class="no-results">
      <p>❌ Sonuç bulunamadı</p>
    </div>

    <div v-else-if="videos && videos.length > 0" class="video-grid">
      <div v-for="video in videos" :key="video.id.videoId" class="video-card">
        <img :src="video.snippet.thumbnails.medium.url" :alt="video.snippet.title" class="video-thumbnail">
        <div class="video-info">
          <h3 class="video-title">{{ video.snippet.title }}</h3>
          <p class="video-channel">{{ video.snippet.channelTitle }}</p>
          <div class="video-actions">
            <!-- Müzik çal butonu - YouTube'da açar -->
            <button @click="playMusic(video)" class="action-btn play-btn">▶️ Çal</button>
            
            
            <!-- Sadece login olunca görünecek butonlar -->
            <template v-if="isAuthenticated">
              <button @click="addToFavorites(video)" class="action-btn favorites-btn">
                ❤️ Favorilere Ekle
              </button>
              <button @click="togglePlaylistMenu(video)" class="action-btn playlist-btn">
                📝 Playlist'e Ekle
              </button>
            </template>
              <!-- Misafir modu uyarısı -->
              <template v-else>
              <div class="guest-warning">
                <button @click="login" class="login-btn-small">Favori ve playlist özellikleri için giriş yapın</button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
             <!-- Playlist menüsü - Sadece login olunca -->
    <div v-if="showPlaylistMenu && isAuthenticated" class="playlist-menu-overlay" @click="closePlaylistMenu">
      <div class="playlist-menu" @click.stop>
        <h3>Playlist Seçin</h3>
        <div v-if="playlists.length === 0" class="no-playlists">
          <p>Henüz playlist oluşturmadınız</p>
          <button @click="closePlaylistMenu" class="close-btn">Kapat</button>
        </div>
        <div v-else>
          <div v-for="playlist in playlists" :key="playlist.id" class="playlist-item">
            <span>{{ playlist.name }}</span>
            <button @click="addToPlaylist(playlist.id, selectedVideo)" class="add-btn">Ekle</button>
          </div>
          <button @click="closePlaylistMenu" class="close-btn">Kapat</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.youtube-search {
  width: 100%;
}

.search-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
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
  border-color: #667eea;
}

.search-btn {
  background: #f5a21d;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
}

.welcome-message {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  margin-bottom: 2rem;
}

.search-examples {
  margin-top: 1rem;
}

.example-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}

.example-tag {
  background: #f0f0f0;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.example-tag:hover {
  background: #e0e0e0;
  transform: scale(1.05);
}

.loading, .no-results {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.video-card {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 1rem;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.video-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.video-thumbnail {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 1rem;
}

.video-info h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1rem;
  font-weight: 600;
}

.video-channel {
  color: #666;
  font-size: 0.9rem;
  margin: 0.25rem 0 1rem 0;
}

.video-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-btn {
  background: #f6b92c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.action-btn:hover {
  background: #f6b92c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}


.favorites-btn {
  background: #e91e63;
}

.favorites-btn:hover {
  background: #c2185b;
}

.playlist-btn {
  background: #9c27b0;
}

.playlist-btn:hover {
  background: #7b1fa2;
}

.guest-warning {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid #ffc107;
  border-radius: 10px;
  padding: 0.5rem;
  margin-top: 0.5rem;
  text-align: center;
}

.guest-warning p {
  margin: 0;
  color: #856404;
  font-size: 0.9rem;
  font-weight: 500;
}

.playlist-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.playlist-menu {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.playlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.add-btn, .close-btn {
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.add-btn:hover, .close-btn:hover {
  background: #45a049;
}

.no-playlists {
  text-align: center;
  padding: 1rem;
}
.guest-warning {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid #ffc107;
  border-radius: 10px;
  padding: 0.5rem;
  margin-top: 0.5rem;
  text-align: center;
}

.guest-warning p {
  margin: 0 0 0.5rem 0;
  color: #856404;
  font-size: 0.9rem;
  font-weight: 500;
}

.login-btn-small {
  background: #f6b92c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.login-btn-small:hover {
  background: #f6b92c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
/* Responsive */
@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: 1fr;
  }
  
  .search-container {
    flex-direction: column;
  }
  
  .example-tags {
    flex-direction: column;
    align-items: center;
  }
}
</style>