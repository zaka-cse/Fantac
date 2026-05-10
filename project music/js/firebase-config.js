// ===== FANTAC FIREBASE CONFIG (COMPAT VERSION) =====
// For use with: firebase-app-compat.js, firebase-auth-compat.js, firebase-firestore-compat.js

const firebaseConfig = {
  apiKey: "AIzaSyADh-PsXSVskCisJvJqIkLnjIGRHpR0ymw",
  authDomain: "fantac-dc759.firebaseapp.com",
  projectId: "fantac-dc759",
  storageBucket: "fantac-dc759.firebasestorage.app",
  messagingSenderId: "26720948797",
  appId: "1:26720948797:web:f6b7c336ee9741c668d054"
};

// Initialize Firebase (compat style)
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ── Disable demo mode (real Firebase) ──
const DEMO_MODE = false;

// ── Firestore collections helper ──
const COLLECTIONS = {
  USERS:         'users',
  POSTS:         'posts',
  CAMPS:         'camps',
  GIVEAWAYS:     'giveaways',
  TRACKS:        'tracks',
  LEADERBOARD:   'leaderboard',
  NOTIFICATIONS: 'notifications'
};

// ── Sample data (kept as fallback, but not used in live mode) ──
const SAMPLE_USER = {
  uid: 'demo_user_1',
  displayName: 'Zeejay',
  email: 'zeejay@demo.com',
  photoURL: 'https://i.pravatar.cc/150?img=47',
  role: 'fan',
  bio: 'Music lover 🎧 | Supporting real talent 🔥',
  location: 'Lagos, NG',
  level: 12,
  points: 2450,
  streak: 7,
  followers: 2300,
  following: 320,
  posts: 48,
  campsJoined: 12,
  giveawaysWon: 18,
  createdAt: new Date()
};

