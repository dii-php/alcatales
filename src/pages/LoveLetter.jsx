// src/pages/LoveLetter.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Plus, Trash2, X, Pencil, ExternalLink, Music, Youtube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLoveLetters, addLoveLetter, deleteLoveLetter, updateLoveLetter, PAGE_SIZE, sendNotification } from '../utils/dataService';
import Pagination from '../components/Pagination';
import YouTubeSearch from '../components/YouTubeSearch';

// ── Date helpers ─────────────────────────────────────────
function toDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
  const d = new Date(ts);
  return isNaN(d) ? null : d;
}

// 24-hour format, UTC+8
function formatDate(ts, prefix = false) {
  const date = toDate(ts);
  if (!date) return '';
  const d = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const mon  = MONTHS[d.getUTCMonth()];
  const day  = d.getUTCDate();
  const year = d.getUTCFullYear();
  const h    = String(d.getUTCHours()).padStart(2, '0');
  const m    = String(d.getUTCMinutes()).padStart(2, '0');
  const s    = String(d.getUTCSeconds()).padStart(2, '0');
  const str  = `${mon} ${day}, ${year} at ${h}:${m}:${s} UTC+8`;
  return prefix ? `Sent on ${str}` : str;
}

// ── Empty form ────────────────────────────────────────────
const EMPTY_FORM = { from: '', content: '', song: null };

