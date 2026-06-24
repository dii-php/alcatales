// api/notify.js — Vercel Serverless Function
// POST { type: 'timeline'|'letter', data: {...} }
// Called internally after admin adds a new timeline/letter
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

const SITE_URL   = 'https://alcatales.web.id';
const FROM_EMAIL = 'no-reply@mail.alcatales.web.id';
const FROM_NAME  = 'ALCA ♡ Aldi & Caca';

function buildEmail({ type, data, token }) {
  const unsubUrl = `${SITE_URL}/api/unsubscribe?token=${token}`;

  const imgurEmbed = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:16px 0;">
        <blockquote class="imgur-embed-pub" lang="en" data-id="sU2SlZm">
          <a href="https://imgur.com/sU2SlZm">View post on imgur.com</a>
        </blockquote>
        <script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>
      </td></tr>
    </table>`;

  if (type === 'timeline') {
    const { title, description, date } = data;
    const actionUrl = `${SITE_URL}/timeline`;
    return {
      subject: `✨ Momen baru di ALCA — ${title}`,
      html: emailTemplate({
        headline: '📅 Ada Momen Baru!',
        body: `
          <p style="font-size:16px;color:#5a3a3a;text-align:center;line-height:1.7;margin-bottom:8px;">
            Pasangan kita, Aldi & Caca baru saja selesai berkelana 🥳
          </p>
          <div style="background:linear-gradient(135deg,#fff5f5,#ffeaea);border-radius:16px;padding:28px;margin:24px 0;border-left:4px solid #e8857a;">
            <p style="font-size:13px;color:#e8857a;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;">${date || ''}</p>
            <h2 style="font-family:Georgia,serif;font-size:22px;color:#3d2b2b;margin:0 0 10px;">${title}</h2>
            ${description ? `<p style="font-size:14px;color:#7a5a5a;margin:0;line-height:1.6;">${description}</p>` : ''}
          </div>
          ${imgurEmbed}
        `,
        btnText: 'Lihat Timeline Lengkap',
        btnUrl: actionUrl,
        unsubUrl,
      }),
    };
  }

  // type === 'letter'
  const { id, from, preview } = data;
  const actionUrl = `${SITE_URL}/love-letter/${id}`;
  return {
    subject: `💌 Surat cinta baru dari ${from} — ALCA`,
    html: emailTemplate({
      headline: '💌 Ada Surat Cinta Baru!',
      body: `
        <p style="font-size:16px;color:#5a3a3a;text-align:center;line-height:1.7;margin-bottom:8px;">
          Seseorang baru saja membuat surat.
        </p>
        <div style="background:linear-gradient(135deg,#fff5f5,#ffeaea);border-radius:16px;padding:28px;margin:24px 0;text-align:center;">
          <p style="font-family:Georgia,serif;font-style:italic;font-size:13px;color:#e8857a;margin:0 0 12px;">♡ Dari ${from}</p>
          <p style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#5a3a3a;line-height:1.7;margin:0;">
            "${preview}..."
          </p>
        </div>
        ${imgurEmbed}
      `,
      btnText: 'Baca Surat Lengkapnya',
      btnUrl: actionUrl,
      unsubUrl,
    }),
  };
}

function emailTemplate({ headline, body, btnText, btnUrl, unsubUrl }) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>ALCA Notification</title>
</head>
<body style="margin:0;padding:0;background:#fdf6f3;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f3;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#c96a5e,#e8857a,#b5607a);border-radius:20px 20px 0 0;padding:40px 32px;text-align:center;">
          <p style="margin:0 0 6px;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:0.1em;text-transform:uppercase;">ALCA ♡</p>
          <h1 style="margin:0;font-family:Georgia,serif;font-size:32px;color:white;font-style:italic;">Aldi & Caca</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">Together since 09 April 2026</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:white;padding:36px 32px;">
          <h2 style="font-family:Georgia,serif;font-size:24px;color:#3d2b2b;text-align:center;margin:0 0 8px;">${headline}</h2>
          ${body}
          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
            <tr><td align="center">
              <a href="${btnUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#e8857a,#d4607a);color:white;text-decoration:none;border-radius:50px;font-size:15px;font-weight:600;letter-spacing:0.02em;">${btnText} →</a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#fff5f5;border-radius:0 0 20px 20px;padding:24px 32px;text-align:center;">
          <p style="margin:0 0 8px;color:#c9a09a;font-size:12px;line-height:1.6;">
            Kamu menerima email ini karena berlangganan notifikasi dari ALCA.
          </p>
          <a href="${unsubUrl}" style="color:#e8857a;font-size:12px;text-decoration:underline;">Berhenti berlangganan</a>
          <p style="margin:12px 0 0;color:#d4b0b0;font-size:11px;">Made with ♡ for our forever story.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-internal-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Simple internal key check to prevent abuse
  const internalKey = req.headers['x-internal-key'];
  if (internalKey !== process.env.INTERNAL_NOTIFY_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { type, data } = req.body || {};
  if (!type || !data) return res.status(400).json({ error: 'Missing type or data' });

  try {
    initAdmin();
    const db = getFirestore();

    // Get all active subscribers
    const snap = await db.collection('subscribers').where('active', '==', true).get();
    if (snap.empty) return res.status(200).json({ sent: 0 });

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) return res.status(500).json({ error: 'RESEND_API_KEY not set' });

    let sent = 0;
    const errors = [];

    for (const docSnap of snap.docs) {
      const { email, token } = docSnap.data();
      if (!email || !token) continue;

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
            to: [email],
            subject,
            html,
          }),
        });
        if (r.ok) sent++;
        else errors.push({ email, status: r.status });
      } catch (e) {
        errors.push({ email, error: e.message });
      }
    }

    return res.status(200).json({ sent, errors });
  } catch (err) {
    console.error('notify error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
