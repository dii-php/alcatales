// src/utils/dataService.js
import { db } from '../firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  orderBy, query, serverTimestamp, where,
  setDoc, getDoc
} from 'firebase/firestore';

// ── GALLERY (semua foto, untuk home preview) ──────────────
export const getGallery = async () => {
  const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ── GALLERY PER MOMEN ─────────────────────────────────────
export const getGalleryByMoment = async (momentId) => {
  try {
    const q = query(
      collection(db, 'gallery'),
      where('momentId', '==', momentId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    const all = await getGallery();
    return all.filter(item => item.momentId === momentId);
  }
};

export const addGalleryItem = async ({ imageUrl, caption, momentId = null }) => {
  return addDoc(collection(db, 'gallery'), {
    imageUrl, caption: caption || '', momentId,
    createdAt: serverTimestamp(),
  });
};

export const deleteGalleryItem = async (id) => deleteDoc(doc(db, 'gallery', id));

// ── SITE SETTINGS (polaroid, love letter foto) ────────────
// key: 'polaroid' | 'loveletter_photo1' | 'loveletter_photo2'
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
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addMoment = async ({ title, description, date, icon }) => {
  return addDoc(collection(db, 'moments'), {
    title, description, date, icon,
    createdAt: serverTimestamp(),
  });
};

export const deleteMoment = async (id) => deleteDoc(doc(db, 'moments', id));

// ── LOVE LETTERS ─────────────────────────────────────────
export const getLoveLetters = async () => {
  const q = query(collection(db, 'loveLetters'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addLoveLetter = async ({ from, content }) => {
  return addDoc(collection(db, 'loveLetters'), {
    from, content, createdAt: serverTimestamp(),
  });
};

export const deleteLoveLetter = async (id) => deleteDoc(doc(db, 'loveLetters', id));

// ── EMAIL SUBSCRIBERS ────────────────────────────────────
export const saveEmail = async (email) => {
  return addDoc(collection(db, 'subscribers'), { email, createdAt: serverTimestamp() });
};
