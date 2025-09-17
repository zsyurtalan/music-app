const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Playlist = sequelize.define('Playlist', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Playlist name'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Playlist description'
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Is playlist public'
  },
  videos: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of video objects as JSON'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Playlist creation date'
  }
}, {
  tableName: 'playlists',
  timestamps: false, // Manuel kontrol için false yaptık
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['is_public']
    }
  ]
});

module.exports = Playlist;