// ── YouTube embed card (compact, in modal/card) ───────────
function SongCard({ songId, songTitle, songThumbnail, channelTitle, compact = false }) {
  if (!songId) return null;
  return (
    <div style={{
      borderRadius: compact ? 10 : 14,
      overflow: 'hidden',
      background: 'var(--color-surface2)',
      border: '1px solid var(--color-border)',
      marginBottom: compact ? 10 : 16,
    }}>
      {compact ? (
        /* Card view: thumbnail + title only, no iframe (perf) */
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          {songThumbnail
            ? <img src={songThumbnail} alt={songTitle} style={{ width: 44, height: 33, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 44, height: 33, borderRadius: 6, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Music size={14} color="#aaa" />
              </div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{songTitle}</p>
            {channelTitle && <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: 0 }}>{channelTitle}</p>}
          </div>
          <Youtube size={14} color="#ff0000" style={{ flexShrink: 0 }} />
        </div>
      ) : (
        /* Modal view: full iframe embed */
        <div style={{ aspectRatio: '16/9' }}>
          <iframe
            width="100%" height="100%"
            src={`https://www.youtube.com/embed/${songId}?rel=0&modestbranding=1`}
            title={songTitle || 'Song'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            style={{ display: 'block' }}
          />
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export default function LoveLetter() {
  const { isAdmin, adminUsername } = useAuth();
  const navigate    = useNavigate();
  const [letters, setLetters]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [open, setOpen]         = useState(null); // letter open in modal
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);

  useEffect(() => { fetchLetters(); }, []);

  const fetchLetters = async () => {
    setLoading(true);
    try { setLetters(await getLoveLetters()); } catch (e) {}
    setLoading(false);
  };

  // Pagination
  const totalPages   = Math.max(1, Math.ceil(letters.length / PAGE_SIZE));
  const pagedLetters = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return letters.slice(start, start + PAGE_SIZE);
  }, [letters, page]);
  useEffect(() => { if (page > totalPages) setPage(Math.max(1, totalPages)); }, [totalPages]);

  // Open add modal
  const openAdd = () => { setForm(EMPTY_FORM); setEditTarget(null); setModalMode('add'); };
  // Open edit modal
  const openEdit = (letter) => {
    setForm({
      from: letter.from || '',
      content: letter.content || '',
      song: letter.songId ? { id: letter.songId, title: letter.songTitle, thumbnail: letter.songThumbnail, channelTitle: letter.channelTitle || '' } : null,
    });
    setEditTarget(letter);
    setModalMode('edit');
  };
  const closeModal = () => { setModalMode(null); setEditTarget(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      from:           form.from,
      content:        form.content,
      songId:         form.song?.id || null,
      songTitle:      form.song?.title || null,
      songThumbnail:  form.song?.thumbnail || null,
      channelTitle:   form.song?.channelTitle || null,
    };
    try {
      if (modalMode === 'add') {
        const docRef = await addLoveLetter(payload);
        const newId = docRef.id;
        setPage(1);
        const preview = payload.content?.substring(0, 80) || '';
        sendNotification('letter', { from: payload.from, preview, id: newId }, adminUsername);
      } else {
        await updateLoveLetter(editTarget.id, payload);
        setLetters(prev => prev.map(l => l.id === editTarget.id ? { ...l, ...payload } : l));
        if (open?.id === editTarget.id) setOpen(prev => ({ ...prev, ...payload }));
      }
      closeModal();
      await fetchLetters();
    } catch (err) { alert('Gagal menyimpan.'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus surat ini?')) return;
    await deleteLoveLetter(id);
    setLetters(prev => prev.filter(l => l.id !== id));
    if (open?.id === id) setOpen(null);
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64 }}>
      {/* Header */}
      <div style={{ background: 'var(--gradient-hero)', padding: '60px 24px 72px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {[...Array(3)].map((_, i) => (
          <Heart key={i} size={14 + i * 5} fill="rgba(255,255,255,0.3)" color="rgba(255,255,255,0.3)"
            style={{ position: 'absolute', top: `${18 + i * 22}%`, left: `${8 + i * 22}%`,
              animation: `floatHeart ${2.2 + i * 0.6}s ease-in-out infinite`, animationDelay: `${i * 0.3}s`, pointerEvents: 'none' }} />
        ))}
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(32px,6vw,52px)', color: 'white', marginBottom: 8 }}>Love Letter</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>Tempat untuk menyimpan kata-kata terindah untuk satu sama lain.</p>
      </div>

      <div className="container" style={{ paddingTop: 36, paddingBottom: 64 }}>
        {isAdmin && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <button onClick={openAdd} className="btn-primary"><Plus size={15} /> Tulis Surat</button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--color-text-muted)' }}>Membuka kotak surat...</div>
        ) : letters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 24px', border: '2px dashed var(--color-border)', borderRadius: 20 }}>
            <Heart size={44} color="var(--color-border)" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 8 }}>Kotak Surat Masih Kosong</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              {isAdmin ? 'Klik "Tulis Surat" untuk menambahkan surat cinta pertama.' : 'Belum ada surat cinta. Nantikan ya!'}
            </p>
          </div>
        ) : (
          <>
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Menampilkan {pagedLetters.length} dari {letters.length} surat</p>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} compact />
            </div>

            {/* Cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {pagedLetters.map(letter => (
                <div key={letter.id} className="letter-card" onClick={() => setOpen(letter)}>

                  {/* If has song: admin buttons sit INSIDE the song strip row */}
                  {letter.songId ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 11px',
                      background: 'var(--color-surface2)',
                      borderRadius: 10, marginBottom: 12,
                      border: '1px solid var(--color-border)',
                    }}>
                      {/* Thumbnail */}
                      {letter.songThumbnail
                        ? <img src={letter.songThumbnail} alt={letter.songTitle}
                            style={{ width: 40, height: 30, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 40, height: 30, borderRadius: 5, background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Music size={13} color="var(--color-text-muted)" />
                          </div>
                      }
                      {/* Song info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{letter.songTitle}</p>
                        {letter.channelTitle && <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: 0 }}>{letter.channelTitle}</p>}
                      </div>
                      {/* YouTube icon */}
                      <Youtube size={13} color="#ff0000" style={{ flexShrink: 0 }} />
                      {/* Admin buttons — inline, never overlap */}
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 4 }}>
                          <button onClick={e => { e.stopPropagation(); openEdit(letter); }} title="Edit"
                            className="letter-card__action-btn letter-card__action-btn--edit">
                            <Pencil size={11} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(letter.id); }} title="Hapus"
                            className="letter-card__action-btn letter-card__action-btn--del">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* No song: keep absolute buttons as before */
                    isAdmin && (
                      <div className="letter-card__actions">
                        <button onClick={e => { e.stopPropagation(); openEdit(letter); }} title="Edit"
                          className="letter-card__action-btn letter-card__action-btn--edit">
                          <Pencil size={12} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(letter.id); }} title="Hapus"
                          className="letter-card__action-btn letter-card__action-btn--del">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )
                  )}

                  {/* From */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                    <Heart size={15} fill="var(--color-primary)" color="var(--color-primary)" />
                    <span style={{ fontFamily: 'Dancing Script', fontSize: 20, color: 'var(--color-primary)' }}>Dari {letter.from}</span>
                  </div>

                  {/* Date */}
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 10, opacity: 0.7, fontStyle: 'italic' }}>
                    {formatDate(letter.createdAt)}
                  </p>

                  {/* Content preview */}
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 12 }}>
                    {letter.content}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', opacity: 0.5 }}>Klik untuk membaca →</span>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/love-letter/${letter.id}`); }}
                      title="Buka halaman penuh"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                    >
                      <ExternalLink size={12} /> Buka
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* ── Letter detail modal ── */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(null)}>
          <div className="modal-box" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>

            {/* Open full page button */}
            <button
              onClick={() => navigate(`/love-letter/${open.id}`)}
              style={{ position: 'absolute', top: 14, right: 46, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              title="Buka halaman penuh"
            >
              <ExternalLink size={18} />
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Heart size={26} fill="var(--color-primary)" color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
              <h2 style={{ fontFamily: 'Dancing Script', fontSize: 28, color: 'var(--color-primary)' }}>Dari {open.from}</h2>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 5, fontStyle: 'italic' }}>{formatDate(open.createdAt, true)}</p>
            </div>

            <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 16 }} />

            {/* Song embed (full iframe in modal) */}
            {open.songId && (
              <SongCard songId={open.songId} songTitle={open.songTitle} songThumbnail={open.songThumbnail} channelTitle={open.channelTitle} compact={false} />
            )}

            {/* Letter body */}
            <div style={{
              background: 'var(--color-surface2)', borderRadius: 12, padding: 18,
              fontFamily: 'Playfair Display', fontStyle: 'italic',
              lineHeight: 1.8, fontSize: 15, color: 'var(--color-text)',
              whiteSpace: 'pre-wrap', maxHeight: '40vh', overflowY: 'auto',
            }}>
              {open.content}
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit modal ── */}
      {modalMode && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 22 }}>
              {modalMode === 'add' ? 'Tulis Surat Cinta' : 'Edit Surat'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label>Dari</label>
                <input value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} placeholder="cth: Aldi" required />
              </div>
              <div>
                <label>Isi Surat</label>
                <textarea rows={6} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Tuliskan kata-kata terindahmu di sini..." required />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Music size={13} /> Lagu (opsional)
                </label>
                <YouTubeSearch
                  value={form.song}
                  onChange={song => setForm(f => ({ ...f, song }))}
                  placeholder="Cari lagu di YouTube..."
                />
              </div>
              <button type="submit" className="btn-primary" disabled={saving} style={{ justifyContent: 'center', marginTop: 4 }}>
                {saving ? 'Menyimpan...' : <><Heart size={14} fill="white" color="white" /> {modalMode === 'add' ? 'Kirim Surat' : 'Simpan Perubahan'}</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Card CSS */}
      <style>{`
        .letter-card {
          background: var(--color-surface);
          border-radius: 16px;
          padding: 18px;
          box-shadow: var(--card-shadow);
          border: 1px solid var(--color-border);
          cursor: pointer;
          position: relative;
          transform: translateZ(0);
          transition: transform 0.18s ease;
        }
        .letter-card:hover { transform: translateY(-4px); }
        .letter-card__actions {
          position: absolute; top: 12px; right: 12px;
          display: flex; gap: 4px;
          opacity: 0; transition: opacity 0.15s;
          z-index: 2;
        }
        .letter-card:hover .letter-card__actions { opacity: 1; }
        .letter-card__action-btn {
          width: 26px; height: 26px; border-radius: 6px;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .letter-card__action-btn--edit { background: var(--color-surface2); color: var(--color-primary); }
        .letter-card__action-btn--del  { background: var(--color-surface2); color: #e05c5c; }
        @media (max-width: 480px) {
          .letter-card__actions { opacity: 1; }
        }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
