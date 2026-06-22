// src/pages/OurStory.jsx
import React from 'react';
import { Heart } from 'lucide-react';

export default function OurStory() {
  return (
    <div style={{ minHeight: '100vh', paddingTop: 64 }}>
      {/* Header */}
      <div style={{
        background: 'var(--gradient-hero)', padding: '60px 24px 48px',
        textAlign: 'center', position: 'relative',
      }}>
        {/* Floating hearts */}
        {[...Array(5)].map((_, i) => (
          <Heart key={i} size={14 + i * 4} fill="rgba(255,255,255,0.3)" color="rgba(255,255,255,0.3)"
            style={{
              position: 'absolute',
              top: `${20 + i * 15}%`, left: `${10 + i * 18}%`,
              animation: `floatHeart ${2 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }} />
        ))}
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(32px,6vw,52px)', color: 'white', marginBottom: 8 }}>Our Story</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>Cerita cinta yang dimulai dari sebuah pertemuan sederhana.</p>
      </div>

      <div className="container" style={{ paddingTop: 64, paddingBottom: 80 }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {[
            { title: 'Awal Pertemuan', date: 'April 2026', text: '01 April 2026 merupakan hari di mana kami berkenalan pertama kali. Obrolan terasa sangat menyenangkan. Kami berawal dari stranger yang kemudian mulai menanyakan nama, sekolah, dan selera musik masing-masing. Tak terasa dari situ mulai timbul obrolan yang lebih intens bahkan sampai ke hal-hal tidak penting sekalipun.' },
            { title: 'Jatuh Hati', date: '09 April 2026', text: 'Hari itu, 09 April 2026 pukul 18:15 adalah hari kami mengutarakan perasaan masing-masing. Ternyata kami berdua memiliki perasaan yang sama, hingga akhirnya 19:17 WITA kami memutuskan untuk membangun sebuah komitmen dan menjalin hubungan lebih lanjut.' },
            { title: 'Membangun Kenangan', date: 'Setiap Hari', text: 'Setiap hari bersama adalah kesempatan baru untuk menciptakan kenangan. Dari hal-hal kecil yang sederhana hingga momen-momen yang tak terlupakan, semua menjadi bagian dari cerita kita.' },
            { title: 'Masa Depan', date: 'Selamanya', text: 'Perjalanan ini baru saja dimulai. Ada banyak cerita yang masih menunggu untuk ditulis, banyak momen yang belum terjadi, dan banyak kebahagiaan yang akan kita ciptakan bersama.' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 24, marginBottom: 48, flexDirection: i % 2 === 0 ? 'row' : 'row-reverse' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
                background: 'var(--gradient-btn)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start',
              }}>
                <Heart size={24} fill="white" color="white" />
              </div>
              <div style={{
                background: 'var(--color-surface)', borderRadius: 20, padding: '28px 32px',
                boxShadow: 'var(--card-shadow)', border: '1px solid var(--color-border)', flex: 1,
              }}>
                <p style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.date}</p>
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 12 }}>{s.title}</h3>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, fontSize: 14 }}>{s.text}</p>
              </div>
            </div>
          ))}

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <p style={{ fontFamily: 'Dancing Script', fontSize: 36, color: 'var(--color-primary)' }}>Aldi & Caca</p>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 8 }}>Together since 09 April 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
