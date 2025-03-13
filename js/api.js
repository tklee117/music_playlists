// 고유 기기 ID 얻기
function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}

// API URL
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/playlists' 
  : 'http://localhost:5000/api/playlists';

// 플레이리스트 가져오기
async function fetchPlaylists() {
  try {
    const deviceId = getDeviceId();
    const response = await fetch(`${API_URL}/${deviceId}`);
    
    if (!response.ok) {
      throw new Error('서버 응답 오류');
    }
    
    return await response.json();
  } catch (error) {
    console.error('플레이리스트 가져오기 오류:', error);
    // API 호출 실패 시 로컬 스토리지에서 가져오기
    return fallbackToLocalStorage();
  }
}

// 플레이리스트 저장하기
async function savePlaylists(playlists) {
  try {
    const deviceId = getDeviceId();
    const response = await fetch(`${API_URL}/${deviceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ playlists })
    });
    
    if (!response.ok) {
      throw new Error('서버 응답 오류');
    }
    
    return await response.json();
  } catch (error) {
    console.error('플레이리스트 저장 오류:', error);
    // API 호출 실패 시 로컬 스토리지에 저장
    saveToLocalStorage(playlists);
    return playlists;
  }
}

// 로컬 스토리지에서 플레이리스트 가져오기 (폴백)
function fallbackToLocalStorage() {
  console.log('로컬 스토리지에서 플레이리스트 복원');
  const savedPlaylists = localStorage.getItem('musicPlaylists');
  
  if (savedPlaylists) {
    return JSON.parse(savedPlaylists);
  } else {
    // 기본 플레이리스트 생성
    const defaultPlaylists = [{
      id: 'default',
      name: '내 첫번째 재생 목록',
      description: '좋아하는 노래를 추가해보세요!',
      songs: []
    }];
    
    saveToLocalStorage(defaultPlaylists);
    return defaultPlaylists;
  }
}

// 로컬 스토리지에 플레이리스트 저장하기 (백업)
function saveToLocalStorage(playlists) {
  localStorage.setItem('musicPlaylists', JSON.stringify(playlists));
}

export { fetchPlaylists, savePlaylists }; 