const SAMPLE_TRACKS = [
  { id: 't1', title: 'Timeless', artist: 'Davido', album: 'Timeless', duration: '3:45', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', cover: 'https://picsum.photos/seed/track1/300/300', plays: 12400 },
  { id: 't2', title: 'Calm Down', artist: 'Rema', album: 'Rave & Roses', duration: '3:33', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', cover: 'https://picsum.photos/seed/track2/300/300', plays: 9800 },
  { id: 't3', title: 'Last Last', artist: 'Burna Boy', album: 'Love Damini', duration: '4:02', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', cover: 'https://picsum.photos/seed/track3/300/300', plays: 18200 },
  { id: 't4', title: 'Joha', artist: 'Asake', album: 'Mr. Money With The Vibe', duration: '3:21', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', cover: 'https://picsum.photos/seed/track4/300/300', plays: 7600 },
  { id: 't5', title: 'Essence', artist: 'Wizkid ft. Tems', album: 'Made in Lagos', duration: '3:52', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', cover: 'https://picsum.photos/seed/track5/300/300', plays: 24100 },
  { id: 't6', title: 'Rush', artist: 'Ayra Starr', album: '19 & Dangerous', duration: '2:58', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', cover: 'https://picsum.photos/seed/track6/300/300', plays: 6300 }
];

const SAMPLE_ARTISTS = [
  { id: 'a1', name: 'Davido', genre: 'Afrobeats', location: 'Lagos, NG', followers: '4.8M', posts: 236, campers: '320K', verified: true, cover: 'https://picsum.photos/seed/davido/800/400', avatar: 'https://picsum.photos/seed/davido_av/200/200', bio: 'Award-winning Afrobeats artist and songwriter. Creating timeless music and building a global family 🌍', link: 'linktr.ee/davido' },
  { id: 'a2', name: 'Burna Boy', genre: 'Afrobeats', location: 'Port Harcourt, NG', followers: '3.2M', posts: 198, campers: '280K', verified: true, cover: 'https://picsum.photos/seed/burnaboy/800/400', avatar: 'https://picsum.photos/seed/burna_av/200/200', bio: 'African Giant. Twice Grammy Nominated. Setting the world on fire 🔥' },
  { id: 'a3', name: 'Rema', genre: 'Afropop', location: 'Benin City, NG', followers: '1.2M', posts: 142, campers: '76K', verified: true, cover: 'https://picsum.photos/seed/rema/800/400', avatar: 'https://picsum.photos/seed/rema_av/200/200', bio: 'Ravers Camp. Making music that moves you.' },
  { id: 'a4', name: 'Asake', genre: 'Street Pop', location: 'Lagos, NG', followers: '1.1M', posts: 88, campers: '65K', verified: true, cover: 'https://picsum.photos/seed/asake/800/400', avatar: 'https://picsum.photos/seed/asake_av/200/200', bio: 'YBNL Nation. Mr. Money Himself. Street Pop is the wave.' },
  { id: 'a5', name: 'Ayra Starr', genre: 'R&B/Afropop', location: 'Lagos, NG', followers: '980K', posts: 112, campers: '98K', verified: true, cover: 'https://picsum.photos/seed/ayra/800/400', avatar: 'https://picsum.photos/seed/ayra_av/200/200', bio: 'Celestial Camp. Breaking boundaries with every song. ✨' },
  { id: 'a6', name: 'Wizkid', genre: 'Afrobeats', location: 'Lagos, NG', followers: '5.1M', posts: 312, campers: '510K', verified: true, cover: 'https://picsum.photos/seed/wizkid/800/400', avatar: 'https://picsum.photos/seed/wiz_av/200/200', bio: 'Big Wiz. Starboy. Making it easier.' }
];

const SAMPLE_CAMPS = [
  { id: 'c1', name: 'African Giant Camp', artist: 'Burna Boy', members: '128K', badge: 'Official', joined: true, avatar: 'https://picsum.photos/seed/camp_burna/100/100', cover: 'https://picsum.photos/seed/camp_burna_cover/400/200' },
  { id: 'c2', name: 'Celestial Camp', artist: 'Ayra Starr', members: '98K', badge: 'Official', joined: true, avatar: 'https://picsum.photos/seed/camp_ayra/100/100', cover: 'https://picsum.photos/seed/camp_ayra_cover/400/200' },
  { id: 'c3', name: 'Ravers Camp', artist: 'Rema', members: '76K', badge: 'Official', joined: false, avatar: 'https://picsum.photos/seed/camp_rema/100/100', cover: 'https://picsum.photos/seed/camp_rema_cover/400/200' },
  { id: 'c4', name: 'YBNL Nation', artist: 'Asake', members: '65K', badge: 'Official', joined: false, avatar: 'https://picsum.photos/seed/camp_asake/100/100', cover: 'https://picsum.photos/seed/camp_asake_cover/400/200' },
  { id: 'c5', name: 'Starboy Nation', artist: 'Wizkid', members: '215K', badge: 'Official', joined: false, avatar: 'https://picsum.photos/seed/camp_wiz/100/100', cover: 'https://picsum.photos/seed/camp_wiz_cover/400/200' }
];

const SAMPLE_POSTS = [
  { id: 'p1', author: 'Davido', authorAvatar: 'https://picsum.photos/seed/davido_av/100/100', time: '2d', content: 'Timeless out now! 🎶 #TimelessTheAlbum', image: 'https://picsum.photos/seed/post1/600/600', likes: 12400, comments: 1200, shares: 856, liked: false },
  { id: 'p2', author: 'Rema', authorAvatar: 'https://picsum.photos/seed/rema_av/100/100', time: '5h', content: 'In the studio working on something 🔥 Stay tuned! #NewMusic', image: 'https://picsum.photos/seed/post2/600/600', likes: 8700, comments: 623, shares: 412, liked: true },
  { id: 'p3', author: 'Ayra Starr', authorAvatar: 'https://picsum.photos/seed/ayra_av/100/100', time: '1d', content: 'Last night was MAGICAL! Thank you Lagos 🌟', image: 'https://picsum.photos/seed/post3/600/600', likes: 6100, comments: 318, shares: 204, liked: false }
];

const SAMPLE_GIVEAWAYS = [
  { id: 'g1', title: 'VIP Concert Tickets', artist: 'Davido', description: 'Win 2 VIP tickets to Davido\'s Timeless Tour! + Backstage access', value: '₦150,000', entries: 45820, endsIn: Date.now() + 3 * 24 * 60 * 60 * 1000, entered: false },
  { id: 'g2', title: 'Signed Album Bundle', artist: 'Burna Boy', description: 'Win a signed Love Damini vinyl + exclusive merch box', value: '₦80,000', entries: 32100, endsIn: Date.now() + 5 * 24 * 60 * 60 * 1000, entered: true },
  { id: 'g3', title: 'Studio Session', artist: 'Rema', description: '1-hour studio session with Rema + production credits', value: 'Priceless', entries: 89420, endsIn: Date.now() + 1 * 24 * 60 * 60 * 1000, entered: false }
];

const SAMPLE_LEADERBOARD = [
  { rank: 1, name: 'Amaka_fan', avatar: 'https://picsum.photos/seed/lb1/80/80', points: 18420, level: 25, badge: '👑' },
  { rank: 2, name: 'MusicKing_NG', avatar: 'https://picsum.photos/seed/lb2/80/80', points: 15300, level: 22, badge: '🥈' },
  { rank: 3, name: 'Chidora22', avatar: 'https://picsum.photos/seed/lb3/80/80', points: 12800, level: 19, badge: '🥉' },
  { rank: 4, name: 'AfrobeatLover', avatar: 'https://picsum.photos/seed/lb4/80/80', points: 9600, level: 15, badge: '' },
  { rank: 5, name: 'NaijaVibes', avatar: 'https://picsum.photos/seed/lb5/80/80', points: 8100, level: 13, badge: '' },
  { rank: 6, name: 'Zeejay', avatar: 'https://i.pravatar.cc/150?img=47', points: 2450, level: 12, badge: '⭐', isUser: true },
  { rank: 7, name: 'SoundSoul_X', avatar: 'https://picsum.photos/seed/lb7/80/80', points: 7200, level: 12, badge: '' },
  { rank: 8, name: 'BeatDropper', avatar: 'https://picsum.photos/seed/lb8/80/80', points: 6700, level: 11, badge: '' }
];

// ── Global FANTAC object for other scripts (auth.js, app.js) ──
window.FANTAC = {
  DEMO_MODE,
  SAMPLE_USER,
  SAMPLE_TRACKS,
  SAMPLE_ARTISTS,
  SAMPLE_CAMPS,
  SAMPLE_POSTS,
  SAMPLE_GIVEAWAYS,
  SAMPLE_LEADERBOARD,
  auth,
  db,
  googleProvider,
  COLLECTIONS,
  currentUser: null
};

console.log('Firebase initialized. DEMO_MODE =', DEMO_MODE);