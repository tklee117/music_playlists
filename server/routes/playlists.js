const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');

// 모든 플레이리스트 가져오기
router.get('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userPlaylists = await Playlist.findOne({ deviceId });
    
    if (!userPlaylists) {
      // 기본 플레이리스트 생성
      const defaultPlaylists = new Playlist({
        deviceId,
        playlists: [{
          id: 'default',
          name: '내 첫번째 재생 목록',
          description: '좋아하는 노래를 추가해보세요!',
          songs: []
        }]
      });
      
      await defaultPlaylists.save();
      return res.json(defaultPlaylists.playlists);
    }
    
    res.json(userPlaylists.playlists);
  } catch (err) {
    console.error('플레이리스트 가져오기 오류:', err);
    res.status(500).json({ message: '서버 오류 발생' });
  }
});

// 플레이리스트 저장
router.post('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { playlists } = req.body;
    
    const filter = { deviceId };
    const update = { 
      playlists, 
      updatedAt: Date.now() 
    };
    const options = { 
      upsert: true, 
      new: true, 
      setDefaultsOnInsert: true 
    };
    
    const updatedPlaylist = await Playlist.findOneAndUpdate(
      filter,
      update,
      options
    );
    
    res.json(updatedPlaylist.playlists);
  } catch (err) {
    console.error('플레이리스트 저장 오류:', err);
    res.status(500).json({ message: '서버 오류 발생' });
  }
});

module.exports = router; 