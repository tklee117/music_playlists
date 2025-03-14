// YouTube API 관련 변수
let player;
let currentVideoId = '';

// 애플리케이션 상태
let playlists = [];
let currentPlaylist = null;
let currentSongIndex = -1;
let isPlaying = false;
let selectedPlaylistIndex = -1;
let progressUpdateInterval;

// 문서 요소 참조
const playlistsScreen = document.getElementById('playlists-screen');
const playerScreen = document.getElementById('player-screen');
const playlistsContainer = document.getElementById('playlists-container');
const songsListElement = document.getElementById('songs-list');
const currentPlaylistTitle = document.getElementById('current-playlist-title');
const songThumbnail = document.getElementById('song-thumbnail');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');
const playPauseButton = document.getElementById('play-pause');
const prevSongButton = document.getElementById('prev-song');
const nextSongButton = document.getElementById('next-song');
const progressBar = document.querySelector('.progress');
const currentTimeElement = document.getElementById('current-time');
const durationElement = document.getElementById('duration');
const shuffleButton = document.getElementById('shuffle-playlist');
const showLyricsButton = document.getElementById('show-lyrics');
const lyricsContainer = document.getElementById('lyrics-container');
const lyricsContent = document.getElementById('lyrics-content');
const closeLyricsButton = document.getElementById('close-lyrics');
const addSongButton = document.getElementById('add-song');
const addSongModal = document.getElementById('add-song-modal');
const addSongSubmit = document.getElementById('add-song-submit');
const youtubeUrlInput = document.getElementById('youtube-url');
const songCoverInput = document.getElementById('song-cover');
const createPlaylistButton = document.getElementById('create-playlist');
const createPlaylistModal = document.getElementById('create-playlist-modal');
const createPlaylistSubmit = document.getElementById('create-playlist-submit');
const playlistNameInput = document.getElementById('playlist-name');
const backToPlaylistsButton = document.getElementById('back-to-playlists');
const closeModalButtons = document.querySelectorAll('.close-modal');
const deletePlaylistButton = document.getElementById('delete-playlist');
const deletePlaylistModal = document.getElementById('delete-playlist-modal');
const deletePlaylistConfirm = document.getElementById('delete-playlist-confirm');
const deletePlaylistCancel = document.getElementById('delete-playlist-cancel');
const songTitleInput = document.getElementById('song-title-input');
const songArtistInput = document.getElementById('song-artist-input');
const songLyricsInput = document.getElementById('song-lyrics');

// YouTube API 초기화
function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '0',
        width: '0',
        playerVars: {
            'playsinline': 1,
            'controls': 0,
            'disablekb': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// 플레이어가 준비되었을 때 호출되는 함수
function onPlayerReady(event) {
    console.log('YouTube 플레이어가 준비되었습니다.');
}

// 플레이어 상태가 변경되었을 때 호출되는 함수
function onPlayerStateChange(event) {
    // 플레이어 상태가 재생 중(1)인 경우
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
        startProgressBarUpdate();
    } 
    // 플레이어 상태가 일시정지(2) 또는 종료(0)인 경우
    else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        isPlaying = false;
        playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
        if (event.data === YT.PlayerState.ENDED) {
            playNextSong();
        }
    }
}

// 플레이리스트 항목을 화면에 렌더링
function renderPlaylists() {
    playlistsContainer.innerHTML = '';
    
    playlists.forEach((playlist, index) => {
        const playlistCard = document.createElement('div');
        playlistCard.className = 'playlist-card';
        if (index === selectedPlaylistIndex) {
            playlistCard.classList.add('selected');
        }
        
        // 재생 목록의 첫 번째 노래 커버 이미지 가져오기
        let coverImage = 'img/default-cover.jpg'; // 기본 이미지
        if (playlist.songs.length > 0) {
            coverImage = playlist.songs[0].thumbnail;
        }
        
        playlistCard.innerHTML = `
            <div class="playlist-cover">
                <img src="${coverImage}" alt="${playlist.name}">
            </div>
            <h3>${playlist.name}</h3>
            <p>${playlist.description || '재생 목록 설명 없음'}</p>
            <div class="song-count">${playlist.songs.length} 곡</div>
        `;
        
        playlistCard.addEventListener('click', (e) => {
            if (deletePlaylistButton.classList.contains('active')) {
                // 재생 목록 삭제 모드일 때
                selectedPlaylistIndex = index;
                renderPlaylists();
                showDeletePlaylistModal();
            } else {
                // 일반 모드일 때
                openPlaylist(index);
            }
        });
        
        playlistsContainer.appendChild(playlistCard);
    });
}

