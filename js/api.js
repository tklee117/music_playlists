/**
 * 플레이리스트 백엔드 API 통신 모듈
 */

// 사용자 ID 생성 또는 가져오기
function getUserId() {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = generateUUID();
    localStorage.setItem('userId', userId);
  }
  return userId;
}

// UUID 생성 함수
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// API 기본 URL (개발/프로덕션 환경에 따라 다름)
const API_BASE_URL = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' 
                    ? `http://${window.location.hostname}:3000/api` 
                    : `${window.location.origin}/api`;

// 플레이리스트 가져오기
async function fetchPlaylists() {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_BASE_URL}/playlists/${userId}`);
    
    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('플레이리스트 가져오기 실패:', error);
    throw error;
  }
}

// 플레이리스트 저장하기
async function savePlaylists(playlists) {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_BASE_URL}/playlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        playlists,
        userId
      })
    });
    
    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('플레이리스트 저장 실패:', error);
    throw error;
  }
}

// 로컬 스토리지에 플레이리스트 백업
function backupToLocalStorage(playlists) {
  try {
    localStorage.setItem('playlists', JSON.stringify(playlists));
    console.log('플레이리스트가 로컬 스토리지에 백업되었습니다');
    return true;
  } catch (error) {
    console.error('로컬 스토리지 백업 실패:', error);
    return false;
  }
}

// 로컬 스토리지에서 플레이리스트 복원
function restoreFromLocalStorage() {
  try {
    const playlistsJson = localStorage.getItem('playlists');
    if (playlistsJson) {
      return JSON.parse(playlistsJson);
    }
    return null;
  } catch (error) {
    console.error('로컬 스토리지 복원 실패:', error);
    return null;
  }
} 