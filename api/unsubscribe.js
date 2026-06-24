// api/unsubscribe.js — Vercel Serverless Function
// GET ?token=xxx → mark subscriber inactive
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initAdmin() {
  if (getApps().length) return;
  initializeApp({
    credential: cert({
      projectId:    process.env.FIREBASE_PROJECT_ID,
      clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:   process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send(html('Token tidak valid', 'Token unsubscribe tidak ditemukan.', false));
  }

  try {
    initAdmin();
    const db = getFirestore();
    const snap = await db.collection('subscribers')
      .where('token', '==', token).limit(1).get();

    if (snap.empty) {
      return res.status(404).send(html('Tidak Ditemukan', 'Token tidak valid atau email sudah di-unsubscribe.', false));
    }

    await snap.docs[0].ref.update({ active: false, unsubscribedAt: new Date() });

    return res.status(200).send(html(
      'Berhasil Unsubscribe',
      'Kamu tidak akan menerima notifikasi dari ALCA lagi. Terima kasih sudah bersama kami 💕',
      true
    ));
  } catch (err) {
    console.error('unsubscribe error:', err);
    return res.status(500).send(html('Error', 'Terjadi kesalahan. Coba lagi nanti.', false));
  }
}

function html(title, message, success) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title} — ALCA</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #fdf6f3; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: white; border-radius: 24px; padding: 48px 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 8px 40px rgba(232,133,122,0.15); border: 1px solid #f0d8d5; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-family: 'Georgia', serif; font-size: 26px; color: #3d2b2b; margin-bottom: 12px; }
    p { color: #9a7a7a; font-size: 15px; line-height: 1.6; margin-bottom: 28px; }
    a { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg,#e8857a,#d4607a); color: white; border-radius: 50px; text-decoration: none; font-size: 14px; font-weight: 500; }
    .brand { margin-top: 28px; font-size: 12px; color: #c9a09a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '💕' : '❌'}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://alcatales.web.id">Kembali ke ALCA</a>
    <p class="brand">ALCA ♡ Aldi & Caca</p>
  </div>
</body>
</html>`;
}
