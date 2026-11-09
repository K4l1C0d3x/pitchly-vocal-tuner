'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AudioTunerEngine, TunerFrameData } from '@/lib/audio/AudioTunerEngine';
import { PitchDetails, getPitchDetails } from '@/lib/dsp/pitchMath';
import { TunerGauge } from '@/components/TunerGauge';
import { NoteDisplay } from '@/components/NoteDisplay';
import { TunerControls } from '@/components/TunerControls';
import { TestToneGenerator } from '@/components/TestToneGenerator';

export default function Home() {
  const engineRef = useRef<AudioTunerEngine | null>(null);

  const [referenceA4, setReferenceA4] = useState<number>(440);
  const [pitchDetails, setPitchDetails] = useState<PitchDetails>(getPitchDetails(0, 440));
  const [lastDetectedPitch, setLastDetectedPitch] = useState<PitchDetails | null>(null);
  const [isLiveSignal, setIsLiveSignal] = useState<boolean>(false);
  const [clarity, setClarity] = useState<number>(0);
  const [volumeRms, setVolumeRms] = useState<number>(0);
  const [activeSource, setActiveSource] = useState<'mic' | 'generator' | 'off'>('off');

  useEffect(() => {
    const engine = new AudioTunerEngine(referenceA4);
    engineRef.current = engine;

    engine.setCallback((data: TunerFrameData) => {
      setPitchDetails(data.pitchDetails);
      setClarity(data.clarity);
      setVolumeRms(data.rms);
      setActiveSource(data.activeSource);

      if (data.activeSource !== 'off' && data.pitchDetails.frequency > 0 && data.clarity > 0.45) {
        setLastDetectedPitch(data.pitchDetails);
        setIsLiveSignal(true);
      } else {
        setIsLiveSignal(false);
      }
    });

    return () => {
      engine.stop();
    };
  }, []);

  const handleReferenceA4Change = (newFreq: number) => {
    setReferenceA4(newFreq);
    if (engineRef.current) {
      engineRef.current.setReferenceA4(newFreq);
    }
  };

  const handleToggleMic = async () => {
    if (!engineRef.current) return;
    if (activeSource === 'mic') {
      setLastDetectedPitch(null);
      engineRef.current.stop();
    } else {
      setLastDetectedPitch(null);
      await engineRef.current.startMic();
    }
  };

  const handleStartTestTone = (freq: number) => {
    if (engineRef.current) {
      setLastDetectedPitch(null);
      engineRef.current.startTestTone(freq);
    }
  };

  const handleStopTestTone = () => {
    if (engineRef.current) {
      setLastDetectedPitch(null);
      engineRef.current.stop();
    }
  };

  const handleTestToneFreqChange = (freq: number) => {
    if (engineRef.current) {
      engineRef.current.setTestToneFrequency(freq);
    }
  };

  const displayPitch = isLiveSignal
    ? pitchDetails
    : lastDetectedPitch ?? pitchDetails;

  const isPitchAvailable = activeSource !== 'off' && displayPitch.frequency > 0;
  const isHeld = !isLiveSignal && lastDetectedPitch !== null && activeSource !== 'off';

  return (
    <main className="min-h-screen bg-[#101216] text-slate-100 flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden select-none">
      <div className="w-full max-w-5xl flex flex-col gap-4 my-auto">
        {/* Main Side-by-Side Boss Effect Pedals Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch">
          {/* UNIT 1: PITCHLY POCKET GT (Left Pedal Chassis - Controls & Pitch Presets) */}
          <div className="boss-chassis rounded-3xl p-5 flex flex-col justify-between gap-4">
            {/* Unit Brand Title Header */}
            <div className="w-full flex items-baseline justify-between border-b border-zinc-700/60 pb-2">
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-slate-100 font-sans">
                  Pitchly <span className="text-xs font-mono font-normal text-emerald-400 ml-1">GT</span>
                </h2>
                <p className="text-[9px] font-mono text-zinc-400 tracking-widest uppercase">VOCAL TUNER / MULTIEFFECT</p>
              </div>
              <span className="text-xs font-black font-mono tracking-widest text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded bg-emerald-950/40">
                PITCHLY
              </span>
            </div>

            {/* Hardware Controls */}
            <TunerControls
              isMicActive={activeSource === 'mic'}
              onToggleMic={handleToggleMic}
              referenceA4={referenceA4}
              onReferenceA4Change={handleReferenceA4Change}
              volumeRms={volumeRms}
            />

            {/* Test Pitch Preset Module */}
            <TestToneGenerator
              isGeneratorActive={activeSource === 'generator'}
              onStartTone={handleStartTestTone}
              onStopTone={handleStopTestTone}
              onFreqChange={handleTestToneFreqChange}
            />
          </div>

          {/* UNIT 2: PITCHLY GRAPHIC TUNER GT-200 (Right Pedal Chassis - LCD Display & Gauge) */}
          <div className="boss-chassis rounded-3xl p-5 flex flex-col justify-between gap-4">
            {/* Unit Brand Title Header */}
            <div className="w-full flex items-baseline justify-between border-b border-zinc-700/60 pb-2">
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-slate-100 font-sans">
                  Pitchly <span className="text-xs font-mono font-normal text-emerald-400 ml-1">GT-200</span>
                </h2>
                <p className="text-[9px] font-mono text-zinc-400 tracking-widest uppercase">GRAPHIC VOCAL TUNER</p>
              </div>
              <span className="text-xs font-black font-mono tracking-widest text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded bg-emerald-950/40">
                PITCHLY
              </span>
            </div>

            {/* Retro LCD Display & Gauge */}
            <div className="flex flex-col gap-4 my-auto">
              <TunerGauge
                cents={displayPitch.cents}
                tuningStatus={displayPitch.tuningStatus}
                hasSignal={isPitchAvailable}
                isHeld={isHeld}
              />

              <NoteDisplay
                pitchDetails={displayPitch}
                hasSignal={isPitchAvailable}
                isHeld={isHeld}
              />
            </div>

            {/* Bottom Screen-printed Label */}
            <div className="w-full flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800">
              <span>PITCHLY YIN DSP ENGINE</span>
              <span>12-TET EQUAL TEMPERAMENT</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
