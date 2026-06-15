// src/pages/Timeline.jsx
import React, { useState, useEffect } from 'react';
import { Heart, Plus, Trash2, X, Calendar, Gift, Star, Coffee, Film, MapPin, Images } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMoments, addMoment, deleteMoment } from '../utils/dataService';
import MomentGallery from '../components/MomentGallery';

const ICONS = { heart: Heart, gift: Gift, star: Star, coffee: Coffee, film: Film, map: MapPin, calendar: Calendar };
const ICON_OPTIONS = [
  { value: 'heart', label: '❤️ Heart' },
  { value: 'gift', label: '🎁 Gift' },
  { value: 'star', label: '⭐ Star' },
  { value: 'coffee', label: '☕ Coffee' },
  { value: 'film', label: '🎬 Film' },
  { value: 'map', label: '📍 Tempat' },
  { value: 'calendar', label: '📅 Tanggal' },
];

export default function Timeline() {
  const { isAdmin } = useAuth();
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', icon: 'heart' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchMoments(); }, []);

  const fetchMoments = async () => {
    setLoading(true);
    try { setMoments(await getMoments()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addMoment(form);
      setForm({ title: '', description: '', date: '', icon: 'heart' });
      setShowAdd(false);
      await fetchMoments();
    } catch (err) { alert('Gagal menyimpan'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus momen ini?')) return;
    await deleteMoment(id);
    setMoments(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64 }}>
      {/* Header */}
      <div style={{
        background: 'var(--gradient-hero)', padding: '60px 24px 80px',
        textAlign: 'center', position: 'relative',
      }}>
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
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(32px,6vw,52px)', color: 'white', marginBottom: 8 }}>Our Timeline</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>Setiap momen berharga dalam perjalanan cinta kita.</p>
      </div>

      <div className="container" style={{ paddingTop: 48, paddingBottom: 64 }}>
        {isAdmin && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus size={16} /> Tambah Momen
            </button>
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', padding: 80, color: 'var(--color-text-muted)' }}>Memuat timeline...</p>
        ) : moments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', border: '2px dashed var(--color-border)', borderRadius: 20 }}>
            <Calendar size={48} color="var(--color-border)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 8 }}>Belum Ada Momen</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              {isAdmin ? 'Klik "Tambah Momen" untuk membuat momen pertama.' : 'Momen akan muncul di sini setelah ditambahkan.'}
            </p>
          </div>
        ) : (
          <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'var(--color-border)', transform: 'translateX(-50%)' }} />

            {moments.map((m, i) => {
              const Icon = ICONS[m.icon] || Heart;
              const isLeft = i % 2 === 0;
              const dateStr = m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

              return (
                <div key={m.id} style={{
                  display: 'flex',
                  justifyContent: isLeft ? 'flex-end' : 'flex-start',
                  paddingRight: isLeft ? 'calc(50% + 28px)' : 0,
                  paddingLeft: isLeft ? 0 : 'calc(50% + 28px)',
                  marginBottom: 40, position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', left: '50%', top: 20, transform: 'translateX(-50%)',
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'var(--color-surface)', border: '2px solid var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2, boxShadow: '0 0 0 4px var(--color-bg)',
                  }}>
                    <Icon size={18} color="var(--color-primary)" fill={m.icon === 'heart' ? 'var(--color-primary)' : 'none'} />
                  </div>

                  <div style={{
                    background: 'var(--color-surface)', borderRadius: 16,
                    padding: '20px 22px', boxShadow: 'var(--card-shadow)',
                    border: '1px solid var(--color-border)',
                    position: 'relative', maxWidth: 280, width: '100%',
                    cursor: 'pointer', transition: 'transform 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    onClick={() => setSelectedMoment(m)}
                  >
                    {isAdmin && (
                      <button onClick={e => { e.stopPropagation(); handleDelete(m.id); }} style={{
                        position: 'absolute', top: 10, right: 10, background: 'none',
                        border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', zIndex: 3,
                      }}><Trash2 size={14} /></button>
                    )}
                    <p style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600, marginBottom: 4 }}>{dateStr}</p>
                    <h3 style={{ fontFamily: 'Playfair Display', fontSize: 17, marginBottom: 6 }}>{m.title}</h3>
                    {m.description && <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 10 }}>{m.description}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-primary)', fontSize: 12, fontWeight: 500 }}>
                      <Images size={13} /> Lihat Gallery
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAdd(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 24 }}>Tambah Momen</h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label>Judul Momen</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="cth: First Date" required />
              </div>
              <div>
                <label>Tanggal</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div>
                <label>Deskripsi</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ceritakan momen ini..." />
              </div>
              <div>
                <label>Ikon</label>
                <select value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}>
                  {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-primary" disabled={saving} style={{ justifyContent: 'center', marginTop: 4 }}>
                {saving ? 'Menyimpan...' : 'Simpan Momen'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedMoment && <MomentGallery moment={selectedMoment} onClose={() => setSelectedMoment(null)} />}
    </div>
  );
}
