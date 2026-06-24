// src/components/TodaySong.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Music, Plus, Trash2, X, ChevronLeft, ChevronRight, RotateCcw, List, ExternalLink, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSongPlaylist, setSongPlaylist } from '../utils/dataService';

const YT_API_KEY = () => process.env.REACT_APP_YOUTUBE_API_KEY;
const SITE_CARD = {
  background: 'var(--color-surface)',
  borderRadius: 20,
  boxShadow: 'var(--card-shadow)',
  border: '1px solid var(--color-border)',
  overflow: 'hidden',
};

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Extract YouTube video ID from various URL formats
function extractVideoId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // raw ID
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// Extract playlist ID from URL
function extractPlaylistId(url) {
  const m = url?.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export default function TodaySong() {
  const { isAdmin } = useAuth();
  const [playlist, setPlaylist]   = useState(null); // raw from Firestore
  const [shuffled, setShuffled]   = useState([]);   // shuffled video list
  const [idx, setIdx]             = useState(0);
  const [loading, setLoading]     = useState(true);
  const [showManage, setShowManage] = useState(false);

  // Manage modal state
  const [inputUrl, setInputUrl]   = useState('');
  const [fetchingPl, setFetchingPl] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [draftVideos, setDraftVideos] = useState([]);
  const [saving, setSaving]       = useState(false);

  const fetchPlaylist = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSongPlaylist();
      setPlaylist(data);
      if (data.videos?.length) {
        const s = shuffle(data.videos);
        setShuffled(s);
        setIdx(0);
      }
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlaylist(); }, [fetchPlaylist]);

  const current = shuffled[idx] || null;
  const isActive = playlist?.active && shuffled.length > 0;

  // ── Navigation ──
  const goNext = () => setIdx(i => (i + 1) % shuffled.length);
  const goPrev = () => setIdx(i => (i - 1 + shuffled.length) % shuffled.length);

  // ── Admin: reset (hide from users) ──
  const handleReset = async () => {
    if (!window.confirm('Sembunyikan Today\'s Song dari user?')) return;
    const updated = { ...playlist, active: false };
    await setSongPlaylist(updated);
    setPlaylist(updated);
  };

  // ── Admin: activate ──
  const handleActivate = async () => {
    const updated = { ...playlist, active: true };
    await setSongPlaylist(updated);
    setPlaylist(updated);
  };

  // ── Admin: open manage modal ──
  const openManage = () => {
    setDraftVideos(playlist?.videos || []);
    setInputUrl('');
    setFetchError('');
    setShowManage(true);
  };

  // ── Admin: fetch playlist from YouTube ──
  const handleFetchPlaylist = async () => {
    const plId = extractPlaylistId(inputUrl);
    const vidId = extractVideoId(inputUrl);
    const key = YT_API_KEY();

    if (!key) { setFetchError('REACT_APP_YOUTUBE_API_KEY belum diset'); return; }

    if (plId) {
      // Fetch all items from playlist
      setFetchingPl(true);
      setFetchError('');
      try {
        let pageToken = '';
        const videos = [];
        do {
          const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${plId}${pageToken ? `&pageToken=${pageToken}` : ''}&key=${key}`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.error) throw new Error(data.error.errors?.[0]?.reason || data.error.message);
          for (const item of (data.items || [])) {
            const vId = item.snippet?.resourceId?.videoId;
            if (!vId) continue;
            videos.push({
              id: vId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
              channelTitle: item.snippet.videoOwnerChannelTitle || '',
            });
          }
          pageToken = data.nextPageToken || '';
        } while (pageToken);

        if (!videos.length) throw new Error('Playlist kosong atau tidak ditemukan');
        // Merge (avoid duplicates)
        const existing = new Set(draftVideos.map(v => v.id));
        const merged = [...draftVideos, ...videos.filter(v => !existing.has(v.id))];
        setDraftVideos(merged);
        setInputUrl('');
      } catch (e) {
        setFetchError('Gagal ambil playlist: ' + (e.message || 'unknown error'));
      }
      setFetchingPl(false);
    } else if (vidId) {
      // Single video — fetch title from YouTube
      setFetchingPl(true);
      setFetchError('');
      try {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${vidId}&key=${key}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        const item = data.items?.[0];
        if (!item) throw new Error('Video tidak ditemukan');
        const already = draftVideos.find(v => v.id === vidId);
        if (!already) {
          setDraftVideos(prev => [...prev, {
            id: vidId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
            channelTitle: item.snippet.channelTitle || '',
          }]);
        }
        setInputUrl('');
      } catch (e) {
        setFetchError('Gagal ambil video: ' + (e.message || 'unknown error'));
      }
      setFetchingPl(false);
    } else {
      setFetchError('URL tidak valid. Masukkan link YouTube video atau playlist.');
    }
  };

  const removeVideo = (id) => setDraftVideos(prev => prev.filter(v => v.id !== id));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = {
        videos: draftVideos,
        active: draftVideos.length > 0 ? true : false,
      };
      await setSongPlaylist(updated);
      setPlaylist(updated);
      const s = shuffle(draftVideos);
      setShuffled(s);
      setIdx(0);
      setShowManage(false);
    } catch (e) { alert('Gagal menyimpan playlist'); }
    setSaving(false);
  };

  // ── Render: loading ──
  if (loading) return null;

  // ── Render: nothing to show for non-admin when inactive ──
  if (!isAdmin && !isActive) return null;

  return (
    <>
      <div style={SITE_CARD}>
        {/* Card header */}
        <div style={{
          padding: '18px 22px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Music size={18} color="var(--color-primary)" />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 18, margin: 0 }}>
              Today's Song
            </h3>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={openManage} className="btn-outline" style={{ fontSize: 12, padding: '5px 12px' }}>
                <List size={12} /> Kelola
              </button>
              {isActive ? (
                <button onClick={handleReset} style={{
                  background: 'none', border: '1px solid #e05c5c', color: '#e05c5c',
                  borderRadius: 20, padding: '5px 12px', fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <RotateCcw size={11} /> Reset
                </button>
              ) : (
                draftVideos.length > 0 || (playlist?.videos?.length > 0) ? (
                  <button onClick={handleActivate} className="btn-primary" style={{ fontSize: 12, padding: '5px 12px' }}>
                    Tampilkan
                  </button>
                ) : null
              )}
            </div>
          )}
        </div>

        {/* Admin: hidden state banner */}
        {isAdmin && !isActive && (
          <div style={{ padding: '16px 22px', background: 'var(--color-surface2)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Music size={16} color="var(--color-text-muted)" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Today's Song disembunyikan</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                {playlist?.videos?.length ? `${playlist.videos.length} lagu di playlist. Klik "Tampilkan" untuk aktifkan.` : 'Belum ada lagu. Klik "Kelola" untuk tambah.'}
              </p>
            </div>
          </div>
        )}

        {/* Video embed */}
        {isActive && current && (
          <>
            <div style={{ aspectRatio: '16/9', background: '#000' }}>
              <iframe
                key={current.id}
                width="100%" height="100%"
                src={`https://www.youtube.com/embed/${current.id}?autoplay=0&rel=0&modestbranding=1`}
                title={current.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                style={{ display: 'block' }}
              />
            </div>

            {/* Song info + nav */}
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {current.thumbnail && (
                  <img src={current.thumbnail} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>{current.channelTitle}</p>
                </div>
                <a href={`https://youtu.be/${current.id}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  <ExternalLink size={14} />
                </a>
              </div>

              {/* Navigation */}
              {shuffled.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 14 }}>
                  <button onClick={goPrev} style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--color-surface2)', border: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--color-text)',
                  }}>
                    <ChevronLeft size={18} />
                  </button>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {idx + 1} / {shuffled.length}
                  </span>
                  <button onClick={goNext} style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--color-surface2)', border: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--color-text)',
                  }}>
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Manage Modal ── */}
      {showManage && (
        <div className="modal-overlay" onClick={() => setShowManage(false)}>
          <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowManage(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 6 }}>Kelola Playlist</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
              Paste URL video YouTube atau URL playlist YouTube/YouTube Music.
            </p>

            {/* URL input */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={inputUrl}
                onChange={e => { setInputUrl(e.target.value); setFetchError(''); }}
                placeholder="https://youtube.com/watch?v=... atau ?list=..."
                style={{ flex: 1 }}
                onKeyDown={e => e.key === 'Enter' && handleFetchPlaylist()}
              />
              <button onClick={handleFetchPlaylist} disabled={fetchingPl || !inputUrl} className="btn-primary" style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                {fetchingPl ? <Loader size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Plus size={14} />}
              </button>
            </div>
            {fetchError && <p style={{ fontSize: 12, color: '#e05c5c', marginBottom: 12 }}>{fetchError}</p>}

            {/* Video list */}
            <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {draftVideos.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13, padding: '24px 0' }}>
                  Belum ada lagu. Tambahkan dari URL di atas.
                </p>
              ) : draftVideos.map((v, i) => (
                <div key={v.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', background: 'var(--color-surface2)', borderRadius: 10,
                  border: '1px solid var(--color-border)',
                }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', minWidth: 20, textAlign: 'right' }}>{i + 1}</span>
                  {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width: 46, height: 34, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</p>
                    <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: 0 }}>{v.channelTitle}</p>
                  </div>
                  <button onClick={() => removeVideo(v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e05c5c', flexShrink: 0, padding: 4 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowManage(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                {saving ? 'Menyimpan...' : `Simpan (${draftVideos.length} lagu)`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </>
  );
}
