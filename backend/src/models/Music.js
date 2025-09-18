const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Music = sequelize.define('Music', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  video_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'YouTube video ID'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Video title'
  },
  channel_title: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Channel name'
  },
  thumbnail_url: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Video thumbnail URL'
  },
  youtube_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Full YouTube URL'
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Video duration'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When added to database'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Last update date'
  }
}, {
  tableName: 'musics',
  timestamps: false,
  indexes: [
    {
      fields: ['video_id']
    },
    {
      fields: ['title']
    },
    {
      fields: ['channel_title']
    }
  ]
});

// İlişkileri tanımla - circular dependency'yi önlemek için lazy loading kullan

module.exports = Music;
