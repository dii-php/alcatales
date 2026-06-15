// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ChevronDown, ArrowRight, Instagram, Gift, Calendar, Star } from 'lucide-react';
import Countdown from '../components/Countdown';
import PhotoSettingButton from '../components/PhotoSettingButton';
import { getGallery, getMoments, getSetting } from '../utils/dataService';
import { useAuth } from '../context/AuthContext';

const ICON_MAP = { heart: Heart, gift: Gift, star: Star, calendar: Calendar };

export default function Home() {
  const { isAdmin } = useAuth();
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [moments, setMoments] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  // Customizable photos
  const [polaroidUrl, setPolaroidUrl] = useState(null);
  const [lovePic1, setLovePic1] = useState(null);
  const [lovePic2, setLovePic2] = useState(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    getGallery().then(d => setGalleryPhotos(d.slice(0, 4))).catch(() => {});
    getMoments().then(d => setMoments(d.slice(0, 4))).catch(() => {});
    getSetting('polaroid').then(d => d?.imageUrl && setPolaroidUrl(d.imageUrl)).catch(() => {});
    getSetting('loveletter_photo1').then(d => d?.imageUrl && setLovePic1(d.imageUrl)).catch(() => {});
    getSetting('loveletter_photo2').then(d => d?.imageUrl && setLovePic2(d.imageUrl)).catch(() => {});
  }, []);

  // Polaroid inner content
  const PolaroidInner = ({ size }) => (
    polaroidUrl
      ? <img src={polaroidUrl} alt="polaroid" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 2, display: 'block' }} />
      : <div style={{ width: '100%', aspectRatio: '1', background: 'linear-gradient(135deg,#c96a5e,#b5607a)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Heart size={size} fill="white" color="white" />
        </div>
  );

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', background: 'var(--gradient-hero)',
        position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 64,
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%)' }} />

        {!isMobile && [
          { top: '15%', left: '8%', size: 18 },
          { top: '30%', right: '10%', size: 24 },
          { bottom: '25%', left: '15%', size: 14 },
        ].map((p, i) => (
          <div key={i} className="float-heart" style={{ position: 'absolute', ...p, opacity: 0.45 }}>
            <Heart size={p.size} fill="white" color="white" />
          </div>
        ))}

        {/* Desktop polaroid — absolute top-right */}
        {!isMobile && (
          <div style={{ position: 'absolute', top: 100, right: 80, zIndex: 2 }}>
            <div style={{
              background: 'white', padding: '10px 10px 28px', borderRadius: 4,
              transform: 'rotate(6deg)', boxShadow: '0 8px 30px rgba(0,0,0,0.25)', width: 160,
            }}>
              <PolaroidInner size={32} />
              <p style={{ textAlign: 'center', marginTop: 8, fontFamily: 'Dancing Script', fontSize: 16, color: '#666', whiteSpace: 'nowrap' }}>You & Me ♡</p>
            </div>
            {/* Admin change button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <PhotoSettingButton
                settingKey="polaroid"
                label="Ganti Foto"
                onUpdated={setPolaroidUrl}
              />
            </div>
          </div>
        )}

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', maxWidth: 700, width: '100%' }}>
          {/* Mobile polaroid — inline */}
          {isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16, gap: 6 }}>
              <div style={{
                background: 'white', padding: '8px 8px 22px', borderRadius: 4,
                transform: 'rotate(3deg)', boxShadow: '0 6px 20px rgba(0,0,0,0.25)', width: 110,
              }}>
                <PolaroidInner size={22} />
                <p style={{ textAlign: 'center', marginTop: 6, fontFamily: 'Dancing Script', fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>You & Me ♡</p>
              </div>
              <PhotoSettingButton settingKey="polaroid" label="Ganti Foto" onUpdated={setPolaroidUrl} />
            </div>
          )}

          <h1 style={{ fontFamily: 'Dancing Script', fontSize: 'clamp(44px,10vw,88px)', color: 'white', lineHeight: 1.1, marginBottom: 12, textShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
            Aldi <span style={{ color: 'rgba(255,220,215,1)', fontStyle: 'italic' }}>&</span> Caca
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: isMobile ? 13 : 15, marginBottom: 32, letterSpacing: '0.05em' }}>
            Together since 09 April 2026 · 19:17 GMT+8
          </p>

          <Countdown />

          <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(255,255,255,0.88)', fontSize: isMobile ? 13 : 15, fontStyle: 'italic', flexWrap: 'wrap', padding: '0 8px' }}>
            <Heart size={13} fill="rgba(255,255,255,0.7)" color="rgba(255,255,255,0.7)" style={{ animation: 'pulse 2s infinite', flexShrink: 0 }} />
            <span>Every second with you is my favorite part of life.</span>
            <Heart size={13} fill="rgba(255,255,255,0.7)" color="rgba(255,255,255,0.7)" style={{ animation: 'pulse 2s infinite 0.5s', flexShrink: 0 }} />
          </div>
        </div>

        <a href="#journey" style={{ position: 'absolute', bottom: 32, color: 'rgba(255,255,255,0.7)', animation: 'floatHeart 2s ease-in-out infinite', cursor: 'pointer' }}>
          <ChevronDown size={28} />
        </a>
      </section>

      {/* ── OUR JOURNEY ─────────────────────────────────── */}
      <section id="journey" className="section">
        <div className="container">
          <div className="section-card">
            <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 180 }}>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: 26, marginBottom: 8 }}>
                  Our Journey <Heart size={18} color="var(--color-primary)" style={{ display: 'inline', verticalAlign: 'middle' }} />
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                  Setiap cerita cinta itu unik,<br />dan ini adalah cerita kita.
                </p>
                <Link to="/timeline" className="btn-primary" style={{ fontSize: 13 }}>
                  Lihat Timeline <ArrowRight size={14} />
                </Link>
              </div>

              <div style={{ flex: 1, minWidth: 260, overflowX: 'auto' }}>
                {moments.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 14, textAlign: 'center' }}>Tambahkan momen di halaman Timeline.</p>
                ) : (
                  <div style={{ position: 'relative', minWidth: moments.length * 90 }}>
                    <div style={{ position: 'absolute', top: 28, left: 28, right: 28, height: 2, background: 'var(--color-border)', zIndex: 0 }} />
                    <div style={{ position: 'absolute', top: 28, left: 28, width: '60%', height: 2, background: 'var(--color-primary)', zIndex: 1 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-around', position: 'relative', zIndex: 2 }}>
                      {moments.map((m, i) => {
                        const Icon = ICON_MAP[m.icon] || Heart;
                        const colors = ['var(--color-primary)', '#e67e9c', '#c96a5e', '#d4af37'];
                        const color = colors[i % colors.length];
                        return (
                          <div key={m.id} style={{ textAlign: 'center', flex: 1, minWidth: 70 }}>
                            <div style={{
                              width: 48, height: 48, borderRadius: '50%',
                              background: 'var(--color-surface)', border: `2px solid ${color}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              margin: '0 auto 8px', boxShadow: `0 0 0 4px var(--color-bg)`,
                            }}>
                              <Icon size={18} color={color} fill={m.icon === 'heart' ? color : 'none'} />
                            </div>
                            <p style={{ fontSize: 10, color, fontWeight: 600, marginBottom: 2 }}>
                              {m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : ''}
                            </p>
                            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.3 }}>{m.title}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GALLERY MOMENTS PREVIEW ──────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? 22 : 28, marginBottom: 4 }}>
                  Gallery Moments <Heart size={18} color="var(--color-primary)" style={{ display: 'inline', verticalAlign: 'middle' }} />
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Kumpulan momen berharga kita berdua.</p>
              </div>
              <Link to="/gallery" className="btn-outline" style={{ fontSize: 13 }}>Lihat Semua <ArrowRight size={13} /></Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
              {galleryPhotos.length > 0
                ? galleryPhotos.map(photo => (
                    <div key={photo.id} style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden' }}>
                      <img src={photo.imageUrl} alt={photo.caption} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  ))
                : [1, 2, 3, 4].map(i => (
                    <div key={i} style={{ aspectRatio: '1', background: 'var(--color-surface2)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed var(--color-border)', gap: 6, padding: 12 }}>
                      <Heart size={16} color="var(--color-primary-light)" />
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>Belum ada foto</p>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      </section>

      {/* ── LOVE LETTER ─────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-card" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 20 : 48, flexWrap: 'wrap' }}>

            {/* Polaroid stack — dengan foto yang bisa diganti */}
            {!isMobile && (
              <div style={{ position: 'relative', width: 200, height: 210, flexShrink: 0 }}>
                {/* Photo 2 — behind */}
                <div style={{ position: 'absolute', top: 20, left: 10, background: 'white', padding: '8px 8px 24px', transform: 'rotate(-8deg)', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', borderRadius: 4, width: 120 }}>
                  {lovePic1
                    ? <img src={lovePic1} alt="love1" style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 2, display: 'block' }} />
                    : <div style={{ width: '100%', height: 90, background: 'linear-gradient(135deg,#e8857a,#b5607a)', borderRadius: 2 }} />
                  }
                </div>
                {/* Photo 1 — front */}
                <div style={{ position: 'absolute', top: 0, left: 40, background: 'white', padding: '8px 8px 24px', transform: 'rotate(5deg)', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', borderRadius: 4, width: 120 }}>
                  {lovePic2
                    ? <img src={lovePic2} alt="love2" style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 2, display: 'block' }} />
                    : <div style={{ width: '100%', height: 90, background: 'linear-gradient(135deg,#c96a5e,#d4607a)', borderRadius: 2 }} />
                  }
                </div>
                {/* Heart badge */}
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 44, height: 44, borderRadius: '50%', background: 'var(--gradient-btn)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                  <Heart size={20} fill="white" color="white" />
                </div>

                {/* Admin buttons */}
                {isAdmin && (
                  <div style={{ position: 'absolute', bottom: -32, left: 0, right: 0, display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <PhotoSettingButton settingKey="loveletter_photo1" label="Foto 1" onUpdated={setLovePic1} />
                    <PhotoSettingButton settingKey="loveletter_photo2" label="Foto 2" onUpdated={setLovePic2} />
                  </div>
                )}
              </div>
            )}

            <div style={{ flex: 1, paddingTop: isAdmin && !isMobile ? 0 : 0 }}>
              {isMobile && (
                <div style={{ marginBottom: 14 }}>
                  <Heart size={28} fill="var(--color-primary)" color="var(--color-primary)" style={{ animation: 'pulse 2s infinite' }} />
                </div>
              )}
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? 22 : 28, marginBottom: 10 }}>
                Love Letter <Heart size={18} color="var(--color-primary)" style={{ display: 'inline', verticalAlign: 'middle' }} />
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                Tempat untuk menyimpan kata-kata<br />terindah untuk satu sama lain.
              </p>
              <Link to="/love-letter" className="btn-primary" style={{ fontSize: 14 }}>
                Buka Love Letter <ArrowRight size={14} />
              </Link>

              {/* Mobile: ganti foto love letter */}
              {isMobile && isAdmin && (
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  <PhotoSettingButton settingKey="loveletter_photo1" label="Foto Polaroid 1" onUpdated={setLovePic1} />
                  <PhotoSettingButton settingKey="loveletter_photo2" label="Foto Polaroid 2" onUpdated={setLovePic2} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── INSTAGRAM LINK ───────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <a href="https://instagram.com/alcatales.haven" target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 16,
            background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
            borderRadius: 16, padding: isMobile ? '18px 20px' : '24px 32px',
            textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(131,58,180,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Instagram size={22} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, color: 'white', marginBottom: 2, fontSize: isMobile ? 14 : 15 }}>Follow perjalanan kami di Instagram</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>@alcatales.haven</p>
            </div>
            <ArrowRight size={18} color="white" style={{ flexShrink: 0 }} />
          </a>
        </div>
      </section>
    </div>
  );
}
