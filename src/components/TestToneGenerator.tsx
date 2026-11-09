'use client';

import React, { useState } from 'react';
import { Play, Square, Radio } from 'lucide-react';

interface TestToneGeneratorProps {
  isGeneratorActive: boolean;
  onStartTone: (freq: number) => void;
  onStopTone: () => void;
  onFreqChange: (freq: number) => void;
}

const PRESET_TONES = [
  { label: 'PROMPT (148.1 Hz)', freq: 148.1, note: 'D3 (+15¢)' },
  { label: 'D3 TARGET (146.8 Hz)', freq: 146.83, note: 'D3 Target' },
  { label: 'A4 REF (440.0 Hz)', freq: 440.0, note: 'A4 Standard' },
  { label: 'C4 MIDDLE (261.6 Hz)', freq: 261.63, note: 'C4' },
];

export const TestToneGenerator: React.FC<TestToneGeneratorProps> = ({
  isGeneratorActive,
  onStartTone,
  onStopTone,
  onFreqChange,
}) => {
  const [selectedFreq, setSelectedFreq] = useState<number>(148.1);

  const handleSelectPreset = (freq: number) => {
    setSelectedFreq(freq);
    if (isGeneratorActive) {
      onFreqChange(freq);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSelectedFreq(val);
    if (isGeneratorActive) {
      onFreqChange(val);
    }
  };

  const toggleGenerator = () => {
    if (isGeneratorActive) {
      onStopTone();
    } else {
      onStartTone(selectedFreq);
    }
  };

  return (
    <div className="w-full bg-[#1e2228] border border-zinc-700/60 rounded-xl p-3 flex flex-col gap-3 shadow-md">
      <div className="flex items-center justify-between border-b border-zinc-700/80 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span>TEST TONE GENERATOR</span>
        </div>
        <button
          onClick={toggleGenerator}
          className={`py-1 px-3 rounded font-mono font-bold text-xs flex items-center gap-1 transition-all ${
            isGeneratorActive
              ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_8px_#10b981]'
              : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
          }`}
        >
          {isGeneratorActive ? (
            <>
              <Square className="w-3 h-3" /> STOP TONE
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current text-emerald-400" /> PLAY TONE
            </>
          )}
        </button>
      </div>

      {/* Boss Style Memory Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {PRESET_TONES.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handleSelectPreset(preset.freq)}
            className={`p-2 rounded border text-left font-mono transition-all text-xs flex flex-col ${
              selectedFreq === preset.freq
                ? 'bg-zinc-950 border-emerald-500 text-emerald-400'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <span className="font-bold text-[10px] tracking-wider">{preset.label}</span>
            <span className="text-[9px] text-zinc-500 mt-0.5">{preset.note}</span>
          </button>
        ))}
      </div>

      {/* Boss EQ Slider Control */}
      <div className="flex flex-col gap-1 pt-1 font-mono">
        <div className="flex justify-between text-[10px] text-zinc-400">
          <span>FREQ SLIDER:</span>
          <span className="text-emerald-400 font-bold">{selectedFreq.toFixed(1)} Hz</span>
        </div>
        <input
          type="range"
          min="60"
          max="800"
          step="0.1"
          value={selectedFreq}
          onChange={handleSliderChange}
          className="w-full accent-slate-200 cursor-pointer h-2 bg-zinc-950 rounded border border-zinc-800"
        />
      </div>
    </div>
  );
};
