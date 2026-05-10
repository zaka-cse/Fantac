// ===== FANTAC GAMIFICATION.JS =====
// Handles points, levels, achievements, leaderboard

const Gamification = (() => {
  // Level thresholds (cumulative points)
  const LEVELS = [
    { level: 1, minPoints: 0, maxPoints: 100, name: 'Rookie', icon: '🌱' },
    { level: 2, minPoints: 100, maxPoints: 250, name: 'Listener', icon: '🎧' },
    { level: 3, minPoints: 250, maxPoints: 500, name: 'Enthusiast', icon: '🔥' },
    { level: 4, minPoints: 500, maxPoints: 850, name: 'Supporter', icon: '❤️' },
    { level: 5, minPoints: 850, maxPoints: 1300, name: 'Superfan', icon: '⭐' },
    { level: 6, minPoints: 1300, maxPoints: 1900, name: 'Diehard', icon: '💎' },
    { level: 7, minPoints: 1900, maxPoints: 2700, name: 'Legend', icon: '🏆' },
    { level: 8, minPoints: 2700, maxPoints: 3700, name: 'Icon', icon: '👑' },
    { level: 9, minPoints: 3700, maxPoints: 5000, name: 'Mythic', icon: '⚡' },
    { level: 10, minPoints: 5000, maxPoints: Infinity, name: 'GOAT', icon: '🐐' }
  ];

  // ── Calculate level from points ───────────────────────────
  function calculateLevel(points) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (points >= LEVELS[i].minPoints) {
        return { ...LEVELS[i], pointsToNext: LEVELS[i].maxPoints === Infinity ? 0 : LEVELS[i].maxPoints - points };
      }
    }
    return LEVELS[0];
  }

  // ── Add points (with level up detection) ──────────────────
  async function addPoints(amount, reason = '') {
    if (!amount || amount <= 0) return;
    const user = Auth.getCurrentUser();
    if (!user) return;

    const currentPoints = user.points || 0;
    const newPoints = currentPoints + amount;
    const oldLevel = calculateLevel(currentPoints);
    const newLevel = calculateLevel(newPoints);

    // Update points via Auth
    if (window.Auth && Auth.addPoints) {
      await Auth.addPoints(amount, reason);
    } else {
      // Fallback for demo
      if (FANTAC.DEMO_MODE) {
        user.points = newPoints;
        if (newLevel.level > oldLevel.level) user.level = newLevel.level;
        localStorage.setItem('fantac_demo_user', JSON.stringify(user));
        FANTAC.currentUser = user;
      }
    }

    // Dispatch events
    window.dispatchEvent(new CustomEvent('pointsAdded', { detail: { amount, total: newPoints, reason } }));

    // Level up!
    if (newLevel.level > oldLevel.level) {
      Toast.success(`🎉 LEVEL UP! You're now Level ${newLevel.level} ${newLevel.name} ${newLevel.icon}`);
      window.dispatchEvent(new CustomEvent('levelUp', { detail: { oldLevel: oldLevel.level, newLevel: newLevel.level, levelInfo: newLevel } }));
    } else {
      Toast.points(amount);
    }

    // Update UI elements that show points/level
    updateGamificationUI();
  }

  // ── Update all gamification UI elements on page ───────────
  function updateGamificationUI() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const points = user.points || 0;
    const levelInfo = calculateLevel(points);
    const progressPercent = levelInfo.maxPoints === Infinity ? 100 : ((points - levelInfo.minPoints) / (levelInfo.maxPoints - levelInfo.minPoints)) * 100;

    // Update points badges
    document.querySelectorAll('.user-points, .points-badge-value, [data-user-points]').forEach(el => {
      el.textContent = formatNum(points);
    });
    document.querySelectorAll('.user-level, [data-user-level]').forEach(el => {
      el.textContent = levelInfo.level;
    });
    document.querySelectorAll('.level-progress-fill, .level-bar-fill').forEach(el => {
      el.style.width = `${Math.min(100, progressPercent)}%`;
    });
    document.querySelectorAll('.level-name').forEach(el => {
      el.textContent = levelInfo.name;
    });
  }

  // ── Get leaderboard (top users by points) ─────────────────
  async function getLeaderboard(limit = 20) {
    if (FANTAC.DEMO_MODE) {
      return FANTAC.SAMPLE_LEADERBOARD || [];
    }

    try {
      const snapshot = await FANTAC.db.collection(FANTAC.COLLECTIONS.USERS)
        .orderBy('points', 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map((doc, idx) => ({
        rank: idx + 1,
        uid: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Leaderboard error:', error);
      return [];
    }
  }

  // ── Get user's rank ───────────────────────────────────────
  async function getUserRank(uid) {
    if (FANTAC.DEMO_MODE) {
      const leaderboard = FANTAC.SAMPLE_LEADERBOARD;
      const userEntry = leaderboard.find(l => l.isUser || l.name === (Auth.getCurrentUser()?.displayName));
      return userEntry ? userEntry.rank : 42;
    }

    try {
      const users = await FANTAC.db.collection(FANTAC.COLLECTIONS.USERS)
        .orderBy('points', 'desc')
        .get();
      let rank = 1;
      for (const doc of users.docs) {
        if (doc.id === uid) return rank;
        rank++;
      }
      return rank;
    } catch (error) {
      console.error('Get rank error:', error);
      return 0;
    }
  }

  // ── Track user actions and award points ───────────────────
  const ActionPoints = {
    DAILY_LOGIN: 10,
    STREAM_SONG: 2,
    LIKE_POST: 1,
    COMMENT: 2,
    SHARE: 3,
    FOLLOW_ARTIST: 5,
    JOIN_CAMP: 25,
    CREATE_POST: 5,
    WIN_GIVEAWAY: 100,
    REFERRAL: 50
  };

  async function trackAction(action, metadata = {}) {
    const points = ActionPoints[action];
    if (!points) return;
    await addPoints(points, action);
  }

  // ── Daily streak tracking ─────────────────────────────────
  async function updateDailyStreak() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
    const today = new Date().toDateString();

    if (lastLogin && lastLogin.toDateString() === today) return;

    let newStreak = 1;
    if (lastLogin) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastLogin.toDateString() === yesterday.toDateString()) {
        newStreak = (user.streak || 0) + 1;
      } else {
        newStreak = 1;
      }
    }

    await Auth.updateProfile({ streak: newStreak, lastLoginDate: new Date() });
    if (newStreak % 7 === 0) {
      await addPoints(50, `7-day streak bonus!`);
      Toast.success(`🔥 ${newStreak} day streak! +50 bonus points!`);
    } else {
      await addPoints(ActionPoints.DAILY_LOGIN, 'daily_login');
    }
  }

  // ── Public API ────────────────────────────────────────────
  return {
    calculateLevel,
    addPoints,
    updateGamificationUI,
    getLeaderboard,
    getUserRank,
    trackAction,
    updateDailyStreak,
    ActionPoints,
    LEVELS
  };
})();

// Auto-update UI on user load
window.addEventListener('userLoaded', () => Gamification.updateGamificationUI());
window.addEventListener('pointsAdded', () => Gamification.updateGamificationUI());

window.Gamification = Gamification;