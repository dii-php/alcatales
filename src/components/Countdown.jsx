// src/components/Countdown.jsx
import React, { useState, useEffect } from 'react';

const START_DATE = new Date('2026-04-09T19:17:00+08:00');

function pad(n, len = 2) { return String(Math.max(0, n)).padStart(len, '0'); }

export default function Countdown() {
  const [elapsed, setElapsed] = useState(getElapsed());
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  function getElapsed() {
    const diff = Math.floor((new Date() - START_DATE) / 1000);
    return {
      days: Math.floor(diff / 86400),
      hours: Math.floor((diff % 86400) / 3600),
      minutes: Math.floor((diff % 3600) / 60),
      seconds: diff % 60,
    };
  }

  useEffect(() => {
    const id = setInterval(() => setElapsed(getElapsed()), 1000);
    const onResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener('resize', onResize);
    return () => { clearInterval(id); window.removeEventListener('resize', onResize); };
  }, []);

  const units = [
    { value: pad(elapsed.days, 3), label: 'Days' },
    { value: pad(elapsed.hours), label: 'Hours' },
    { value: pad(elapsed.minutes), label: 'Minutes' },
    { value: pad(elapsed.seconds), label: 'Seconds' },
  ];

  const boxStyle = {
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(10px)',
    borderRadius: 14,
    padding: isMobile ? '14px 16px' : '20px 28px',
    textAlign: 'center',
    minWidth: isMobile ? 64 : 90,
    border: '1px solid rgba(255,255,255,0.18)',
  };

  return (
    /* Always single row, scale down on mobile */
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12, justifyContent: 'center', flexWrap: 'nowrap' }}>
      {units.map((u, i) => (
        <React.Fragment key={u.label}>
          <div style={boxStyle}>
            <div style={{
              fontSize: isMobile ? 28 : 42,
              fontWeight: 700, color: 'white',
              fontFamily: 'Inter', letterSpacing: '-0.02em', lineHeight: 1,
            }}>{u.value}</div>
            <div style={{ fontSize: isMobile ? 9 : 12, color: 'rgba(255,255,255,0.75)', marginTop: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {u.label}
            </div>
          </div>
          {i < 3 && (
            <span style={{ fontSize: isMobile ? 20 : 36, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: isMobile ? -10 : -16, flexShrink: 0 }}>:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
