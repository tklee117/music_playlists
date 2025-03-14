// Supabase 클라이언트 초기화
const supabaseUrl = 'https://ksxjolldqertcfufwgit.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzeGpvbGxkcWVydGNmdWZ3Z2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5MTA5NjAsImV4cCI6MjA1NzQ4Njk2MH0.r7wARyMGu3VD7Zz9iYfqEfBQbbGtQDkJwospfaaYiCc';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 로컬 스토리지에 사용자 ID 저장 (인증 없는 사용자 구분용)
let userId = localStorage.getItem('music_user_id');
if (!userId) {
    userId = generateUUID();
    localStorage.setItem('music_user_id', userId);
}

// UUID 생성 함수
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Supabase 초기화 함수
async function initializeSupabase() {
    try {
        console.log('Supabase 초기화 중...');
        // 테이블이 존재하는지 확인
        const { data, error } = await supabase
            .from('playlists')
            .select('id')
            .limit(1);
            
        if (error && error.code === '42P01') {
            console.error('테이블이 존재하지 않습니다. 새 테이블을 생성해주세요.');
            // 로컬 스토리지에서 재생 목록 복원
            return false;
        } else {
            console.log('Supabase 초기화 완료');
            return true;
        }
    } catch (error) {
        console.error('Supabase 초기화 오류:', error);
        return false;
    }
}

// 사용자 ID 가져오기
function getUserId() {
    return userId;
}

// 재생 목록 가져오기
async function fetchPlaylistsFromSupabase() {
    showLoadingIndicator();
    try {
        const { data, error } = await supabase
            .from('playlists')
            .select('*')
            .eq('user_id', userId);
            
        hideLoadingIndicator();
        
        if (error) {
            console.error('재생 목록 가져오기 오류:', error);
            // 오류 발생 시 로컬 스토리지에서 복원
            return restorePlaylistsFromLocalStorage();
        }
        
        if (data && data.length > 0) {
            return data;
        } else {
            // 데이터가 없으면 기본 재생 목록 생성
            const defaultPlaylists = [
                {
                    id: 'default',
                    name: '기본 재생 목록',
                    songs: []
                }
            ];
            
            // 기본 재생 목록 저장 시도
            await savePlaylistsToSupabase(defaultPlaylists);
            return defaultPlaylists;
        }
    } catch (error) {
        console.error('재생 목록 가져오기 오류:', error);
        hideLoadingIndicator();
        return restorePlaylistsFromLocalStorage();
    }
}

// 재생 목록 저장하기
async function savePlaylistsToSupabase(playlists) {
    showLoadingIndicator();
    try {
        // 기존 재생 목록 삭제
        const { error: deleteError } = await supabase
            .from('playlists')
            .delete()
            .eq('user_id', userId);
            
        if (deleteError) {
            console.error('기존 재생 목록 삭제 오류:', deleteError);
            throw deleteError;
        }
        
        // 새 재생 목록 저장
        const playlistsWithUserId = playlists.map(playlist => ({
            ...playlist,
            user_id: userId,
            updated_at: new Date().toISOString()
        }));
        
        const { error: insertError } = await supabase
            .from('playlists')
            .insert(playlistsWithUserId);
            
        if (insertError) {
            console.error('재생 목록 저장 오류:', insertError);
            throw insertError;
        }
        
        // 로컬 스토리지에도 백업
        backupToLocalStorage(playlists);
        hideLoadingIndicator();
        return true;
    } catch (error) {
        console.error('재생 목록 저장 오류:', error);
        // 오류 발생 시 로컬 스토리지에 백업
        backupToLocalStorage(playlists);
        hideLoadingIndicator();
        return false;
    }
}

// 로컬 스토리지에 백업
function backupToLocalStorage(playlists) {
    try {
        localStorage.setItem('playlists', JSON.stringify(playlists));
        return true;
    } catch (error) {
        console.error('로컬 스토리지 백업 오류:', error);
        return false;
    }
}

// 로컬 스토리지에서 복원
function restorePlaylistsFromLocalStorage() {
    try {
        const playlists = JSON.parse(localStorage.getItem('playlists'));
        if (playlists && playlists.length > 0) {
            return playlists;
        }
    } catch (error) {
        console.error('로컬 스토리지 복원 오류:', error);
    }
    
    // 복원 실패 시 기본 재생 목록 생성
    return [
        {
            id: 'default',
            name: '기본 재생 목록',
            songs: []
        }
    ];
}

// 로딩 인디케이터 표시
function showLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
}

// 로딩 인디케이터 숨기기
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
} 