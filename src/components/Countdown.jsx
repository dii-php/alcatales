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
      justifyContent: 'center',
      alignItems: 'center',
      gap: isMobile ? 4 : 12,
      flexWrap: 'nowrap',
      width: '100%',
    }}
  >
    {units.map((u, i) => (
      <React.Fragment key={u.label}>
        <div
          style={{
            width: isMobile ? 68 : 95,
            minWidth: isMobile ? 68 : 95,
            height: isMobile ? 90 : 120,

            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 18,
            boxSizing: 'border-box',

            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',

            flexShrink: 0,
          }}
        >
          <div
            style={{
              color: 'white',
              fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              fontSize: isMobile ? 22 : 42,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              textAlign: 'center',
            }}
          >
            {u.value}
          </div>

          <div
            style={{
              marginTop: 10,
              color: 'rgba(255,255,255,0.75)',
              fontSize: isMobile ? 10 : 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            {u.label}
          </div>
        </div>

        {i < units.length - 1 && (
          <div
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 700,
              fontSize: isMobile ? 18 : 34,
              flexShrink: 0,
            }}
          >
            :
          </div>
        )}
      </React.Fragment>
    ))}
  </div>
);
}