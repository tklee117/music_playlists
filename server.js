const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, './')));

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/music_playlists';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB에 연결되었습니다'))
  .catch(err => console.error('MongoDB 연결 오류:', err));

// 플레이리스트 스키마 및 모델
const playlistSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  songs: { type: Array, default: [] },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Playlist = mongoose.model('Playlist', playlistSchema);

// API 라우트
// 플레이리스트 가져오기
app.get('/api/playlists/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const playlists = await Playlist.find({ userId });
    res.json(playlists);
  } catch (error) {
    console.error('플레이리스트 조회 오류:', error);
    res.status(500).json({ error: '플레이리스트를 가져오는 중 오류가 발생했습니다' });
  }
});

// 플레이리스트 저장하기
app.post('/api/playlists', async (req, res) => {
  try {
    const { playlists, userId } = req.body;
    
    // 기존 플레이리스트 삭제
    await Playlist.deleteMany({ userId });
    
    // 새 플레이리스트 저장
    const playlistPromises = playlists.map(playlist => {
      return new Playlist({
        id: playlist.id,
        name: playlist.name,
        songs: playlist.songs,
        userId,
        updatedAt: Date.now()
      }).save();
    });
    
    await Promise.all(playlistPromises);
    res.status(201).json({ message: '플레이리스트가 성공적으로 저장되었습니다' });
  } catch (error) {
    console.error('플레이리스트 저장 오류:', error);
    res.status(500).json({ error: '플레이리스트를 저장하는 중 오류가 발생했습니다' });
  }
});

// 정적 파일 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 없는 페이지에 대한 처리
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`http://localhost:${PORT}/`);
}); 