// src/pages/Gallery.jsx
import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Plus, Trash2, Heart, X, Upload, Image, Pin, PinOff, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getGallery, addGalleryItem, deleteGalleryItem,
  getMoments,
  getGalleryDisplay, setGalleryDisplay,
} from '../utils/dataService';
import { uploadToCloudinary } from '../utils/cloudinary';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

// Random rotation for polaroid effect: deterministic based on id so it doesn't change on re-render
function getRotation(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return ((hash % 14) - 7); // -7 to +7 degrees
}

const PolaroidCard = memo(function PolaroidCard({ item, isAdmin, isPinned, onPin, onClick, onDelete }) {
  const rot = getRotation(item.id);
  return (
    <div
      onClick={() => onClick(item)}
      style={{
        transform: `rotate(${rot}deg)`,
        background: 'white',
        padding: '10px 10px 36px',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s, z-index 0s',
        position: 'relative',
        zIndex: 1,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = `rotate(${rot}deg) scale(1.06)`;
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.28)';
        e.currentTarget.style.zIndex = '10';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = `rotate(${rot}deg) scale(1)`;
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)';
        e.currentTarget.style.zIndex = '1';
      }}
    >
      <img
        src={item.imageUrl}
        alt={item.caption || ''}
        loading="lazy"
        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
      />
      {item.caption && (
        <p style={{
          textAlign: 'center', marginTop: 8,
          fontFamily: 'Dancing Script, cursive',
          fontSize: 13, color: '#555', lineHeight: 1.3,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>{item.caption}</p>
      )}

      {/* Admin controls */}
      {isAdmin && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          display: 'flex', gap: 4, opacity: 0,
        }}
          className="polaroid-admin-btns"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => onPin(item.id)}
            title={isPinned ? 'Unpin dari display' : 'Pin ke display'}
            style={{
              width: 24, height: 24, borderRadius: '50%',
              background: isPinned ? 'var(--color-primary)' : 'rgba(0,0,0,0.5)',
              border: 'none', cursor: 'pointer', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)', border: 'none',
              cursor: 'pointer', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
});

