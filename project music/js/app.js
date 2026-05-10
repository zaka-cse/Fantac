// ===== FANTAC APP.JS =====
// Utilities, toast, nav, PWA install, gamification UI

// ── Register Service Worker ────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(r => console.log('SW registered:', r.scope))
      .catch(e => console.warn('SW failed:', e));
  });
}

// ── Toast Notifications ────────────────────────────────────
const Toast = {
  container: null,
  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(msg, type = '', icon = '') {
    if (!this.container) this.init();
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `${icon ? `<span>${icon}</span>` : ''}<span>${msg}</span>`;
    this.container.appendChild(t);
    setTimeout(() => {
      t.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => t.remove(), 300);
    }, 3000);
  },
  success: (m) => Toast.show(m, 'success', '✅'),
  error:   (m) => Toast.show(m, 'error', '❌'),
  info:    (m) => Toast.show(m, 'info', '💫'),
  points:  (n) => Toast.show(`+${n} points earned! ⭐`, 'info')
};

// ── Format numbers ─────────────────────────────────────────
function formatNum(n) {
  n = parseInt(n) || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

// ── Format duration ────────────────────────────────────────
function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Countdown timer ────────────────────────────────────────
function startCountdown(endTs, el) {
  function update() {
    const diff = Math.max(0, endTs - Date.now());
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (el) el.innerHTML = `
      <div class="countdown-unit"><div class="countdown-num">${String(d).padStart(2,'0')}</div><div class="countdown-label">Days</div></div>
      <div class="countdown-unit"><div class="countdown-num">${String(h).padStart(2,'0')}</div><div class="countdown-label">Hrs</div></div>
      <div class="countdown-unit"><div class="countdown-num">${String(m).padStart(2,'0')}</div><div class="countdown-label">Min</div></div>
      <div class="countdown-unit"><div class="countdown-num">${String(s).padStart(2,'0')}</div><div class="countdown-label">Sec</div></div>
    `;
    if (diff > 0) setTimeout(update, 1000);
  }
  update();
}

// ── Active nav highlighting ────────────────────────────────
function highlightNav() {
  const path = window.location.pathname.split('/').pop() || 'home.html';
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.dataset.page === path);
  });
}

// ── Load user avatar/name in nav ───────────────────────────
function populateUserUI() {
  const user = Auth?.getCurrentUser() || FANTAC.SAMPLE_USER;
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.displayName || 'User');
  document.querySelectorAll('[data-user-avatar]').forEach(el => {
    el.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=E1306C&color=fff`;
  });
  document.querySelectorAll('[data-user-points]').forEach(el => el.textContent = formatNum(user.points || 0));
  document.querySelectorAll('[data-user-level]').forEach(el => el.textContent = user.level || 1);
}

// ── PWA Install Banner ─────────────────────────────────────
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  const banner = document.getElementById('install-banner');
  if (banner) banner.classList.remove('hidden');
});

function promptInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(r => {
    if (r.outcome === 'accepted') Toast.success('App installed! 🎉');
    deferredPrompt = null;
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.add('hidden');
  });
}

// ── Skeleton loading helpers ───────────────────────────────
function showSkeletons(container, count = 3, height = '80px') {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'skeleton';
    el.style.height = height;
    el.style.marginBottom = '8px';
    container.appendChild(el);
  }
}

// ── Like toggle with animation ─────────────────────────────
function toggleLike(btn, postId) {
  const liked = btn.classList.toggle('liked');
  const counter = btn.querySelector('.like-count');
  const icon = btn.querySelector('.like-icon');
  if (icon) {
    icon.textContent = liked ? '❤️' : '🤍';
    icon.style.transform = 'scale(1.4)';
    setTimeout(() => icon.style.transform = 'scale(1)', 200);
  }
  if (counter) {
    let n = parseInt(counter.textContent.replace(/[KM]/g, '')) || 0;
    counter.textContent = formatNum(liked ? n + 1 : n - 1);
  }
  if (liked) Auth?.addPoints(1);
}

// ── Follow toggle ──────────────────────────────────────────
function toggleFollow(btn) {
  const following = btn.classList.toggle('following');
  btn.textContent = following ? 'Following' : 'Follow';
  if (following) {
    btn.classList.add('btn-outline');
    btn.classList.remove('btn-primary');
    Auth?.addPoints(5);
    Toast.success('Following! +5 points ⭐');
  } else {
    btn.classList.remove('btn-outline');
    btn.classList.add('btn-primary');
  }
}

// ── Join camp ──────────────────────────────────────────────
function joinCamp(btn, campName) {
  const joined = btn.classList.toggle('joined');
  btn.textContent = joined ? 'Joined ✓' : 'Join';
  if (joined) {
    Auth?.addPoints(25);
    Toast.success(`Joined ${campName}! +25 points 🎉`);
  }
}

// ── Points level calc ──────────────────────────────────────
function getLevelInfo(points) {
  const levels = [
    { level: 1, min: 0, max: 100, name: 'Rookie Fan' },
    { level: 2, min: 100, max: 300, name: 'Bronze Fan' },
    { level: 3, min: 300, max: 600, name: 'Silver Fan' },
    { level: 4, min: 600, max: 1000, name: 'Gold Fan' },
    { level: 5, min: 1000, max: 2000, name: 'Platinum Fan' },
    { level: 6, min: 2000, max: 3500, name: 'Diamond Fan' },
    { level: 7, min: 3500, max: 5500, name: 'Legend Fan' },
    { level: 8, min: 5500, max: 8000, name: 'Icon Fan' },
    { level: 9, min: 8000, max: 12000, name: 'Hall of Fame' },
    { level: 10, min: 12000, max: Infinity, name: 'GOD Level' }
  ];
  return levels.find(l => points >= l.min && points < l.max) || levels[levels.length - 1];
}

// ── Debounce ───────────────────────────────────────────────
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── Init on DOM ready ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  highlightNav();
  populateUserUI();

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => {
      if (e.target === o) o.classList.remove('open');
    });
  });

  // Animate elements on scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-on-scroll').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
});

// ── Exports ────────────────────────────────────────────────
window.Toast = Toast;
window.formatNum = formatNum;
window.formatDuration = formatDuration;
window.startCountdown = startCountdown;
window.promptInstall = promptInstall;
window.toggleLike = toggleLike;
window.toggleFollow = toggleFollow;
window.joinCamp = joinCamp;
window.getLevelInfo = getLevelInfo;
window.debounce = debounce;
window.populateUserUI = populateUserUI;