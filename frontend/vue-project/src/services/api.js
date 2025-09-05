import axios from 'axios'

const API_BASE = 'http://localhost:5000/api/music'
const YOUTUBE_API_BASE = 'http://localhost:5000/api/youtube'


export const youtubeAPI = {
  search: async (query, maxResults = 10) => {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
        params: { q: query, maxResults }
      });
      return response.data;
    } catch (error) {
      console.error('YouTube arama hatası:', error);
      throw error;
    }
  }
}