// api/notify.js
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

const SITE_URL   = 'https://alcatales.web.id';
const FROM_EMAIL = 'notification@mail.alcatales.web.id';
const FROM_NAME  = 'ALCA ♡ Aldi & Caca';

const IMGUR_IMG = `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
  <tr><td align="center">
    <img src="https://i.imgur.com/sU2SlZm.jpeg"
      alt="ALCA - Aldi & Caca" width="480"
      style="max-width:100%;border-radius:16px;display:block;" />
  </td></tr>
</table>`;

function emailTemplate({ headline, body, btnText, btnUrl, unsubUrl }) {
  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ALCA Notification</title></head>
<body style="margin:0;padding:0;background:#fdf6f3;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f3;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
  <tr><td style="background:linear-gradient(135deg,#c96a5e,#e8857a,#b5607a);border-radius:20px 20px 0 0;padding:40px 32px;text-align:center;">
    <p style="margin:0 0 6px;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:.1em;text-transform:uppercase;">ALCA ♡</p>
    <h1 style="margin:0;font-family:Georgia,serif;font-size:32px;color:white;font-style:italic;">Aldi &amp; Caca</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,.75);font-size:14px;">Together since 09 April 2026</p>
  </td></tr>
  <tr><td style="background:white;padding:36px 32px;">
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#3d2b2b;text-align:center;margin:0 0 20px;">${headline}</h2>
    ${body}
    ${IMGUR_IMG}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr><td align="center">
        <a href="${btnUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#e8857a,#d4607a);color:white;text-decoration:none;border-radius:50px;font-size:15px;font-weight:600;">${btnText} →</a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#fff5f5;border-radius:0 0 20px 20px;padding:24px 32px;text-align:center;">
    <p style="margin:0 0 8px;color:#c9a09a;font-size:12px;line-height:1.6;">
      Kamu menerima email ini karena berlangganan notifikasi dari ALCA.
    </p>
    <a href="${unsubUrl}" style="color:#e8857a;font-size:12px;">Berhenti berlangganan</a>
    <p style="margin:12px 0 0;color:#d4b0b0;font-size:11px;">Made with ♡ for our forever story.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function buildEmail({ type, data, token }) {
  const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${token}`;

  if (type === 'timeline') {
    const { title, description, date } = data;
    return {
      subject: `✨ Momen baru di ALCA — ${title}`,
      html: emailTemplate({
        headline: '📅 Ada Momen Baru!',
        body: `
          <p style="font-size:15px;color:#5a3a3a;text-align:center;line-height:1.7;margin:0 0 16px;">
            Timeline perjalanan cinta Aldi &amp; Caca baru saja bertambah.
          </p>
          <div style="background:linear-gradient(135deg,#fff5f5,#ffeaea);border-radius:16px;padding:24px;border-left:4px solid #e8857a;">
            ${date ? `<p style="font-size:12px;color:#e8857a;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px;">${date}</p>` : ''}
            <h2 style="font-family:Georgia,serif;font-size:20px;color:#3d2b2b;margin:0 0 10px;">${title}</h2>
            ${description ? `<p style="font-size:14px;color:#7a5a5a;margin:0;line-height:1.6;">${description}</p>` : ''}
          </div>`,
        btnText: 'Lihat Timeline Lengkap',
        btnUrl: `${SITE_URL}/timeline`,
        unsubUrl,
      }),
    };
  }

  const { id, from, preview } = data;
  return {
    subject: `💌 Surat cinta baru dari ${from} — ALCA`,
    html: emailTemplate({
      headline: '💌 Ada Surat Cinta Baru!',
      body: `
        <p style="font-size:15px;color:#5a3a3a;text-align:center;line-height:1.7;margin:0 0 16px;">
          Seseorang ingin mengungkapkan perasaannya melalui sebuah surat.
        </p>
        <div style="background:linear-gradient(135deg,#fff5f5,#ffeaea);border-radius:16px;padding:24px;text-align:center;">
          <p style="font-family:Georgia,serif;font-style:italic;font-size:13px;color:#e8857a;margin:0 0 12px;">♡ Dari ${from}</p>
          <p style="font-family:Georgia,serif;font-style:italic;font-size:17px;color:#5a3a3a;line-height:1.7;margin:0;">"${preview}..."</p>
        </div>`,
      btnText: 'Baca Surat Lengkapnya',
      btnUrl: `${SITE_URL}/love-letter/${id}`,
      unsubUrl,
    }),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-internal-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth: only enforce if INTERNAL_NOTIFY_KEY is configured
  const configuredKey = process.env.INTERNAL_NOTIFY_KEY;
  if (configuredKey) {
    if (req.headers['x-internal-key'] !== configuredKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const { type, data, senderAdminUsername = '' } = req.body || {};
  if (!type || !data) return res.status(400).json({ error: 'Missing type or data' });

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    console.error('[notify] RESEND_API_KEY not set');
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  try {
    initAdmin();
    const db = getFirestore();

    const snap = await db.collection('subscribers').where('active', '==', true).get();
    console.log(`[notify] ${snap.size} active subscribers`);
    if (snap.empty) return res.status(200).json({ sent: 0, message: 'No subscribers' });

    let sent = 0;
    const errors = [];
    const skipped = [];

    for (const docSnap of snap.docs) {
      const { email, token, isAdminSubscriber, adminUsername } = docSnap.data();
      if (!email || !token) { skipped.push('missing data'); continue; }

      // Skip the admin who triggered this notification
      if (isAdminSubscriber && adminUsername && senderAdminUsername &&
          adminUsername.toLowerCase() === senderAdminUsername.toLowerCase()) {
        skipped.push(`self: ${email}`);
        continue;
      }

      const { subject, html } = buildEmail({ type, data, token });

      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [email], subject, html,
          }),
        });
        const result = await r.json();
        if (r.ok) { sent++; console.log(`[notify] ✓ ${email}`); }
        else { errors.push({ email, status: r.status, detail: result }); console.error(`[notify] ✗ ${email}:`, result); }
      } catch (e) {
        errors.push({ email, error: e.message });
        console.error(`[notify] exception ${email}:`, e.message);
      }
    }

    console.log(`[notify] sent=${sent} skipped=${skipped.length} errors=${errors.length}`);
    return res.status(200).json({ sent, skipped, errors });
  } catch (err) {
    console.error('[notify] fatal:', err);
    return res.status(500).json({ error: err.message });
  }
}
