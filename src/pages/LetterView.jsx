// src/pages/LetterView.jsx
// Full-page view of a single love letter — accessed via /love-letter/:id
// Same layout as site (navbar, footer) but dedicated page for sharing/bookmarking
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ArrowLeft, Music } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

function toDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
  const d = new Date(ts);
  return isNaN(d) ? null : d;
}

function formatDate(ts, prefix = false) {
  const date = toDate(ts);
  if (!date) return '';
  const d = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const mon = MONTHS[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  const str = `${mon} ${day}, ${year} at ${h}:${m}:${s} UTC+8`;
  return prefix ? `Sent on ${str}` : str;
}

export default function LetterView() {
  const { id } = useParams();
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'loveLetters', id));
        if (!snap.exists()) { setNotFound(true); }
        else { setLetter({ id: snap.id, ...snap.data() }); }
      } catch (e) { setNotFound(true); }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: '100vh', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--color-text-muted)' }}>Membuka surat...</p>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', paddingTop: 100, textAlign: 'center', padding: '100px 24px' }}>
      <Heart size={48} color="var(--color-border)" style={{ margin: '0 auto 16px' }} />
      <h2 style={{ fontFamily: 'Playfair Display', fontSize: 24, marginBottom: 8 }}>Surat tidak ditemukan</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>Surat ini mungkin sudah dihapus atau link tidak valid.</p>
      <Link to="/love-letter" className="btn-primary">Kembali ke Love Letter</Link>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64 }}>
      {/* Hero gradient strip */}
      <div style={{ background: 'var(--gradient-hero)', padding: '48px 24px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {[...Array(3)].map((_, i) => (
          <Heart key={i} size={14 + i * 5} fill="rgba(255,255,255,0.25)" color="rgba(255,255,255,0.25)"
            style={{ position: 'absolute', top: `${15 + i * 25}%`, left: `${8 + i * 20}%`, animation: `floatHeart ${2.5 + i * 0.6}s ease-in-out infinite`, animationDelay: `${i * 0.4}s`, pointerEvents: 'none' }} />
        ))}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Heart size={32} fill="white" color="white" style={{ margin: '0 auto 12px', display: 'block', animation: 'pulse 2s infinite' }} />
          <p style={{ fontFamily: 'Inter', fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            There's someone sending you a song,
          </p>
          <h1 style={{ fontFamily: "'Architects Daughter', cursive", fontSize: 'clamp(28px,6vw,48px)', color: 'white', marginBottom: 4 }}>
            Hello, from {letter.from}.
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
            They want you to hear this song that maybe you'll like :)
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* YouTube embed */}
        {letter.songId ? (
          <div style={{ marginBottom: 36 }}>
            <div style={{
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              background: '#0f0f0f',
              aspectRatio: '16/9',
            }}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${letter.songId}?rel=0&modestbranding=1`}
                title={letter.songTitle || 'Song'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ display: 'block', width: '100%', height: '100%' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: 32, padding: '24px', background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)' }}>
            <Music size={28} color="var(--color-text-muted)" style={{ margin: '0 auto 8px' }} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Surat ini tidak menyertakan lagu.</p>
          </div>
        )}

        {/* Message */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16, textAlign: 'center' }}>
            Also, here's a message from the sender:
          </p>
          <div style={{
            fontFamily: "'Caveat', 'Patrick Hand', cursive",
            fontSize: 'clamp(23px, 3vw, 25px)',
            color: 'var(--color-text)',
            lineHeight: 1.7,
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
            padding: '0 8px',
          }}>
            {letter.content}
          </div>
        </div>

        {/* Timestamp */}
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', opacity: 0.6, fontStyle: 'italic' }}>
          {formatDate(letter.createdAt, true)}
        </p>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/love-letter" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 13, textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Kembali ke Love Letter
          </Link>
        </div>
      </div>
    </div>
  );
}
