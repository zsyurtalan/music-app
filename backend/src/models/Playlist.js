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
  is_public: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Is playlist public'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Playlist creation date'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Playlist last update date'
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

// İlişkileri tanımla - circular dependency'yi önlemek için lazy loading kullan

module.exports = Playlist;
