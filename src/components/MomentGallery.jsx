// src/components/MomentGallery.jsx
import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getGalleryByMoment, addGalleryItem, deleteGalleryItem } from '../utils/dataService';
import { uploadToCloudinary } from '../utils/cloudinary';

export default function MomentGallery({ moment, onClose }) {
  const { isAdmin } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => { fetchPhotos(); }, [moment.id]);

  const fetchPhotos = async () => {
    setLoading(true);
    try { setPhotos(await getGalleryByMoment(moment.id)); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert('Pilih foto dulu');
    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      await addGalleryItem({ imageUrl, caption, momentId: moment.id });
      setFile(null); setPreview(null); setCaption(''); setShowUpload(false);
      await fetchPhotos();
    } catch (err) { alert('Gagal upload: ' + err.message); }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus foto ini?')) return;
    await deleteGalleryItem(id);
    setPhotos(photos.filter(p => p.id !== id));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--color-surface)', borderRadius: 24,
        width: '100%', maxWidth: 780, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22 }}>{moment.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
              {moment.date ? new Date(moment.date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {isAdmin && (
              <button onClick={() => setShowUpload(v => !v)} className="btn-primary" style={{ fontSize: 13, padding: '8px 16px' }}>
                <Upload size={14} /> Tambah Foto
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Upload form */}
        {showUpload && isAdmin && (
          <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface2)', flexShrink: 0 }}>
            <form onSubmit={handleUpload} style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>Pilih Foto</label>
                <div onClick={() => document.getElementById('mg-upload').click()} style={{
                  border: '1.5px dashed var(--color-border)', borderRadius: 10,
                  padding: '10px 14px', cursor: 'pointer', background: 'var(--color-surface)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  {preview
                    ? <img src={preview} alt="prev" style={{ height: 40, borderRadius: 6, objectFit: 'cover' }} />
                    : <><Image size={18} color="var(--color-primary-light)" /><span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Klik untuk pilih foto</span></>
                  }
                  <input id="mg-upload" type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>Caption (opsional)</label>
                <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Tambah keterangan..." style={{
                  width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-border)',
                  borderRadius: 10, background: 'var(--color-surface)', color: 'var(--color-text)',
                  fontSize: 13, outline: 'none', fontFamily: 'Inter',
                }} />
              </div>
              <button type="submit" className="btn-primary" disabled={uploading} style={{ padding: '10px 20px', fontSize: 13, whiteSpace: 'nowrap' }}>
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </div>
        )}

        {/* Photos grid */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 40 }}>Memuat foto...</p>
          ) : photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Image size={40} color="var(--color-border)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                {isAdmin ? 'Klik "Tambah Foto" untuk upload foto momen ini.' : 'Belum ada foto untuk momen ini.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {photos.map(p => (
                <div key={p.id} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => setLightbox(p)}>
                  <img src={p.imageUrl} alt={p.caption} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                  {p.caption && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                      padding: '16px 8px 8px', color: 'white', fontSize: 11,
                    }}>{p.caption}</div>
                  )}
                  {isAdmin && (
                    <button onClick={e => { e.stopPropagation(); handleDelete(p.id); }} style={{
                      position: 'absolute', top: 6, right: 6,
                      background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                      width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'white',
                    }}><Trash2 size={12} /></button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setLightbox(null)}>
          <div style={{ position: 'relative', maxWidth: 700, width: '100%' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
              <X size={28} />
            </button>
            <img src={lightbox.imageUrl} alt={lightbox.caption} style={{ width: '100%', borderRadius: 16, maxHeight: '80vh', objectFit: 'contain' }} />
            {lightbox.caption && <p style={{ textAlign: 'center', color: 'white', marginTop: 12, fontSize: 14 }}>{lightbox.caption}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
