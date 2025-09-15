 import axios from 'axios'

 const API_BASE = 'http://localhost:5000/api'

 //playlist api
 export const playlistAPI = {
    // Playlist oluştur
  createPlaylist: async (playlistData) => {
    try {
      const response = await axios.post(`${API_BASE}/playlists`, playlistData);
      return response.data;
    } catch (error) {
      console.error('Playlist oluşturma hatası:', error);
      // Fallback to localStorage
      const playlist = {
        id: Date.now(),
        ...playlistData,
        videos: [],
        created: new Date().toISOString()
      };
      return playlist;
    }
  },

    //kullanıcın playlistlerini getir
    getUserPlaylists: async (userId) => {
        try {
          const response = await axios.get(`${API_BASE}/playlists/user/${userId}`);
          return response.data;
        } catch (error) {
          console.error('Playlist listesi alma hatası:', error);
          // Fallback to localStorage
          const saved = localStorage.getItem('music-playlists');
          return saved ? JSON.parse(saved) : [];
        }
      },

    //playliste müzik ekle
    addMusicToPlaylist: async (playlistId, musicData) => {
        try {
            const response = await axios.put(`${API_BASE}/playlists/${playlistId}/add-music`, musicData)
            return response.data
        } catch (error) {
            console.error('Müzik ekleme hatası:', error)
            throw error
        }
    },

    //playlistten müzik çıkar
    removeMusicFromPlaylist: async (playlistId, videoId) => {
        try {
            const response = await axios.put(`${API_BASE}/playlists/${playlistId}/remove-music`, { videoId })
            return response.data
        } catch (error) {
            console.error('Müzik çıkarma hatası:', error)
            throw error
        }
    },

    //playlist sil
    deletePlaylist: async (playlistId) => {
        try {
            const response = await axios.delete(`${API_BASE}/playlists/${playlistId}`)
            return response.data
        } catch (error) {
            console.error('Playlist silme hatası:', error)
            throw error
        }
    }
 };

//favorites api
export const favoriteAPI = {
   // Favoriye ekle
   addToFavorites: async (favoriteData) => {
       try {
           const response = await axios.post(`${API_BASE}/favorites`, favoriteData)
           return response.data
       } catch (error) {
           console.error('Favori ekleme hatası:', error)
           // Fallback to localStorage
           const favorite = {
               id: Date.now(),
               ...favoriteData,
               added_at: new Date().toISOString()
           };
           return favorite;
       }
   },

   // Kullanıcının favorilerini getir
   getUserFavorites: async (userId) => {
       try {
           const response = await axios.get(`${API_BASE}/favorites/user/${userId}`)
           return response.data
       } catch (error) {
           console.error('Favori listesi alma hatası:', error)
           // Fallback to localStorage
           const saved = localStorage.getItem('music-favorites');
           return saved ? JSON.parse(saved) : [];
       }
   },

   // Favoriden çıkar
   removeFromFavorites: async (favoriteId) => {
       try {
           const response = await axios.delete(`${API_BASE}/favorites/${favoriteId}`)
           return response.data
       } catch (error) {
           console.error('Favori silme hatası:', error)
           throw error
       }
   }
};

// Backward compatibility
export const favoritesAPI = favoriteAPI;
