import { describe, it, expect } from 'vitest';
import { getPitchDetails } from '../pitchMath';
import { detectPitchYIN } from '../yin';

describe('Pitch Math Utilities', () => {
  it('correctly calculates details for A4 (440 Hz)', () => {
    const details = getPitchDetails(440, 440);
    expect(details.midiNote).toBe(69);
    expect(details.fullNote).toBe('A4');
    expect(details.targetFrequency).toBe(440);
    expect(details.cents).toBe(0);
    expect(details.tuningStatus).toBe('in-tune');
  });

  it('correctly calculates details for prompt example 148.1 Hz vs 146.83 Hz target', () => {
    // 148.1 Hz is slightly sharp of D3 (146.83 Hz)
    const details = getPitchDetails(148.1, 440);
    expect(details.noteName).toBe('D');
    expect(details.targetFrequency).toBeCloseTo(146.83, 1);
    expect(details.cents).toBeCloseTo(15, 0);
    expect(details.tuningStatus).toBe('sharp');
  });

  it('handles negative cents (flat pitch)', () => {
    // D3 is 146.83 Hz. Test 145.5 Hz
    const details = getPitchDetails(145.5, 440);
    expect(details.noteName).toBe('D');
    expect(details.cents).toBeLessThan(0);
    expect(details.tuningStatus).toBe('flat');
  });
});

describe('YIN Pitch Detection Algorithm', () => {
  function generateSineWave(freq: number, sampleRate: number = 44100, durationSec: number = 0.1): Float32Array {
    const numSamples = Math.floor(sampleRate * durationSec);
    const buffer = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      buffer[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
    }
    return buffer;
  }

  it('accurately detects A4 (440 Hz) sine wave', () => {
    const sampleRate = 44100;
    const buffer = generateSineWave(440, sampleRate, 0.1);
    const result = detectPitchYIN(buffer, sampleRate);
    expect(result.pitch).toBeGreaterThan(0);
    expect(result.pitch).toBeCloseTo(440, 1);
    expect(result.clarity).toBeGreaterThan(0.85);
  });

  it('accurately detects D3 / 146.83 Hz sine wave', () => {
    const sampleRate = 44100;
    const buffer = generateSineWave(146.83, sampleRate, 0.1);
    const result = detectPitchYIN(buffer, sampleRate);
    expect(result.pitch).toBeGreaterThan(0);
    expect(result.pitch).toBeCloseTo(146.83, 1);
    expect(result.clarity).toBeGreaterThan(0.85);
  });

  it('returns -1 for silence / zero buffer', () => {
    const buffer = new Float32Array(4096);
    const result = detectPitchYIN(buffer, 44100);
    expect(result.pitch).toBe(-1);
  });
});
