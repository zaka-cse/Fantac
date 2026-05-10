// ===== FANTAC CAMPS.JS =====
// Handles camp creation, joining, leaving, and listing

const Camps = (() => {
  // ── Create a new camp (artist only) ───────────────────────
  async function createCamp(campName, description, artistId, artistName) {
    if (!campName || !description) {
      Toast.error('Camp name and description required');
      return null;
    }

    const user = Auth.getCurrentUser();
    if (!user) {
      Toast.error('You must be logged in');
      return null;
    }

    if (FANTAC.DEMO_MODE) {
      const newCamp = {
        id: 'camp_' + Date.now(),
        name: campName,
        artist: artistName,
        description: description,
        members: '1',
        badge: 'New',
        joined: true,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(campName)}&background=E1306C&color=fff`,
        cover: 'https://picsum.photos/seed/newcamp/400/200',
        createdAt: new Date()
      };
      // Add to sample camps (simulate)
      if (window.FANTAC && FANTAC.SAMPLE_CAMPS) {
        FANTAC.SAMPLE_CAMPS.unshift(newCamp);
      }
      Toast.success(`Camp "${campName}" created!`);
      return newCamp;
    }

    // Firebase version
    try {
      const campRef = await FANTAC.db.collection(FANTAC.COLLECTIONS.CAMPS).add({
        name: campName,
        description: description,
        artistId: artistId,
        artistName: artistName,
        creatorId: user.uid,
        members: [user.uid],
        memberCount: 1,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      Toast.success(`Camp "${campName}" created!`);
      return { id: campRef.id, name: campName };
    } catch (error) {
      console.error('Create camp error:', error);
      Toast.error('Failed to create camp');
      return null;
    }
  }

  // ── Join a camp ───────────────────────────────────────────
  async function joinCamp(campId, campName) {
    const user = Auth.getCurrentUser();
    if (!user) {
      Toast.error('Please login to join camps');
      return false;
    }

    if (FANTAC.DEMO_MODE) {
      // Update local storage and sample data
      const userData = Auth.getCurrentUser();
      if (userData) {
        const joinedCamps = userData.joinedCamps || [];
        if (!joinedCamps.includes(campId)) {
          joinedCamps.push(campId);
          userData.joinedCamps = joinedCamps;
          userData.campsJoined = (userData.campsJoined || 0) + 1;
          if (window.Auth && Auth.updateProfile) {
            await Auth.updateProfile({ joinedCamps, campsJoined: userData.campsJoined });
          }
        }
      }
      // Update camp member count in sample
      if (window.FANTAC && FANTAC.SAMPLE_CAMPS) {
        const camp = FANTAC.SAMPLE_CAMPS.find(c => c.id === campId);
        if (camp) {
          const currentMembers = parseInt(camp.members) || 0;
          camp.members = (currentMembers + 1).toString() + (currentMembers >= 1000 ? 'K' : '');
          camp.joined = true;
        }
      }
      Auth?.addPoints(25);
      Toast.success(`Joined ${campName}! +25 points 🎉`);
      return true;
    }

    // Firebase version
    try {
      const campRef = FANTAC.db.collection(FANTAC.COLLECTIONS.CAMPS).doc(campId);
      await campRef.update({
        members: firebase.firestore.FieldValue.arrayUnion(user.uid),
        memberCount: firebase.firestore.FieldValue.increment(1)
      });
      const userRef = FANTAC.db.collection(FANTAC.COLLECTIONS.USERS).doc(user.uid);
      await userRef.update({
        joinedCamps: firebase.firestore.FieldValue.arrayUnion(campId),
        campsJoined: firebase.firestore.FieldValue.increment(1)
      });
      Auth?.addPoints(25);
      Toast.success(`Joined ${campName}! +25 points 🎉`);
      return true;
    } catch (error) {
      console.error('Join camp error:', error);
      Toast.error('Failed to join camp');
      return false;
    }
  }

  // ── Leave a camp ──────────────────────────────────────────
  async function leaveCamp(campId, campName) {
    const user = Auth.getCurrentUser();
    if (!user) return false;

    if (FANTAC.DEMO_MODE) {
      const userData = Auth.getCurrentUser();
      if (userData && userData.joinedCamps) {
        userData.joinedCamps = userData.joinedCamps.filter(id => id !== campId);
        userData.campsJoined = Math.max(0, (userData.campsJoined || 0) - 1);
        if (window.Auth && Auth.updateProfile) {
          await Auth.updateProfile({ joinedCamps: userData.joinedCamps, campsJoined: userData.campsJoined });
        }
      }
      if (window.FANTAC && FANTAC.SAMPLE_CAMPS) {
        const camp = FANTAC.SAMPLE_CAMPS.find(c => c.id === campId);
        if (camp) camp.joined = false;
      }
      Toast.info(`Left ${campName}`);
      return true;
    }

    try {
      const campRef = FANTAC.db.collection(FANTAC.COLLECTIONS.CAMPS).doc(campId);
      await campRef.update({
        members: firebase.firestore.FieldValue.arrayRemove(user.uid),
        memberCount: firebase.firestore.FieldValue.increment(-1)
      });
      const userRef = FANTAC.db.collection(FANTAC.COLLECTIONS.USERS).doc(user.uid);
      await userRef.update({
        joinedCamps: firebase.firestore.FieldValue.arrayRemove(campId),
        campsJoined: firebase.firestore.FieldValue.increment(-1)
      });
      Toast.info(`Left ${campName}`);
      return true;
    } catch (error) {
      console.error('Leave camp error:', error);
      Toast.error('Failed to leave camp');
      return false;
    }
  }

  // ── Get all camps (with optional filtering) ───────────────
  async function getAllCamps() {
    if (FANTAC.DEMO_MODE) {
      return FANTAC.SAMPLE_CAMPS || [];
    }

    try {
      const snapshot = await FANTAC.db.collection(FANTAC.COLLECTIONS.CAMPS).orderBy('memberCount', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Get camps error:', error);
      return [];
    }
  }

  // ── Get camps joined by current user ──────────────────────
  async function getUserCamps() {
    const user = Auth.getCurrentUser();
    if (!user) return [];

    if (FANTAC.DEMO_MODE) {
      const userData = Auth.getCurrentUser();
      const joinedIds = userData?.joinedCamps || [];
      const allCamps = FANTAC.SAMPLE_CAMPS || [];
      return allCamps.filter(camp => joinedIds.includes(camp.id));
    }

    try {
      const userDoc = await FANTAC.db.collection(FANTAC.COLLECTIONS.USERS).doc(user.uid).get();
      const joinedIds = userDoc.data()?.joinedCamps || [];
      if (joinedIds.length === 0) return [];
      const camps = await Promise.all(joinedIds.map(id => 
        FANTAC.db.collection(FANTAC.COLLECTIONS.CAMPS).doc(id).get()
      ));
      return camps.filter(doc => doc.exists).map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Get user camps error:', error);
      return [];
    }
  }

  // ── Public API ─────────────────────────────────────────────
  return { createCamp, joinCamp, leaveCamp, getAllCamps, getUserCamps };
})();

window.Camps = Camps;