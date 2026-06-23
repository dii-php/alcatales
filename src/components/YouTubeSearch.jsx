// src/components/YouTubeSearch.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Music } from 'lucide-react';

function useDebounce(value, ms = 450) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function YouTubeSearch({ value, onChange, placeholder = 'Cari lagu di YouTube...' }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const debouncedQuery        = useDebounce(query);
  const containerRef          = useRef(null);
  const abortRef              = useRef(null);

  // Close on outside click
  useEffect(() => {
    const fn = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]); setOpen(false); setError(''); return;
    }

    // Read key fresh every search (not cached at module level)
    const key = process.env.REACT_APP_YOUTUBE_API_KEY;
    if (!key) {
      setError('REACT_APP_YOUTUBE_API_KEY belum diset di .env');
      return;
    }

    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const doSearch = async () => {
      setLoading(true);
      setError('');
      try {
        const url =
          `https://www.googleapis.com/youtube/v3/search` +
          `?part=snippet` +
          `&type=video` +
          `&videoCategoryId=10` +   // Music category
          `&maxResults=8` +
          `&q=${encodeURIComponent(debouncedQuery)}` +
          `&key=${key}`;

        const res = await fetch(url, { signal: abortRef.current.signal });
        const data = await res.json();

        // YouTube API returns error objects in the body even with 200
        if (data.error) {
          const msg = data.error.errors?.[0]?.reason || data.error.message || 'API error';
          console.error('[YouTubeSearch] API error:', data.error);
          throw new Error(msg);
        }

        const items = (data.items || []).filter(i => i.id?.videoId);
        setResults(items);
        setOpen(items.length > 0);
      } catch (e) {
        if (e.name === 'AbortError') return; // cancelled, ignore
        console.error('[YouTubeSearch] fetch failed:', e);

        // User-friendly messages per common error codes
        const reason = e.message || '';
        if (reason.includes('quotaExceeded') || reason.includes('dailyLimitExceeded')) {
          setError('Kuota YouTube API habis hari ini. Coba lagi besok.');
        } else if (reason.includes('keyInvalid') || reason.includes('badRequest')) {
          setError('API Key tidak valid. Periksa REACT_APP_YOUTUBE_API_KEY.');
        } else if (reason.includes('accessNotConfigured')) {
          setError('YouTube Data API v3 belum diaktifkan di Google Cloud Console.');
        } else {
          setError(`Gagal mencari: ${reason || 'network error'}. Cek konsol browser.`);
        }
        setResults([]);
      }
      setLoading(false);
    };

    doSearch();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [debouncedQuery]);

  const handleSelect = useCallback((item) => {
    onChange({
      id:           item.id.videoId,
      title:        item.snippet.title,
      thumbnail:    item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      channelTitle: item.snippet.channelTitle,
    });
    setQuery(''); setResults([]); setOpen(false); setError('');
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange(null);
    setQuery(''); setResults([]); setError('');
  }, [onChange]);

  // ── Render: selected song ──
  if (value) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 12,
        border: '1.5px solid var(--color-primary)',
        background: 'var(--color-surface2)',
      }}>
        {value.thumbnail
          ? <img src={value.thumbnail} alt="" style={{ width: 42, height: 42, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 42, height: 42, borderRadius: 6, background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Music size={16} color="var(--color-text-muted)" />
            </div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value.title}</p>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>{value.channelTitle}</p>
        </div>
        <button onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', flexShrink: 0, padding: 4 }}>
          <X size={16} />
        </button>
      </div>
    );
  }

  // ── Render: search input + dropdown ──
  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{
          position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--color-text-muted)', pointerEvents: 'none',
        }} />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setError(''); }}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          style={{ paddingLeft: 36 }}
        />
        {loading && (
          <div style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            width: 14, height: 14, borderRadius: '50%',
            border: '2px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            animation: 'spin 0.65s linear infinite',
          }} />
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)',
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 12, zIndex: 9000,
          maxHeight: 260, overflowY: 'auto',
          boxShadow: '0 10px 32px rgba(0,0,0,0.18)',
        }}>
          {results.map((item) => (
            <div
              key={item.id.videoId}
              onClick={() => handleSelect(item)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 13px', cursor: 'pointer',
                borderBottom: '1px solid var(--color-border)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {item.snippet.thumbnails?.default
                ? <img src={item.snippet.thumbnails.default.url} alt="" style={{ width: 46, height: 34, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 46, height: 34, borderRadius: 4, background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Music size={13} color="var(--color-text-muted)" />
                  </div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.snippet.title}
                </p>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>
                  {item.snippet.channelTitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={{ fontSize: 12, color: '#e05c5c', marginTop: 5, lineHeight: 1.4 }}>{error}</p>
      )}
    </div>
  );
}
