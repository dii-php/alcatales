// src/utils/dataService.js
import { db } from '../firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  orderBy, query, serverTimestamp, where,
  setDoc, getDoc, updateDoc
} from 'firebase/firestore';

// Convert Firestore Timestamp to ISO string safely
const toISO = (ts) => {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
  if (ts.seconds !== undefined) return new Date(ts.seconds * 1000).toISOString();
  return null;
};

// Serialize a Firestore doc — converts all Timestamp fields to ISO strings
const serialize = (d) => {
  const data = d.data();
  return {
    id: d.id,
    ...data,
    createdAt: toISO(data.createdAt) ?? null,
    updatedAt: toISO(data.updatedAt) ?? null,
  };
};

export const PAGE_SIZE = 10;

// ── GALLERY ───────────────────────────────────────────────
// Returns ALL gallery items (used internally for pagination/filtering on client)
export const getGallery = async () => {
  const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(serialize);
};

export const getGalleryByMoment = async (momentId) => {
  try {
    const q = query(
      collection(db, 'gallery'),
      where('momentId', '==', momentId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(serialize);
  } catch (e) {
    const all = await getGallery();
    return all.filter(item => item.momentId === momentId);
  }
};

export const addGalleryItem = async ({ imageUrl, caption, momentId = null, cloudinaryId = null }) => {
  return addDoc(collection(db, 'gallery'), {
    imageUrl, caption: caption || '', momentId, cloudinaryId,
    createdAt: serverTimestamp(),
  });
};

// Assign / change which moment a gallery photo belongs to
export const updateGalleryItemMoment = async (id, momentId) => {
  return updateDoc(doc(db, 'gallery', id), { momentId: momentId || null });
};

export const deleteGalleryItem = async (id) => deleteDoc(doc(db, 'gallery', id));

// ── SITE SETTINGS ────────────────────────────────────────
export const getSetting = async (key) => {
  try {
    const snap = await getDoc(doc(db, 'settings', key));
    return snap.exists() ? snap.data() : null;
  } catch (e) { return null; }
};

export const setSetting = async (key, data) => {
  return setDoc(doc(db, 'settings', key), { ...data, updatedAt: serverTimestamp() });
};

// ── TIMELINE / MOMENTS ────────────────────────────────────
export const getMoments = async () => {
  const q = query(collection(db, 'moments'), orderBy('date', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(serialize);
};

export const addMoment = async ({ title, description, date, icon }) => {
  return addDoc(collection(db, 'moments'), {
    title, description, date, icon,
    createdAt: serverTimestamp(),
  });
};

export const deleteMoment = async (id) => deleteDoc(doc(db, 'moments', id));

// ── LOVE LETTERS ─────────────────────────────────────────
// Returns ALL letters (client paginates)
export const getLoveLetters = async () => {
  const q = query(collection(db, 'loveLetters'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(serialize);
};

export const addLoveLetter = async ({ from, content, songId = null, songTitle = null, songThumbnail = null, channelTitle = null }) => {
  return addDoc(collection(db, 'loveLetters'), {
    from, content,
    songId, songTitle, songThumbnail, channelTitle,
    createdAt: serverTimestamp(),
  });
};

export const deleteLoveLetter = async (id) => deleteDoc(doc(db, 'loveLetters', id));

// ── EMAIL SUBSCRIBERS ────────────────────────────────────
export const saveEmail = async (email) => {
  return addDoc(collection(db, 'subscribers'), { email, createdAt: serverTimestamp() });
};

// ── UPDATE MOMENT ─────────────────────────────────────────
export const updateMoment = async (id, { title, description, date, icon }) => {
  return updateDoc(doc(db, 'moments', id), {
    title, description, date, icon,
    updatedAt: serverTimestamp(),
  });
};

// ── UPDATE LOVE LETTER ────────────────────────────────────
export const updateLoveLetter = async (id, { from, content, songId, songTitle, songThumbnail }) => {
  return updateDoc(doc(db, 'loveLetters', id), {
    from, content,
    songId: songId || null,
    songTitle: songTitle || null,
    songThumbnail: songThumbnail || null,
    updatedAt: serverTimestamp(),
  });
};

// ── TODAY'S SONG PLAYLIST ─────────────────────────────────
export const getSongPlaylist = async () => {
  try {
    const snap = await getDoc(doc(db, 'settings', 'song_playlist'));
    return snap.exists() ? snap.data() : { videos: [], active: false, currentIndex: 0 };
  } catch (e) { return { videos: [], active: false, currentIndex: 0 }; }
};

export const setSongPlaylist = async (data) => {
  return setDoc(doc(db, 'settings', 'song_playlist'), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// ── SUBSCRIBERS (client-side save with token) ────────────
export const subscribeEmail = async (email, isAdminSubscriber = false, adminUsername = '') => {
  const res = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, isAdminSubscriber, adminUsername }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Subscribe failed');
  return data;
};

// ── SEND NOTIFICATION (internal, called after admin actions) ─
export const sendNotification = async (type, data, senderAdminUsername = '') => {
  const key = process.env.REACT_APP_INTERNAL_NOTIFY_KEY;
  if (!key) return;
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': key,
      },
      body: JSON.stringify({ type, data, senderAdminUsername }),
    });
  } catch (e) {
    console.warn('Notification send failed (non-critical):', e.message);
  }
};
