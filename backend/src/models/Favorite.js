const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Favorite = sequelize.define('Favorite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
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
  video_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'YouTube video ID'
  },
  youtubeUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Full YouTube URL'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When added to favorites'
  }
}, {
  tableName: 'favorites',
  timestamps: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['video_id']
    },
    {
      unique: true,
      fields: ['user_id', 'video_id']
    }
  ]
});

module.exports = Favorite;
