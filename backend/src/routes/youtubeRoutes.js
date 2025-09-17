const express = require('express');
const router = express.Router();
const { searchMusic } = require('../controllers/youtubeController');

// YouTube'da müzik ara
router.get('/search', searchMusic);

// Video detaylarını getir
router.get('/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    console.log('📺 Video detayı isteniyor:', videoId);

    const response = await youtube.videos.list({
      part: 'snippet,contentDetails',
      id: videoId
    });

    if (response.data.items.length === 0) {
      return res.status(404).json({ error: 'Video bulunamadı' });
    }

    const video = response.data.items[0];
    const videoData = {
      id: video.id,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
      youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
      duration: video.contentDetails.duration,
      description: video.snippet.description
    };

    console.log('✅ Video detayı getirildi:', videoData.title);
    res.json(videoData);
  } catch (error) {
    console.error('❌ Video detay hatası:', error);
    res.status(500).json({ 
      error: 'Video detay hatası',
      message: error.message 
    });
  }
});

module.exports = router;