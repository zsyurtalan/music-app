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
    unique: false, // user_id ile birlikte unique olacak
    comment: 'YouTube video ID'
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false, // user_id ile birlikte unique olacak
    comment: 'User ID from Keycloak'
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
  is_fav: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Is music favorite'
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
      fields: ['user_id']
    },
    {
      fields: ['user_id', 'video_id'],
      unique: true,
      name: 'unique_user_video'
    },
    {
      fields: ['title']
    },
    {
      fields: ['channel_title']
    },
    {
      fields: ['is_fav']
    }
  ]
});

// İlişkileri tanımla - circular dependency'yi önlemek için lazy loading kullan

module.exports = Music;
