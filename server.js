const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Express 앱 설정
const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// SQLite 데이터베이스 설정
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('데이터베이스 연결 오류:', err.message);
  } else {
    console.log('SQLite 데이터베이스에 연결되었습니다.');
    // 데이터베이스 테이블 생성
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      playlist_id TEXT,
      title TEXT,
      artist TEXT,
      youtube_id TEXT,
      cover_url TEXT,
      order_index INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(playlist_id) REFERENCES playlists(id)
    )`);
  }
});

// API 엔드포인트

// 사용자 생성 또는 가져오기
app.post('/api/users', (req, res) => {
  const { id } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: '사용자 ID가 필요합니다.' });
  }
  
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (user) {
      return res.json(user);
    }
    
    db.run('INSERT INTO users (id) VALUES (?)', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ id, created_at: new Date().toISOString() });
    });
  });
});

// 재생 목록 가져오기
app.get('/api/users/:userId/playlists', (req, res) => {
  const { userId } = req.params;
  
  db.all('SELECT * FROM playlists WHERE user_id = ? ORDER BY created_at', [userId], (err, playlists) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // 각 재생 목록의 노래 가져오기
    const promises = playlists.map(playlist => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM songs WHERE playlist_id = ? ORDER BY order_index', [playlist.id], (err, songs) => {
          if (err) {
            reject(err);
          } else {
            playlist.songs = songs;
            resolve(playlist);
          }
        });
      });
    });
    
    Promise.all(promises)
      .then(results => res.json(results))
      .catch(err => res.status(500).json({ error: err.message }));
  });
});

// 재생 목록 생성
app.post('/api/playlists', (req, res) => {
  const { id, user_id, name } = req.body;
  
  if (!id || !user_id || !name) {
    return res.status(400).json({ error: '모든 필드가 필요합니다.' });
  }
  
  db.run('INSERT INTO playlists (id, user_id, name) VALUES (?, ?, ?)',
    [id, user_id, name],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        id,
        user_id,
        name,
        created_at: new Date().toISOString(),
        songs: []
      });
    }
  );
});

// 재생 목록 삭제
app.delete('/api/playlists/:playlistId', (req, res) => {
  const { playlistId } = req.params;
  
  db.run('DELETE FROM songs WHERE playlist_id = ?', [playlistId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.run('DELETE FROM playlists WHERE id = ?', [playlistId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ message: '재생 목록이 삭제되었습니다.' });
    });
  });
});

// 노래 추가
app.post('/api/songs', (req, res) => {
  const { id, playlist_id, title, artist, youtube_id, cover_url, order_index } = req.body;
  
  if (!id || !playlist_id || !title || !youtube_id) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
  }
  
  db.run(
    'INSERT INTO songs (id, playlist_id, title, artist, youtube_id, cover_url, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, playlist_id, title, artist || '', youtube_id, cover_url || '', order_index || 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        id,
        playlist_id,
        title,
        artist: artist || '',
        youtube_id,
        cover_url: cover_url || '',
        order_index: order_index || 0,
        created_at: new Date().toISOString()
      });
    }
  );
});

// 노래 삭제
app.delete('/api/songs/:songId', (req, res) => {
  const { songId } = req.params;
  
  db.run('DELETE FROM songs WHERE id = ?', [songId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: '노래를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '노래가 삭제되었습니다.' });
  });
});

// 재생 목록 순서 업데이트
app.put('/api/playlists/:playlistId/songs/order', (req, res) => {
  const { playlistId } = req.params;
  const { songOrders } = req.body;
  
  if (!Array.isArray(songOrders)) {
    return res.status(400).json({ error: '올바른 노래 순서 배열이 필요합니다.' });
  }
  
  const promises = songOrders.map(item => {
    return new Promise((resolve, reject) => {
      db.run('UPDATE songs SET order_index = ? WHERE id = ? AND playlist_id = ?',
        [item.order_index, item.id, playlistId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  });
  
  Promise.all(promises)
    .then(() => {
      db.all('SELECT * FROM songs WHERE playlist_id = ? ORDER BY order_index', [playlistId], (err, songs) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json(songs);
      });
    })
    .catch(err => res.status(500).json({ error: err.message }));
});

// SPA 지원을 위한 HTML 파일 제공
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`http://localhost:${PORT}/`);
}); 