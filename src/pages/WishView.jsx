import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, Music, Star } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

function toDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
  const d = new Date(ts);
  return isNaN(d) ? null : d;
}

function formatDate(ts) {
  const d = toDate(ts);
  if (!d) return '';
  const utc8 = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${utc8.getUTCDate()} ${months[utc8.getUTCMonth()]} ${utc8.getUTCFullYear()}`;
}

function getCardAccent(id = '') {
  const accents = [
    { bg: '#fff5f5', border: '#ffd6d6', dot: '#e8857a' },
    { bg: '#f5f0ff', border: '#d6c5ff', dot: '#9b72cf' },
    { bg: '#f0fff5', border: '#c5ffd6', dot: '#5cb87a' },
    { bg: '#fff8f0', border: '#ffddc5', dot: '#e8a87a' },
    { bg: '#f0f8ff', border: '#c5d6ff', dot: '#7a9ce8' },
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return accents[Math.abs(hash) % accents.length];
}

export default function WishView() {
  const { id } = useParams();
  const [wish, setWish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchWish = async () => {
      try {
        const snap = await getDoc(doc(db, 'wishes', id));
        if (!snap.exists()) {
          setNotFound(true);
        } else {
          setWish({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        setNotFound(true);
      }
      setLoading(false);
    };

    fetchWish();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Membuka ucapan...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 100, textAlign: 'center', padding: '100px 24px' }}>
        <Star size={48} color="var(--color-border)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontFamily: 'Playfair Display', fontSize: 24, marginBottom: 8 }}>Ucapan tidak ditemukan</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>Ucapan ini mungkin sudah dihapus atau link tidak valid.</p>
        <Link to="/wish-wall" className="btn-primary">Kembali ke Wish Wall</Link>
      </div>
    );
  }

  const accent = getCardAccent(wish.id);

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64 }}>
      <div style={{ background: 'var(--gradient-hero)', padding: '52px 24px 68px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {[...Array(4)].map((_, i) => (
          <Star
            key={i}
            size={12 + i * 5}
            fill="rgba(255,255,255,0.25)"
            color="rgba(255,255,255,0.25)"
            style={{
              position: 'absolute',
              top: `${15 + i * 18}%`,
              left: `${6 + i * 22}%`,
              animation: `floatHeart ${2.2 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Star size={32} fill="white" color="white" style={{ margin: '0 auto 12px', display: 'block', animation: 'pulse 2s infinite' }} />
          <p style={{ color: 'rgba(255,255,255,0.76)', fontSize: 14, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Sebuah ucapan untuk Aldi & Caca
          </p>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(30px,6vw,48px)', color: 'white', marginBottom: 8 }}>
            Dari {wish.name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 14 }}>
            Tersimpan di Wish Wall pada {formatDate(wish.createdAt)}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
        {wish.songId ? (
          <div style={{ marginBottom: 28 }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', background: '#0f0f0f', aspectRatio: '16/9' }}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${wish.songId}?rel=0&modestbranding=1`}
                title={wish.songTitle || 'Song'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                style={{ display: 'block', width: '100%', height: '100%' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: 28, padding: '24px', background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)' }}>
            <Music size={28} color="var(--color-text-muted)" style={{ margin: '0 auto 8px' }} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Ucapan ini tidak menyertakan lagu.</p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: accent.dot, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.14)' }}>
            <Heart size={18} fill="white" color="white" />
          </div>
        </div>

        <div
          style={{
            background: accent.bg,
            border: `1px solid ${accent.border}`,
            borderRadius: 20,
            padding: '28px 24px',
            fontFamily: 'Playfair Display',
            fontStyle: 'italic',
            fontSize: 'clamp(18px, 2.8vw, 24px)',
            color: '#3d2b2b',
            lineHeight: 1.9,
            whiteSpace: 'pre-wrap',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          }}
        >
          "{wish.message}"
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', opacity: 0.75, marginTop: 18 }}>
          Ditinggalkan oleh {wish.name} pada {formatDate(wish.createdAt)}
        </p>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/wish-wall" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 13, textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Kembali ke Wish Wall
          </Link>
        </div>
      </div>
    </div>
  );
}
