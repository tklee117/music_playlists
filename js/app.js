// YouTube API 관련 변수
let player;
let currentVideoId = '';

// 애플리케이션 상태
let playlists = [];
let currentPlaylist = null;
let currentSongIndex = -1;
let isPlaying = false;

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
        playlistCard.innerHTML = `
            <h3>${playlist.name}</h3>
            <p>${playlist.description || '재생 목록 설명 없음'}</p>
            <div class="song-count">${playlist.songs.length} 곡</div>
        `;
        playlistCard.addEventListener('click', () => openPlaylist(index));
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
            videoId: videoId
        };
    } catch (error) {
        console.error('비디오 정보를 가져오는 데 실패했습니다:', error);
        return null;
    }
}

// 노래 추가
async function addSongToPlaylist(url, customThumbnailUrl = null) {
    const videoId = extractVideoId(url);
    
    if (!videoId) {
        alert('유효한 YouTube URL이 아닙니다.');
        return;
    }
    
    const videoInfo = await getVideoInfo(videoId);
    
    if (!videoInfo) {
        alert('비디오 정보를 가져오는 데 실패했습니다.');
        return;
    }
    
    // 사용자 지정 썸네일이 있는 경우 사용
    if (customThumbnailUrl) {
        videoInfo.thumbnail = customThumbnailUrl;
    }
    
    // 현재 재생 목록에 노래 추가
    currentPlaylist.songs.push(videoInfo);
    
    // UI 업데이트
    renderSongs();
    
    // 첫 번째 노래가 추가된 경우 자동 재생
    if (currentPlaylist.songs.length === 1) {
        playSong(0);
    }
    
    // 재생 목록 저장
    savePlaylists();
}

// 노래 삭제
function deleteSong(index) {
    if (confirm('이 노래를 삭제하시겠습니까?')) {
        // 현재 재생 중인 노래를 삭제하는 경우
        const isCurrentSong = index === currentSongIndex;
        
        // 노래 삭제
        currentPlaylist.songs.splice(index, 1);
        
        // 현재 재생 중인 노래보다 앞의 노래를 삭제하는 경우 인덱스 조정
        if (index < currentSongIndex) {
            currentSongIndex--;
        } 
        // 현재 재생 중인 노래를 삭제하는 경우
        else if (isCurrentSong) {
            // 노래가 남아있는 경우 다음 노래 재생
            if (currentPlaylist.songs.length > 0) {
                // 삭제된 노래가 마지막 노래였다면 첫 번째 노래로 이동
                if (currentSongIndex >= currentPlaylist.songs.length) {
                    currentSongIndex = 0;
                }
                playSong(currentSongIndex);
            } 
            // 남은 노래가 없는 경우
            else {
                currentSongIndex = -1;
                player.stopVideo();
                songThumbnail.src = 'img/default-cover.jpg';
                songTitle.textContent = '선택된 노래 없음';
                songArtist.textContent = '아티스트';
            }
        }
        
        // UI 업데이트
        renderSongs();
        
        // 재생 목록 저장
        savePlaylists();
    }
}

// 재생 목록 생성
function createNewPlaylist(name) {
    const newPlaylist = {
        id: Date.now().toString(),
        name: name,
        description: '',
        songs: []
    };
    
    playlists.push(newPlaylist);
    
    // UI 업데이트
    renderPlaylists();
    
    // 재생 목록 저장
    savePlaylists();
    
    return newPlaylist;
}

// 로컬 스토리지에 재생 목록 저장
function savePlaylists() {
    localStorage.setItem('musicPlaylists', JSON.stringify(playlists));
}

// 로컬 스토리지에서 재생 목록 로드
function loadPlaylists() {
    const savedPlaylists = localStorage.getItem('musicPlaylists');
    if (savedPlaylists) {
        playlists = JSON.parse(savedPlaylists);
    } else {
        // 기본 재생 목록 생성
        playlists = [{
            id: 'default',
            name: '내 첫번째 재생 목록',
            description: '좋아하는 노래를 추가해보세요!',
            songs: []
        }];
        savePlaylists();
    }
}

// 가사 가져오기 (임시 구현 - 실제로는 API를 사용해야 함)
async function getLyrics(title, artist) {
    // 가사 API 통합을 위한 자리 표시자
    // 실제 구현에서는 Musixmatch, Genius 등의 API를 사용할 수 있음
    return `현재 가사 정보를 가져올 수 없습니다.\n\n제목: ${title}\n아티스트: ${artist}\n\n가사 API 통합이 필요합니다.`;
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
        const lyrics = await getLyrics(song.title, song.artist);
        
        lyricsContent.textContent = lyrics;
        lyricsContainer.classList.remove('hidden');
    });
    
    // 가사 닫기 버튼
    closeLyricsButton.addEventListener('click', () => {
        lyricsContainer.classList.add('hidden');
    });
    
    // 노래 추가 버튼
    addSongButton.addEventListener('click', () => {
        addSongModal.classList.add('active');
    });
    
    // 노래 추가 제출 버튼
    addSongSubmit.addEventListener('click', () => {
        const url = youtubeUrlInput.value.trim();
        const customThumbnail = songCoverInput.value.trim();
        
        if (url) {
            addSongToPlaylist(url, customThumbnail);
            addSongModal.classList.remove('active');
            youtubeUrlInput.value = '';
            songCoverInput.value = '';
        } else {
            alert('YouTube URL을 입력해주세요.');
        }
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
    
    // 모달 닫기 버튼
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            addSongModal.classList.remove('active');
            createPlaylistModal.classList.remove('active');
        });
    });
    
    // 재생 목록으로 돌아가기 버튼
    backToPlaylistsButton.addEventListener('click', () => {
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