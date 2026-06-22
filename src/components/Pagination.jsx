// src/components/Pagination.jsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange, compact = false }) {
  if (totalPages <= 1) return null;

  // Build page number list with ellipsis for long ranges
  const getPages = () => {
    const pages = [];
    const delta = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const btnBase = {
    minWidth: 36, height: 36, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
    color: 'var(--color-text)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
    transition: 'all 0.15s', padding: '0 10px',
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      marginTop: compact ? 0 : 36, flexWrap: 'wrap',
    }}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        style={{ ...btnBase, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'default' : 'pointer' }}
      >
        <ChevronLeft size={15} />
      </button>

      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} style={{ padding: '0 4px', color: 'var(--color-text-muted)', fontSize: 13 }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            style={{
              ...btnBase,
              background: p === currentPage ? 'var(--gradient-btn)' : 'var(--color-surface)',
              color: p === currentPage ? 'white' : 'var(--color-text)',
              border: p === currentPage ? 'none' : '1.5px solid var(--color-border)',
              fontWeight: p === currentPage ? 700 : 500,
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        style={{ ...btnBase, opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'default' : 'pointer' }}
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
