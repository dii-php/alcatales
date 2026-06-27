// api/unsubscribe-email.js — unsubscribe by email (called from website button)
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

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    initAdmin();
    const db = getFirestore();
    const snap = await db.collection('subscribers')
      .where('email', '==', email.toLowerCase()).get();

    const batch = db.batch();
    snap.docs.forEach(d => batch.update(d.ref, { active: false, unsubscribedAt: new Date() }));
    await batch.commit();

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('unsubscribe-email error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
