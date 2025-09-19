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
      showSearchHistory: false, // Arama geçmişi gösterilsin mi
      searchTimeout: null, // Debounce için timeout
    }
  },
  mounted() {
    console.log('🔄 YouTubeSearch mounted')
    console.log('🔍 window.$keycloak:', window.$keycloak)
    console.log('🔍 window.$keycloak?.authenticated:', window.$keycloak?.authenticated)
    
    this.loadPlaylists()
    window.addEventListener('playlists-updated', this.loadPlaylists)
    
    // Keycloak durumunu kontrol et
    if (window.$keycloak) {
      this.isAuthenticated = window.$keycloak.authenticated
      console.log('✅ isAuthenticated set to:', this.isAuthenticated)
      
      // Eğer giriş yapmışsa playlist'leri yükle
      if (this.isAuthenticated) {
        console.log('🔄 Mounted - Giriş yapmış kullanıcı, playlist\'ler yükleniyor...')
        this.loadPlaylists()
      }
      
      // Login sonrası bekleyen arama varsa devam et
      if (this.pendingSearchQuery && this.pendingVideos.length > 0) {
        this.searchQuery = this.pendingSearchQuery
        this.videos = this.pendingVideos
        this.hasSearched = true
        this.pendingSearchQuery = ''
        this.pendingVideos = []
      }
    } else {
      console.log('❌ window.$keycloak bulunamadı')
    }
    
    // Keycloak login event'ini dinle
    window.addEventListener('keycloak-login', this.onKeycloakLogin)
    
    // Tab değişikliklerini dinle
    window.addEventListener('switch-tab', this.onTabSwitch)
  },
  beforeUnmount() {
    window.removeEventListener('playlists-updated', this.loadPlaylists)
    window.removeEventListener('keycloak-login', this.onKeycloakLogin)
    window.removeEventListener('switch-tab', this.onTabSwitch)
    
    // Timeout'u temizle
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
    }
  },
  methods: {
    async searchYouTube() {
      if (!this.searchQuery.trim()) return
      
      // Arama geçmişini gizle
      this.showSearchHistory = false
      
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
        
        // Arama geçmişini kaydet
        await this.saveSearchHistory()
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
        return
      }
      
      // Debounce ile arama yap (500ms bekle)
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.searchYouTube()
      }, 500)
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
          is_fav: true // Favori olarak işaretle
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
          console.log('🔄 Favorites-updated event dispatch ediliyor...')
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
            console.log('🔄 Favorites-updated event dispatch ediliyor (toggle)...')
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
          
          // Playlist'i güncelle
          const playlistIndex = this.playlists.findIndex(p => p.id === playlistId)
          if (playlistIndex !== -1) {
            // Musics array'ini videos formatına çevir
            let videos = [];
            if (updatedPlaylist.musics && Array.isArray(updatedPlaylist.musics)) {
              videos = updatedPlaylist.musics.map(music => ({
                id: { videoId: music.video_id },
                snippet: {
                  title: music.title,
                  channelTitle: music.channel_title,
                  thumbnails: {
                    medium: { url: music.thumbnail_url }
                  }
                },
                youtubeUrl: music.youtube_url,
                addedAt: music.PlaylistMusic?.added_at || new Date().toISOString()
              }));
            }
            
            this.playlists[playlistIndex] = {
              ...this.playlists[playlistIndex],
              videos: videos
            }
          }
          
          this.showMessage(`✅ "${video.snippet?.title || video.title}" "${playlist.name}" playlist'ine eklendi!`)
          
          // Diğer component'leri güncelle
          window.dispatchEvent(new CustomEvent('playlists-updated'))
          
          this.closePlaylistMenu()
        } else {
          const errorData = await response.json()
          this.showMessage(`❌ Müzik eklenemedi: ${errorData.error}`, 'error')
        }
      } catch (error) {
        this.showMessage('❌ Müzik eklenemedi!', 'error')
      }
    },
    
    // Playlist Manager'a git
    goToPlaylistManager() {
      this.closePlaylistMenu()
      // Playlist Manager tab'ına geç
      window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'playlists' }))
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
          console.log('🔍 İlk müzik:', this.searchHistory[0])
        }
      } catch (error) {
        console.error('❌ Arama geçmişi yükleme hatası:', error)
      }
    },

    // Arama geçmişini kaydet
    async saveSearchHistory() {
      if (!this.isAuthenticated || !this.searchQuery.trim()) return
      
      try {
        const userId = window.$keycloak?.subject
        if (!userId) return
        
        const response = await fetch(`http://localhost:5000/api/music/search-history`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('keycloak-token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: userId,
            query: this.searchQuery.trim()
          })
        })
        
        if (response.ok) {
          console.log('✅ Arama geçmişi kaydedildi:', this.searchQuery)
          // Arama geçmişini yeniden yükle
          await this.loadSearchHistory()
        } else {
          console.error('❌ Arama geçmişi kaydedilemedi:', response.status)
        }
      } catch (error) {
        console.error('❌ Arama geçmişi kaydetme hatası:', error)
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
      console.log('🔍 Arama geçmişi müziği:', music)
      console.log('🔍 Video ID:', music.video_id)
      console.log('🔍 Tüm alanlar:', Object.keys(music))
      
      this.searchQuery = music.title
      this.showSearchHistory = false
      
      // Video ID'yi bul (farklı alan adları olabilir)
      const videoId = music.video_id || music.videoId || music.id
      
      if (!videoId) {
        console.error('❌ Video ID bulunamadı!')
        this.showMessage('❌ Video ID bulunamadı!')
        return
      }
      
      // Müziği oynat
      this.playMusic({
        id: { videoId: videoId },
        snippet: {
          title: music.title,
          channelTitle: music.channel_title,
          thumbnails: { medium: { url: music.thumbnail_url } }
        }
      })
    },


    // Arama kutusunu temizle
    clearSearch() {
      console.log('🧹 Arama kutusu temizleniyor')
      this.searchQuery = ''
      this.videos = []
      this.hasSearched = false
      this.loading = false
      this.showSearchHistory = false
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
      console.log('🔄 loadPlaylists çağrıldı')
      console.log('🔍 isAuthenticated:', this.isAuthenticated)
      
      // Sadece giriş yapmış kullanıcılar için playlist'leri yükle
      if (!this.isAuthenticated) {
        console.log('❌ Kullanıcı giriş yapmamış - playlist yüklenmiyor')
        this.playlists = []
        return
      }
      
      try {
        const userId = window.$keycloak?.subject || 'guest'
        const token = localStorage.getItem('keycloak-token')
        
        console.log('🔍 userId:', userId)
        console.log('🔍 token:', token ? 'Mevcut' : 'Yok')
        
        if (userId === 'guest') {
          console.log('👤 Misafir kullanıcı - playlist yüklenmiyor')
          this.playlists = []
          return
        }
        
        console.log('🔄 Playlist\'ler yükleniyor, kullanıcı ID:', userId)
        console.log('🔑 Token:', token ? 'Mevcut' : 'Yok')
        
        console.log('🔗 API URL:', `http://localhost:5000/api/playlists/user/${userId}`)
        console.log('🔑 Token değeri:', token)
        console.log('🔑 Token uzunluğu:', token ? token.length : 0)
        
        const response = await fetch(`http://localhost:5000/api/playlists/user/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        
        console.log('📡 Response status:', response.status)
        console.log('📡 Response ok:', response.ok)
        
        if (response.ok) {
          const data = await response.json()
          console.log('📋 Backend\'den gelen data:', data)
          console.log('📋 Data type:', typeof data)
          console.log('📋 Data length:', Array.isArray(data) ? data.length : 'Not array')
          
          this.playlists = data.map(playlist => {
            
            // Musics alanını güvenli şekilde işle (yeni database yapısı)
            let videos = [];
            if (playlist.musics) {
              if (Array.isArray(playlist.musics)) {
                // Musics array'ini videos formatına çevir
                videos = playlist.musics.map(music => ({
                  id: { videoId: music.video_id },
                  snippet: {
                    title: music.title,
                    channelTitle: music.channel_title,
                    thumbnails: {
                      medium: { url: music.thumbnail_url }
                    }
                  },
                  youtubeUrl: music.youtube_url,
                  addedAt: music.PlaylistMusic?.added_at || new Date().toISOString()
                }));
              }
            } else if (playlist.videos) {
              // Eski format için fallback
              if (Array.isArray(playlist.videos)) {
                videos = playlist.videos;
              } else if (typeof playlist.videos === 'string') {
                try {
                  videos = JSON.parse(playlist.videos);
                } catch (e) {
                  console.error('❌ Videos JSON parse hatası:', e);
                  videos = [];
                }
              }
            }
            
            
            return {
              id: playlist.id,
              name: playlist.name,
              is_public: playlist.is_public || false,
              videos: videos,
              created: playlist.created_at || new Date().toISOString(),
              created_at: playlist.created_at || new Date().toISOString()
            }
          })
          console.log('✅ Playlist\'ler yüklendi:', this.playlists.length, 'adet')
        } else {
          console.error('❌ Playlist yükleme hatası:', response.status)
          const errorText = await response.text()
          console.error('❌ Hata detayı:', errorText)
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
      
      console.log('🏁 loadPlaylists tamamlandı, final playlists length:', this.playlists.length)
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
      console.log('✅ isAuthenticated set to:', this.isAuthenticated)
      
      // Playlist'leri yükle
      console.log('🔄 Login sonrası playlist\'ler yükleniyor...')
      this.loadPlaylists()
      
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

    onTabSwitch(event) {
      console.log('🔄 Tab değiştiriliyor:', event.detail)
      if (event.detail === 'search') {
        // Arama tab'ına geçildiğinde playlist'leri yenile
        console.log('🔄 Arama tab\'ına geçildi, playlist\'ler yenileniyor')
        this.loadPlaylists()
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
        <button 
          v-if="searchQuery.trim()" 
          @click="clearSearch"
          class="clear-search-btn"
          title="Aramayı temizle"
        >
          ✕
        </button>
        
        <!-- Arama geçmişi dropdown -->
        <!-- Arama Geçmişi -->
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
          <div class="no-playlists-content">
            <div class="no-playlists-icon">📝</div>
            <h4>Henüz playlist oluşturmadınız</h4>
            <p>Müziği eklemek için önce bir playlist oluşturun</p>
            <div class="no-playlists-actions">
              <button @click="goToPlaylistManager" class="create-playlist-btn">Playlist Oluştur</button>
              <button @click="closePlaylistMenu" class="close-btn">Kapat</button>
            </div>
          </div>
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

.youtube-search h2 {
  text-align: center;
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.search-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  position: relative;
  max-width: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  max-width: 600px;
}

.search-input {
  width: 100%;
  padding: 1rem 1.5rem;
  border: 3px solid rgba(102, 126, 234, 0.3);
  border-radius: 30px;
  outline: none;
  font-size: 1.1rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  color: #333;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #667eea;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
  transform: translateY(-2px);
}

.search-input::placeholder {
  color: rgba(0, 0, 0, 0.6);
  font-weight: 400;
}

/* Temizleme Butonu */
.clear-search-btn {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  color: #666;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.clear-search-btn:hover {
  background: rgba(255, 0, 0, 0.1);
  color: #ff4444;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 4px 12px rgba(255, 0, 0, 0.2);
}

.clear-search-btn:active {
  transform: translateY(-50%) scale(0.95);
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
  padding: 2rem 0;
}

.no-playlists-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.no-playlists-icon {
  font-size: 3rem;
  opacity: 0.6;
}

.no-playlists h4 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.no-playlists p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  opacity: 0.8;
}

.no-playlists-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.create-playlist-btn {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.create-playlist-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
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
    align-items: stretch;
  }
  
  .search-input-wrapper {
    margin-bottom: 0;
    max-width: 100%;
  }
  
  .search-btn {
    width: 100%;
    min-width: auto;
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }
  
  .youtube-search h2 {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
  }
  
  .clear-search-btn {
    width: 28px;
    height: 28px;
    font-size: 12px;
    right: 12px;
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