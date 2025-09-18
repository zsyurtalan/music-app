const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlaylistMusic = sequelize.define('PlaylistMusic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  playlist_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Playlist ID'
  },
  music_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Music ID'
  },
  added_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When added to playlist'
  },
  order_index: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Order in playlist'
  }
}, {
  tableName: 'playlist_musics',
  timestamps: false,
  indexes: [
    {
      fields: ['playlist_id']
    },
    {
      fields: ['music_id']
    },
    {
      unique: true,
      fields: ['playlist_id', 'music_id']
    }
  ]
});

module.exports = PlaylistMusic;
