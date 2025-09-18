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
      currentVideo: null,
      pendingSearchQuery: '', // Login sonrası arama yapılacak query
      pendingVideos: [], // Login sonrası gösterilecek videolar
      searchHistory: [], // Arama geçmişi
      showSearchHistory: false // Arama geçmişi gösterilsin mi
    }
  },
  mounted() {
    this.loadPlaylists()
    window.addEventListener('playlists-updated', this.loadPlaylists)
    
    // Keycloak durumunu kontrol et
    if (window.$keycloak) {
      this.isAuthenticated = window.$keycloak.authenticated
      
      // Login sonrası bekleyen arama varsa devam et
      if (this.pendingSearchQuery && this.pendingVideos.length > 0) {
        this.searchQuery = this.pendingSearchQuery
        this.videos = this.pendingVideos
        this.hasSearched = true
        this.pendingSearchQuery = ''
        this.pendingVideos = []
      }
    }
    
    // Keycloak login event'ini dinle
    window.addEventListener('keycloak-login', this.onKeycloakLogin)
  },
  beforeUnmount() {
    window.removeEventListener('playlists-updated', this.loadPlaylists)
    window.removeEventListener('keycloak-login', this.onKeycloakLogin)
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
  
    async addToFavorites(video) {
      if (!this.isAuthenticated) {
        alert('Favorilere eklemek için giriş yapın!')
        return
      }
      
      const videoId = video.id?.videoId || video.videoId
      if (!videoId) {
        this.showMessage('❌ Video ID bulunamadı!')
        return
      }
      
      try {
        console.log('🔄 Favorilere ekleniyor:', video.snippet?.title || video.title)
        
        // Önce müziği database'e ekle (eğer yoksa)
        const musicData = {
          video_id: videoId,
          title: video.snippet?.title || video.title,
          channel_title: video.snippet?.channelTitle || video.channelTitle,
          thumbnail_url: video.snippet?.thumbnails?.medium?.url || video.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
          is_fav: true // Direkt favori olarak ekle
        }
        
        // Müziği database'e ekle
        const createResponse = await fetch('http://localhost:5000/api/music/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('keycloak-token')}`
          },
          body: JSON.stringify(musicData)
        })
        
        if (createResponse.ok) {
          console.log('✅ Müzik database\'e eklendi ve favori yapıldı')
          this.showMessage(`✅ ${video.snippet?.title || video.title} favorilere eklendi!`)
          
          // Event dispatch et
          window.dispatchEvent(new CustomEvent('favorites-updated'))
        } else {
          // Müzik zaten varsa, favori yap
          const toggleResponse = await fetch(`http://localhost:5000/api/music/toggle-favorite/${videoId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('keycloak-token')}`
            }
          })
          
          if (toggleResponse.ok) {
            const data = await toggleResponse.json()
            console.log('✅ Favori durumu güncellendi:', data)
            this.showMessage(`✅ ${video.snippet?.title || video.title} favorilere eklendi!`)
            
            // Event dispatch et
            window.dispatchEvent(new CustomEvent('favorites-updated'))
          } else {
            const errorData = await toggleResponse.json()
            console.error('❌ Favori ekleme hatası:', errorData)
            this.showMessage(`❌ Favori eklenemedi: ${errorData.error}`, 'error')
          }
        }
      } catch (error) {
        console.error('❌ Favori ekleme hatası:', error)
        this.showMessage('❌ Favori eklenemedi!', 'error')
      }
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
        
        const userId = window.$keycloak?.subject || 'guest'
        
        const response = await fetch(`http://localhost:5000/api/playlists/${playlistId}/add-music`, {
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
            youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
            user_id: userId
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
  
    // Arama geçmişini yükle
    async loadSearchHistory() {
      if (!this.isAuthenticated) {
        this.searchHistory = []
        return
      }
      
      try {
        const userId = window.$keycloak?.subject
        if (!userId) return
        
        const response = await fetch(`http://localhost:5000/api/music/search-history/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('keycloak-token')}`
          }
        })
        
        if (response.ok) {
          this.searchHistory = await response.json()
          console.log('🔍 Arama geçmişi yüklendi:', this.searchHistory.length, 'müzik')
        }
      } catch (error) {
        console.error('❌ Arama geçmişi yükleme hatası:', error)
      }
    },

    // Arama kutusuna odaklanıldığında
    onSearchFocus() {
      if (this.isAuthenticated) {
        this.showSearchHistory = true
        this.loadSearchHistory()
      }
    },

    // Arama geçmişini gizle
    hideSearchHistory() {
      // Kısa bir gecikme ile gizle (tıklama işlemi tamamlansın)
      setTimeout(() => {
        this.showSearchHistory = false
      }, 200)
    },

    // Arama geçmişinden müzik seç
    selectFromHistory(music) {
      this.searchQuery = music.title
      this.showSearchHistory = false
      // Müziği oynat
      this.playMusic({
        id: { videoId: music.video_id },
        snippet: {
          title: music.title,
          channelTitle: music.channel_title,
          thumbnails: { medium: { url: music.thumbnail_url } }
        }
      })
    },

    // Zaman formatla
    formatTime(dateString) {
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) return 'Az önce'
      if (minutes < 60) return `${minutes} dk önce`
      if (hours < 24) return `${hours} saat önce`
      if (days < 7) return `${days} gün önce`
      return date.toLocaleDateString('tr-TR')
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
        console.log(' Login başlatılıyor...')
        
        // Mevcut arama sonuçlarını sakla
        if (this.hasSearched && this.videos.length > 0) {
          this.pendingSearchQuery = this.searchQuery
          this.pendingVideos = [...this.videos]
          console.log('💾 Arama sonuçları saklandı:', this.pendingSearchQuery)
        }
        
        window.$keycloak.login({
          redirectUri: window.location.origin
        })
      } else {
        console.error('❌ Keycloak bulunamadı!')
        alert('Giriş yapılamıyor. Lütfen sayfayı yenileyin.')
      }
    },
    
    onKeycloakLogin() {
      console.log('✅ Keycloak login eventi alındı')
      this.isAuthenticated = true
      
      // Bekleyen arama sonuçlarını göster
      if (this.pendingSearchQuery && this.pendingVideos.length > 0) {
        this.searchQuery = this.pendingSearchQuery
        this.videos = this.pendingVideos
        this.hasSearched = true
        this.pendingSearchQuery = ''
        this.pendingVideos = []
        console.log('🎵 Arama sonuçları geri yüklendi:', this.searchQuery)
      } else if (this.pendingSearchQuery) {
        // Sadece query varsa yeniden arama yap
        this.searchQuery = this.pendingSearchQuery
        this.pendingSearchQuery = ''
        this.searchYouTube()
        console.log('🔍 Bekleyen arama yeniden yapılıyor:', this.searchQuery)
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
      <div class="search-input-wrapper">
        <input 
          v-model="searchQuery" 
          @keyup.enter="searchYouTube"
          @input="onSearchInput"
          @focus="onSearchFocus"
          @blur="hideSearchHistory"
          placeholder="Müzik ara..."
          class="search-input"
        >
        
        <!-- Arama geçmişi dropdown -->
        <div v-if="showSearchHistory && searchHistory.length > 0" class="search-history">
          <div class="search-history-header">
            <h4>🔍 Son Aramalar</h4>
            <span class="history-count">{{ searchHistory.length }} müzik</span>
          </div>
          <div class="history-list">
            <div 
              v-for="music in searchHistory" 
              :key="music.id"
              @click="selectFromHistory(music)"
              class="history-item"
            >
              <img :src="music.thumbnail_url" :alt="music.title" class="history-thumbnail">
              <div class="history-info">
                <h5 class="history-title">{{ music.title }}</h5>
                <p class="history-channel">{{ music.channel_title }}</p>
                <span class="history-time">{{ formatTime(music.created_at) }}</span>
              </div>
              <div class="history-play">▶️</div>
            </div>
          </div>
        </div>
      </div>
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
  position: relative;
  max-width: 100%;
  width: 100%;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  outline: none;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: #333;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
}

.search-input::placeholder {
  color: rgba(0, 0, 0, 0.6);
  font-weight: 400;
}

/* Arama Geçmişi Stilleri */
.search-history {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 400px;
  overflow: hidden;
  margin-top: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
}

.search-history-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  opacity: 0.8;
}

