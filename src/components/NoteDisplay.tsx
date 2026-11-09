'use client';

import React from 'react';
import { PitchDetails } from '@/lib/dsp/pitchMath';

interface NoteDisplayProps {
  pitchDetails: PitchDetails;
  hasSignal: boolean;
  isHeld?: boolean;
}

export const NoteDisplay: React.FC<NoteDisplayProps> = ({ pitchDetails, hasSignal, isHeld = false }) => {
  const { noteName, octave, frequency, targetFrequency, cents, tuningStatus } = pitchDetails;

  const centsFormatted = cents > 0 ? `+${cents}` : `${cents}`;

  return (
    <div className="w-full boss-lcd-screen rounded-xl p-3 flex flex-col items-center gap-2 border border-zinc-700/60 shadow-inner">
      {/* 7-Segment Retro LED Display (Pocket GT Style) */}
      <div className="w-full bg-[#050709] rounded-lg p-3 border border-zinc-800 flex items-center justify-between shadow-inner">
        <div className="flex flex-col">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
            {isHeld ? 'LAST NOTE HELD' : 'PITCH DETECTED'}
          </span>
          <span className={`text-xs font-mono font-bold ${isHeld ? 'text-cyan-400 animate-pulse' : 'text-zinc-400'}`}>
            {hasSignal
              ? isHeld
                ? 'RELEASED (HELD)'
                : tuningStatus === 'in-tune'
                ? 'PERFECT'
                : tuningStatus === 'flat'
                ? 'FLAT (-)'
                : 'SHARP (+)'
              : 'NO SIGNAL'}
          </span>
        </div>

        {/* 7-Segment White/Cyan Large Digits */}
        <div className="flex items-baseline gap-0.5 px-3 py-1 bg-zinc-950 rounded border border-zinc-800">
          {hasSignal ? (
            <>
              <span className={`text-5xl font-black font-mono tracking-wider ${isHeld ? 'text-slate-300' : 'text-slate-100'} drop-shadow-[0_0_10px_rgba(248,250,252,0.8)]`}>
                {noteName}
              </span>
              <span className="text-3xl font-bold font-mono text-slate-300">
                {octave}
              </span>
            </>
          ) : (
            <span className="text-5xl font-black font-mono text-zinc-800 tracking-wider">
              --
            </span>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="w-full grid grid-cols-3 gap-2 text-center pt-1 font-mono">
        <div className="bg-[#050709] rounded p-2 border border-zinc-800 flex flex-col">
          <span className="text-[9px] text-zinc-500 font-bold">FREQ</span>
          <span className="text-xs font-bold text-slate-200 mt-0.5">
            {hasSignal ? `${frequency.toFixed(1)}` : '--'}
            <span className="text-[9px] text-zinc-500 ml-0.5">Hz</span>
          </span>
        </div>

        <div className="bg-[#050709] rounded p-2 border border-zinc-800 flex flex-col">
          <span className="text-[9px] text-zinc-500 font-bold">CENTS</span>
          <span className={`text-xs font-bold mt-0.5 ${hasSignal ? (tuningStatus === 'in-tune' ? 'text-emerald-400' : tuningStatus === 'flat' ? 'text-amber-400' : 'text-rose-400') : 'text-slate-200'}`}>
            {hasSignal ? centsFormatted : '--'}
            <span className="text-[9px] text-zinc-500 ml-0.5">¢</span>
          </span>
        </div>

        <div className="bg-[#050709] rounded p-2 border border-zinc-800 flex flex-col">
          <span className="text-[9px] text-zinc-500 font-bold">TARGET</span>
          <span className="text-xs font-bold text-slate-200 mt-0.5">
            {hasSignal ? `${targetFrequency.toFixed(2)}` : '--'}
            <span className="text-[9px] text-zinc-500 ml-0.5">Hz</span>
          </span>
        </div>
      </div>
    </div>
  );
};
