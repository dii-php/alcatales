// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ChevronDown, ArrowRight, Instagram, Gift, Calendar, Star } from 'lucide-react';
import Countdown from '../components/Countdown';
import PhotoSettingButton from '../components/PhotoSettingButton';
import TodaySong from '../components/TodaySong';
import { getGallery, getMoments, getSetting, subscribeEmail } from '../utils/dataService';
import { useAuth } from '../context/AuthContext';

const ICON_MAP = { heart: Heart, gift: Gift, star: Star, calendar: Calendar };

const HEARTS = [
  { top: '14%', left: '6%',    size: 18, delay: '0s'   },
  { top: '28%', right: '8%',   size: 24, delay: '0.6s' },
  { bottom: '22%', left: '12%', size: 14, delay: '1.2s' },
  { bottom: '35%', right: '14%', size: 20, delay: '1.8s' },
];

const GUEST_EMAIL_KEY = 'alca_sub_email';

export default function Home() {
  const { isAdmin, adminUsername } = useAuth();
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [moments, setMoments]             = useState([]);
  const [isMobile, setIsMobile]           = useState(window.innerWidth <= 640);
  const [polaroidUrl, setPolaroidUrl]     = useState(null);
  const [lovePic1, setLovePic1]           = useState(null);
  const [lovePic2, setLovePic2]           = useState(null);
  const [subEmail, setSubEmail]           = useState('');
  const [subStatus, setSubStatus]         = useState('');
  const [savedSubEmail, setSavedSubEmail] = useState('');
  const [subLoaded, setSubLoaded]         = useState(true); // true so form shows immediately, updated async

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    getGallery().then(d => setGalleryPhotos(d.slice(0, 4))).catch(() => {});
    getMoments().then(d => setMoments(d.slice(0, 4))).catch(() => {});
    getSetting('polaroid').then(d => d?.imageUrl && setPolaroidUrl(d.imageUrl)).catch(() => {});
    getSetting('loveletter_photo1').then(d => d?.imageUrl && setLovePic1(d.imageUrl)).catch(() => {});
    getSetting('loveletter_photo2').then(d => d?.imageUrl && setLovePic2(d.imageUrl)).catch(() => {});
  }, []);

  useEffect(() => {
    // Don't hide form during loading — show optimistically from localStorage/empty
    // then update async when API responds
    if (isAdmin && adminUsername) {
      // Admin: restore from localStorage instantly while API loads
      const cachedAdminSub = localStorage.getItem('alca_admin_sub_' + adminUsername);
      if (cachedAdminSub) setSavedSubEmail(cachedAdminSub);
      fetch('/api/my-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUsername }),
      })
        .then(r => r.ok ? r.json() : { email: null })
        .then(data => {
          const email = data.email || '';
          setSavedSubEmail(email);
          // Cache for instant display next visit
          if (email) localStorage.setItem('alca_admin_sub_' + adminUsername, email);
          else localStorage.removeItem('alca_admin_sub_' + adminUsername);
          setSubLoaded(true);
        })
        .catch(() => { setSubLoaded(true); });
    } else {
      const saved = localStorage.getItem(GUEST_EMAIL_KEY);
      setSavedSubEmail(saved || '');
      setSubLoaded(true);
      if (saved) {
        fetch('/api/check-subscriber', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: saved }),
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data && data.active === false) {
              localStorage.removeItem(GUEST_EMAIL_KEY);
              setSavedSubEmail('');
            }
          })
          .catch(() => {});
      }
    }
  }, [isAdmin, adminUsername]);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subEmail) return;
    setSubStatus('loading');
    try {
      const result = await subscribeEmail(subEmail, isAdmin, adminUsername);
      const emailLower = subEmail.toLowerCase();
      if (!isAdmin) localStorage.setItem(GUEST_EMAIL_KEY, emailLower);
      else if (adminUsername) localStorage.setItem('alca_admin_sub_' + adminUsername, emailLower);
      setSavedSubEmail(emailLower);
      setSubStatus(result.message === 'already_subscribed' ? 'exists' : 'done');
      setSubEmail('');
    } catch (err) {
      setSubStatus('error');
    }
  };

  const handleUnsubscribe = async () => {
    if (!window.confirm(`Berhenti menerima notifikasi untuk ${savedSubEmail}? Data akan dihapus permanen.`)) return;
    setSubStatus('loading');
    try {
      await fetch('/api/unsubscribe-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: savedSubEmail }),
      });
    } catch (e) {}
    if (!isAdmin) localStorage.removeItem(GUEST_EMAIL_KEY);
    else if (adminUsername) localStorage.removeItem('alca_admin_sub_' + adminUsername);
    setSavedSubEmail('');
    setSubStatus('');
  };

  const PolaroidInner = ({ height }) => (
    polaroidUrl
      ? <img src={polaroidUrl} alt="polaroid" style={{ width: '100%', height: height || 'auto', aspectRatio: height ? undefined : '1', objectFit: 'cover', borderRadius: 2, display: 'block' }} />
      : <div style={{ width: '100%', height: height || undefined, aspectRatio: height ? undefined : '1', background: 'linear-gradient(135deg,#c96a5e,#b5607a)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Heart size={height ? height * 0.35 : 32} fill="white" color="white" />
        </div>
  );

  return (
    <div>
      <section style={{
        minHeight: '100vh', background: 'var(--gradient-hero)',
        position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 64,
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%)' }} />
        {HEARTS.map((h, i) => (
          <div key={i} className="float-heart" style={{ position: 'absolute', opacity: 0.45, top: h.top, left: h.left, right: h.right, bottom: h.bottom, animationDelay: h.delay }}>
            <Heart size={h.size} fill="white" color="white" />
          </div>
        ))}
        {!isMobile && (
          <div style={{ position: 'absolute', top: 96, right: 72, zIndex: 2 }}>
            <div style={{ background: 'white', padding: '10px 10px 28px', borderRadius: 4, transform: 'rotate(6deg)', boxShadow: '0 8px 30px rgba(0,0,0,0.25)', width: 160 }}>
              <PolaroidInner />
              <p style={{ textAlign: 'center', marginTop: 8, fontFamily: 'Dancing Script', fontSize: 16, color: '#666', whiteSpace: 'nowrap' }}>You & Me ♡</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <PhotoSettingButton settingKey="polaroid" label="Ganti Foto" onUpdated={setPolaroidUrl} />
            </div>
          </div>
        )}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', maxWidth: 700, width: '100%' }}>
          {isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 14, gap: 7 }}>
              <div style={{ background: 'white', padding: '8px 8px 22px', borderRadius: 4, transform: 'rotate(3deg)', boxShadow: '0 6px 20px rgba(0,0,0,0.25)', width: 100 }}>
                <PolaroidInner height={86} />
                <p style={{ textAlign: 'center', marginTop: 6, fontFamily: 'Dancing Script', fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>You & Me ♡</p>
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
        <a href="#notify" style={{ position: 'absolute', bottom: 32, color: 'rgba(255,255,255,0.7)', animation: 'floatHeart 2s ease-in-out infinite', cursor: 'pointer' }}>
          <ChevronDown size={28} />
        </a>
      </section>

      <section id="notify" className="section" style={{ paddingTop: isMobile ? 32 : 48, paddingBottom: isMobile ? 20 : 24 }}>
        <div className="container">
          <div style={{
            background: 'var(--color-surface)', borderRadius: 20,
            padding: isMobile ? '22px 18px' : '24px 28px',
            boxShadow: 'var(--card-shadow)', border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 24, flexWrap: 'wrap',
            maxWidth: 760, margin: '0 auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 200 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: 'var(--gradient-btn)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={20} fill="white" color="white" />
              </div>
              <div>
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? 16 : 18, margin: '0 0 3px' }}>Get Notification?</h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                  Notifikasi email saat ada momen atau surat cinta baru.
                </p>
              </div>
            </div>

            {!subLoaded ? (
              <div style={{ flex: 1, minWidth: isMobile ? '100%' : 240 }} />
            ) : savedSubEmail ? (
              <div style={{ flex: 1, minWidth: isMobile ? '100%' : 220 }}>
                <div style={{ background: 'var(--color-surface2)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--color-border)', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <Heart size={12} fill="var(--color-primary)" color="var(--color-primary)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600 }}>✓ Subscribed</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500, margin: 0, wordBreak: 'break-all' }}>
                    {savedSubEmail}
                  </p>
                </div>
                <button
                  onClick={handleUnsubscribe}
                  disabled={subStatus === 'loading'}
                  style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: 'var(--color-text-muted)', cursor: 'pointer', width: '100%' }}>
                  {subStatus === 'loading' ? 'Memproses...' : 'Berhenti Berlangganan'}
                </button>
              </div>
            ) : subStatus === 'done' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary)', fontSize: 14, fontWeight: 500 }}>
                <Heart size={15} fill="var(--color-primary)" color="var(--color-primary)" /> Berhasil! Kamu akan mendapat notifikasi.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 8, flex: 1, minWidth: isMobile ? '100%' : 240 }}>
                <input
                  type="email" value={subEmail}
                  onChange={e => { setSubEmail(e.target.value); setSubStatus(''); }}
                  placeholder="email@kamu.com"
                  required disabled={subStatus === 'loading'}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn-primary" disabled={subStatus === 'loading'} style={{ padding: '10px 18px', fontSize: 13, whiteSpace: 'nowrap' }}>
                  {subStatus === 'loading' ? '...' : <><Heart size={13} fill="white" color="white" /> Subscribe</>}
                </button>
              </form>
            )}
            {subStatus === 'error' && !savedSubEmail && (
              <p style={{ fontSize: 12, color: '#e05c5c', width: '100%', margin: '-4px 0 0' }}>
                Gagal subscribe. Pastikan server sudah di-deploy ke Vercel.
              </p>
            )}
          </div>
        </div>
      </section>

      <TodaySong />

      <section id="journey" className="section" style={{ paddingTop: isMobile ? 24 : 28 }}>
        <div className="container">
          <div className="section-card">
            <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 180 }}>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: 26, marginBottom: 8 }}>
                  Our Journey <Heart size={18} color="var(--color-primary)" style={{ display: 'inline', verticalAlign: 'middle' }} />
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>Setiap cerita cinta itu unik,<br />dan ini adalah cerita kita.</p>
                <Link to="/timeline" className="btn-primary" style={{ fontSize: 13 }}>Lihat Timeline <ArrowRight size={14} /></Link>
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
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-surface)', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', boxShadow: `0 0 0 4px var(--color-bg)` }}>
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
                : [1,2,3,4].map(i => (
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

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-card" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 20 : 48, flexWrap: 'nowrap' }}>
            {!isMobile ? (
              <div style={{ position: 'relative', width: 200, height: 210, flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 20, left: 10, background: 'white', padding: '8px 8px 24px', transform: 'rotate(-8deg)', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', borderRadius: 4, width: 120 }}>
                  {lovePic1 ? <img src={lovePic1} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 2, display: 'block' }} /> : <div style={{ width: '100%', height: 90, background: 'linear-gradient(135deg,#e8857a,#b5607a)', borderRadius: 2 }} />}
                </div>
                <div style={{ position: 'absolute', top: 0, left: 40, background: 'white', padding: '8px 8px 24px', transform: 'rotate(5deg)', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', borderRadius: 4, width: 120 }}>
                  {lovePic2 ? <img src={lovePic2} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 2, display: 'block' }} /> : <div style={{ width: '100%', height: 90, background: 'linear-gradient(135deg,#c96a5e,#d4607a)', borderRadius: 2 }} />}
                </div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 44, height: 44, borderRadius: '50%', background: 'var(--gradient-btn)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                  <Heart size={20} fill="white" color="white" />
                </div>
                {isAdmin && (
                  <div style={{ position: 'absolute', bottom: -34, left: 0, right: 0, display: 'flex', gap: 5, justifyContent: 'center' }}>
                    <PhotoSettingButton settingKey="loveletter_photo1" label="Foto 1" onUpdated={setLovePic1} />
                    <PhotoSettingButton settingKey="loveletter_photo2" label="Foto 2" onUpdated={setLovePic2} />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ flexShrink: 0 }}>
                <div style={{ background: 'white', padding: '6px 6px 18px', borderRadius: 4, transform: 'rotate(-4deg)', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', width: 80 }}>
                  {lovePic1 ? <img src={lovePic1} alt="" style={{ width: '100%', height: 68, objectFit: 'cover', borderRadius: 2, display: 'block' }} /> : <div style={{ width: '100%', height: 68, background: 'linear-gradient(135deg,#e8857a,#b5607a)', borderRadius: 2 }} />}
                </div>
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: isMobile ? 20 : 28, marginBottom: 10 }}>
                Love Letter <Heart size={16} color="var(--color-primary)" style={{ display: 'inline', verticalAlign: 'middle' }} />
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: isMobile ? 13 : 14, lineHeight: 1.6, marginBottom: 18 }}>
                Tempat untuk menyimpan kata-kata<br />terindah untuk satu sama lain.
              </p>
              <Link to="/love-letter" className="btn-primary" style={{ fontSize: isMobile ? 13 : 14 }}>
                Buka Love Letter <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

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
              <p style={{ fontWeight: 600, color: 'white', marginBottom: 2, fontSize: isMobile ? 14 : 15 }}>Follow perjalanan kita di Instagram</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>@alcatales.haven</p>
            </div>
            <ArrowRight size={18} color="white" style={{ flexShrink: 0 }} />
          </a>
        </div>
      </section>
    </div>
  );
}