.history-count {
  font-size: 12px;
  color: #666;
  background: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px 0;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.history-item:hover {
  background: rgba(102, 126, 234, 0.08);
  transform: translateX(4px);
}

.history-item:last-child {
  border-bottom: none;
}

.history-thumbnail {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  margin-right: 12px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-channel {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #666;
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: 11px;
  color: #999;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 8px;
  display: inline-block;
}

.history-play {
  font-size: 16px;
  color: #667eea;
  opacity: 0.6;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.history-item:hover .history-play {
  opacity: 1;
  transform: scale(1.1);
}

.search-btn {
  background: #f5a21d;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  min-width: 100px;
  height: fit-content;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(245, 162, 29, 0.3);
}

.search-btn:hover {
  background: #e6941a;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 162, 29, 0.4);
}

.search-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(245, 162, 29, 0.3);
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
    gap: 0.75rem;
  }
  
  .search-input-wrapper {
    margin-bottom: 0;
  }
  
  .search-btn {
    width: 100%;
    min-width: auto;
    padding: 0.875rem 1.5rem;
  }
  
  .search-history {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90vw;
    max-width: 400px;
    max-height: 70vh;
  }
  
  .history-item {
    padding: 16px 20px;
  }
  
  .history-thumbnail {
    width: 56px;
    height: 56px;
  }
  
  .history-title {
    font-size: 15px;
  }
  
  .history-channel {
    font-size: 13px;
  }
  
  .example-tags {
    flex-direction: column;
    align-items: center;
  }
}
</style>