<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const playlists = ref([])
const newPlaylistName = ref('')
const showCreateForm = ref(false)
const showAddMusicForm = ref({})
const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const expandedPlaylists = ref([])

// Toast mesajı göster
const showMessage = (message, type = 'success') => {
  const messageDiv = document.createElement('div')
  messageDiv.textContent = message
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#ff9800' : '#f44336'};
    color: white;
    padding: 1rem 2rem;
    border-radius: 10px;
    z-index: 1000;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
  `
  
  // CSS animasyonu ekle
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `
  document.head.appendChild(style)
  
  document.body.appendChild(messageDiv)
  
  setTimeout(() => {
    messageDiv.remove()
    style.remove()
  }, 3000)
}

// Playlist'leri backend'den yükle
const loadPlaylists = async () => {
  try {
    // Keycloak'dan kullanıcı ID'sini al
    const userId = window.$keycloak?.subject || 'guest'
    const token = localStorage.getItem('keycloak-token')
    
    console.log('🔍 Frontend - Keycloak subject:', window.$keycloak?.subject)
    console.log('🔍 Frontend - User ID:', userId)
    console.log('🔍 Frontend - Token var mı:', !!token)
    console.log('🔍 Frontend - Token başlangıcı:', token ? token.substring(0, 50) + '...' : 'Yok')
    
    if (userId === 'guest') {
      console.log('👤 Misafir kullanıcı - playlist yüklenmiyor')
      playlists.value = []
      return
    }
    
    console.log('🔄 Playlist\'ler yükleniyor, kullanıcı ID:', userId)
    
    const response = await fetch(`http://localhost:5000/api/playlists/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('🔍 Backend\'den gelen data:', data)
      
      playlists.value = data.map(playlist => {
        console.log('🔍 Raw playlist data:', playlist)
        console.log('🔍 Raw videos:', playlist.videos)
        console.log('🔍 Videos type:', typeof playlist.videos)
        console.log('🔍 Videos is array:', Array.isArray(playlist.videos))
        
        // Videos alanını güvenli şekilde işle
        let videos = [];
        if (playlist.videos) {
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
        
        console.log('🔍 Processed videos:', videos)
        console.log('🔍 Processed videos length:', videos.length)
        
        return {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description || '',
          is_public: playlist.is_public || false,
          videos: videos,
          created: playlist.created_at || new Date().toISOString(),
          created_at: playlist.created_at || new Date().toISOString()
        }
      })
      console.log('✅ Playlist\'ler yüklendi:', playlists.value.length, 'adet')
      console.log('🔍 Final playlists:', playlists.value)
    } else {
      console.error('❌ Playlist yükleme hatası:', response.status)
      // Fallback: localStorage'dan yükle
      loadPlaylistsFromLocalStorage()
    }
  } catch (error) {
    console.error('❌ Playlist yükleme hatası:', error)
    // Fallback: localStorage'dan yükle
    loadPlaylistsFromLocalStorage()
  }
}

// Fallback: localStorage'dan yükle
const loadPlaylistsFromLocalStorage = () => {
  const saved = localStorage.getItem('music-playlists')
  if (saved) {
    try {
      playlists.value = JSON.parse(saved)
      // Her playlist için videos array'ini kontrol et
      playlists.value.forEach(playlist => {
        if (!playlist.videos) {
          playlist.videos = []
        }
      })
      console.log('📱 localStorage\'dan playlist\'ler yüklendi')
    } catch (error) {
      console.error('Playlist yükleme hatası:', error)
      playlists.value = []
    }
  } else {
    playlists.value = []
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
  console.log('🔍 Müzik arama başlatılıyor:', searchQuery.value)
  if (!searchQuery.value.trim()) {
    console.log('❌ Arama sorgusu boş!')
    return
  }
  
  searchLoading.value = true
  try {
    console.log('📡 API isteği gönderiliyor...')
    const response = await fetch(`http://localhost:5000/api/youtube/search?q=${searchQuery.value}&maxResults=5`)
    console.log('📡 Response status:', response.status)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('📡 Response data:', data)
    
    // Backend direkt array döndürüyor, data.data değil
    searchResults.value = Array.isArray(data) ? data : (data.data || [])
    console.log('✅ Arama sonuçları:', searchResults.value)
  } catch (error) {
    console.error('❌ Arama hatası:', error)
    showMessage(`❌ Müzik araması yapılamadı: ${error.message}`, 'error')
  } finally {
    searchLoading.value = false
  }
}

// Playlist'e müzik ekle
const addMusicToPlaylist = async (playlistId, video) => {
  console.log('🚀 ADD MUSIC TO PLAYLIST FONKSIYONU ÇAĞRILDI!')
  console.log('🚀 ADD MUSIC TO PLAYLIST FONKSIYONU ÇAĞRILDI!')
  console.log('🚀 ADD MUSIC TO PLAYLIST FONKSIYONU ÇAĞRILDI!')
  try {
    console.log('🔍 Playlist ID:', playlistId)
    console.log('🔍 Mevcut playlist\'ler:', playlists.value.map(p => ({ id: p.id, name: p.name })))
    
    const playlist = playlists.value.find(p => p.id === playlistId)
    const videoId = video.id.videoId
    
    console.log('🔍 Bulunan playlist:', playlist)
    console.log('🔍 Video ID:', videoId)
    
    if (!playlist) {
      console.error('❌ Playlist bulunamadı! ID:', playlistId)
      showMessage('❌ Playlist bulunamadı!', 'error')
      return
    }
    
    // Müzik zaten var mı kontrol et
    if (playlist.videos.find(v => v.id?.videoId === videoId)) {
      showMessage('⚠️ Bu müzik zaten bu playlist\'te!', 'warning')
      return
    }
    
    console.log('🔄 Müzik playlist\'e ekleniyor:', video.snippet.title)
    console.log('🔍 API URL:', `http://localhost:5000/api/playlists/${playlistId}/add-music`)
    console.log('🔍 Request data:', {
      id: videoId,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      videoId: videoId
    })
    
    const response = await fetch(`http://localhost:5000/api/playlists/${playlistId}/add-music`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('keycloak-token')}`
      },
      body: JSON.stringify({
        id: videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        videoId: videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`
      })
    })
    
    if (response.ok) {
      let updatedPlaylist;
      try {
        updatedPlaylist = await response.json()
        console.log('✅ Müzik playlist\'e eklendi')
      } catch (jsonError) {
        console.error('❌ JSON parse hatası:', jsonError)
        showMessage('❌ Müzik eklenemedi - Server hatası!', 'error')
        return
      }
      
      // Playlist'i güncelle
      console.log('🔄 Playlist güncelleniyor...')
      console.log('🔍 Updated playlist:', updatedPlaylist)
      console.log('🔍 Updated videos:', updatedPlaylist.videos)
      
      const playlistIndex = playlists.value.findIndex(p => p.id === playlistId)
      console.log('🔍 Playlist index:', playlistIndex)
      
      if (playlistIndex !== -1) {
        playlists.value[playlistIndex] = {
          ...playlists.value[playlistIndex],
          videos: updatedPlaylist.videos || []
        }
        console.log('✅ Playlist güncellendi:', playlists.value[playlistIndex])
      } else {
        console.error('❌ Playlist index bulunamadı!')
      }
      
      showMessage(`✅ ${video.snippet.title} "${playlist.name}" playlist'ine eklendi!`)
      showAddMusicForm.value[playlistId] = false
      searchQuery.value = ''
      searchResults.value = []
    } else {
      const errorData = await response.json()
      console.error('❌ Müzik ekleme hatası:', errorData)
      showMessage(`❌ Müzik eklenemedi: ${errorData.error}`, 'error')
    }
  } catch (error) {
    console.error('❌ Müzik ekleme hatası:', error)
    showMessage('❌ Müzik eklenemedi!', 'error')
  }
}

