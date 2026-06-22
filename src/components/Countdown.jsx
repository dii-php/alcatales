// src/components/Countdown.jsx
// Waktu statis berdasarkan server NTP via worldtimeapi, fallback ke Date.now() jika offline
// Tidak terpengaruh perubahan jam device karena pakai performance.now() sebagai ticker
//
// PERFORMANCE: Box styling moved to CSS classes (countdown.css below via index.css)
// so each 1-second tick only updates text nodes, not full inline-style objects.
import React, { useState, useEffect, useRef, memo } from 'react';

const START_MS = new Date('2026-04-09T19:17:00+08:00').getTime();

function getElapsedFrom(nowMs) {
  const diff = Math.floor((nowMs - START_MS) / 1000);
  return {
    days:    Math.floor(diff / 86400),
    hours:   Math.floor((diff % 86400) / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
  };
}

function pad(n, len = 2) { return String(Math.max(0, n)).padStart(len, '0'); }

// Memoized box — only re-renders when its own value changes, not on every parent tick
const TimeBox = memo(function TimeBox({ value, label, isMobile }) {
  return (
    <div className={isMobile ? 'cd-box cd-box--mobile' : 'cd-box'}>
      <div className={isMobile ? 'cd-value cd-value--mobile' : 'cd-value'}>{value}</div>
      <div className={isMobile ? 'cd-label cd-label--mobile' : 'cd-label'}>{label}</div>
    </div>
  );
});

export default function Countdown() {
  const serverNowRef = useRef(null);
  const perfBaseRef = useRef(null);

  const [elapsed, setElapsed] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    let frame;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setIsMobile(window.innerWidth <= 480));
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const res = await fetch('https://worldtimeapi.org/api/timezone/Asia/Makassar');
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
    return <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Memuat waktu...</div>;
  }

  const units = [
    { value: pad(elapsed.days, 3), label: 'Days' },
    { value: pad(elapsed.hours),   label: 'Hours' },
    { value: pad(elapsed.minutes), label: 'Minutes' },
    { value: pad(elapsed.seconds), label: 'Seconds' },
  ];

  return (
    <div className="cd-row">
      {units.map((u, i) => (
        <React.Fragment key={u.label}>
          <TimeBox value={u.value} label={u.label} isMobile={isMobile} />
          {i < units.length - 1 && <div className={isMobile ? 'cd-colon cd-colon--mobile' : 'cd-colon'}>:</div>}
        </React.Fragment>
      ))}
    </div>
  );
}
