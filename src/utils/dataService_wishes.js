// TAMBAHKAN ke dataService.js — Wish Wall functions

export const getWishes = async () => {
  const { db } = await import('../firebase');
  const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
  const q = query(collection(db, 'wishes'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    const toISO = (ts) => {
      if (!ts) return null;
      if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
      if (ts.seconds !== undefined) return new Date(ts.seconds * 1000).toISOString();
      return null;
    };
    return { id: d.id, ...data, createdAt: toISO(data.createdAt) };
  });
};

export const addWish = async ({ name, message, songId, songTitle, songThumbnail, channelTitle }) => {
  const { db } = await import('../firebase');
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
  return addDoc(collection(db, 'wishes'), {
    name: name?.trim() || 'Anonymous',
    message,
    songId: songId || null,
    songTitle: songTitle || null,
    songThumbnail: songThumbnail || null,
    channelTitle: channelTitle || null,
    createdAt: serverTimestamp(),
  });
};

export const deleteWish = async (id) => {
  const { db } = await import('../firebase');
  const { doc, deleteDoc } = await import('firebase/firestore');
  return deleteDoc(doc(db, 'wishes', id));
};
