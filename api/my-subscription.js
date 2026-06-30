// api/my-subscription.js — get subscriber email associated with an admin account
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initAdmin() {
  if (getApps().length) return;
  initializeApp({ credential: cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  })});
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { adminUsername } = req.body || {};
  if (!adminUsername) return res.status(400).json({ email: null });

  try {
    initAdmin();
    const db = getFirestore();
    const snap = await db.collection('subscribers')
      .where('isAdminSubscriber', '==', true)
      .where('adminUsername', '==', adminUsername.toLowerCase())
      .limit(1).get();

    if (snap.empty) return res.status(200).json({ email: null });
    return res.status(200).json({ email: snap.docs[0].data().email });
  } catch (e) {
    console.error('my-subscription error:', e);
    return res.status(200).json({ email: null });
  }
}
