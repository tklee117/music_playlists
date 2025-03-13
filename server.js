const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// 데이터 파일 경로
const DATA_FILE = path.join(__dirname, 'data', 'playlists.json');

// 데이터 디렉토리 확인 및 생성
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// 초기 데이터 파일 생성
if (!fs.existsSync(DATA_FILE)) {
  const initialData = {
    playlists: [{
      id: 'default',
      name: '내 첫번째 재생 목록',
      description: '좋아하는 노래를 추가해보세요!',
      songs: []
    }]
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 모든 플레이리스트 가져오기
app.get('/api/playlists', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json(data.playlists);
  } catch (error) {
    console.error('플레이리스트 읽기 오류:', error);
    res.status(500).json({ error: '플레이리스트를 불러오는 데 실패했습니다.' });
  }
});

// 플레이리스트 저장
app.post('/api/playlists', (req, res) => {
  try {
    const playlists = req.body;
    
    if (!Array.isArray(playlists)) {
      return res.status(400).json({ error: '올바른 플레이리스트 형식이 아닙니다.' });
    }
    
    const data = { playlists };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    
    res.json({ success: true, message: '플레이리스트가 저장되었습니다.' });
  } catch (error) {
    console.error('플레이리스트 저장 오류:', error);
    res.status(500).json({ error: '플레이리스트 저장에 실패했습니다.' });
  }
});

// 프론트엔드 라우팅을 위한 설정
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
}); 