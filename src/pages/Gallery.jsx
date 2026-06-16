// src/pages/Gallery.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Heart, X, Upload, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getGallery, addGalleryItem, deleteGalleryItem } from '../utils/dataService';
import { uploadToCloudinary } from '../utils/cloudinary';

export default function Gallery() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ caption: '', file: null, preview: null });

  useEffect(() => { fetchGallery(); }, []);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const data = await getGallery();
      setItems(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setForm(f => ({ ...f, file, preview }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.file) return alert('Pilih foto terlebih dahulu');
    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(form.file);
      await addGalleryItem({ imageUrl, caption: form.caption });
      setForm({ caption: '', file: null, preview: null });
      setShowAdd(false);
      await fetchGallery();
    } catch (err) {
      alert('Gagal upload: ' + err.message);
    }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus foto ini?')) return;
    try {
      await deleteGalleryItem(id);
      setItems(items.filter(i => i.id !== id));
    } catch (e) { alert('Gagal menghapus'); }
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64 }}>
      {/* Header */}
      <div style={{
        background: 'var(--gradient-hero)', padding: '60px 24px 48px',
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
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(32px,6vw,52px)', color: 'white', marginBottom: 8 }}>
          Gallery Moments
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>Kumpulan momen berharga kami berdua.</p>
      </div>

      <div className="container" style={{ paddingTop: 48, paddingBottom: 64 }}>
        {/* Admin: add button */}
        {isAdmin && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus size={16} /> Tambah Foto
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--color-text-muted)' }}>Memuat gallery...</div>
        ) : items.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            border: '2px dashed var(--color-border)', borderRadius: 20,
          }}>
            <Image size={48} color="var(--color-border)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 8 }}>Belum Ada Foto</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              {isAdmin ? 'Klik "Tambah Foto" untuk mengunggah momen pertama.' : 'Momen akan muncul di sini setelah ditambahkan.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20,
          }}>
            {items.map(item => (
              <div key={item.id} style={{
                borderRadius: 16, overflow: 'hidden',
                background: 'var(--color-surface)',
                boxShadow: 'var(--card-shadow)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                position: 'relative',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                onClick={() => setLightbox(item)}
              >
                <img src={item.imageUrl} alt={item.caption}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                {item.caption && (
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{item.caption}</p>
                  </div>
                )}
                {isAdmin && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                    style={{
                      position: 'absolute', top: 10, right: 10,
                      background: 'rgba(0,0,0,0.55)', border: 'none',
                      borderRadius: '50%', width: 32, height: 32,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'white',
                    }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ADD MODAL ─────────────────────────── */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => !uploading && setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button onClick={() => !uploading && setShowAdd(false)} style={{
              position: 'absolute', top: 16, right: 16,
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
            }}><X size={20} /></button>

            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 24 }}>Tambah Foto</h3>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* File upload area */}
              <div
                style={{
                  border: '2px dashed var(--color-border)', borderRadius: 12,
                  padding: 24, textAlign: 'center', cursor: 'pointer',
                  background: form.preview ? 'transparent' : 'var(--color-surface2)',
                  position: 'relative', overflow: 'hidden',
                }}
                onClick={() => document.getElementById('photo-upload').click()}
              >
                {form.preview ? (
                  <img src={form.preview} alt="preview" style={{ maxHeight: 200, borderRadius: 8, objectFit: 'cover' }} />
                ) : (
                  <>
                    <Upload size={32} color="var(--color-primary-light)" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Klik untuk memilih foto</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', opacity: 0.6, marginTop: 4 }}>JPG, PNG, WEBP (maks 10MB)</p>
                  </>
                )}
                <input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>

              <div>
                <label>Caption (opsional)</label>
                <input
                  placeholder="Tambahkan keterangan foto..."
                  value={form.caption}
                  onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={uploading} style={{ justifyContent: 'center' }}>
                {uploading ? 'Mengupload...' : <><Upload size={15} /> Upload Foto</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX ─────────────────────────── */}
      {lightbox && (
        <div className="modal-overlay" onClick={() => setLightbox(null)}>
          <div style={{ position: 'relative', maxWidth: 700, width: '100%' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} style={{
              position: 'absolute', top: -40, right: 0,
              background: 'none', border: 'none', cursor: 'pointer', color: 'white',
            }}><X size={28} /></button>
            <img src={lightbox.imageUrl} alt={lightbox.caption}
              style={{ width: '100%', borderRadius: 16, maxHeight: '80vh', objectFit: 'contain' }} />
            {lightbox.caption && (
              <p style={{ textAlign: 'center', color: 'white', marginTop: 12, fontSize: 14 }}>{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
