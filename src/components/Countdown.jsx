// src/components/Countdown.jsx
// Counter dihentikan (statis) di END_MS, tampil merah.
import React, { useState, useEffect, memo } from 'react';

const START_MS = new Date('2026-04-09T19:17:00+08:00').getTime();
const END_MS   = new Date('2026-11-24T18:41:00+08:00').getTime();

function getElapsedFrom(nowMs) {
  const diff = Math.max(0, Math.floor((nowMs - START_MS) / 1000));
  return {
    days:    Math.floor(diff / 86400),
    hours:   Math.floor((diff % 86400) / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
  };
}

function pad(n, len = 2) { return String(Math.max(0, n)).padStart(len, '0'); }

const TimeBox = memo(function TimeBox({ value, label, isMobile }) {
  return (
    <div className={isMobile ? 'cd-box cd-box--mobile' : 'cd-box'}>
      <div className={isMobile ? 'cd-value cd-value--mobile' : 'cd-value'}>{value}</div>
      <div className={isMobile ? 'cd-label cd-label--mobile' : 'cd-label'}>{label}</div>
    </div>
  );
});

const RED_CSS = `
  .cd-stopped .cd-box {
    background: rgba(110, 0, 20, 0.38) !important;
    border-color: rgba(255, 80, 80, 0.55) !important;
  }
  .cd-stopped .cd-value,
  .cd-stopped .cd-colon {
    color: #ff4d4d !important;
    text-shadow: 0 0 14px rgba(255, 40, 40, 0.45);
  }
  .cd-stopped .cd-label { color: #ff9a9a !important; }
`;

export default function Countdown() {
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

  const elapsed = getElapsedFrom(END_MS);

  const units = [
    { value: pad(elapsed.days, 3), label: 'Days' },
    { value: pad(elapsed.hours),   label: 'Hours' },
    { value: pad(elapsed.minutes), label: 'Minutes' },
    { value: pad(elapsed.seconds), label: 'Seconds' },
  ];

  return (
    <>
      <style>{RED_CSS}</style>
      <div className="cd-row cd-stopped">
        {units.map((u, i) => (
          <React.Fragment key={u.label}>
            <TimeBox value={u.value} label={u.label} isMobile={isMobile} />
            {i < units.length - 1 && <div className={isMobile ? 'cd-colon cd-colon--mobile' : 'cd-colon'}>:</div>}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
