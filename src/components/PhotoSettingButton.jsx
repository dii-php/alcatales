// src/components/PhotoSettingButton.jsx
// Reusable button that lets admin upload/change a "setting" photo (polaroid, love letter, etc.)
import React, { useState } from 'react';
import { Camera, X, Upload, Loader } from 'lucide-react';
import { uploadToCloudinary } from '../utils/cloudinary';
import { setSetting } from '../utils/dataService';
import { useAuth } from '../context/AuthContext';

export default function PhotoSettingButton({ settingKey, onUpdated, label = 'Ganti Foto', style = {} }) {
  const { isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (!isAdmin) return null;

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      await setSetting(settingKey, { imageUrl });
      onUpdated(imageUrl);
      setShowModal(false);
      setFile(null);
      setPreview(null);
    } catch (err) {
      alert('Gagal upload: ' + err.message);
    }
    setUploading(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        title={label}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 20,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: 'white', fontSize: 12, fontWeight: 500,
          cursor: 'pointer', ...style,
        }}
      >
        <Camera size={13} /> {label}
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => !uploading && setShowModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              <X size={20} />
            </button>

            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 20, marginBottom: 20 }}>{label}</h3>

            {/* Drop zone */}
            <div
              onClick={() => document.getElementById(`psb-${settingKey}`).click()}
              style={{
                border: '2px dashed var(--color-border)', borderRadius: 14,
                padding: 24, textAlign: 'center', cursor: 'pointer',
                background: 'var(--color-surface2)', marginBottom: 16,
                minHeight: 160, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 10,
                overflow: 'hidden',
              }}
            >
              {preview ? (
                <img src={preview} alt="preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 8, objectFit: 'cover' }} />
              ) : (
                <>
                  <Upload size={28} color="var(--color-primary-light)" />
                  <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Klik untuk pilih foto baru</p>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', opacity: 0.6 }}>JPG, PNG, WEBP</p>
                </>
              )}
              <input id={`psb-${settingKey}`} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => !uploading && setShowModal(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                Batal
              </button>
              <button onClick={handleSave} className="btn-primary" disabled={!file || uploading} style={{ flex: 1, justifyContent: 'center' }}>
                {uploading ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</> : <><Upload size={14} /> Simpan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
