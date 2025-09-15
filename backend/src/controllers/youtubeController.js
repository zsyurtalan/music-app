const { google } = require('googleapis');

// YouTube API Key kontrolü
console.log(' YouTube API Key:', process.env.YOUTUBE_API_KEY ? 'Mevcut' : 'Eksik');

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

const searchMusic = async (req, res) => {
  try {
    const { q, maxResults = 10 } = req.query;
    
    console.log('�� Gelen istek:', { q, maxResults });
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Arama terimi gerekli'
      });
    }

    console.log('🔍 YouTube API Arama:', q);
    console.log('🔑 API Key durumu:', process.env.YOUTUBE_API_KEY ? 'Mevcut' : 'Eksik');

    const response = await youtube.search.list({
      part: 'snippet',
      q: q,
      type: 'video',
      videoCategoryId: '10', // Müzik kategorisi
      maxResults: parseInt(maxResults),
      order: 'relevance'
    });

    console.log('📊 YouTube API Response:', response.data);
    console.log('📊 Items sayısı:', response.data.items ? response.data.items.length : 0);

    if (!response.data.items || response.data.items.length === 0) {
      console.log('❌ Hiç video bulunamadı');
      return res.json([]);
    }

    const videos = response.data.items.map(item => ({
      id: {
        videoId: item.id.videoId
      },
      snippet: {
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnails: {
          medium: {
            url: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
          }
        }
      }
    }));

    console.log('🎵 İşlenmiş videolar:', videos);
    console.log('🎵 Video sayısı:', videos.length);

    res.json(videos);
  } catch (error) {
    console.error('❌ YouTube arama hatası:', error);
    console.error('❌ Hata detayı:', error.message);
    res.status(500).json({
      success: false,
      error: 'YouTube arama hatası',
      message: error.message
    });
  }
};

module.exports = { searchMusic };