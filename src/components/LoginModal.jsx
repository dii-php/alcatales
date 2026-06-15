// src/components/LoginModal.jsx
import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginModal() {
  const { login, showLoginModal, setShowLoginModal } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!showLoginModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 400));
    const ok = login(username, password);
    setLoading(false);
    if (ok) {
      setShowLoginModal(false);
      setUsername(''); setPassword('');
    } else {
      setError('Username atau password salah.');
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button onClick={() => setShowLoginModal(false)} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)',
        }}><X size={20} /></button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--color-surface2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <Lock size={22} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: 22 }}>Admin Login</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>Masuk untuk mengelola konten</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" required />
          </div>
          <div>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p style={{ color: '#e05c5c', fontSize: 13, textAlign: 'center' }}>{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: 4 }}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
