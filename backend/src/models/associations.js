const User = require('./Users');
const Playlist = require('./Playlist');
const Music = require('./Music');
const PlaylistMusic = require('./PlaylistMusic');

// User -> Playlist (One-to-Many) - user_id = keycloak_id
User.hasMany(Playlist, {
  foreignKey: 'user_id',
  sourceKey: 'keycloak_id',
  as: 'playlists',
  constraints: false
});

Playlist.belongsTo(User, {
  foreignKey: 'user_id',
  targetKey: 'keycloak_id',
  as: 'user',
  constraints: false
});

// Playlist -> PlaylistMusic (One-to-Many)
Playlist.hasMany(PlaylistMusic, {
  foreignKey: 'playlist_id',
  as: 'playlistMusics'
});

PlaylistMusic.belongsTo(Playlist, {
  foreignKey: 'playlist_id',
  as: 'playlist'
});

// Music -> PlaylistMusic (One-to-Many)
Music.hasMany(PlaylistMusic, {
  foreignKey: 'music_id',
  as: 'playlistMusics'
});

PlaylistMusic.belongsTo(Music, {
  foreignKey: 'music_id',
  as: 'music'
});

// Playlist -> Music (Many-to-Many through PlaylistMusic)
Playlist.belongsToMany(Music, {
  through: PlaylistMusic,
  foreignKey: 'playlist_id',
  otherKey: 'music_id',
  as: 'musics'
});

Music.belongsToMany(Playlist, {
  through: PlaylistMusic,
  foreignKey: 'music_id',
  otherKey: 'playlist_id',
  as: 'playlists'
});

// User -> Music (One-to-Many) - user_id = keycloak_id
User.hasMany(Music, {
  foreignKey: 'user_id',
  sourceKey: 'keycloak_id',
  as: 'musics',
  constraints: false
});

Music.belongsTo(User, {
  foreignKey: 'user_id',
  targetKey: 'keycloak_id',
  as: 'user',
  constraints: false
});

module.exports = {
  User,
  Playlist,
  Music,
  PlaylistMusic
};
