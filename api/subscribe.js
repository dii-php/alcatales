// api/subscribe.js — Vercel Serverless Function
// POST { email } → save subscriber to Firestore with unique token
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { randomBytes } from 'crypto';

function initAdmin() {
  if (getApps().length) return;
  console.log('KEY LENGTH:', process.env.FIREBASE_PRIVATE_KEY?.length);

  const key = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  console.log('START:', key?.slice(0, 30));
  console.log('END:', key?.slice(-30));
  initializeApp({
    credential: cert({
      projectId:    process.env.FIREBASE_PROJECT_ID,
      clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:   process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email tidak valid' });
  }

  try {
    initAdmin();
    const db = getFirestore();

    // Check if already subscribed
    const existing = await db.collection('subscribers')
      .where('email', '==', email.toLowerCase()).limit(1).get();

    if (!existing.empty) {
      return res.status(200).json({ message: 'already_subscribed' });
    }

    const token = randomBytes(32).toString('hex');
    await db.collection('subscribers').add({
      email: email.toLowerCase(),
      token,
      active: true,
      createdAt: new Date(),
    });

    return res.status(200).json({ message: 'subscribed' });
  } catch (err) {
    console.error('subscribe error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
