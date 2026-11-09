'use client';

import React from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface TunerControlsProps {
  isMicActive: boolean;
  onToggleMic: () => void;
  referenceA4: number;
  onReferenceA4Change: (val: number) => void;
  volumeRms: number;
}

export const TunerControls: React.FC<TunerControlsProps> = ({
  isMicActive,
  onToggleMic,
  referenceA4,
  onReferenceA4Change,
  volumeRms,
}) => {
  const activeDotCount = Math.min(100, Math.round(volumeRms * 1200));

  // Knob rotation angle
  const knobAngle = ((referenceA4 - 440) / 10) * 90;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Knob Row (Pocket GT Style Metallic Knobs) */}
      <div className="w-full bg-[#1e2228] border border-zinc-700/60 rounded-xl p-3 flex items-center justify-between shadow-md">
        {/* A4 Pitch Knob */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-widest uppercase">VALUE / A4</span>
          
          <div className="relative w-14 h-14 rounded-full boss-knob flex items-center justify-center border border-zinc-600">
            <div
              className="w-full h-full rounded-full flex items-center justify-center transition-transform duration-100"
              style={{ transform: `rotate(${knobAngle}deg)` }}
            >
              {/* White Indicator Notch on Perimeter */}
              <div className="absolute top-1 w-1 h-3 rounded-full bg-slate-100 shadow-sm" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onReferenceA4Change(Math.max(430, referenceA4 - 1))}
              className="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-bold font-mono flex items-center justify-center border border-zinc-600"
            >
              -
            </button>
            <span className="font-mono text-xs font-bold text-slate-200">{referenceA4} Hz</span>
            <button
              onClick={() => onReferenceA4Change(Math.min(450, referenceA4 + 1))}
              className="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-bold font-mono flex items-center justify-center border border-zinc-600"
            >
              +
            </button>
          </div>
        </div>

        {/* Level / Volume Bar */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[160px]">
          <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-widest uppercase">MIC INPUT LEVEL</span>
          <div className="w-full h-3 bg-zinc-950 rounded border border-zinc-800 p-0.5 overflow-hidden">
            <div
              className="h-full bg-emerald-400 shadow-[0_0_8px_#10b981] transition-all duration-75"
              style={{ width: `${activeDotCount}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-500">{isMicActive ? `${activeDotCount}% RMS` : 'MUTED'}</span>
        </div>
      </div>

      {/* Chrome Footswitch Button & LED (Boss EQ-200 Footswitch Style) */}
      <div className="w-full bg-[#1a1d22] border border-zinc-700/60 rounded-xl p-4 flex flex-col items-center gap-3 shadow-lg">
        {/* Mint Green LED Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isMicActive ? 'boss-led-green' : 'bg-zinc-800 border border-zinc-700'}`} />
          <span className="text-xs font-mono font-bold tracking-wider text-zinc-300 uppercase">
            {isMicActive ? 'ON / LISTENING' : 'OFF / BYPASS'}
          </span>
        </div>

        {/* Chrome Metallic Heavy-Duty Footswitch */}
        <button
          onClick={onToggleMic}
          className="group flex flex-col items-center justify-center gap-1 focus:outline-none"
        >
          <div className="w-16 h-16 rounded-full boss-footswitch border-2 border-zinc-400/60 flex items-center justify-center transform active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-full border border-slate-300/80 bg-slate-200/40 shadow-inner flex items-center justify-center">
              {isMicActive ? <MicOff className="w-5 h-5 text-zinc-900" /> : <Mic className="w-5 h-5 text-zinc-900" />}
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-zinc-400 group-hover:text-slate-100 transition-colors mt-1">
            MIC ON / OFF
          </span>
        </button>
      </div>
    </div>
  );
};
