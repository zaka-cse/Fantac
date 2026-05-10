// ===== FANTAC PLAYER.JS =====
// Full-featured music player with queue, progress, controls

const Player = (() => {
  let audio = new Audio();
  let queue = [];
  let currentIndex = 0;
  let isPlaying = false;
  let isRepeat = false;
  let isShuffle = false;
  let isLiked = false;

  // ── DOM refs (set on init) ─────────────────────────────────
  let elBar, elBarArt, elBarTitle, elBarArtist, elBarPlay, elBarPrev, elBarNext;
  let elProgress, elFull, elFullTitle, elFullArtist, elFullArt, elFullPlay, elFullProg, elCurrentTime, elDuration;

  function init() {
    elBar        = document.getElementById('player-bar');
    elBarArt     = document.getElementById('bar-art');
    elBarTitle   = document.getElementById('bar-title');
    elBarArtist  = document.getElementById('bar-artist');
    elBarPlay    = document.getElementById('bar-play');
    elBarPrev    = document.getElementById('bar-prev');
    elBarNext    = document.getElementById('bar-next');
    elProgress   = document.getElementById('bar-progress-fill');
    elFull       = document.getElementById('full-player');
    elFullTitle  = document.getElementById('fp-title');
    elFullArtist = document.getElementById('fp-artist');
    elFullArt    = document.getElementById('fp-art');
    elFullPlay   = document.getElementById('fp-play');
    elFullProg   = document.getElementById('fp-progress-fill');
    elCurrentTime= document.getElementById('fp-current');
    elDuration   = document.getElementById('fp-duration');

    // Audio events
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', () => Toast?.info('Audio unavailable in demo. Real tracks will play! 🎵'));

    // Bar controls
    elBarPlay?.addEventListener('click', togglePlay);
    elBarPrev?.addEventListener('click', prev);
    elBarNext?.addEventListener('click', next);
    elFullPlay?.addEventListener('click', togglePlay);
    document.getElementById('fp-prev')?.addEventListener('click', prev);
    document.getElementById('fp-next')?.addEventListener('click', next);
    document.getElementById('fp-repeat')?.addEventListener('click', toggleRepeat);
    document.getElementById('fp-shuffle')?.addEventListener('click', toggleShuffle);
    document.getElementById('fp-like')?.addEventListener('click', toggleLikeTrack);
    document.getElementById('fp-close')?.addEventListener('click', closeFullPlayer);

    // Progress click
    document.getElementById('fp-progress-bar')?.addEventListener('click', seek);

    // Open full player on bar click
    elBar?.addEventListener('click', e => {
      if (!e.target.closest('button')) openFullPlayer();
    });

    // Load demo tracks into queue
    if (window.FANTAC?.SAMPLE_TRACKS?.length) {
      setQueue(FANTAC.SAMPLE_TRACKS, 0, false);
    }
  }

  // ── Load and play a track ──────────────────────────────────
  function play(index) {
    if (!queue.length) return;
    currentIndex = Math.max(0, Math.min(index, queue.length - 1));
    const track = queue[currentIndex];

    audio.src = track.src;
    audio.load();
    audio.play().catch(() => {});
    isPlaying = true;

    updateUI(track);
    updatePlayBtn(true);
    if (elBar) elBar.style.display = 'flex';

    // Award streaming points
    Auth?.addPoints(2);
    window.dispatchEvent(new CustomEvent('trackChanged', { detail: track }));
  }

  function togglePlay() {
    if (!queue.length) return;
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
    } else {
      if (!audio.src || audio.src === window.location.href) {
        play(currentIndex);
        return;
      }
      audio.play().catch(() => {});
      isPlaying = true;
    }
    updatePlayBtn(isPlaying);
  }

  function next() {
    if (!queue.length) return;
    let idx = isShuffle
      ? Math.floor(Math.random() * queue.length)
      : (currentIndex + 1) % queue.length;
    play(idx);
  }

  function prev() {
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    play((currentIndex - 1 + queue.length) % queue.length);
  }

  function seek(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * (audio.duration || 0);
  }

  function toggleRepeat() {
    isRepeat = !isRepeat;
    audio.loop = isRepeat;
    const btn = document.getElementById('fp-repeat');
    if (btn) btn.style.color = isRepeat ? 'var(--pink)' : '';
    Toast.info(isRepeat ? 'Repeat on 🔁' : 'Repeat off');
  }

  function toggleShuffle() {
    isShuffle = !isShuffle;
    const btn = document.getElementById('fp-shuffle');
    if (btn) btn.style.color = isShuffle ? 'var(--pink)' : '';
    Toast.info(isShuffle ? 'Shuffle on 🔀' : 'Shuffle off');
  }

  function toggleLikeTrack() {
    isLiked = !isLiked;
    const btn = document.getElementById('fp-like');
    if (btn) btn.textContent = isLiked ? '❤️' : '🤍';
    if (isLiked) { Auth?.addPoints(1); Toast.success('+1 point for loving music! ❤️'); }
  }

  // ── Queue management ───────────────────────────────────────
  function setQueue(tracks, startIndex = 0, autoPlay = true) {
    queue = tracks;
    currentIndex = startIndex;
    if (autoPlay) play(startIndex);
    else {
      updateUI(tracks[startIndex]);
      if (elBar) elBar.style.display = 'flex';
    }
  }

  function addToQueue(track) {
    queue.push(track);
    Toast.info(`"${track.title}" added to queue`);
  }

  // ── Audio event handlers ───────────────────────────────────
  function onTimeUpdate() {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (elProgress) elProgress.style.width = pct + '%';
    if (elFullProg) elFullProg.style.width = pct + '%';
    if (elCurrentTime) elCurrentTime.textContent = formatDuration(audio.currentTime);
  }

  function onLoaded() {
    if (elDuration) elDuration.textContent = formatDuration(audio.duration);
  }

  function onEnded() {
    if (!isRepeat) next();
  }

  // ── UI helpers ─────────────────────────────────────────────
  function updateUI(track) {
    const art = track.cover || 'https://picsum.photos/seed/default/300/300';
    if (elBarArt)    elBarArt.src = art;
    if (elBarTitle)  elBarTitle.textContent = track.title;
    if (elBarArtist) elBarArtist.textContent = track.artist;
    if (elFullArt)   elFullArt.src = art;
    if (elFullTitle) elFullTitle.textContent = track.title;
    if (elFullArtist)elFullArtist.textContent = track.artist;

    // Highlight active track in list
    document.querySelectorAll('.track-item').forEach((el, i) => {
      const isActive = el.dataset.trackId === track.id;
      el.classList.toggle('playing', isActive);
      const num = el.querySelector('.track-num');
      const indicator = el.querySelector('.track-playing-indicator');
      if (num && indicator) {
        num.style.display = isActive ? 'none' : 'block';
        indicator.style.display = isActive ? 'flex' : 'none';
      }
    });
  }

  function updatePlayBtn(playing) {
    const icon = playing ? '⏸' : '▶';
    if (elBarPlay) elBarPlay.textContent = icon;
    if (elFullPlay) elFullPlay.textContent = playing ? '⏸' : '▶';
  }

  function openFullPlayer() {
    if (elFull) elFull.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeFullPlayer() {
    if (elFull) elFull.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Public API ─────────────────────────────────────────────
  return { init, play, togglePlay, next, prev, setQueue, addToQueue, openFullPlayer, closeFullPlayer, get isPlaying() { return isPlaying; }, get currentTrack() { return queue[currentIndex]; } };
})();

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', () => Player.init());

window.Player = Player;