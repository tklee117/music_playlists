// API 기본 URL (로컬 개발 환경)
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? `http://${window.location.hostname}:3000/api` 
  : `${window.location.origin}/api`;

// 사용자 ID를 생성하거나 가져옵니다
async function getOrCreateUserId() {
  let userId = localStorage.getItem('userId');
  
  if (!userId) {
    userId = 'user_' + Date.now() + Math.random().toString(36).substring(2, 10);
    
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId }),
      });
      
      if (response.ok) {
        localStorage.setItem('userId', userId);
      } else {
        console.error('사용자 생성 실패:', await response.json());
        return null;
      }
    } catch (error) {
      console.error('사용자 생성 중 오류:', error);
      return null;
    }
  }
  
  return userId;
}

// 재생 목록 가져오기
async function fetchPlaylists() {
  const userId = await getOrCreateUserId();
  if (!userId) return null;
  
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/playlists`);
    
    if (response.ok) {
      return await response.json();
    } else {
      console.error('재생 목록 가져오기 실패:', await response.json());
      return null;
    }
  } catch (error) {
    console.error('재생 목록 가져오기 중 오류:', error);
    return null;
  }
}

// 재생 목록 생성
async function createApiPlaylist(name) {
  const userId = await getOrCreateUserId();
  if (!userId) return null;
  
  const playlistId = 'pl_' + Date.now() + Math.random().toString(36).substring(2, 10);
  
  try {
    const response = await fetch(`${API_BASE_URL}/playlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: playlistId,
        user_id: userId,
        name: name,
      }),
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      console.error('재생 목록 생성 실패:', await response.json());
      return null;
    }
  } catch (error) {
    console.error('재생 목록 생성 중 오류:', error);
    return null;
  }
}

// 재생 목록 삭제
async function deleteApiPlaylist(playlistId) {
  try {
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      return true;
    } else {
      console.error('재생 목록 삭제 실패:', await response.json());
      return false;
    }
  } catch (error) {
    console.error('재생 목록 삭제 중 오류:', error);
    return false;
  }
}

// 노래 추가
async function addApiSong(song) {
  try {
    const response = await fetch(`${API_BASE_URL}/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(song),
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      console.error('노래 추가 실패:', await response.json());
      return null;
    }
  } catch (error) {
    console.error('노래 추가 중 오류:', error);
    return null;
  }
}

// 노래 삭제
async function deleteApiSong(songId) {
  try {
    const response = await fetch(`${API_BASE_URL}/songs/${songId}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      return true;
    } else {
      console.error('노래 삭제 실패:', await response.json());
      return false;
    }
  } catch (error) {
    console.error('노래 삭제 중 오류:', error);
    return false;
  }
}

// 노래 순서 업데이트
async function updateSongOrder(playlistId, songOrders) {
  try {
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs/order`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        songOrders,
      }),
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      console.error('노래 순서 업데이트 실패:', await response.json());
      return null;
    }
  } catch (error) {
    console.error('노래 순서 업데이트 중 오류:', error);
    return null;
  }
}

// 백업 및 복원 함수
function backupToLocalStorage(playlists) {
  try {
    localStorage.setItem('playlists_backup', JSON.stringify(playlists));
    return true;
  } catch (error) {
    console.error('로컬 스토리지 백업 중 오류:', error);
    return false;
  }
}

function restoreFromLocalStorage() {
  try {
    const data = localStorage.getItem('playlists_backup');
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('로컬 스토리지에서 복원 중 오류:', error);
    return null;
  }
}

// 서버 연결 상태 확인
async function checkServerConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'HEAD',
      timeout: 3000 // 3초 타임아웃
    });
    
    return response.ok;
  } catch (error) {
    console.error('서버 연결 확인 중 오류:', error);
    return false;
  }
}

// 재생 목록 동기화
async function syncPlaylists(localPlaylists) {
  const userId = await getOrCreateUserId();
  if (!userId) return false;
  
  try {
    // 각 재생 목록을 서버에 동기화
    for (const playlist of localPlaylists) {
      // 재생 목록 생성
      const newPlaylist = await createApiPlaylist(playlist.name);
      
      if (newPlaylist) {
        // 노래 추가
        for (const song of playlist.songs || []) {
          const newSong = {
            id: 's_' + Date.now() + Math.random().toString(36).substring(2, 10),
            playlist_id: newPlaylist.id,
            title: song.title || 'Unknown Title',
            artist: song.artist || '',
            youtube_id: song.youtube_id || song.videoId,
            cover_url: song.cover_url || song.thumbnail,
            order_index: song.order_index || 0
          };
          
          await addApiSong(newSong);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('재생 목록 동기화 중 오류:', error);
    return false;
  }
} 