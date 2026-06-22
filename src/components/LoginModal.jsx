// src/components/LoginModal.jsx
import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginModal() {
  const { login, showLoginModal, setShowLoginModal } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!showLoginModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 300));
    const ok = login(username, password, rememberMe);
    setLoading(false);
    if (ok) {
      setShowLoginModal(false);
      setUsername('');
      setPassword('');
      setRememberMe(false);
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

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="alca" required />
          </div>
          <div>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          {/* Remember Me */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', fontSize: 13, color: 'var(--color-text)',
            fontWeight: 400, marginBottom: 0,
          }}>
            <div
              onClick={() => setRememberMe(v => !v)}
              style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                border: `2px solid ${rememberMe ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: rememberMe ? 'var(--color-primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, border-color 0.15s', cursor: 'pointer',
              }}
            >
              {rememberMe && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                  <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span onClick={() => setRememberMe(v => !v)}>Ingat saya di perangkat ini</span>
          </label>

          {error && <p style={{ color: '#e05c5c', fontSize: 13, textAlign: 'center', margin: 0 }}>{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: 4 }}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
