// src/pages/LoveLetter.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLoveLetters, addLoveLetter, deleteLoveLetter, PAGE_SIZE } from '../utils/dataService';
import Pagination from '../components/Pagination';

// createdAt is a plain ISO string (serialized in dataService)
function toDate(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  return isNaN(d) ? null : d;
}

// Format a timestamp to UTC+8 string
// mode 'card'  → "June 16, 2026 at 11:04:02 AM UTC+8"
// mode 'modal' → "Sent on June 16, 2026 at 11:04:02 AM UTC+8"
function formatDate(ts, mode = 'card') {
  const date = toDate(ts);
  if (!date) return '';

  const d = new Date(date.getTime() + 8 * 60 * 60 * 1000);

  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const mon  = MONTHS[d.getUTCMonth()];
  const day  = d.getUTCDate();
  const year = d.getUTCFullYear();
  let   h    = d.getUTCHours();
  const m    = String(d.getUTCMinutes()).padStart(2, '0');
  const s    = String(d.getUTCSeconds()).padStart(2, '0');
  const ap   = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;

  const str = `${mon} ${day}, ${year} at ${h}:${m}:${s} ${ap} UTC+8`;
  return mode === 'modal' ? `Sent on ${str}` : str;
}

export default function LoveLetter() {
  const { isAdmin } = useAuth();
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ from: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => { fetchLetters(); }, []);

  const fetchLetters = async () => {
    setLoading(true);
    try { setLetters(await getLoveLetters()); } catch (e) {}
    setLoading(false);
  };

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(letters.length / PAGE_SIZE));
  const pagedLetters = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return letters.slice(start, start + PAGE_SIZE);
  }, [letters, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addLoveLetter(form);
      setForm({ from: '', content: '' });
      setShowAdd(false);
      setPage(1);
      await fetchLetters();
    } catch (err) { alert('Gagal menyimpan'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus surat ini?')) return;
    await deleteLoveLetter(id);
    setLetters(letters.filter(l => l.id !== id));
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64 }}>
      {/* Header */}
      <div style={{
        background: 'var(--gradient-hero)', padding: '60px 24px 70px',
        textAlign: 'center', position: 'relative',
      }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(32px,6vw,52px)', color: 'white', marginBottom: 8 }}>
          Love Letter
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>Tempat untuk menyimpan kata-kata terindah untuk satu sama lain.</p>

        {[...Array(5)].map((_, i) => (
          <Heart key={i} size={14 + i * 4} fill="rgba(255,255,255,0.3)" color="rgba(255,255,255,0.3)"
            style={{
              position: 'absolute',
              top: `${20 + i * 15}%`, left: `${10 + i * 18}%`,
              animation: `floatHeart ${2 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }} />
        ))}
      </div>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
        {isAdmin && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus size={16} /> Tulis Surat
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--color-text-muted)' }}>Membuka kotak surat...</div>
        ) : letters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', border: '2px dashed var(--color-border)', borderRadius: 20 }}>
            <Heart size={48} color="var(--color-border)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 8 }}>Kotak Surat Masih Kosong</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              {isAdmin ? 'Klik "Tulis Surat" untuk menambahkan surat cinta pertama.' : 'Belum ada surat cinta. Nantikan ya!'}
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Menampilkan {pagedLetters.length} dari {letters.length} surat
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {pagedLetters.map(letter => (
                <div key={letter.id}
                  style={{
                    background: 'var(--color-surface)',
                    borderRadius: 16, padding: '24px',
                    boxShadow: 'var(--card-shadow)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  onClick={() => setOpen(letter)}
                >
                  {isAdmin && (
                    <button onClick={e => { e.stopPropagation(); handleDelete(letter.id); }} style={{
                      position: 'absolute', top: 12, right: 12,
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
                    }}><Trash2 size={14} /></button>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Heart size={16} fill="var(--color-primary)" color="var(--color-primary)" />
                    <span style={{ fontFamily: 'Dancing Script', fontSize: 20, color: 'var(--color-primary)' }}>
                      Dari {letter.from}
                    </span>
                  </div>

                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 10, opacity: 0.7, fontStyle: 'italic' }}>
                    {formatDate(letter.createdAt, 'card')}
                  </p>

                  <p style={{
                    fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6,
                    display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {letter.content}
                  </p>

                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 12, opacity: 0.5 }}>
                    Klik untuk membaca selengkapnya →
                  </p>
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
          <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(null)} style={{
              position: 'absolute', top: 16, right: 16,
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
            }}><X size={20} /></button>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Heart size={28} fill="var(--color-primary)" color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
              <h2 style={{ fontFamily: 'Dancing Script', fontSize: 30, color: 'var(--color-primary)' }}>
                Dari {open.from}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6, fontStyle: 'italic' }}>
                {formatDate(open.createdAt, 'modal')}
              </p>
            </div>

            <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 18 }} />

            <div style={{
              background: 'var(--color-surface2)', borderRadius: 12, padding: 20,
              fontFamily: 'Playfair Display', fontStyle: 'italic',
              lineHeight: 1.8, fontSize: 15, color: 'var(--color-text)',
              whiteSpace: 'pre-wrap', maxHeight: '55vh', overflowY: 'auto',
            }}>
              {open.content}
            </div>
          </div>
        </div>
      )}

      {/* ── Add letter modal ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAdd(false)} style={{
              position: 'absolute', top: 16, right: 16,
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
            }}><X size={20} /></button>

            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 24 }}>Tulis Surat Cinta</h3>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label>Dari</label>
                <input value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} placeholder="cth: Aldi" required />
              </div>
              <div>
                <label>Isi Surat</label>
                <textarea rows={7} value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Tuliskan kata-kata terindahmu di sini..."
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={saving} style={{ justifyContent: 'center' }}>
                {saving ? 'Menyimpan...' : <><Heart size={15} fill="white" color="white" /> Kirim Surat</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
