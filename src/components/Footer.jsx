// src/components/Footer.jsx
import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)',
      padding: '28px 24px',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>ALCA</span>
          <Heart size={14} fill="var(--color-primary)" color="var(--color-primary)" />
        </div>
        <span style={{ fontFamily: 'Dancing Script', fontSize: 22, color: 'var(--color-primary)' }}>
          Aldi & Caca
        </span>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          Made with <Heart size={12} fill="var(--color-primary)" color="var(--color-primary)" /> for our forever story.
        </p>
      </div>
    </footer>
  );
}
