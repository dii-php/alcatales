// api/check-subscriber.js — check if email is still active subscriber
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
  if (!email) return res.status(400).json({ active: false });

  try {
    initAdmin();
    const db = getFirestore();
    const snap = await db.collection('subscribers')
      .where('email', '==', email.toLowerCase())
      .where('active', '==', true)
      .limit(1).get();
    return res.status(200).json({ active: !snap.empty });
  } catch (e) {
    return res.status(200).json({ active: true }); // assume active on error
  }
}
