// src/components/TodaySong.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Music, Plus, Trash2, X,
  ChevronLeft, ChevronRight, RotateCcw, List, ExternalLink, Loader,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

const PLAYLIST_DOC = doc(db, 'settings', 'song_playlist');
const YT_KEY = () => process.env.REACT_APP_YOUTUBE_API_KEY;

function extractVideoId(url) {
  if (!url) return null;
  const pats = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of pats) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

function extractPlaylistId(url) {
  const m = url?.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export default function TodaySong() {
  const { isAdmin } = useAuth();

  // Live Firestore state
  const [firestoreData, setFirestoreData] = useState(null);
  const [loading, setLoading]             = useState(true);

  // Manage modal
  const [showManage, setShowManage]   = useState(false);
  const [inputUrl, setInputUrl]       = useState('');
  const [fetchingPl, setFetchingPl]   = useState(false);
  const [fetchError, setFetchError]   = useState('');
  const [draftVideos, setDraftVideos] = useState([]);
  const [saving, setSaving]           = useState(false);

  // Real-time listener — all devices stay in sync
  useEffect(() => {
    const unsub = onSnapshot(PLAYLIST_DOC, (snap) => {
      setFirestoreData(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const videos      = firestoreData?.videos || [];
  const isActive    = firestoreData?.active === true && videos.length > 0;
  const currentIdx  = firestoreData?.currentIndex ?? 0;
  const current     = isActive ? videos[currentIdx % videos.length] : null;

  // ── Admin: save to Firestore ──
  const saveToFirestore = useCallback(async (patch) => {
    await setDoc(PLAYLIST_DOC, {
      ...(firestoreData || {}),
      ...patch,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }, [firestoreData]);

  // Admin next/prev — writes index to Firestore → all users update
  const goNext = async () => {
    const next = ((currentIdx + 1) % videos.length);
    await saveToFirestore({ currentIndex: next });
  };
  const goPrev = async () => {
    const prev = ((currentIdx - 1 + videos.length) % videos.length);
    await saveToFirestore({ currentIndex: prev });
  };

  const handleReset = async () => {
    if (!window.confirm('Sembunyikan Today\'s Song dari user?')) return;
    await saveToFirestore({ active: false });
  };

  const handleActivate = async () => {
    await saveToFirestore({ active: true, currentIndex: 0 });
  };

  // ── Manage modal ──
  const openManage = () => {
    setDraftVideos(videos);
    setInputUrl('');
    setFetchError('');
    setShowManage(true);
  };

  const handleFetchUrl = async () => {
    const key = YT_KEY();
    if (!key) { setFetchError('REACT_APP_YOUTUBE_API_KEY belum diset'); return; }
    const plId  = extractPlaylistId(inputUrl);
    const vidId = extractVideoId(inputUrl);

    if (plId) {
      setFetchingPl(true); setFetchError('');
      try {
        let pageToken = '';
        const newVids = [];
        do {
          const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${plId}${pageToken ? `&pageToken=${pageToken}` : ''}&key=${key}`;
          const res  = await fetch(url);
          const data = await res.json();
          if (data.error) throw new Error(data.error.errors?.[0]?.reason || data.error.message);
          for (const item of (data.items || [])) {
            const vId = item.snippet?.resourceId?.videoId;
            if (!vId || vId === 'deleted') continue;
            newVids.push({
              id: vId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
              channelTitle: item.snippet.videoOwnerChannelTitle || '',
            });
          }
          pageToken = data.nextPageToken || '';
        } while (pageToken);

        if (!newVids.length) throw new Error('Playlist kosong atau tidak ditemukan');
        const existing = new Set(draftVideos.map(v => v.id));
        setDraftVideos(prev => [...prev, ...newVids.filter(v => !existing.has(v.id))]);
        setInputUrl('');
      } catch (e) { setFetchError('Gagal: ' + (e.message || 'unknown')); }
      setFetchingPl(false);

    } else if (vidId) {
      setFetchingPl(true); setFetchError('');
      try {
        const res  = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${vidId}&key=${key}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        const item = data.items?.[0];
        if (!item) throw new Error('Video tidak ditemukan');
        if (!draftVideos.find(v => v.id === vidId)) {
          setDraftVideos(prev => [...prev, {
            id: vidId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.medium?.url || '',
            channelTitle: item.snippet.channelTitle || '',
          }]);
        }
        setInputUrl('');
      } catch (e) { setFetchError('Gagal: ' + (e.message || 'unknown')); }
      setFetchingPl(false);
    } else {
      setFetchError('URL tidak valid. Masukkan link video atau playlist YouTube.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveToFirestore({
        videos: draftVideos,
        active: draftVideos.length > 0,
        currentIndex: 0,
      });
      setShowManage(false);
    } catch (e) { alert('Gagal menyimpan playlist'); }
    setSaving(false);
  };

  // ── Early returns ──
  if (loading) return null;
  if (!isAdmin && !isActive) return null;

  return (
    <>
      {/* Max-width wrapper so it doesn't go full-width on large screens */}
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 20,
          boxShadow: 'var(--card-shadow)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Music size={17} color="var(--color-primary)" />
              <h3 style={{ fontFamily: 'Playfair Display', fontSize: 17, margin: 0 }}>Today's Song</h3>
            </div>
            {isAdmin && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={openManage} className="btn-outline" style={{ fontSize: 11, padding: '4px 11px' }}>
                  <List size={11} /> Kelola
                </button>
                {isActive ? (
                  <button onClick={handleReset} style={{
                    background: 'none', border: '1px solid #e05c5c', color: '#e05c5c',
                    borderRadius: 20, padding: '4px 11px', fontSize: 11, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <RotateCcw size={10} /> Reset
                  </button>
                ) : (
                  (firestoreData?.videos?.length > 0) && (
                    <button onClick={handleActivate} className="btn-primary" style={{ fontSize: 11, padding: '4px 11px' }}>
                      Tampilkan
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Admin-only: hidden state */}
          {isAdmin && !isActive && (
            <div style={{ padding: '14px 20px', background: 'var(--color-surface2)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Music size={15} color="var(--color-text-muted)" />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Today's Song disembunyikan</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                  {firestoreData?.videos?.length
                    ? `${firestoreData.videos.length} lagu di playlist. Klik "Tampilkan" untuk aktifkan.`
                    : 'Belum ada lagu. Klik "Kelola" untuk tambah.'
                  }
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
                  src={`https://www.youtube.com/embed/${current.id}?rel=0&modestbranding=1`}
                  title={current.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen loading="lazy"
                  style={{ display: 'block' }}
                />
              </div>

              {/* Song info */}
              <div style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {current.thumbnail && (
                    <img src={current.thumbnail} alt="" style={{ width: 38, height: 38, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>{current.channelTitle}</p>
                  </div>
                  <a href={`https://youtu.be/${current.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
                    <ExternalLink size={13} />
                  </a>
                </div>

                {/* Next/Prev — ADMIN ONLY */}
                {isAdmin && videos.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 12 }}>
                    <button onClick={goPrev} style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--color-surface2)', border: '1px solid var(--color-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'var(--color-text)',
                    }}><ChevronLeft size={16} /></button>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {(currentIdx % videos.length) + 1} / {videos.length}
                    </span>
                    <button onClick={goNext} style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--color-surface2)', border: '1px solid var(--color-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'var(--color-text)',
                    }}><ChevronRight size={16} /></button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Manage Modal */}
      {showManage && (
        <div className="modal-overlay" onClick={() => setShowManage(false)}>
          <div className="modal-box" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowManage(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 21, marginBottom: 6 }}>Kelola Playlist</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 18 }}>Paste URL video atau playlist YouTube.</p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input
                value={inputUrl}
                onChange={e => { setInputUrl(e.target.value); setFetchError(''); }}
                placeholder="https://youtube.com/watch?v=... atau ?list=..."
                style={{ flex: 1 }}
                onKeyDown={e => e.key === 'Enter' && handleFetchUrl()}
              />
              <button onClick={handleFetchUrl} disabled={fetchingPl || !inputUrl.trim()} className="btn-primary" style={{ padding: '10px 14px' }}>
                {fetchingPl ? <Loader size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Plus size={14} />}
              </button>
            </div>
            {fetchError && <p style={{ fontSize: 12, color: '#e05c5c', marginBottom: 10 }}>{fetchError}</p>}

            <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {draftVideos.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13, padding: '20px 0' }}>Belum ada lagu.</p>
              ) : draftVideos.map((v, i) => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--color-surface2)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)', minWidth: 18, textAlign: 'right' }}>{i + 1}</span>
                  {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width: 44, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</p>
                    <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: 0 }}>{v.channelTitle}</p>
                  </div>
                  <button onClick={() => setDraftVideos(prev => prev.filter(x => x.id !== v.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e05c5c', padding: 4, flexShrink: 0 }}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowManage(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                {saving ? 'Menyimpan...' : `Simpan (${draftVideos.length} lagu)`}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
