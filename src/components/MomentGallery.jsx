// src/components/MomentGallery.jsx
import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Image, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getGalleryByMoment, addGalleryItem, deleteGalleryItem } from '../utils/dataService';
import { uploadToCloudinary } from '../utils/cloudinary';

export default function MomentGallery({ moment, onClose }) {
  const { isAdmin } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [captions, setCaptions] = useState({});
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => { fetchPhotos(); }, [moment.id]);

  const fetchPhotos = async () => {
    setLoading(true);
    try { setPhotos(await getGalleryByMoment(moment.id)); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;
    setFiles(selected);
    setPreviews(selected.map(f => URL.createObjectURL(f)));
    // Init captions map
    const caps = {};
    selected.forEach((_, i) => { caps[i] = ''; });
    setCaptions(caps);
  };

  const handleUpload = async () => {
    if (!files.length) return alert('Pilih foto dulu');
    setUploading(true);
    setUploadProgress({ done: 0, total: files.length });
    try {
      for (let i = 0; i < files.length; i++) {
        const imageUrl = await uploadToCloudinary(files[i]);
        await addGalleryItem({ imageUrl, caption: captions[i] || '', momentId: moment.id });
        setUploadProgress({ done: i + 1, total: files.length });
      }
      setFiles([]); setPreviews([]); setCaptions({}); setShowUpload(false);
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
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 21 }}>{moment.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
              {moment.date ? new Date(moment.date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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

        {/* Upload panel */}
        {showUpload && isAdmin && (
          <div style={{ padding: '18px 26px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface2)', flexShrink: 0 }}>
            {/* Multi-file drop zone */}
            <div
              onClick={() => document.getElementById('mg-multi-upload').click()}
              style={{
                border: '2px dashed var(--color-border)', borderRadius: 12,
                padding: '16px', cursor: 'pointer', background: 'var(--color-surface)',
                marginBottom: 12, minHeight: 80,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {previews.length === 0 ? (
                <>
                  <Upload size={24} color="var(--color-primary-light)" />
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Klik untuk pilih foto <strong>(bisa banyak sekaligus)</strong></p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', opacity: 0.6 }}>JPG, PNG, WEBP</p>
                </>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%' }}>
                  {previews.map((src, i) => (
                    <div key={i} style={{ position: 'relative', width: 70, flexShrink: 0 }}>
                      <img src={src} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                      <span style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 9, padding: '1px 4px', borderRadius: 4 }}>{i + 1}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 70, height: 70, border: '1.5px dashed var(--color-border)', borderRadius: 8, fontSize: 22, color: 'var(--color-text-muted)', cursor: 'pointer' }}>+</div>
                </div>
              )}
              <input id="mg-multi-upload" type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
            </div>

            {/* Captions per file */}
            {previews.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, maxHeight: 120, overflowY: 'auto' }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', minWidth: 60, flexShrink: 0 }}>Foto {i + 1}:</span>
                    <input
                      value={captions[i] || ''}
                      onChange={e => setCaptions(c => ({ ...c, [i]: e.target.value }))}
                      placeholder={`Caption untuk ${f.name.substring(0, 20)}...`}
                      style={{ fontSize: 12, padding: '6px 10px' }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowUpload(false); setFiles([]); setPreviews([]); }} className="btn-outline" style={{ fontSize: 13, padding: '8px 16px' }}>
                Batal
              </button>
              <button onClick={handleUpload} className="btn-primary" disabled={uploading || !files.length} style={{ fontSize: 13, padding: '8px 20px' }}>
                {uploading
                  ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> {uploadProgress.done}/{uploadProgress.total} Uploading...</>
                  : <><Upload size={13} /> Upload {files.length > 0 ? `${files.length} Foto` : 'Foto'}</>
                }
              </button>
            </div>
          </div>
        )}

        {/* Photos grid */}
        <div style={{ padding: '20px 26px', overflowY: 'auto', flex: 1 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
              {photos.map(p => (
                <div key={p.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => setLightbox(p)}>
                  <img src={p.imageUrl} alt={p.caption} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                  {p.caption && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.6))', padding: '16px 8px 7px', color: 'white', fontSize: 11 }}>
                      {p.caption}
                    </div>
                  )}
                  {isAdmin && (
                    <button onClick={e => { e.stopPropagation(); handleDelete(p.id); }} style={{
                      position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)',
                      border: 'none', borderRadius: '50%', width: 28, height: 28,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white',
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

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
