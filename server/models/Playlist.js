const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    default: 'Unknown Artist'
  },
  thumbnail: {
    type: String,
    default: 'img/default-cover.jpg'
  },
  videoId: {
    type: String,
    required: true
  },
  isManual: {
    type: Boolean,
    default: false
  },
  lyrics: {
    type: String,
    default: ''
  }
});

const PlaylistSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  playlists: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    songs: [SongSchema]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Playlist', PlaylistSchema); 