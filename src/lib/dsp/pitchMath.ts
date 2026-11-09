export interface PitchDetails {
  frequency: number;
  midiNote: number;
  noteName: string;
  octave: number;
  fullNote: string;
  targetFrequency: number;
  cents: number;
  tuningStatus: 'flat' | 'in-tune' | 'sharp';
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Calculates note details, target frequency, and cents deviation for a given frequency.
 * Uses 12-tone equal temperament (12-TET).
 *
 * @param frequency Detected fundamental frequency in Hz
 * @param referenceA4 Reference frequency for A4 (default 440 Hz)
 * @param inTuneThreshold Cents threshold to consider pitch "in tune" (default 5 cents)
 */
export function getPitchDetails(
  frequency: number,
  referenceA4: number = 440,
  inTuneThreshold: number = 5
): PitchDetails {
  if (frequency <= 0 || !isFinite(frequency)) {
    return {
      frequency: 0,
      midiNote: 0,
      noteName: '-',
      octave: 0,
      fullNote: '--',
      targetFrequency: 0,
      cents: 0,
      tuningStatus: 'in-tune',
    };
  }

  // n = 69 + 12 * log2(f / referenceA4)
  const exactMidi = 69 + 12 * Math.log2(frequency / referenceA4);
  const midiNote = Math.round(exactMidi);

  // Note index (0 = C, 1 = C#, ..., 11 = B)
  const noteIndex = ((midiNote % 12) + 12) % 12;
  const noteName = NOTE_NAMES[noteIndex];

  // Octave calculation (MIDI 60 is C4, MIDI 69 is A4)
  const octave = Math.floor(midiNote / 12) - 1;
  const fullNote = `${noteName}${octave}`;

  // Target frequency f_target = referenceA4 * 2^((midiNote - 69) / 12)
  const targetFrequency = referenceA4 * Math.pow(2, (midiNote - 69) / 12);

  // Cents deviation = 1200 * log2(frequency / targetFrequency)
  const cents = 1200 * Math.log2(frequency / targetFrequency);

  let tuningStatus: 'flat' | 'in-tune' | 'sharp' = 'in-tune';
  if (cents < -inTuneThreshold) {
    tuningStatus = 'flat';
  } else if (cents > inTuneThreshold) {
    tuningStatus = 'sharp';
  }

  return {
    frequency: Number(frequency.toFixed(1)),
    midiNote,
    noteName,
    octave,
    fullNote,
    targetFrequency: Number(targetFrequency.toFixed(2)),
    cents: Number(cents.toFixed(1)),
    tuningStatus,
  };
}
