// Firebase 구성
// 실제 프로젝트에서는 이 값을 Firebase 콘솔에서 제공하는 값으로 변경해야 합니다
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Firebase 초기화
function initializeFirebase() {
  return new Promise((resolve, reject) => {
    try {
      firebase.initializeApp(firebaseConfig);
      console.log("Firebase가 초기화되었습니다.");
      
      // 로그인 상태 확인
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          console.log("사용자가 로그인되어 있습니다:", user.uid);
          // 사용자가 이미 로그인되어 있으면 해당 사용자 ID 반환
          resolve(user.uid);
        } else {
          // 로그인되어 있지 않으면 익명 로그인 실행
          firebase.auth().signInAnonymously()
            .then(result => {
              console.log("익명 사용자로 로그인되었습니다:", result.user.uid);
              resolve(result.user.uid);
            })
            .catch(error => {
              console.error("익명 로그인 오류:", error);
              // 로그인 실패해도 로컬 스토리지 모드로 계속 진행
              resolve(null);
            });
        }
      });
    } catch (error) {
      console.error("Firebase 초기화 오류:", error);
      reject(error);
    }
  });
}

// Firestore 데이터베이스 가져오기
function getFirestore() {
  return firebase.firestore();
}

// 현재 사용자 ID 가져오기
function getCurrentUserId() {
  const user = firebase.auth().currentUser;
  return user ? user.uid : null;
}

// 재생 목록 가져오기
async function loadPlaylists() {
  try {
    // 로딩 표시
    document.getElementById('loading-indicator').style.display = 'flex';
    
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error("사용자가 로그인되어 있지 않습니다.");
    }
    
    const db = getFirestore();
    const playlistsRef = db.collection('playlists');
    const snapshot = await playlistsRef.where('userId', '==', userId).get();
    
    if (snapshot.empty) {
      console.log("저장된 재생 목록이 없습니다. 기본 재생 목록을 생성합니다.");
      return null;
    }
    
    const playlists = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      playlists.push({
        id: doc.id,
        name: data.name,
        songs: data.songs || []
      });
    });
    
    return playlists;
  } catch (error) {
    console.error("Firebase에서 재생 목록을 가져오는 중 오류 발생:", error);
    // Firestore에서 로드하지 못한 경우 로컬 스토리지에서 시도
    return restoreFromLocalStorage();
  } finally {
    // 로딩 표시 숨기기
    document.getElementById('loading-indicator').style.display = 'none';
  }
}

// 재생 목록 저장하기
async function savePlaylists(playlists) {
  try {
    // 로딩 표시
    document.getElementById('loading-indicator').style.display = 'flex';
    
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error("사용자가 로그인되어 있지 않습니다.");
    }
    
    const db = getFirestore();
    const batch = db.batch();
    
    // 기존 재생 목록 모두 삭제
    const existingPlaylistsSnapshot = await db.collection('playlists')
      .where('userId', '==', userId)
      .get();
    
    existingPlaylistsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 새 재생 목록 추가
    playlists.forEach(playlist => {
      const playlistRef = db.collection('playlists').doc();
      batch.set(playlistRef, {
        name: playlist.name,
        songs: playlist.songs || [],
        userId: userId,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log("재생 목록이 Firebase에 저장되었습니다.");
    
    // 성공적으로 저장되면 로컬 스토리지에도 백업
    backupToLocalStorage(playlists);
    
    return true;
  } catch (error) {
    console.error("Firebase에 재생 목록을 저장하는 중 오류 발생:", error);
    // Firebase에 저장 실패한 경우 로컬 스토리지에 백업
    backupToLocalStorage(playlists);
    return false;
  } finally {
    // 로딩 표시 숨기기
    document.getElementById('loading-indicator').style.display = 'none';
  }
}

// 로컬 스토리지에 백업
function backupToLocalStorage(playlists) {
  try {
    localStorage.setItem('playlists', JSON.stringify(playlists));
    console.log("재생 목록이 로컬 스토리지에 백업되었습니다.");
  } catch (error) {
    console.error("로컬 스토리지에 백업하는 중 오류 발생:", error);
  }
}

// 로컬 스토리지에서 복원
function restoreFromLocalStorage() {
  try {
    const playlistsData = localStorage.getItem('playlists');
    if (playlistsData) {
      return JSON.parse(playlistsData);
    }
    return null;
  } catch (error) {
    console.error("로컬 스토리지에서 복원하는 중 오류 발생:", error);
    return null;
  }
} 