// src/pages/WishWall.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Star, Trash2, X, Send, Music, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getWishes, addWish, deleteWish, sendNotification } from '../utils/dataService';
import YouTubeSearch from '../components/YouTubeSearch';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 12;

function toDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

function formatDate(ts) {
  const d = toDate(ts);
  if (!d || isNaN(d)) return '';
  const utc8 = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${utc8.getUTCDate()} ${months[utc8.getUTCMonth()]} ${utc8.getUTCFullYear()}`;
}

// Deterministic pastel color per wish id
function getCardAccent(id) {
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

export default function WishWall() {
  const { isAdmin, adminUsername } = useAuth();
  const navigate = useNavigate();
  const [wishes, setWishes]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage]         = useState(1);
  const [open, setOpen]         = useState(null);
  const [form, setForm]         = useState({ name: '', message: '', song: null });
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    try { setWishes(await getWishes()); } catch (e) {}
    setLoading(false);
  };

  const totalPages   = Math.max(1, Math.ceil(wishes.length / PAGE_SIZE));
  const pagedWishes  = useMemo(() => wishes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [wishes, page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return;
    setSending(true);
    try {
      const payload = {
        name:          form.name.trim() || 'Anonymous',
        message:       form.message.trim(),
        songId:        form.song?.id || null,
        songTitle:     form.song?.title || null,
        songThumbnail: form.song?.thumbnail || null,
        channelTitle:  form.song?.channelTitle || null,
      };
      const docRef = await addWish(payload);
      const preview = payload.message.substring(0, 80);
      sendNotification('wish', { name: payload.name, preview, id: docRef.id }, adminUsername);
      setSent(true);
      setForm({ name: '', message: '', song: null });
      setTimeout(() => { setSent(false); setShowForm(false); }, 2000);
      await fetch();
    } catch (err) { alert('Gagal mengirim. Coba lagi.'); }
    setSending(false);
  };

  // Only admin "aldi" can delete
  const canDelete = isAdmin && adminUsername === 'aldi';

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus ucapan ini?')) return;
    await deleteWish(id);
    setWishes(prev => prev.filter(w => w.id !== id));
    if (open?.id === id) setOpen(null);
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64 }}>
      {/* Header */}
      <div style={{ background: 'var(--gradient-hero)', padding: '60px 24px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {[...Array(4)].map((_, i) => (
          <Star key={i} size={12 + i * 5} fill="rgba(255,255,255,0.25)" color="rgba(255,255,255,0.25)"
            style={{ position: 'absolute', top: `${15 + i * 20}%`, left: `${5 + i * 23}%`, animation: `floatHeart ${2 + i * 0.6}s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }} />
        ))}
        <Star size={28} fill="white" color="white" style={{ margin: '0 auto 12px', display: 'block', animation: 'pulse 2s infinite' }} />
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(30px,6vw,50px)', color: 'white', marginBottom: 8 }}>Wish Wall</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 24 }}>
          Tinggalkan harapan & ucapan untuk Aldi & Caca ✨
        </p>
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 28px', background: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.6)', borderRadius: 50,
            color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            backdropFilter: 'blur(8px)', transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        >
          <Send size={16} /> Tulis Ucapan
        </button>
      </div>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: 80, color: 'var(--color-text-muted)' }}>Memuat ucapan...</p>
        ) : wishes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <Star size={48} color="var(--color-border)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 8 }}>Belum Ada Ucapan</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Jadilah yang pertama meninggalkan harapan! 🌟</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{wishes.length} Harapan diberikan.</p>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} compact />
            </div>

            {/* Card grid — envelope/letter style */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 20,
            }}>
              {pagedWishes.map(wish => {
                const accent = getCardAccent(wish.id);
                return (
                  <div
                    key={wish.id}
                    onClick={() => setOpen(wish)}
                    style={{
                      background: accent.bg,
                      border: `1.5px solid ${accent.border}`,
                      borderRadius: 16, padding: '20px 18px',
                      cursor: 'pointer', position: 'relative',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      transition: 'transform 0.18s, box-shadow 0.18s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
                  >
                    {/* Decorative seal */}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: accent.dot, position: 'absolute', top: -10, left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}>
                      <Star size={13} fill="white" color="white" />
                    </div>

                    {canDelete && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(wish.id); }}
                        style={{
                          position: 'absolute', top: 8, right: 8,
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#ccc', padding: 4,
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#e05c5c'}
                        onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                      ><Trash2 size={13} /></button>
                    )}

                    {/* Song thumbnail */}
                    {wish.songThumbnail && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 10, background: 'rgba(0,0,0,0.05)', borderRadius: 8, padding: '6px 10px' }}>
                        <img src={wish.songThumbnail} alt="" style={{ width: 32, height: 24, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: '#666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wish.songTitle}</p>
                      </div>
                    )}

                    <p style={{ fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: 14, color: '#3d2b2b', lineHeight: 1.65, marginTop: wish.songThumbnail ? 0 : 14,
                      display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 14 }}>
                      "{wish.message}"
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: accent.dot, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Heart size={10} fill="white" color="white" />
                        </div>
                        <span style={{ fontFamily: 'Dancing Script', fontSize: 15, color: accent.dot, fontWeight: 700 }}>
                          {wish.name}
                        </span>
                      </div>
                      <span style={{ fontSize: 10, color: '#aaa' }}>{formatDate(wish.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/wish-wall/${wish.id}`); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: accent.dot,
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        <ExternalLink size={12} /> Buka
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Wish detail modal */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(null)}>
          <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            <button
              onClick={() => navigate(`/wish-wall/${open.id}`)}
              style={{ position: 'absolute', top: 14, right: 46, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              title="Buka halaman penuh"
            >
              <ExternalLink size={18} />
            </button>

            {/* Seal */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: getCardAccent(open.id).dot, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <Star size={18} fill="white" color="white" />
              </div>
              <p style={{ fontFamily: 'Dancing Script', fontSize: 22, color: getCardAccent(open.id).dot, margin: 0 }}>Dari {open.name}</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{formatDate(open.createdAt)}</p>
            </div>

            {/* Song embed */}
            {open.songId && (
              <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, aspectRatio: '16/9' }}>
                <iframe
                  width="100%" height="100%"
                  src={`https://www.youtube.com/embed/${open.songId}?rel=0&modestbranding=1`}
                  title={open.songTitle || 'Song'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen loading="lazy"
                  style={{ display: 'block' }}
                />
              </div>
            )}

            <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 16 }} />

            <div style={{
              background: getCardAccent(open.id).bg,
              border: `1px solid ${getCardAccent(open.id).border}`,
              borderRadius: 12, padding: 20,
              fontFamily: 'Playfair Display', fontStyle: 'italic',
              fontSize: 16, color: '#3d2b2b', lineHeight: 1.8,
              whiteSpace: 'pre-wrap', maxHeight: '45vh', overflowY: 'auto',
            }}>
              "{open.message}"
            </div>

            {canDelete && (
              <button onClick={() => handleDelete(open.id)} style={{
                marginTop: 14, background: 'none', border: 'none',
                color: '#e05c5c', fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5, padding: 0,
              }}>
                <Trash2 size={13} /> Hapus ucapan ini
              </button>
            )}
          </div>
        </div>
      )}

      {/* Write wish modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => !sending && setShowForm(false)}>
          <div className="modal-box" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => !sending && setShowForm(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Star size={28} fill="var(--color-primary)" color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
              <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22 }}>Tulis Ucapanmu</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>Tinggalkan harapan untuk Aldi & Caca ✨</p>
            </div>

            {sent ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <Star size={40} fill="var(--color-primary)" color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontFamily: 'Playfair Display', fontSize: 18, color: 'var(--color-primary)' }}>Ucapanmu terkirim! 🌟</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label>Namamu (opsional)</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nama kamu (kosongkan untuk Anonymous)"
                  />
                </div>
                <div>
                  <label>Ucapan / Harapan *</label>
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Tulis harapan atau ucapanmu untuk Aldi & Caca di sini..."
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Music size={13} /> Lagu (opsional)
                  </label>
                  <YouTubeSearch
                    value={form.song}
                    onChange={song => setForm(f => ({ ...f, song }))}
                    placeholder="Tambahkan lagu spesial..."
                  />
                </div>
                <button type="submit" disabled={sending || !form.message.trim()} className="btn-primary" style={{ justifyContent: 'center' }}>
                  {sending ? 'Mengirim...' : <><Send size={14} /> Kirim Ucapan</>}
                </button>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', margin: 0 }}>
                  Ucapanmu akan terlihat oleh semua pengunjung 💕
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
