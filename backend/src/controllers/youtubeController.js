const { google } = require('googleapis');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// YouTube'da müzik ara
const searchMusic = async (req, res) => {
  try {
    const { q, maxResults = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Arama terimi gerekli'
      });
    }

    const response = await youtube.search.list({
      part: 'snippet',
      q: q,
      type: 'video',
      videoCategoryId: '10', // Müzik kategorisi
      maxResults: maxResults,
      order: 'relevance'
    });

    const videos = response.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt
    }));

    res.json({
      success: true,
      data: videos,
      count: videos.length
    });
  } catch (error) {
    console.error('YouTube API hatası:', error);
    res.status(500).json({
      success: false,
      error: 'YouTube araması yapılamadı',
      message: error.message
    });
  }
};

module.exports = {
  searchMusic,
};
