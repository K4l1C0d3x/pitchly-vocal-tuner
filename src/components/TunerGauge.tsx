'use client';

import React, { useEffect, useState } from 'react';

interface TunerGaugeProps {
  cents: number;
  tuningStatus: 'flat' | 'in-tune' | 'sharp';
  hasSignal: boolean;
  isHeld?: boolean;
}

export const TunerGauge: React.FC<TunerGaugeProps> = ({ cents, tuningStatus, hasSignal, isHeld = false }) => {
  const [smoothCents, setSmoothCents] = useState(0);

  useEffect(() => {
    if (!hasSignal) {
      setSmoothCents(0);
      return;
    }
    const targetCents = Math.max(-50, Math.min(50, cents));
    const timer = setTimeout(() => {
      setSmoothCents((prev) => prev + (targetCents - prev) * 0.35);
    }, 16);
    return () => clearTimeout(timer);
  }, [cents, hasSignal, smoothCents]);

  const ticks = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];

  const getLedColor = () => {
    if (!hasSignal) return 'bg-zinc-700';
    if (isHeld) return 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]';
    if (tuningStatus === 'in-tune') return 'bg-emerald-400 shadow-[0_0_10px_#10b981]';
    if (tuningStatus === 'flat') return 'bg-amber-400 shadow-[0_0_10px_#f59e0b]';
    return 'bg-rose-500 shadow-[0_0_10px_#f43f5e]';
  };

  // Mathematical SVG Needle Position
  // Center pivot: (100, 88), rounded to 3 decimal places to prevent SSR/client hydration float discrepancies
  const needleAngleRad = ((smoothCents / 50) * 60 - 90) * (Math.PI / 180);
  const needleRadius = 72;
  const needleX2 = Number((100 + needleRadius * Math.cos(needleAngleRad)).toFixed(3));
  const needleY2 = Number((88 + needleRadius * Math.sin(needleAngleRad)).toFixed(3));

  return (
    <div className="w-full boss-lcd-screen rounded-xl p-3 flex flex-col items-center justify-between border border-zinc-700/60 shadow-inner relative overflow-hidden aspect-[2/1]">
      {/* Top Status Bar with Boss LED indicator */}
      <div className="w-full flex items-center justify-between px-2 text-[10px] font-mono text-zinc-400 uppercase tracking-widest border-b border-zinc-800/80 pb-1">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${getLedColor()}`} />
          <span>
            {hasSignal
              ? isHeld
                ? 'LAST PITCH HELD'
                : tuningStatus === 'in-tune'
                ? 'IN TUNE'
                : tuningStatus === 'flat'
                ? 'FLAT'
                : 'SHARP'
              : 'STANDBY'}
          </span>
        </div>
        <span>TUNER GAUGE</span>
      </div>

      {/* High-Precision Vector SVG Arc & Needle */}
      <svg className="w-full h-full p-1" viewBox="0 0 200 100">
        {/* Center line (0 cents) */}
        <line
          x1="100"
          y1="10"
          x2="100"
          y2="25"
          stroke={tuningStatus === 'in-tune' && hasSignal ? '#10b981' : '#4b5563'}
          strokeWidth="2.5"
        />

        {/* Ticks */}
        {ticks.map((tick) => {
          const angleRad = ((tick / 50) * 60 - 90) * (Math.PI / 180);
          const isMajor = tick % 10 === 0;
          const isZero = tick === 0;
          const innerR = isZero ? 62 : isMajor ? 66 : 70;
          const outerR = 78;

          const x1 = Number((100 + innerR * Math.cos(angleRad)).toFixed(3));
          const y1 = Number((88 + innerR * Math.sin(angleRad)).toFixed(3));
          const x2 = Number((100 + outerR * Math.cos(angleRad)).toFixed(3));
          const y2 = Number((88 + outerR * Math.sin(angleRad)).toFixed(3));

          let strokeColor = '#374151';
          if (hasSignal) {
            if (isZero && tuningStatus === 'in-tune') strokeColor = '#10b981';
            else if (tick < 0 && cents < tick + 5) strokeColor = '#f59e0b';
            else if (tick > 0 && cents > tick - 5) strokeColor = '#f43f5e';
          }

          return (
            <line
              key={tick}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={strokeColor}
              strokeWidth={isZero ? '2.5' : isMajor ? '1.5' : '1'}
              strokeLinecap="round"
            />
          );
        })}

        {/* Dynamic Precision Needle (Rendered inside SVG coordinate space) */}
        <line
          x1="100"
          y1="88"
          x2={needleX2}
          y2={needleY2}
          stroke={hasSignal ? (isHeld ? '#38bdf8' : tuningStatus === 'in-tune' ? '#10b981' : '#f8fafc') : '#4b5563'}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transition: 'x2 0.075s ease-out, y2 0.075s ease-out' }}
        />

        {/* Pivot Cap */}
        <circle cx="100" cy="88" r="4.5" fill="#1f2937" stroke="#4b5563" strokeWidth="1.5" />
        <circle cx="100" cy="88" r="1.5" fill={hasSignal ? (isHeld ? '#38bdf8' : tuningStatus === 'in-tune' ? '#10b981' : '#f8fafc') : '#6b7280'} />

        {/* Scale Numbers */}
        <text x="35" y="85" fill="#6b7280" fontSize="7" textAnchor="middle" fontFamily="monospace">-50</text>
        <text x="100" y="36" fill={tuningStatus === 'in-tune' && hasSignal ? '#10b981' : '#9ca3af'} fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">0</text>
        <text x="165" y="85" fill="#6b7280" fontSize="7" textAnchor="middle" fontFamily="monospace">+50</text>
      </svg>
    </div>
  );
};