// Yeni playlist oluştur
const createPlaylist = async () => {
  if (!newPlaylistName.value.trim()) return
  
  try {
    const userId = window.$keycloak?.subject || 'guest'
    const token = localStorage.getItem('keycloak-token')
    
    if (userId === 'guest') {
      showMessage('❌ Playlist oluşturmak için giriş yapın!', 'warning')
      return
    }
    
    console.log('🔄 Yeni playlist oluşturuluyor:', newPlaylistName.value)
    console.log('🔍 User ID:', userId)
    console.log('🔍 Token var mı:', !!token)
    
    const response = await fetch('http://localhost:5000/api/playlists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: userId,
        name: newPlaylistName.value,
        description: '',
        is_public: false
      })
    })
    
    console.log('📡 Response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Playlist oluşturuldu:', data)
      
      // Playlist'i listeye ekle
      playlists.value.push({
        id: data.id,
        name: data.name,
        description: data.description || '',
        is_public: data.is_public || false,
        videos: data.videos || [],
        created: data.created_at || new Date().toISOString(),
        created_at: data.created_at || new Date().toISOString()
      })
      
      showMessage(`✅ "${data.name}" playlist'i oluşturuldu!`)
      newPlaylistName.value = ''
      showCreateForm.value = false
    } else {
      const errorData = await response.json()
      console.error('❌ Playlist oluşturma hatası:', errorData)
      showMessage(`❌ Playlist oluşturulamadı: ${errorData.error}`, 'error')
    }
  } catch (error) {
    console.error('❌ Playlist oluşturma hatası:', error)
    showMessage('❌ Playlist oluşturulamadı!', 'error')
  }
}