export default function Gallery() {
  const { isAdmin } = useAuth();
  const [items, setItems]         = useState([]);
  const [moments, setMoments]     = useState([]);
  const [pinnedIds, setPinnedIds] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [lightbox, setLightbox]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm]           = useState({ caption: '', file: null, preview: null, momentId: '' });
  const [page, setPage]           = useState(1);
  const [tab, setTab]             = useState('display'); // 'display' | 'all'
  const [savingPin, setSavingPin] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [galleryData, momentsData, displayData] = await Promise.all([
        getGallery(), getMoments(), getGalleryDisplay(),
      ]);
      setItems(galleryData);
      setMoments(momentsData);
      setPinnedIds(displayData.pinnedIds || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // Display photos: pinned ones (in pin order) or fallback to 10 most recent
  const displayPhotos = useMemo(() => {
    if (pinnedIds.length > 0) {
      return pinnedIds
        .map(id => items.find(i => i.id === id))
        .filter(Boolean);
    }
    return items.slice(0, 10);
  }, [items, pinnedIds]);

  // All photos with pagination
  const totalPages  = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pagedItems  = useMemo(() => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [items, page]);
  const handlePin = useCallback(async (id) => {
    setSavingPin(true);
    let newPins;
    if (pinnedIds.includes(id)) {
      newPins = pinnedIds.filter(p => p !== id);
    } else {
      if (pinnedIds.length >= 10) {
        alert('Maksimal 10 foto yang bisa di-pin ke display gallery.');
        setSavingPin(false); return;
      }
      newPins = [...pinnedIds, id];
    }
    setPinnedIds(newPins);
    await setGalleryDisplay(newPins);
    setSavingPin(false);
  }, [pinnedIds]);

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
      await fetchAll();
    } catch (err) { alert('Gagal upload: ' + err.message); }
    setUploading(false);
  };

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Hapus foto ini?')) return;
    try {
      await deleteGalleryItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setPinnedIds(prev => {
        const next = prev.filter(p => p !== id);
        setGalleryDisplay(next);
        return next;
      });
      setLightbox(null);
    } catch (e) { alert('Gagal menghapus'); }
  }, []);

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64 }}>
      {/* Header */}
      <div style={{ background: 'var(--gradient-hero)', padding: '60px 24px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {[...Array(3)].map((_, i) => (
          <Heart key={i} size={14 + i * 5} fill="rgba(255,255,255,0.3)" color="rgba(255,255,255,0.3)"
            style={{ position: 'absolute', top: `${18 + i * 22}%`, left: `${8 + i * 22}%`, animation: `floatHeart ${2.5 + i * 0.6}s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }} />
        ))}
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(32px,6vw,52px)', color: 'white', marginBottom: 8 }}>Gallery Moments</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>Kumpulan momen berharga kita berdua.</p>
      </div>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        {/* Admin toolbar */}
        {isAdmin && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setTab('display')} className={tab === 'display' ? 'btn-primary' : 'btn-outline'} style={{ fontSize: 13, padding: '8px 16px' }}>
                Polaroid Wall
              </button>
              <button onClick={() => setTab('all')} className={tab === 'all' ? 'btn-primary' : 'btn-outline'} style={{ fontSize: 13, padding: '8px 16px' }}>
                <Settings size={13} /> Kelola Semua ({items.length})
              </button>
            </div>
            <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ fontSize: 13 }}>
              <Plus size={14} /> Tambah Foto
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--color-text-muted)' }}>Memuat gallery...</div>
        ) : (tab === 'all' && isAdmin) ? (
          /* ── ALL PHOTOS MANAGEMENT VIEW ── */
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                {pinnedIds.length} foto di-pin ke display · {items.length} total foto
              </p>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} compact />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {pagedItems.map(item => {
                const isPinned = pinnedIds.includes(item.id);
                return (
                  <div key={item.id} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: isPinned ? '2px solid var(--color-primary)' : '2px solid transparent' }}>
                    <img src={item.imageUrl} alt={item.caption} loading="lazy"
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                    {isPinned && (
                      <div style={{ position: 'absolute', top: 6, left: 6, background: 'var(--color-primary)', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: 'white', fontWeight: 600 }}>
                        #{pinnedIds.indexOf(item.id) + 1}
                      </div>
                    )}
                    {item.caption && (
                      <div style={{ background: 'var(--color-surface)', padding: '6px 10px' }}>
                        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>{item.caption}</p>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 4, padding: '6px 8px', background: 'var(--color-surface2)' }}>
                      <button onClick={() => handlePin(item.id)} disabled={savingPin} style={{
                        flex: 1, padding: '5px', fontSize: 11, border: 'none', borderRadius: 6, cursor: 'pointer',
                        background: isPinned ? 'var(--color-primary)' : 'var(--color-border)',
                        color: isPinned ? 'white' : 'var(--color-text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      }}>
                        {isPinned ? <><PinOff size={10} /> Unpin</> : <><Pin size={10} /> Pin</>}
                      </button>
                      <button onClick={() => handleDelete(item.id)} style={{
                        padding: '5px 8px', fontSize: 11, border: 'none', borderRadius: 6,
                        cursor: 'pointer', background: '#fee', color: '#e05c5c',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        ) : (
          /* ── POLAROID WALL DISPLAY ── */
          displayPhotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', border: '2px dashed var(--color-border)', borderRadius: 20 }}>
              <Image size={48} color="var(--color-border)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 8 }}>Belum Ada Foto</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                {isAdmin ? 'Upload foto dan pin ke display gallery.' : 'Foto akan muncul di sini setelah ditambahkan.'}
              </p>
            </div>
          ) : (
            <>
              {isAdmin && (
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 20, textAlign: 'center' }}>
                  💡 Menampilkan {displayPhotos.length} foto • {pinnedIds.length > 0 ? 'Di-pin manual' : '10 terbaru otomatis'} • Klik "Kelola Semua" untuk pin foto
                </p>
              )}
              {/* Polaroid wall grid — masonry-like with CSS */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 32,
                padding: '20px 8px 40px',
              }}>
                {displayPhotos.map(item => (
                  <PolaroidCard
                    key={item.id}
                    item={item}
                    isAdmin={isAdmin}
                    isPinned={pinnedIds.includes(item.id)}
                    onPin={handlePin}
                    onClick={setLightbox}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => !uploading && setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button onClick={() => !uploading && setShowAdd(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 20 }}>Tambah Foto</h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div onClick={() => document.getElementById('photo-upload').click()} style={{
                border: '2px dashed var(--color-border)', borderRadius: 12, padding: 20,
                textAlign: 'center', cursor: 'pointer', background: 'var(--color-surface2)',
                minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {form.preview
                  ? <img src={form.preview} alt="preview" style={{ maxHeight: 180, borderRadius: 8, objectFit: 'cover' }} />
                  : <><Upload size={28} color="var(--color-primary-light)" /><p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Klik untuk memilih foto</p></>
                }
                <input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>
              <div>
                <label>Caption (opsional)</label>
                <input placeholder="Tambahkan keterangan foto..." value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} />
              </div>
              <div>
                <label>Masukkan ke timeline? (opsional)</label>
                <select value={form.momentId} onChange={e => setForm(f => ({ ...f, momentId: e.target.value }))}>
                  <option value="">— Tidak —</option>
                  {moments.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-primary" disabled={uploading} style={{ justifyContent: 'center' }}>
                {uploading ? 'Mengupload...' : <><Upload size={14} /> Upload Foto</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox — polaroid style */}
      {lightbox && (
        <div className="modal-overlay" onClick={() => setLightbox(null)}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={() => setLightbox(null)} style={{
              position: 'absolute', top: -44, right: 0,
              background: 'none', border: 'none', cursor: 'pointer', color: 'white',
            }}><X size={28} /></button>

            {/* Big polaroid */}
            <div style={{
              background: 'white', padding: '14px 14px 48px',
              borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              transform: `rotate(${getRotation(lightbox.id) * 0.4}deg)`,
              maxWidth: '80vw', maxHeight: '85vh',
            }}>
              <img
                src={lightbox.imageUrl}
                alt={lightbox.caption || ''}
                style={{ display: 'block', maxWidth: '70vw', maxHeight: '65vh', objectFit: 'contain' }}
              />
              {lightbox.caption && (
                <p style={{
                  textAlign: 'center', marginTop: 12,
                  fontFamily: 'Dancing Script, cursive',
                  fontSize: 18, color: '#444',
                }}>{lightbox.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .polaroid-admin-btns { transition: opacity 0.15s; }
        div:hover > .polaroid-admin-btns { opacity: 1 !important; }
        @media(max-width:480px) { .polaroid-admin-btns { opacity: 1 !important; } }
      `}</style>
    </div>
  );
}
