// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Lock, LogOut, Heart, Menu, X, Home, BookOpen, Image, Clock, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';

const NAV_LINKS = [
  { label: 'Home',        path: '/',            Icon: Home },
  { label: 'Our Story',   path: '/our-story',   Icon: BookOpen },
  { label: 'Gallery',     path: '/gallery',     Icon: Image },
  { label: 'Timeline',    path: '/timeline',    Icon: Clock },
  { label: 'Love Letter', path: '/love-letter', Icon: Mail },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, logout, setShowLoginModal } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const textColor = scrolled ? 'var(--color-text)' : 'white';
  const navBg     = scrolled ? 'var(--nav-bg)' : 'transparent';

  return (
    <>
      {/* ── Navbar bar (z: 400) ─────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 400,
        background: navBg,
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.3s ease', padding: '0 20px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 20, color: textColor, letterSpacing: '0.05em' }}>ALCA</span>
            <Heart size={15} fill="var(--color-primary)" color="var(--color-primary)" style={{ animation: 'pulse 2s infinite' }} />
          </Link>

          {/* Desktop nav links */}
          <div className="desktop-nav" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {NAV_LINKS.map(({ label, path }) => (
              <Link key={path} to={path} style={{
                textDecoration: 'none', fontSize: 14, fontWeight: 500, color: textColor,
                opacity: location.pathname === path ? 1 : 0.82,
                borderBottom: location.pathname === path ? '2px solid var(--color-primary)' : '2px solid transparent',
                paddingBottom: 2, transition: 'all 0.2s',
              }}>{label}</Link>
            ))}
          </div>

          {/* Desktop controls */}
          <div className="desktop-nav" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} textColor={textColor} scrolled={scrolled} />
            <AdminBtn isAdmin={isAdmin} logout={logout} openLogin={() => setShowLoginModal(true)} />
          </div>

          {/* Mobile: only hamburger — theme toggle lives inside the drawer */}
          <button
            className="mobile-only"
            onClick={() => setDrawerOpen(v => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: textColor, padding: 6, lineHeight: 0,
            }}
            aria-label="Buka menu"
          >
            <Menu size={26} />
          </button>
        </div>
      </nav>

      {/* ── Backdrop (z: 600) ───────────────────────────── */}
      <div
        className="mobile-only"
        onClick={() => setDrawerOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 600,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'all' : 'none',
          transition: 'opacity 0.25s',
        }}
      />

      {/* ── Drawer panel (z: 610) ───────────────────────── */}
      <div
        className="mobile-only"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 610,
          width: 270, maxWidth: '85vw',
          background: 'var(--color-surface)',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.3)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}
      >
        {/* Drawer header — gradient strip */}
        <div style={{
          padding: '20px 18px 16px',
          background: 'var(--gradient-hero)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Heart size={14} fill="white" color="white" />
            <span style={{ fontFamily: 'Dancing Script', fontSize: 20, color: 'white' }}>Aldi & Caca</span>
          </div>

          {/* Theme toggle + close — both fully inside drawer, never overlapping navbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} textColor="white" scrolled={false} compact />
            <button
              onClick={() => setDrawerOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: '50%',
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white', flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAV_LINKS.map(({ label, path, Icon }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 22px', textDecoration: 'none',
                color: active ? 'var(--color-primary)' : 'var(--color-text)',
                background: active ? 'var(--color-surface2)' : 'transparent',
                borderLeft: `3px solid ${active ? 'var(--color-primary)' : 'transparent'}`,
                fontWeight: active ? 600 : 400, fontSize: 15,
                transition: 'all 0.15s',
              }}>
                <Icon size={17} color={active ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer: login/logout */}
        <div style={{ padding: '14px 18px 36px', borderTop: '1px solid var(--color-border)' }}>
          <AdminBtn
            isAdmin={isAdmin} logout={logout}
            openLogin={() => { setShowLoginModal(true); setDrawerOpen(false); }}
            fullWidth
          />
        </div>
      </div>

      <LoginModal />

      <style>{`
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function ThemeToggle({ theme, toggleTheme, textColor, scrolled, compact }) {
  const bg    = scrolled ? 'var(--color-surface2)' : 'rgba(255,255,255,0.18)';
  const track = theme === 'midnight' ? '#7c3aed' : 'var(--color-primary)';
  const knob  = theme === 'midnight' ? (compact ? 13 : 14) : 2;
  return (
    <button onClick={toggleTheme} style={{
      display: 'flex', alignItems: 'center', gap: compact ? 4 : 8,
      padding: compact ? '5px 9px' : '6px 14px', borderRadius: 50,
      background: bg, border: '1px solid rgba(255,255,255,0.25)',
      cursor: 'pointer', color: textColor, fontSize: 12, fontWeight: 500,
      flexShrink: 0,
    }}>
      {!compact && <span>Theme</span>}
      <Sun size={compact ? 11 : 13} />
      <div style={{ width: compact ? 24 : 28, height: compact ? 14 : 16, borderRadius: 8, background: track, position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: compact ? 1 : 2, left: knob, width: 12, height: 12, borderRadius: '50%', background: 'white', transition: 'left 0.3s' }} />
      </div>
      <Moon size={compact ? 11 : 13} />
    </button>
  );
}

function AdminBtn({ isAdmin, logout, openLogin, fullWidth }) {
  const s = { padding: '9px 18px', fontSize: 13, justifyContent: 'center', ...(fullWidth ? { width: '100%' } : {}) };
  return isAdmin
    ? <button onClick={logout}    className="btn-primary" style={s}><LogOut size={14} /> Logout</button>
    : <button onClick={openLogin} className="btn-primary" style={s}><Lock   size={14} /> Login Admin</button>;
}