// 특정 플레이리스트를 열기
function openPlaylist(index) {
    currentPlaylist = playlists[index];
    currentPlaylistTitle.textContent = currentPlaylist.name;
    renderSongs();
    
    playlistsScreen.classList.remove('active');
    playerScreen.classList.add('active');
    
    // 첫 번째 곡 선택
    if (currentPlaylist.songs.length > 0) {
        playSong(0);
    }
}

// 노래 목록을 화면에 렌더링
function renderSongs() {
    songsListElement.innerHTML = '';
    
    if (!currentPlaylist || currentPlaylist.songs.length === 0) {
        songsListElement.innerHTML = '<li class="no-songs">재생 목록에 노래가 없습니다.</li>';
        return;
    }
    
    currentPlaylist.songs.forEach((song, index) => {
        const songItem = document.createElement('li');
        songItem.className = 'song-item';
        if (index === currentSongIndex) {
            songItem.classList.add('active');
        }
        
        songItem.innerHTML = `
            <div class="thumbnail">
                <img src="${song.thumbnail}" alt="${song.title}">
            </div>
            <div class="item-info">
                <h4>${song.title}</h4>
                <p>${song.artist}</p>
            </div>
            <div class="item-actions">
                <button class="delete-song" data-index="${index}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        songItem.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-song')) {
                playSong(index);
            }
        });
        
        songsListElement.appendChild(songItem);
    });
    
    // 삭제 버튼에 이벤트 리스너 추가
    document.querySelectorAll('.delete-song').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const songIndex = parseInt(button.getAttribute('data-index'));
            deleteSong(songIndex);
        });
    });
}

// 노래 재생
function playSong(index) {
    if (!currentPlaylist || currentPlaylist.songs.length === 0) {
        return;
    }
    
    currentSongIndex = index;
    const song = currentPlaylist.songs[currentSongIndex];
    
    // 이전 노래가 있다면 중지
    if (currentVideoId) {
        player.stopVideo();
    }
    
    currentVideoId = song.videoId;
    
    // 수동 추가된 노래인 경우 (YouTube URL 없음)
    if (song.isManual) {
        // 플레이어 대신 오디오 요소 사용 또는 다른 처리
        updateNowPlayingUI(song);
        updateSongsList();
        savePlaylists();
        return;
    }
    
    player.loadVideoById(currentVideoId);
    
    // UI 업데이트
    updateNowPlayingUI(song);
    updateSongsList();
    
    // 플레이리스트 저장
    savePlaylists();
}

// 재생 중인 노래 UI 업데이트
function updateNowPlayingUI(song) {
    songThumbnail.src = song.thumbnail;
    songTitle.textContent = song.title;
    songArtist.textContent = song.artist;
}

// 노래 목록 UI 업데이트
function updateSongsList() {
    const songItems = songsListElement.querySelectorAll('.song-item');
    songItems.forEach((item, index) => {
        if (index === currentSongIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// 진행 막대 업데이트 시작
function startProgressBarUpdate() {
    stopProgressBarUpdate();
    progressUpdateInterval = setInterval(updateProgressBar, 1000);
}

// 진행 막대 업데이트 중지
function stopProgressBarUpdate() {
    if (progressUpdateInterval) {
        clearInterval(progressUpdateInterval);
    }
}

// 진행 막대 업데이트
function updateProgressBar() {
    if (player && player.getCurrentTime && player.getDuration) {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        
        if (currentTime && duration) {
            const percentage = (currentTime / duration) * 100;
            progressBar.style.width = `${percentage}%`;
            
            currentTimeElement.textContent = formatTime(currentTime);
            durationElement.textContent = formatTime(duration);
        }
    }
}

// 시간 형식 변환 (초 -> MM:SS)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// 다음 노래 재생
function playNextSong() {
    if (!currentPlaylist || currentPlaylist.songs.length === 0) {
        return;
    }
    
    let nextIndex = currentSongIndex + 1;
    if (nextIndex >= currentPlaylist.songs.length) {
        nextIndex = 0; // 마지막 노래면 처음으로 돌아감
    }
    
    playSong(nextIndex);
}

// 이전 노래 재생
function playPrevSong() {
    if (!currentPlaylist || currentPlaylist.songs.length === 0) {
        return;
    }
    
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) {
        prevIndex = currentPlaylist.songs.length - 1; // 첫 번째 노래면 마지막으로 이동
    }
    
    playSong(prevIndex);
}

// 재생 목록 셔플
function shufflePlaylist() {
    if (!currentPlaylist || currentPlaylist.songs.length <= 1) {
        return;
    }
    
    // 현재 노래 저장
    const currentSong = currentPlaylist.songs[currentSongIndex];
    
    // Fisher-Yates 셔플 알고리즘
    for (let i = currentPlaylist.songs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentPlaylist.songs[i], currentPlaylist.songs[j]] = [currentPlaylist.songs[j], currentPlaylist.songs[i]];
    }
    
    // 현재 노래의 새 인덱스 찾기
    currentSongIndex = currentPlaylist.songs.findIndex(song => song.videoId === currentSong.videoId);
    
    // UI 업데이트
    renderSongs();
    
    // 재생 목록 저장
    savePlaylists();
}

// YouTube URL에서 비디오 ID 추출
function extractVideoId(url) {
    if (!url) return null;
    
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

// YouTube API를 사용하여 비디오 정보 가져오기
async function getVideoInfo(videoId) {
    try {
        // YouTube Data API 대신 oEmbed API 사용
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        const data = await response.json();
        
        // 기본 데이터 추출
        const title = data.title;
        
        // 제목에서 아티스트 추출 (일반적으로 " - " 로 구분)
        let artist = 'Unknown Artist';
        if (title.includes(' - ')) {
            const parts = title.split(' - ');
            artist = parts[0].trim();
        }
        
        // 썸네일 URL 생성
        const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        
        return {
            title: title,
            artist: artist,
            thumbnail: thumbnail,
            videoId: videoId,
            lyrics: ''
        };
    } catch (error) {
        console.error('비디오 정보를 가져오는 데 실패했습니다:', error);
        return null;
    }
}

// 노래 추가
async function addSongToPlaylist(url, customThumbnailUrl = null, manualTitle = null, manualArtist = null, lyrics = '') {
    if (!currentPlaylist) return;
    
    // 로딩 인디케이터 표시
    document.getElementById('loading-indicator').style.display = 'flex';
    
    try {
        const videoId = extractVideoId(url);
        
        if (!videoId) {
            alert('유효한 YouTube URL을 입력해주세요.');
            document.getElementById('loading-indicator').style.display = 'none';
            return;
        }
        
        let videoInfo = { title: '', thumbnails: { default: { url: '' } } };
        
        if (!manualTitle) {
            videoInfo = await getVideoInfo(videoId);
        }
        
        const songId = 's_' + Date.now() + Math.random().toString(36).substring(2, 10);
        
        const newSong = {
            id: songId,
            playlist_id: currentPlaylist.id,
            title: manualTitle || videoInfo.title || 'Unknown Title',
            artist: manualArtist || '',
            youtube_id: videoId,
            cover_url: customThumbnailUrl || (videoInfo.thumbnails ? videoInfo.thumbnails.default.url : ''),
            lyrics: lyrics || '',
            order_index: currentPlaylist.songs ? currentPlaylist.songs.length : 0
        };
        
        // API를 통해 노래 추가 시도
        const addedSong = await addApiSong(newSong);
        
        if (addedSong) {
            // songs 배열이 없으면 초기화
            if (!currentPlaylist.songs) {
                currentPlaylist.songs = [];
            }
            
            // 노래 추가
            currentPlaylist.songs.push(newSong);
        } else {
            // API 호출이 실패하면 로컬에서만 추가
            // songs 배열이 없으면 초기화
            if (!currentPlaylist.songs) {
                currentPlaylist.songs = [];
            }
            
            // 노래 추가
            currentPlaylist.songs.push(newSong);
            await savePlaylists();
        }
        
        updateSongsList();
        renderSongs();
        
        // 노래가 없었다면 첫 번째 노래 자동 재생
        if (currentPlaylist.songs.length === 1) {
            playSong(0);
        }
        
        resetAddSongForm();
        addSongModal.style.display = 'none';
    } catch (error) {
        console.error('노래 추가 중 오류:', error);
        alert('노래를 추가하는 데 문제가 발생했습니다.');
    }
    
    // 로딩 인디케이터 숨기기
    document.getElementById('loading-indicator').style.display = 'none';
}

// 노래 삭제
async function deleteSong(index) {
    if (!currentPlaylist || !currentPlaylist.songs || index >= currentPlaylist.songs.length) return;
    
    // 로딩 인디케이터 표시
    document.getElementById('loading-indicator').style.display = 'flex';
    
    try {
        const songId = currentPlaylist.songs[index].id;
        
        // API를 통해 노래 삭제 시도
        const success = await deleteApiSong(songId);
        
        // 현재 재생 중인 노래를 삭제할 경우
        if (currentSongIndex === index) {
            if (isPlaying) {
                player.stopVideo();
            }
            
            isPlaying = false;
            currentSongIndex = -1;
            
            // UI 업데이트
            songThumbnail.src = '';
            songTitle.textContent = '';
            songArtist.textContent = '';
            playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
            currentTimeElement.textContent = '0:00';
            durationElement.textContent = '0:00';
            progressBar.style.width = '0%';
        } else if (currentSongIndex > index) {
            // 현재 재생 중인 노래보다 앞에 있는 노래를 삭제할 경우
            currentSongIndex--;
        }
        
        // 노래 삭제 및 UI 업데이트
        currentPlaylist.songs.splice(index, 1);
        
        if (success) {
            // 삭제 성공 시 UI만 업데이트
            updateSongsList();
            renderSongs();
        } else {
            // API 호출이 실패하면 로컬에서 삭제하고 저장
            updateSongsList();
            renderSongs();
            await savePlaylists();
        }
    } catch (error) {
        console.error('노래 삭제 중 오류:', error);
        alert('노래를 삭제하는 데 문제가 발생했습니다.');
    }
    
    // 로딩 인디케이터 숨기기
    document.getElementById('loading-indicator').style.display = 'none';
}

// 재생 목록 생성
async function createNewPlaylist(name) {
    // 로딩 인디케이터 표시
    document.getElementById('loading-indicator').style.display = 'flex';
    
    try {
        const newPlaylist = await createApiPlaylist(name);
        
        if (newPlaylist) {
            playlists.push(newPlaylist);
            renderPlaylists();
        } else {
            // API 호출이 실패하면 로컬에서만 생성
            const playlistId = 'pl_' + Date.now() + Math.random().toString(36).substring(2, 10);
            
            playlists.push({
                id: playlistId,
                name: name,
                songs: []
            });
            
            renderPlaylists();
            await savePlaylists();
        }
    } catch (error) {
        console.error('재생 목록 생성 중 오류:', error);
        alert('재생 목록을 생성하는 데 문제가 발생했습니다.');
    }
    
    // 로딩 인디케이터 숨기기
    document.getElementById('loading-indicator').style.display = 'none';
}

// 재생 목록 삭제
async function deletePlaylist(index) {
    // 로딩 인디케이터 표시
    document.getElementById('loading-indicator').style.display = 'flex';
    
    try {
        const playlistId = playlists[index].id;
        
        // API를 통해 삭제 시도
        const success = await deleteApiPlaylist(playlistId);
        
        if (success) {
            playlists.splice(index, 1);
            
            if (playlists.length === 0) {
                // 모든 재생 목록이 삭제된 경우 기본 재생 목록 생성
                await createNewPlaylist('내 첫 재생 목록');
            }
            
            renderPlaylists();
        } else {
            // API 호출이 실패하면 로컬에서만 삭제
            playlists.splice(index, 1);
            
            if (playlists.length === 0) {
                // 모든 재생 목록이 삭제된 경우 기본 재생 목록 생성
                const playlistId = 'pl_' + Date.now() + Math.random().toString(36).substring(2, 10);
                
                playlists.push({
                    id: playlistId,
                    name: '내 첫 재생 목록',
                    songs: []
                });
            }
            
            renderPlaylists();
            await savePlaylists();
        }
    } catch (error) {
        console.error('재생 목록 삭제 중 오류:', error);
        alert('재생 목록을 삭제하는 데 문제가 발생했습니다.');
    }
    
    // 로딩 인디케이터 숨기기
    document.getElementById('loading-indicator').style.display = 'none';
}

// 재생 목록 삭제 모달 표시
function showDeletePlaylistModal() {
    if (selectedPlaylistIndex >= 0 && selectedPlaylistIndex < playlists.length) {
        deletePlaylistModal.classList.add('active');
    }
}

// 재생 목록 삭제 모달 닫기
function closeDeletePlaylistModal() {
    deletePlaylistModal.classList.remove('active');
}

// 로컬 스토리지에 재생 목록 저장
async function savePlaylists() {
    try {
        // 로딩 인디케이터 표시
        document.getElementById('loading-indicator').style.display = 'flex';
        
        // 로컬 스토리지에 백업
        backupToLocalStorage(playlists);
        
        // 로딩 인디케이터 숨기기
        document.getElementById('loading-indicator').style.display = 'none';
    } catch (error) {
        console.error('재생 목록 저장 중 오류:', error);
        
        // 로딩 인디케이터 숨기기
        document.getElementById('loading-indicator').style.display = 'none';
    }
}

// 로컬 스토리지에서 재생 목록 로드
async function loadPlaylists() {
    try {
        // 로딩 인디케이터 표시
        document.getElementById('loading-indicator').style.display = 'flex';
        
        // API에서 재생 목록 가져오기 시도
        const apiPlaylists = await fetchPlaylists();
        
        if (apiPlaylists && apiPlaylists.length > 0) {
            playlists = apiPlaylists;
            console.log('서버에서 재생 목록을 성공적으로 불러왔습니다.');
        } else {
            // API 호출이 실패하면 로컬 스토리지에서 복원 시도
            const localPlaylists = restoreFromLocalStorage();
            
            if (localPlaylists && localPlaylists.length > 0) {
                playlists = localPlaylists;
                console.log('로컬 스토리지에서 재생 목록을 복원했습니다.');
            } else {
                // 로컬 스토리지에도 없으면 기본 재생 목록 생성
                console.log('기본 재생 목록을 생성합니다.');
                const defaultPlaylist = await createApiPlaylist('내 첫 재생 목록');
                
                if (defaultPlaylist) {
                    playlists = [defaultPlaylist];
                } else {
                    // API 호출도 실패하면 메모리에 기본 재생 목록 생성
                    playlists = [{
                        id: 'pl_default',
                        name: '내 첫 재생 목록',
                        songs: []
                    }];
                }
            }
        }
        
        // 변경된 플레이리스트를 다시 렌더링
        renderPlaylists();
        
        // 로딩 인디케이터 숨기기
        document.getElementById('loading-indicator').style.display = 'none';
    } catch (error) {
        console.error('재생 목록 로드 중 오류:', error);
        
        // 오류 발생 시 로컬 스토리지에서 복원 시도
        const localPlaylists = restoreFromLocalStorage();
        
        if (localPlaylists) {
            playlists = localPlaylists;
            console.log('오류 발생 후 로컬 스토리지에서 재생 목록을 복원했습니다.');
        }
        
        // 로딩 인디케이터 숨기기
        document.getElementById('loading-indicator').style.display = 'none';
    }
}

// 가사 가져오기 및 표시
async function getLyrics(song) {
    if (song.lyrics) {
        return song.lyrics;
    }
    
    // 가사가 없는 경우 기본 메시지 반환
    return `현재 가사 정보를 가져올 수 없습니다.\n\n제목: ${song.title}\n아티스트: ${song.artist}\n\n노래를 추가할 때 가사를 입력하면 이곳에 표시됩니다.`;
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 재생/일시정지 버튼
    playPauseButton.addEventListener('click', () => {
        if (isPlaying) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    });
    
    // 이전 노래 버튼
    prevSongButton.addEventListener('click', playPrevSong);
    
    // 다음 노래 버튼
    nextSongButton.addEventListener('click', playNextSong);
    
    // 셔플 버튼
    shuffleButton.addEventListener('click', shufflePlaylist);
    
    // 가사 보기 버튼
    showLyricsButton.addEventListener('click', async () => {
        if (!currentPlaylist || currentSongIndex === -1) return;
        
        const song = currentPlaylist.songs[currentSongIndex];
        const lyrics = await getLyrics(song);
        
        lyricsContent.textContent = lyrics;
        lyricsContainer.classList.remove('hidden');
    });
    
    // 가사 닫기 버튼
    closeLyricsButton.addEventListener('click', () => {
        lyricsContainer.classList.add('hidden');
    });
    
    // 노래 추가 버튼
    addSongButton.addEventListener('click', () => {
        resetAddSongForm();
        addSongModal.classList.add('active');
    });
    
    // 노래 추가 제출 버튼
    addSongSubmit.addEventListener('click', () => {
        const url = youtubeUrlInput.value.trim();
        const customThumbnail = songCoverInput.value.trim();
        const manualTitle = songTitleInput.value.trim();
        const manualArtist = songArtistInput.value.trim();
        const lyrics = songLyricsInput.value.trim();
        
        // URL이나 제목 중 하나는 있어야 함
        if (!url && !manualTitle) {
            alert('YouTube URL 또는 노래 제목을 입력해주세요.');
            return;
        }
        
        addSongToPlaylist(url, customThumbnail, manualTitle, manualArtist, lyrics);
        addSongModal.classList.remove('active');
        resetAddSongForm();
    });
    
    // 재생 목록 생성 버튼
    createPlaylistButton.addEventListener('click', () => {
        createPlaylistModal.classList.add('active');
    });
    
    // 재생 목록 생성 제출 버튼
    createPlaylistSubmit.addEventListener('click', () => {
        const name = playlistNameInput.value.trim();
        
        if (name) {
            createNewPlaylist(name);
            createPlaylistModal.classList.remove('active');
            playlistNameInput.value = '';
        } else {
            alert('재생 목록 이름을 입력해주세요.');
        }
    });
    
    // 재생 목록 삭제 버튼
    deletePlaylistButton.addEventListener('click', () => {
        deletePlaylistButton.classList.toggle('active');
        
        if (deletePlaylistButton.classList.contains('active')) {
            alert('삭제할 재생 목록을 선택하세요.');
        } else {
            selectedPlaylistIndex = -1;
            renderPlaylists();
        }
    });
    
    // 재생 목록 삭제 확인 버튼
    deletePlaylistConfirm.addEventListener('click', () => {
        deletePlaylist(selectedPlaylistIndex);
        closeDeletePlaylistModal();
    });
    
    // 재생 목록 삭제 취소 버튼
    deletePlaylistCancel.addEventListener('click', () => {
        selectedPlaylistIndex = -1;
        renderPlaylists();
        closeDeletePlaylistModal();
    });
    
    // 모달 닫기 버튼
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            addSongModal.classList.remove('active');
            createPlaylistModal.classList.remove('active');
            deletePlaylistModal.classList.remove('active');
            selectedPlaylistIndex = -1;
            renderPlaylists();
        });
    });
    
    // 재생 목록으로 돌아가기 버튼
    backToPlaylistsButton.addEventListener('click', () => {
        // 노래 재생 중지
        if (player && player.stopVideo) {
            player.stopVideo();
        }
        isPlaying = false;
        playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
        stopProgressBarUpdate();
        
        playerScreen.classList.remove('active');
        playlistsScreen.classList.add('active');
    });
    
    // 진행 막대 클릭
    document.querySelector('.progress-bar').addEventListener('click', function(e) {
        if (!player || !player.getDuration) return;
        
        const percent = e.offsetX / this.offsetWidth;
        const duration = player.getDuration();
        player.seekTo(duration * percent);
    });
}

// 노래 추가 폼 초기화
function resetAddSongForm() {
    youtubeUrlInput.value = '';
    songCoverInput.value = '';
    songTitleInput.value = '';
    songArtistInput.value = '';
    songLyricsInput.value = '';
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadPlaylists();
    renderPlaylists();
    setupEventListeners();
    
    // YouTube API 스크립트 로드
    if (typeof YT === 'undefined') {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
        onYouTubeIframeAPIReady();
    }
}); 