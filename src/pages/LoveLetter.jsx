// src/pages/LoveLetter.jsx
import React, { useState, useEffect } from 'react';
import { Heart, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLoveLetters, addLoveLetter, deleteLoveLetter } from '../utils/dataService';

export default function LoveLetter() {
  const { isAdmin } = useAuth();
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ from: '', content: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchLetters(); }, []);

  const fetchLetters = async () => {
    setLoading(true);
    try { setLetters(await getLoveLetters()); } catch (e) {}
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addLoveLetter(form);
      setForm({ from: '', content: '' });
      setShowAdd(false);
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
        background: 'var(--gradient-hero)', padding: '60px 24px 80px',
        textAlign: 'center', position: 'relative',
      }}>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(32px,6vw,52px)', color: 'white', marginBottom: 8 }}>
          Love Letter
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>Tempat untuk menyimpan kata-kata terindah untuk satu sama lain.</p>

        {/* Floating hearts */}
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
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            border: '2px dashed var(--color-border)', borderRadius: 20,
          }}>
            <Heart size={48} color="var(--color-border)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 8 }}>Kotak Surat Masih Kosong</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              {isAdmin ? 'Klik "Tulis Surat" untuk menambahkan surat cinta pertama.' : 'Belum ada surat cinta. Nantikan ya!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {letters.map(letter => (
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

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Heart size={16} fill="var(--color-primary)" color="var(--color-primary)" />
                  <span style={{ fontFamily: 'Dancing Script', fontSize: 20, color: 'var(--color-primary)' }}>
                    Dari {letter.from}
                  </span>
                </div>

                <p style={{
                  fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6,
                  display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {letter.content}
                </p>

                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 12, opacity: 0.6 }}>
                  Klik untuk membaca selengkapnya →
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Letter detail modal */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(null)}>
          <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(null)} style={{
              position: 'absolute', top: 16, right: 16,
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
            }}><X size={20} /></button>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Heart size={28} fill="var(--color-primary)" color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
              <h2 style={{ fontFamily: 'Dancing Script', fontSize: 30, color: 'var(--color-primary)' }}>
                Dari {open.from}
              </h2>
            </div>

            <div style={{
              background: 'var(--color-surface2)', borderRadius: 12, padding: 20,
              fontFamily: 'Playfair Display', fontStyle: 'italic',
              lineHeight: 1.8, fontSize: 15, color: 'var(--color-text)',
              whiteSpace: 'pre-wrap',
            }}>
              {open.content}
            </div>
          </div>
        </div>
      )}

      {/* Add letter modal */}
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