// Playlist'leri localStorage'a kaydet (Sadece fallback için)
const savePlaylists = () => {
  // Sadece fallback durumunda localStorage kullan
  console.log('📱 Fallback: Playlist\'ler localStorage\'a kaydediliyor')
  localStorage.setItem('music-playlists', JSON.stringify(playlists.value))
  window.dispatchEvent(new CustomEvent('playlists-updated'))
}

// Playlist'ten müzik çıkar
const removeFromPlaylist = async (playlistId, videoId) => {
  try {
    console.log('🔄 Müzik playlist\'ten çıkarılıyor:', videoId)
    
    const response = await fetch(`http://localhost:5000/api/playlists/${playlistId}/remove-music`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('keycloak-token')}`
      },
      body: JSON.stringify({
        videoId: videoId
      })
    })
    
    if (response.ok) {
      const updatedPlaylist = await response.json()
      console.log('✅ Müzik playlist\'ten çıkarıldı')
      
      // Playlist'i güncelle
      const playlistIndex = playlists.value.findIndex(p => p.id === playlistId)
      if (playlistIndex !== -1) {
        playlists.value[playlistIndex] = {
          ...playlists.value[playlistIndex],
          videos: updatedPlaylist.videos || []
        }
      }
      
      showMessage('✅ Müzik playlist\'ten çıkarıldı!')
    } else {
      const errorData = await response.json()
      console.error('❌ Müzik çıkarma hatası:', errorData)
      showMessage(`❌ Müzik çıkarılamadı: ${errorData.error}`, 'error')
    }
  } catch (error) {
    console.error('❌ Müzik çıkarma hatası:', error)
    showMessage('❌ Müzik çıkarılamadı!', 'error')
  }
}

// Playlist'i sil
const deletePlaylist = async (playlistId) => {
  if (confirm('Bu playlist\'i silmek istediğinizden emin misiniz?')) {
    try {
      console.log('🔄 Playlist siliniyor:', playlistId)
      
      const response = await fetch(`http://localhost:5000/api/playlists/${playlistId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('keycloak-token')}`
        }
      })
      
      if (response.ok) {
        console.log('✅ Playlist silindi')
        playlists.value = playlists.value.filter(p => p.id !== playlistId)
        showMessage('✅ Playlist silindi!')
      } else {
        console.error('❌ Playlist silme hatası:', response.status)
        showMessage('❌ Playlist silinemedi!', 'error')
      }
    } catch (error) {
      console.error('❌ Playlist silme hatası:', error)
      showMessage('❌ Playlist silinemedi!', 'error')
    }
  }
}

// Playlist detaylarını göster/gizle
const togglePlaylistDetails = (playlistId) => {
  const index = expandedPlaylists.value.indexOf(playlistId)
  if (index > -1) {
    expandedPlaylists.value.splice(index, 1)
  } else {
    expandedPlaylists.value.push(playlistId)
  }
}

