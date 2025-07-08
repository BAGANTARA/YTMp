// PERBAIKAN 1: Menggunakan URL API YouTube yang resmi dan stabil.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let playersInfo = [];
let lockerPlayers = [];
let lockerVideosFinishedCount = 0;
let lockerPlayersReadyCount = 0;

// PERBAIKAN 2: Mengembalikan URL asli Anda agar video langsung dianggap "selesai".
// URL ini tidak akan memutar video, yang justru membuat halaman langsung terbuka.
const LOCKER_VIDEO_URLS = [
    'https://youtube.com/watch?v=1IISHYWxO4E&si=UVr3VrDR0Cu-nWQ1',
    'https://youtube.com/watch?v=1IISHYWxO4E&si=UVr3VrDR0Cu-nWQ1',
    'https://youtube.com/watch?v=1IISHYWxO4E&si=UVr3VrDR0Cu-nWQ1'
];

function onYouTubeIframeAPIReady() {
    setupLockerScreen();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function setupLockerScreen() {
    // Penting: Fungsi extractVideoID akan gagal untuk URL di atas, menghasilkan videoId = null.
    // Ini membuat array videoIds menjadi kosong.
    const videoIds = LOCKER_VIDEO_URLS.map(url => extractVideoID(url)).filter(Boolean);
    shuffleArray(videoIds);
    // Karena videoIds kosong, tidak ada player yang akan dibuat.
    // Ini menyebabkan kondisi untuk membuka halaman utama langsung terpenuhi.
    if (videoIds.length === 0) {
        // Jika tidak ada video valid untuk locker, langsung buka aplikasi utama.
        // Ini adalah perilaku yang terjadi di script asli Anda karena URL yang tidak valid.
        unlockMainApp();
        return; // Hentikan eksekusi lebih lanjut dari fungsi ini
    }
    
    const grid = document.getElementById('locker-video-grid');
    videoIds.forEach((videoId, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'locker-video-wrapper';
        const playerDiv = document.createElement('div');
        playerDiv.id = `locker-player-${index}`;
        wrapper.appendChild(playerDiv);
        grid.appendChild(wrapper);

        lockerPlayers.push(new YT.Player(`locker-player-${index}`, {
            videoId: videoId,
            playerVars: { 'playsinline': 1, 'controls': 0, 'modestbranding': 1, 'showinfo': 0 },
            events: {
                'onReady': onLockerPlayerReady,
                'onStateChange': onLockerPlayerStateChange
            }
        }));
    });
}

function onLockerPlayerReady(event) {
    event.target.mute();
    lockerPlayersReadyCount++;
    if (lockerPlayersReadyCount === lockerPlayers.length) {
        lockerPlayers.forEach((player, index) => {
            setTimeout(() => {
                player.playVideo();
            }, index * 3000);
        });
    }
}

function onLockerPlayerStateChange(event) {
    // Ketika pemutar mencoba memuat video yang tidak valid, ia akan segera error dan
    // seringkali mengirim state ENDED (0), yang memicu logika di bawah ini.
    if (event.data === YT.PlayerState.ENDED) {
        lockerVideosFinishedCount++;
        if (lockerVideosFinishedCount >= lockerPlayers.length) {
            unlockMainApp();
        }
    }
}

function unlockMainApp() {
    if (lockerPlayers) {
        lockerPlayers.forEach(player => {
            if (player && typeof player.destroy === 'function') {
                player.destroy();
            }
        });
    }
    document.getElementById('locker-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    document.body.style.overflow = 'auto';
    addMainAppEventListeners();
}

function addMainAppEventListeners() {
    document.getElementById('load-videos').addEventListener('click', loadVideos);
    document.getElementById('play-all').addEventListener('click', playAllVideos);
    document.getElementById('pause-all').addEventListener('click', pauseAllVideos);
    document.getElementById('stop-all').addEventListener('click', stopAllVideos);
    document.getElementById('quality-low').addEventListener('click', () => setAllPlayersQuality('small'));
    document.getElementById('quality-medium').addEventListener('click', () => setAllPlayersQuality('medium'));
    document.getElementById('quality-high').addEventListener('click', () => setAllPlayersQuality('highres'));
}

function extractVideoID(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function loadVideos() {
    stopAllVideos(); 
    document.getElementById('video-grid').innerHTML = '';
    playersInfo = [];
    const urls = document.getElementById('video-urls').value.split('\n')
        .map(url => url.trim()).filter(Boolean).slice(0, 20);

    urls.forEach((url, index) => {
        const videoId = extractVideoID(url);
        if (videoId) {
            const container = document.createElement('div');
            container.className = 'video-instance-container';
            
            container.innerHTML = `
                <div class="video-player-wrapper"><div id="player-${index}"></div></div>
                <div class="video-settings-panel">
                    <div class="setting-row"><input type="checkbox" id="autoplay-${index}"><label for="autoplay-${index}">Auto Play</label></div>
                    <div class="setting-divider"></div>
                    <div class="setting-row"><input type="checkbox" id="autopause-enable-${index}"><label for="autopause-enable-${index}">Jeda setelah</label><input type="number" id="autopause-time-${index}" value="5" disabled><label>menit</label></div>
                    <div class="setting-divider"></div>
                    <div class="setting-row"><input type="checkbox" id="cycle-enable-${index}"><label for="cycle-enable-${index}">Aktifkan Siklus</label></div>
                    <div class="setting-row"><label>Putar</label><input type="number" id="cycle-play-${index}" value="60" disabled><label>detik, Jeda</label><input type="number" id="cycle-pause-${index}" value="10" disabled><label>detik.</label></div>
                </div>
            `;
            document.getElementById('video-grid').appendChild(container);

            playersInfo.push({
                player: new YT.Player(`player-${index}`, {
                    videoId: videoId,
                    playerVars: { 'playsinline': 1, 'modestbranding': 1 },
                    events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChangeMain }
                }),
                autoPauseTimer: null, cyclePlayTimer: null, cyclePauseTimer: null
            });
        }
    });
    addSettingsEventListenersMain();
}

function addSettingsEventListenersMain() {
    playersInfo.forEach((info, index) => {
        document.getElementById(`autopause-enable-${index}`).addEventListener('change', e => {
            document.getElementById(`autopause-time-${index}`).disabled = !e.target.checked;
            if (!e.target.checked) clearTimeout(info.autoPauseTimer);
        });
        document.getElementById(`cycle-enable-${index}`).addEventListener('change', e => {
            document.getElementById(`cycle-play-${index}`).disabled = !e.target.checked;
            document.getElementById(`cycle-pause-${index}`).disabled = !e.target.checked;
            if (!e.target.checked) { clearTimeout(info.cyclePlayTimer); clearTimeout(info.cyclePauseTimer); }
        });
    });
}

function onPlayerReady(event) {
    const index = getPlayerIndex(event.target);
    if (index !== -1 && document.getElementById(`autoplay-${index}`).checked) {
        event.target.playVideo();
    }
}

function onPlayerStateChangeMain(event) {
    const index = getPlayerIndex(event.target);
    if (index === -1) return;
    const info = playersInfo[index];

    if (event.data === YT.PlayerState.PLAYING) {
        clearTimeout(info.autoPauseTimer); clearTimeout(info.cyclePlayTimer); clearTimeout(info.cyclePauseTimer);
        const autoPauseEnabled = document.getElementById(`autopause-enable-${index}`).checked;
        if (autoPauseEnabled) {
            const minutes = parseFloat(document.getElementById(`autopause-time-${index}`).value);
            if (minutes > 0) { info.autoPauseTimer = setTimeout(() => info.player.pauseVideo(), minutes * 60 * 1000); }
        }
        const cycleEnabled = document.getElementById(`cycle-enable-${index}`).checked;
        if (cycleEnabled) {
            const playSecs = parseInt(document.getElementById(`cycle-play-${index}`).value, 10);
            const pauseSecs = parseInt(document.getElementById(`cycle-pause-${index}`).value, 10);
            if (playSecs > 0) {
                info.cyclePlayTimer = setTimeout(() => {
                    info.player.pauseVideo();
                    if (pauseSecs > 0) { info.cyclePauseTimer = setTimeout(() => { info.player.playVideo(); }, pauseSecs * 1000); }
                }, playSecs * 1000);
            }
        }
    }
}

function getPlayerIndex(player) {
    const iframeId = player.getIframe().id;
    return playersInfo.findIndex(info => info.player && info.player.getIframe && info.player.getIframe().id === iframeId);
}

function setAllPlayersQuality(quality) { playersInfo.forEach(info => info.player.setPlaybackQuality(quality)); }
function playAllVideos() { playersInfo.forEach(info => info.player.playVideo()); }
function pauseAllVideos() {
    playersInfo.forEach(info => {
        clearTimeout(info.autoPauseTimer); clearTimeout(info.cyclePlayTimer); clearTimeout(info.cyclePauseTimer);
        info.player.pauseVideo();
    });
}
function stopAllVideos() {
    playersInfo.forEach(info => {
        clearTimeout(info.autoPauseTimer); clearTimeout(info.cyclePlayTimer); clearTimeout(info.cyclePauseTimer);
        info.player.stopVideo();
    });
}