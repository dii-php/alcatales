// src/components/Countdown.jsx
// Waktu statis berdasarkan server NTP via worldtimeapi, fallback ke Date.now() jika offline
// Tidak terpengaruh perubahan jam device karena pakai performance.now() sebagai ticker
import React, { useState, useEffect, useRef } from 'react';

const START_MS = new Date('2026-04-09T19:17:00+08:00').getTime();

function getElapsedFrom(nowMs) {
  const diff = Math.floor((nowMs - START_MS) / 1000);
  return {
    days: Math.floor(diff / 86400),
    hours: Math.floor((diff % 86400) / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
  };
}

function pad(n, len = 2) {
  return String(Math.max(0, n)).padStart(len, '0');
}

export default function Countdown() {
  const serverNowRef = useRef(null);
  const perfBaseRef = useRef(null);

  const [elapsed, setElapsed] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const res = await fetch(
          'https://worldtimeapi.org/api/timezone/Asia/Makassar'
        );
        const data = await res.json();

        serverNowRef.current = data.unixtime * 1000;
        perfBaseRef.current = performance.now();
      } catch {
        serverNowRef.current = Date.now();
        perfBaseRef.current = performance.now();
      }
    };

    fetchTime();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (serverNowRef.current === null) return;

      const elapsedPerf = performance.now() - perfBaseRef.current;
      const realNow = serverNowRef.current + elapsedPerf;

      setElapsed(getElapsedFrom(realNow));
    }, 1000);

    return () => clearInterval(id);
  }, []);

  if (!elapsed) {
    return (
      <div
        style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: 14,
        }}
      >
        Memuat waktu...
      </div>
    );
  }

  const units = [
    { value: pad(elapsed.days, 3), label: 'Days' },
    { value: pad(elapsed.hours), label: 'Hours' },
    { value: pad(elapsed.minutes), label: 'Minutes' },
    { value: pad(elapsed.seconds), label: 'Seconds' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? 4 : 12,
        flexWrap: 'nowrap',
      }}
    >
      {units.map((u, i) => (
        <React.Fragment key={u.label}>
          <div
            style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.18)',

              padding: isMobile ? '14px 10px' : '20px 28px',

              // PERBAIKAN BUG
              minWidth: isMobile ? 78 : 90,
              boxSizing: 'border-box',
              overflow: 'hidden',

              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: isMobile ? 26 : 42,
                fontWeight: 700,
                color: 'white',
                fontFamily: 'Inter',
                letterSpacing: '-0.02em',
                lineHeight: 1,

                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',

                width: '100%',
                whiteSpace: 'nowrap',
              }}
            >
              {u.value}
            </div>

            <div
              style={{
                fontSize: isMobile ? 9 : 12,
                color: 'rgba(255,255,255,0.75)',
                marginTop: 5,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {u.label}
            </div>
          </div>

          {i < 3 && (
            <span
              style={{
                fontSize: isMobile ? 20 : 36,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.7)',
                marginTop: isMobile ? -10 : -16,
                flexShrink: 0,
              }}
            >
              :
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}