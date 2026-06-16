// src/utils/dataService.js
import { db } from '../firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  orderBy, query, serverTimestamp, where,
  setDoc, getDoc
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

// ── GALLERY ───────────────────────────────────────────────
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

export const addGalleryItem = async ({ imageUrl, caption, momentId = null }) => {
  return addDoc(collection(db, 'gallery'), {
    imageUrl, caption: caption || '', momentId,
    createdAt: serverTimestamp(),
  });
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
export const getLoveLetters = async () => {
  const q = query(collection(db, 'loveLetters'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(serialize);
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
