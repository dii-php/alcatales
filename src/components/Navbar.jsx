// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Lock, LogOut, Heart } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, logout, setShowLoginModal } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Our Story', path: '/our-story' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Timeline', path: '/timeline' },
    { label: 'Love Letter', path: '/love-letter' },
  ];

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
        background: scrolled ? 'var(--nav-bg)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.3s ease',
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 64,
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'Inter', fontWeight: 700, fontSize: 20,
              color: scrolled ? 'var(--color-text)' : 'white',
              letterSpacing: '0.05em',
            }}>ALCA</span>
            <Heart size={16} fill="var(--color-primary)" color="var(--color-primary)" style={{ animation: 'pulse 2s infinite' }} />
          </Link>

          {/* Desktop nav links */}
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="desktop-nav">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} style={{
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                color: scrolled ? 'var(--color-text)' : 'white',
                opacity: location.pathname === link.path ? 1 : 0.85,
                borderBottom: location.pathname === link.path ? '2px solid var(--color-primary)' : '2px solid transparent',
                paddingBottom: 2,
                transition: 'all 0.2s',
              }}>{link.label}</Link>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Theme toggle */}
            <button onClick={toggleTheme} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 50,
              background: scrolled ? 'var(--color-surface2)' : 'rgba(255,255,255,0.18)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer', color: scrolled ? 'var(--color-text)' : 'white',
              fontSize: 12, fontWeight: 500,
            }}>
              <span>Theme</span>
              <Sun size={13} />
              <div style={{
                width: 28, height: 16, borderRadius: 8,
                background: theme === 'midnight' ? '#7c3aed' : 'var(--color-primary)',
                position: 'relative', transition: 'background 0.3s',
              }}>
                <div style={{
                  position: 'absolute', top: 2,
                  left: theme === 'midnight' ? 14 : 2,
                  width: 12, height: 12, borderRadius: '50%',
                  background: 'white', transition: 'left 0.3s',
                }} />
              </div>
              <Moon size={13} />
            </button>

            {/* Login / logout */}
            {isAdmin ? (
              <button onClick={logout} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                <LogOut size={14} /> Logout
              </button>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                <Lock size={14} /> Login
              </button>
            )}
          </div>
        </div>
      </nav>

      <LoginModal />

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </>
  );
}