// Tek müzik çal
const playMusic = (video) => {
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

// Playlist'i çal
const playPlaylist = (playlist) => {
  if (playlist.videos.length === 0) {
    alert('Bu playlist boş!')
    return
  }
  
  const firstVideo = playlist.videos[0]
  playMusic(firstVideo)
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
            @click="togglePlaylistDetails(playlist.id)" 
            class="view-btn"
          >
            {{ expandedPlaylists.includes(playlist.id) ? '📖 Gizle' : '👁️ Görüntüle' }}
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
          <div v-if="searchResults && searchResults.length > 0" class="search-results">
            <h5>Arama Sonuçları:</h5>
            <div class="music-list">
              <div 
                v-for="video in searchResults" 
                :key="video.id.videoId"
                class="music-item"
              >
                <img :src="video.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${video.id.videoId}/hqdefault.jpg`" :alt="video.snippet.title" class="music-thumbnail" />
                <div class="music-info">
                  <h6>{{ video.snippet.title }}</h6>
                  <p>{{ video.snippet.channelTitle }}</p>
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

        <!-- Playlist Detayları - Müzik Listesi -->
        <div v-if="expandedPlaylists.includes(playlist.id)" class="playlist-details">
          <h4>🎵 Müzikler</h4>
          <div v-if="playlist.videos && playlist.videos.length > 0" class="music-list">
            <div v-for="(video, index) in playlist.videos" :key="video.videoId || video.id?.videoId || index" class="music-item">
              <img :src="video.snippet?.thumbnails?.medium?.url || video.thumbnail || `https://img.youtube.com/vi/${video.videoId || video.id?.videoId}/hqdefault.jpg`" 
                   :alt="video.snippet?.title || video.title" class="music-thumbnail">
              <div class="music-info">
                <h5>{{ video.snippet?.title || video.title }}</h5>
                <p>{{ video.snippet?.channelTitle || video.channelTitle }}</p>
              </div>
              <div class="music-actions">
                <button @click="playMusic(video)" class="play-music-btn">▶️ Çal</button>
                <button @click="removeFromPlaylist(playlist.id, video.videoId || video.id?.videoId)" class="remove-music-btn">❌ Çıkar</button>
              </div>
            </div>
          </div>
          <div v-else class="no-music">
            <p>📭 Bu playlist'te henüz müzik yok</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playlist-manager {
  width: 100%;
  padding: 1.5rem;
  background: var(--card);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.playlist-header h2 {
  color: var(--text);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.create-btn {
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

.create-btn:hover {
  background: linear-gradient(135deg, var(--secondary), var(--accent));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.create-form {
  background: var(--card);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.playlist-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  outline: none;
  font-size: 1rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
  backdrop-filter: blur(10px);
}

.playlist-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  background: rgba(255, 255, 255, 0.2);
}

.playlist-input::placeholder {
  color: var(--text);
  opacity: 0.7;
}

.save-btn {
  background: linear-gradient(45deg, #28a745, #20c997);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: var(--card);
  border-radius: 20px;
  color: var(--text);
  opacity: 0.8;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.empty-state p {
  font-size: 1.1rem;
  margin: 0.5rem 0;
}

.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.playlist-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.playlist-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(45deg, #667eea, #764ba2);
}

.playlist-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.playlist-info h3 {
  color: var(--text);
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.playlist-count {
  color: var(--primary);
  font-weight: 600;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.playlist-date {
  color: var(--text);
  opacity: 0.7;
  font-size: 0.8rem;
  margin: 0.25rem 0;
}

.playlist-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.play-btn, .add-music-btn, .delete-btn, .view-btn {
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.play-btn {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.play-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--secondary), var(--accent));
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.play-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.view-btn {
  background: linear-gradient(135deg, #9c27b0, #7b1fa2);
  color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.view-btn:hover {
  background: linear-gradient(135deg, #8e24aa, #6a1b9a);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(156, 39, 176, 0.3);
}

.add-music-btn {
  background: linear-gradient(135deg, #17a2b8, #138496);
  color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.add-music-btn:hover {
  background: linear-gradient(135deg, #138496, #117a8b);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(23, 162, 184, 0.3);
}

.delete-btn {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.delete-btn:hover {
  background: linear-gradient(135deg, #c82333, #bd2130);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(220, 53, 69, 0.3);
}

.add-music-form {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: var(--card);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.search-section h4 {
  margin: 0 0 1rem 0;
  color: var(--text);
  font-size: 1rem;
}

.search-box {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  outline: none;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
  backdrop-filter: blur(10px);
}

.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  background: rgba(255, 255, 255, 0.2);
}

.search-input::placeholder {
  color: var(--text);
  opacity: 0.7;
}

.search-btn {
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

.search-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.search-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.search-results h5 {
  margin: 0 0 1rem 0;
  color: var(--text);
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
  gap: 0.75rem;
  padding: 1rem;
  background: var(--card);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  margin-bottom: 0.75rem;
}

.music-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.1);
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
  color: var(--text);
  font-size: 0.8rem;
  font-weight: bold;
}

.music-info p {
  margin: 0;
  color: var(--text);
  opacity: 0.7;
  font-size: 0.7rem;
}

.add-to-playlist-btn {
  background: linear-gradient(45deg, #28a745, #20c997);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 3px 10px rgba(40, 167, 69, 0.3);
}

.add-to-playlist-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
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

/* Playlist Detayları */
.playlist-details {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: var(--card);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.playlist-details h4 {
  margin: 0 0 1rem 0;
  color: var(--text);
  font-size: 1.1rem;
  font-weight: 600;
}

.no-music {
  text-align: center;
  padding: 2rem;
  color: var(--text);
  opacity: 0.8;
}

.no-music p {
  margin: 0;
  font-size: 1rem;
}

.music-actions {
  display: flex;
  gap: 0.5rem;
}

.play-music-btn {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.play-music-btn:hover {
  background: linear-gradient(135deg, var(--secondary), var(--accent));
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.remove-music-btn {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.remove-music-btn:hover {
  background: linear-gradient(135deg, #c82333, #bd2130);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(220, 53, 69, 0.3);
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