// ===== FANTAC AUTH.JS =====
// Handles: login, register, logout, auth state, profile creation

const Auth = (() => {

  // ── Guard: redirect to login if not authenticated ──────────
  function requireAuth() {
    const publicPages = ['/index.html', '/login.html', '/register.html', '/', '/index'];
    const path = window.location.pathname;
    const isPublic = publicPages.some(p => path.endsWith(p) || path === p);
    if (isPublic) return;

    if (FANTAC.DEMO_MODE) {
      // Demo mode: use stored session
      const session = localStorage.getItem('fantac_demo_user');
      if (!session) { window.location.href = 'login.html'; return; }
      FANTAC.currentUser = JSON.parse(session);
      return;
    }

    FANTAC.auth.onAuthStateChanged(user => {
      if (!user) window.location.href = 'login.html';
      else {
        FANTAC.currentUser = user;
        loadUserProfile(user.uid);
      }
    });
  }

  // ── Load user Firestore profile ────────────────────────────
  async function loadUserProfile(uid) {
    try {
      const doc = await FANTAC.db.collection(FANTAC.COLLECTIONS.USERS).doc(uid).get();
      if (doc.exists) {
        FANTAC.currentUser = { ...FANTAC.auth.currentUser, ...doc.data() };
        window.dispatchEvent(new CustomEvent('userLoaded', { detail: FANTAC.currentUser }));
      }
    } catch (e) { console.warn('Profile load failed:', e); }
  }

  // ── Email/Password Login ───────────────────────────────────
  async function loginWithEmail(email, password) {
    if (FANTAC.DEMO_MODE) {
      return demoLogin(email);
    }
    const cred = await FANTAC.auth.signInWithEmailAndPassword(email, password);
    await loadUserProfile(cred.user.uid);
    return cred.user;
  }

  // ── Google Login ───────────────────────────────────────────
  async function loginWithGoogle() {
    if (FANTAC.DEMO_MODE) return demoLogin('google@demo.com');
    const cred = await FANTAC.auth.signInWithPopup(FANTAC.googleProvider);
    // Create profile if first time
    const ref = FANTAC.db.collection(FANTAC.COLLECTIONS.USERS).doc(cred.user.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      await createUserProfile(cred.user, 'fan');
    }
    await loadUserProfile(cred.user.uid);
    return cred.user;
  }

  // ── Demo Login ─────────────────────────────────────────────
  function demoLogin(email) {
    const user = { ...FANTAC.SAMPLE_USER, email };
    localStorage.setItem('fantac_demo_user', JSON.stringify(user));
    FANTAC.currentUser = user;
    return user;
  }

  // ── Registration ───────────────────────────────────────────
  async function register(email, password, displayName, role = 'fan') {
    if (FANTAC.DEMO_MODE) {
      const user = { ...FANTAC.SAMPLE_USER, email, displayName, role };
      localStorage.setItem('fantac_demo_user', JSON.stringify(user));
      FANTAC.currentUser = user;
      return user;
    }
    const cred = await FANTAC.auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName });
    await createUserProfile(cred.user, role);
    await loadUserProfile(cred.user.uid);
    return cred.user;
  }

  // ── Create Firestore user document ────────────────────────
  async function createUserProfile(firebaseUser, role) {
    const profile = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || 'Music Fan',
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL || '',
      role,
      bio: '',
      location: '',
      level: 1,
      points: 0,
      streak: 0,
      followers: 0,
      following: 0,
      posts: 0,
      campsJoined: 0,
      giveawaysWon: 0,
      genres: [],
      vibes: [],
      followedArtists: [],
      joinedCamps: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await FANTAC.db.collection(FANTAC.COLLECTIONS.USERS).doc(firebaseUser.uid).set(profile);
    return profile;
  }

  // ── Logout ─────────────────────────────────────────────────
  async function logout() {
    if (FANTAC.DEMO_MODE) {
      localStorage.removeItem('fantac_demo_user');
    } else {
      await FANTAC.auth.signOut();
    }
    FANTAC.currentUser = null;
    window.location.href = 'login.html';
  }

  // ── Password Reset ─────────────────────────────────────────
  async function resetPassword(email) {
    if (FANTAC.DEMO_MODE) return true;
    await FANTAC.auth.sendPasswordResetEmail(email);
    return true;
  }

  // ── Update Points ──────────────────────────────────────────
  async function addPoints(amount, reason = '') {
    if (!FANTAC.currentUser) return;
    if (FANTAC.DEMO_MODE) {
      FANTAC.currentUser.points = (FANTAC.currentUser.points || 0) + amount;
      localStorage.setItem('fantac_demo_user', JSON.stringify(FANTAC.currentUser));
      window.dispatchEvent(new CustomEvent('pointsAdded', { detail: { amount, total: FANTAC.currentUser.points } }));
      return;
    }
    const ref = FANTAC.db.collection(FANTAC.COLLECTIONS.USERS).doc(FANTAC.currentUser.uid);
    await ref.update({
      points: firebase.firestore.FieldValue.increment(amount)
    });
  }

  // ── Get current user (sync) ────────────────────────────────
  function getCurrentUser() {
    if (FANTAC.currentUser) return FANTAC.currentUser;
    if (FANTAC.DEMO_MODE) {
      const stored = localStorage.getItem('fantac_demo_user');
      if (stored) { FANTAC.currentUser = JSON.parse(stored); return FANTAC.currentUser; }
    }
    return null;
  }

  // ── Update profile ─────────────────────────────────────────
  async function updateProfile(data) {
    if (FANTAC.DEMO_MODE) {
      FANTAC.currentUser = { ...FANTAC.currentUser, ...data };
      localStorage.setItem('fantac_demo_user', JSON.stringify(FANTAC.currentUser));
      return;
    }
    const ref = FANTAC.db.collection(FANTAC.COLLECTIONS.USERS).doc(FANTAC.currentUser.uid);
    await ref.update(data);
    FANTAC.currentUser = { ...FANTAC.currentUser, ...data };
  }

  // ── Public API ─────────────────────────────────────────────
  return { requireAuth, loginWithEmail, loginWithGoogle, register, logout, resetPassword, addPoints, getCurrentUser, updateProfile, createUserProfile, loadUserProfile };
})();

window.Auth = Auth;