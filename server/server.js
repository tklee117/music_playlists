const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 제공 (클라이언트 빌드)
app.use(express.static(path.join(__dirname, '..')));

// API 라우트
app.use('/api/playlists', require('./routes/playlists'));

// SPA를 위한 모든 경로 처리
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'index.html'));
});

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB에 연결되었습니다');
    // 서버 시작
    app.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
    });
  })
  .catch(err => {
    console.error('MongoDB 연결 오류:', err);
    process.exit(1);
  }); 