// src/components/PhotoSettingButton.jsx
import React, { useState } from 'react';
import { Camera, X, Upload, Loader } from 'lucide-react';
import { uploadToCloudinary } from '../utils/cloudinary';
import { setSetting } from '../utils/dataService';
import { useAuth } from '../context/AuthContext';
import ReactDOM from 'react-dom';

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
      handleClose();
    } catch (err) {
      alert('Gagal upload: ' + err.message);
    }
    setUploading(false);
  };

  const handleClose = () => {
    if (uploading) return;
    setShowModal(false);
    setFile(null);
    setPreview(null);
  };

  const modal = showModal ? ReactDOM.createPortal(
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          borderRadius: 20, padding: 28,
          width: '100%', maxWidth: 420,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          position: 'relative',
          border: '1px solid var(--color-border)',
        }}
      >
        <button onClick={handleClose} style={{
          position: 'absolute', top: 14, right: 14,
          background: 'var(--color-surface2)', border: 'none',
          borderRadius: '50%', width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--color-text-muted)',
        }}>
          <X size={16} />
        </button>

        <h3 style={{ fontFamily: 'Playfair Display', fontSize: 20, marginBottom: 20, color: 'var(--color-text)', paddingRight: 32 }}>
          {label}
        </h3>

        <div
          onClick={() => document.getElementById(`psb-${settingKey}`).click()}
          style={{
            border: '2px dashed var(--color-border)', borderRadius: 14,
            cursor: 'pointer', background: 'var(--color-bg)',
            marginBottom: 16, minHeight: 150,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
            overflow: 'hidden', padding: preview ? 0 : 24,
          }}
        >
          {preview
            ? <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
            : <>
                <Upload size={28} color="var(--color-primary-light)" />
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Klik untuk pilih foto baru</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', opacity: 0.6 }}>JPG, PNG, WEBP</p>
              </>
          }
          <input id={`psb-${settingKey}`} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleClose} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Batal</button>
          <button onClick={handleSave} className="btn-primary" disabled={!file || uploading} style={{ flex: 1, justifyContent: 'center' }}>
            {uploading ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</> : <><Upload size={14} /> Simpan</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 20,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: 'white', fontSize: 12, fontWeight: 500,
          cursor: 'pointer', ...style,
        }}
      >
        <Camera size={13} /> {label}
      </button>
      {modal}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </>
  );
}
