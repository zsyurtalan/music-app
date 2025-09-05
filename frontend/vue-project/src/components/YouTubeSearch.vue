<script>
import { youtubeAPI } from '../services/api.js'
import axios from 'axios'

export default {
  name: 'YouTubeSearch',
  data() {
    return {
      searchQuery: '',
      videos: [], // Boş array olarak başlat
      loading: false,
      showPlaylistMenu: false,
      selectedVideo: null,
      playlists: []
    }
  },
  mounted() {
    this.loadPlaylists()
    // Playlist güncellemelerini dinle
    window.addEventListener('playlists-updated', this.loadPlaylists)
  },
  beforeUnmount() {
    window.removeEventListener('playlists-updated', this.loadPlaylists)
  },
  methods: {
    async searchYouTube() {
      if (!this.searchQuery.trim()) return
      
      this.loading = true
      try {
        const response = await youtubeAPI.search(this.searchQuery)
        this.videos = response.data || [] // Eğer data yoksa boş array
      } catch (error) {
        console.error('YouTube arama hatası:', error)
        this.videos = [] // Hata durumunda boş array
      } finally {
        this.loading = false
      }
    },
    
    playMusic(video) {
      // Müzik çalma işlemi
      console.log('Müzik çalınıyor:', video.title)
    },
    
    openYouTube(videoId) {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')
    },
    
    addToFavorites(video) {
      // Favorilere ekleme işlemi
      console.log('Favorilere eklendi:', video.title)
    },
    
    togglePlaylistMenu(video) {
      this.selectedVideo = video
      this.showPlaylistMenu = !this.showPlaylistMenu
    },
    
    closePlaylistMenu() {
      this.showPlaylistMenu = false
      this.selectedVideo = null
    },
    
    addToPlaylist(playlistId, video) {
      // Playlist'e ekleme işlemi
      console.log('Playlist\'e eklendi:', video.title, 'Playlist ID:', playlistId)
      this.closePlaylistMenu()
    },
    
    loadPlaylists() {
      const saved = localStorage.getItem('playlists')
      this.playlists = saved ? JSON.parse(saved) : []
    }
  }
}
</script>

<template>
  <div class="youtube-search">
    <div class="search-box">
      <input 
        v-model="searchQuery" 
        @keyup.enter="searchYouTube"
        placeholder="Müzik ara..."
        class="search-input"
      />
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
      <div v-for="video in videos" :key="video.id" class="video-item">
        <img :src="video.thumbnail" :alt="video.title" class="thumbnail" />
        <div class="video-info">
          <h4>{{ video.title }}</h4>
          <p class="channel">{{ video.channelTitle }}</p>
        </div>
        
        <div class="video-actions">
          <button @click="playMusic(video)" class="play-btn">
            ▶️ Müziği Oynat
          </button>
          <button @click="openYouTube(video.id)" class="download-btn">
            🔗 YouTube Linki
          </button>
          <button @click="addToFavorites(video)" class="favorite-btn">
            ❤️ Favorilere Ekle
          </button>
          <button @click="togglePlaylistMenu(video)" class="playlist-btn">
            📝 Playlist'e Ekle
          </button>
        </div>

        <!-- Playlist Menüsü -->
        <div v-if="selectedVideo && selectedVideo.id === video.id && showPlaylistMenu" class="playlist-menu">
          <div class="playlist-menu-header">
            <h5>Playlist Seçin</h5>
            <button @click="closePlaylistMenu" class="close-btn">×</button>
          </div>
          
          <div v-if="playlists.length === 0" class="no-playlists">
            <p>Henüz playlist oluşturulmamış</p>
          </div>
          
          <div v-else class="playlist-options">
            <div v-for="playlist in playlists" :key="playlist.id" class="playlist-option">
              <div class="playlist-info">
                <h6>{{ playlist.name }}</h6>
                <p>{{ playlist.songs.length }} müzik</p>
              </div>
              <button @click="addToPlaylist(playlist.id, video)" class="add-btn">
                Ekle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.youtube-search {
  width: 100%;
}

.search-box {
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

.video-item {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid #e9ecef;
}

.thumbnail {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.video-info h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1rem;
}

.channel {
  color: #666;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.play-btn {
  background: #f6b92c;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;
}
.playlist-btn {
  background: #f6b92c;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;
}
.playlist-btn:hover {
  background: #47a332;
}
.favorite-btn {
  background: #e91e63;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.favorite-btn:hover {
  background: #c2185b;
  transform: scale(1.05);
}
</style>