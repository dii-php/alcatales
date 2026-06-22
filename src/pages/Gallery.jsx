// src/pages/Gallery.jsx
import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Plus, Trash2, Heart, X, Upload, Image, Link2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getGallery, addGalleryItem, deleteGalleryItem,
  updateGalleryItemMoment, getMoments, PAGE_SIZE,
} from '../utils/dataService';
import { uploadToCloudinary } from '../utils/cloudinary';
import Pagination from '../components/Pagination';

// Memoized gallery card — avoids re-rendering all cards when page state changes
const GalleryCard = memo(function GalleryCard({ item, momentTitle, isAdmin, onClick, onDelete }) {
  return (
    <div
      className="gallery-card"
      onClick={() => onClick(item)}
    >
      <img
        src={item.imageUrl}
        alt={item.caption || ''}
        loading="lazy"
        decoding="async"
        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
      />

      {item.momentId && momentTitle && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(0,0,0,0.6)',
          color: 'white', fontSize: 10, padding: '3px 8px', borderRadius: 20,
          display: 'flex', alignItems: 'center', gap: 3,
          pointerEvents: 'none',
        }}>
          <Link2 size={9} /> {momentTitle}
        </div>
      )}

      {item.caption && (
        <div style={{ padding: '10px 12px' }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>{item.caption}</p>
        </div>
      )}

      {isAdmin && (
        <button
          className="gallery-card__delete"
          onClick={e => { e.stopPropagation(); onDelete(item.id); }}
          aria-label="Hapus foto"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
});

export default function Gallery() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ caption: '', file: null, preview: null, momentId: '' });
  const [page, setPage] = useState(1);
  const [assigning, setAssigning] = useState(false);
  const [assignMomentId, setAssignMomentId] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [galleryData, momentsData] = await Promise.all([getGallery(), getMoments()]);
      setItems(galleryData);
      setMoments(momentsData);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // Memoized moment title lookup
  const momentTitleMap = useMemo(() => {
    const map = {};
    moments.forEach(m => { map[m.id] = m.title; });
    return map;
  }, [moments]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  useEffect(() => {
    if (page > totalPages) setPage(Math.max(1, totalPages));
  }, [totalPages]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, file, preview: URL.createObjectURL(file) }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.file) return alert('Pilih foto terlebih dahulu');
    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(form.file);
      await addGalleryItem({ imageUrl, caption: form.caption, momentId: form.momentId || null });
      setForm({ caption: '', file: null, preview: null, momentId: '' });
      setShowAdd(false);
      setPage(1);
      await fetchAll();
    } catch (err) {
      alert('Gagal upload: ' + err.message);
    }
    setUploading(false);
  };

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Hapus foto ini?')) return;
    try {
      await deleteGalleryItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setLightbox(null);
    } catch (e) { alert('Gagal menghapus'); }
  }, []);

  const openLightbox = useCallback((item) => {
    setLightbox(item);
    setAssigning(false);
    setAssignMomentId(item.momentId || '');
  }, []);

  const handleAssignSave = async () => {
    if (!lightbox) return;
    setAssignSaving(true);
    try {
      await updateGalleryItemMoment(lightbox.id, assignMomentId || null);
      const updated = { ...lightbox, momentId: assignMomentId || null };
      setItems(prev => prev.map(i => i.id === lightbox.id ? updated : i));
      setLightbox(updated);
      setAssigning(false);
    } catch (e) { alert('Gagal menyimpan'); }
    setAssignSaving(false);
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64 }}>
      {/* Header */}
      <div style={{ background: 'var(--gradient-hero)', padding: '60px 24px 48px', textAlign: 'center', position: 'relative' }}>
        {[...Array(3)].map((_, i) => (
          <Heart key={i} size={14 + i * 5} fill="rgba(255,255,255,0.3)" color="rgba(255,255,255,0.3)"
            style={{ position: 'absolute', top: `${20 + i * 22}%`, left: `${10 + i * 22}%`,
              animation: `floatHeart ${2.5 + i * 0.6}s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }} />
        ))}
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(32px,6vw,52px)', color: 'white', marginBottom: 8 }}>Gallery Moments</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>Kumpulan momen berharga kami berdua.</p>
      </div>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
        {isAdmin && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15} /> Tambah Foto</button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--color-text-muted)' }}>Memuat gallery...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', border: '2px dashed var(--color-border)', borderRadius: 20 }}>
            <Image size={48} color="var(--color-border)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 8 }}>Belum Ada Foto</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              {isAdmin ? 'Klik "Tambah Foto" untuk mengunggah momen pertama.' : 'Foto akan muncul di sini setelah ditambahkan.'}
            </p>
          </div>
        ) : (
          <>
            {/* Top bar: count + pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                Menampilkan {pagedItems.length} dari {items.length} foto
              </p>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} compact />
            </div>

            <div className="gallery-grid">
              {pagedItems.map(item => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  momentTitle={momentTitleMap[item.momentId] || null}
                  isAdmin={isAdmin}
                  onClick={openLightbox}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* ── ADD MODAL ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => !uploading && setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button onClick={() => !uploading && setShowAdd(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 20 }}>Tambah Foto</h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                onClick={() => document.getElementById('photo-upload').click()}
                style={{
                  border: '2px dashed var(--color-border)', borderRadius: 12,
                  padding: 20, textAlign: 'center', cursor: 'pointer',
                  background: 'var(--color-surface2)', overflow: 'hidden',
                  minHeight: 120, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {form.preview
                  ? <img src={form.preview} alt="preview" style={{ maxHeight: 180, borderRadius: 8, objectFit: 'cover' }} />
                  : <>
                      <Upload size={28} color="var(--color-primary-light)" />
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Klik untuk memilih foto</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', opacity: 0.6 }}>JPG, PNG, WEBP (maks 10MB)</p>
                    </>
                }
                <input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>

              <div>
                <label>Caption (opsional)</label>
                <input placeholder="Tambahkan keterangan foto..." value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} />
              </div>

              <div>
                <label>Masukkan ke memory timeline? (opsional)</label>
                <select value={form.momentId} onChange={e => setForm(f => ({ ...f, momentId: e.target.value }))}>
                  <option value="">— Tidak ditambahkan ke timeline —</option>
                  {moments.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
                {moments.length === 0 && (
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, opacity: 0.7 }}>
                    Belum ada momen di Timeline.
                  </p>
                )}
              </div>

              <button type="submit" className="btn-primary" disabled={uploading} style={{ justifyContent: 'center' }}>
                {uploading ? 'Mengupload...' : <><Upload size={14} /> Upload Foto</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div className="modal-overlay" onClick={() => { setLightbox(null); setAssigning(false); }}>
          <div style={{ position: 'relative', maxWidth: 680, width: '100%' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => { setLightbox(null); setAssigning(false); }}
              style={{ position: 'absolute', top: -38, right: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
              <X size={26} />
            </button>

            <img
              src={lightbox.imageUrl}
              alt={lightbox.caption || ''}
              style={{ width: '100%', borderRadius: 14, maxHeight: '68vh', objectFit: 'contain', display: 'block' }}
            />

            {lightbox.caption && (
              <p style={{ textAlign: 'center', color: 'white', marginTop: 10, fontSize: 13 }}>{lightbox.caption}</p>
            )}

            {/* Admin panel */}
            {isAdmin && (
              <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: 14, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!assigning ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--color-text)' }}>
                      <Link2 size={13} color="var(--color-primary)" />
                      {lightbox.momentId && momentTitleMap[lightbox.momentId]
                        ? <span>Terhubung ke: <strong>{momentTitleMap[lightbox.momentId]}</strong></span>
                        : <span style={{ color: 'var(--color-text-muted)' }}>Belum terhubung ke momen</span>
                      }
                    </div>
                    <button onClick={() => setAssigning(true)} className="btn-outline" style={{ fontSize: 12, padding: '5px 12px' }}>
                      {lightbox.momentId ? 'Ubah Momen' : 'Masukkan ke Timeline'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select value={assignMomentId} onChange={e => setAssignMomentId(e.target.value)} style={{ flex: 1, minWidth: 140 }}>
                      <option value="">— Tidak terhubung —</option>
                      {moments.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                    <button onClick={handleAssignSave} disabled={assignSaving} className="btn-primary" style={{ fontSize: 12, padding: '7px 14px' }}>
                      {assignSaving ? '...' : <><Check size={12} /> Simpan</>}
                    </button>
                    <button onClick={() => setAssigning(false)} className="btn-outline" style={{ fontSize: 12, padding: '7px 12px' }}>Batal</button>
                  </div>
                )}
                <button onClick={() => handleDelete(lightbox.id)}
                  style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#e05c5c', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
                  <Trash2 size={12} /> Hapus foto ini
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS for gallery grid and card hover — avoids inline style objects per card */}
      <style>{`
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }
        .gallery-card {
          border-radius: 14px;
          overflow: hidden;
          background: var(--color-surface);
          box-shadow: var(--card-shadow);
          cursor: pointer;
          position: relative;
          transform: translateZ(0); /* GPU layer hint */
          transition: transform 0.18s ease;
        }
        .gallery-card:hover { transform: translateY(-4px); }
        .gallery-card__delete {
          position: absolute; top: 8px; right: 8px;
          background: rgba(0,0,0,0.6); border: none;
          border-radius: 50%; width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: white;
          opacity: 0; transition: opacity 0.15s;
        }
        .gallery-card:hover .gallery-card__delete { opacity: 1; }
        @media (max-width: 480px) {
          .gallery-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .gallery-card__delete { opacity: 1; } /* always show on mobile */
        }
      `}</style>
    </div>
  );
}
