// src/pages/Timeline.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Plus, Trash2, X, Calendar, Gift, Star, Coffee, Film, MapPin, Images, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMoments, addMoment, deleteMoment, updateMoment, getGalleryByMoment, sendNotification } from '../utils/dataService';
import MomentGallery from '../components/MomentGallery';

const ICONS = { heart: Heart, gift: Gift, star: Star, coffee: Coffee, film: Film, map: MapPin, calendar: Calendar };
const ICON_OPTIONS = [
  { value: 'heart',    label: '❤️ Heart' },
  { value: 'gift',     label: '🎁 Gift' },
  { value: 'star',     label: '⭐ Star' },
  { value: 'coffee',   label: '☕ Coffee' },
  { value: 'film',     label: '🎬 Film' },
  { value: 'map',      label: '📍 Tempat' },
  { value: 'calendar', label: '📅 Tanggal' },
];

const EMPTY_FORM = { title: '', description: '', date: '', icon: 'heart' };

export default function Timeline() {
  const { isAdmin, adminUsername } = useAuth();
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state — mode: 'add' | 'edit' | null
  const [modalMode, setModalMode] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // moment being edited
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [selectedMoment, setSelectedMoment] = useState(null);
  const [momentHasPhotos, setMomentHasPhotos] = useState({});

  const fetchMoments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMoments();
      setMoments(data);
      if (!isAdmin) {
        const checks = await Promise.all(
          data.map(async m => {
            const photos = await getGalleryByMoment(m.id);
            return { id: m.id, hasPhotos: photos.length > 0 };
          })
        );
        const map = {};
        checks.forEach(c => { map[c.id] = c.hasPhotos; });
        setMomentHasPhotos(map);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => { fetchMoments(); }, [fetchMoments]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setModalMode('add');
  };

  const openEdit = (m) => {
    setForm({ title: m.title, description: m.description || '', date: m.date || '', icon: m.icon || 'heart' });
    setEditTarget(m);
    setModalMode('edit');
  };

  const closeModal = () => { setModalMode(null); setEditTarget(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === 'add') {
        await addMoment(form);
        // Send email notification to subscribers (non-blocking)
        sendNotification('timeline', { title: form.title, description: form.description, date: form.date }, adminUsername);
      } else {
        await updateMoment(editTarget.id, form);
      }
      closeModal();
      await fetchMoments();
    } catch (err) {
      alert(modalMode === 'add' ? 'Gagal menyimpan.' : 'Gagal mengupdate.');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus momen ini?')) return;
    await deleteMoment(id);
    setMoments(prev => prev.filter(m => m.id !== id));
  };

  const canSeeGallery = (momentId) => {
    if (isAdmin) return true;
    return momentHasPhotos[momentId] === true;
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64 }}>
      {/* Header */}
      <div style={{ background: 'var(--gradient-hero)', padding: '60px 24px 48px', textAlign: 'center', position: 'relative' }}>
        {[...Array(3)].map((_, i) => (
          <Heart key={i} size={14 + i * 5} fill="rgba(255,255,255,0.3)" color="rgba(255,255,255,0.3)"
            style={{ position: 'absolute', top: `${20 + i * 22}%`, left: `${10 + i * 22}%`,
              animation: `floatHeart ${2.5 + i * 0.6}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }} />
        ))}
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(32px,6vw,52px)', color: 'white', marginBottom: 8 }}>Our Timeline</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>Setiap momen berharga dalam perjalanan cinta kita.</p>
      </div>

      <div className="container" style={{ paddingTop: 48, paddingBottom: 64 }}>
        {isAdmin && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
            <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Tambah Momen</button>
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
              const showGallery = canSeeGallery(m.id);

              return (
                <div key={m.id} style={{
                  display: 'flex',
                  justifyContent: isLeft ? 'flex-end' : 'flex-start',
                  paddingRight: isLeft ? 'calc(50% + 28px)' : 0,
                  paddingLeft: isLeft ? 0 : 'calc(50% + 28px)',
                  marginBottom: 40, position: 'relative',
                }}>
                  {/* Timeline dot */}
                  <div style={{
                    position: 'absolute', left: '50%', top: 20, transform: 'translateX(-50%)',
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'var(--color-surface)', border: '2px solid var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2, boxShadow: '0 0 0 4px var(--color-bg)',
                  }}>
                    <Icon size={18} color="var(--color-primary)" fill={m.icon === 'heart' ? 'var(--color-primary)' : 'none'} />
                  </div>

                  {/* Card */}
                  <div style={{
                    background: 'var(--color-surface)', borderRadius: 16,
                    padding: '20px 22px', boxShadow: 'var(--card-shadow)',
                    border: '1px solid var(--color-border)',
                    position: 'relative', maxWidth: 280, width: '100%',
                    cursor: showGallery ? 'pointer' : 'default',
                  }}
                    onClick={() => showGallery && setSelectedMoment(m)}
                  >
                    {/* Admin action buttons */}
                    {isAdmin && (
                      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4, zIndex: 3 }}>
                        <button
                          onClick={e => { e.stopPropagation(); openEdit(m); }}
                          title="Edit momen"
                          style={{
                            background: 'var(--color-surface2)', border: 'none', borderRadius: 6,
                            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'var(--color-primary)',
                          }}>
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(m.id); }}
                          title="Hapus momen"
                          style={{
                            background: 'var(--color-surface2)', border: 'none', borderRadius: 6,
                            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#e05c5c',
                          }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}

                    <p style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600, marginBottom: 4, paddingRight: isAdmin ? 64 : 0 }}>{dateStr}</p>
                    <h3 style={{ fontFamily: 'Playfair Display', fontSize: 17, marginBottom: 6, paddingRight: isAdmin ? 64 : 0 }}>{m.title}</h3>
                    {m.description && (
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: showGallery ? 10 : 0 }}>{m.description}</p>
                    )}
                    {showGallery && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-primary)', fontSize: 12, fontWeight: 500 }}>
                        <Images size={13} /> Lihat Gallery
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {modalMode && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 24 }}>
              {modalMode === 'add' ? 'Tambah Momen' : 'Edit Momen'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                {saving ? 'Menyimpan...' : (modalMode === 'add' ? 'Simpan Momen' : 'Update Momen')}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedMoment && <MomentGallery moment={selectedMoment} onClose={() => setSelectedMoment(null)} />}
    </div>
  );
}
