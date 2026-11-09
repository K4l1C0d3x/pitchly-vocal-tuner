export interface YINResult {
  pitch: number; // Fundamental frequency in Hz (-1 if unpitched/below threshold)
  clarity: number; // Confidence score between 0 and 1
}

/**
 * YIN Pitch Detection Algorithm
 *
 * @param buffer Float32Array containing time-domain PCM audio samples
 * @param sampleRate Audio sample rate (e.g. 44100 Hz or 48000 Hz)
 * @param threshold Absolute threshold for YIN candidate selection (default 0.15)
 * @param minFreq Minimum frequency to detect in Hz (default 50 Hz, e.g. G1)
 * @param maxFreq Maximum frequency to detect in Hz (default 1200 Hz, e.g. D6)
 */
export function detectPitchYIN(
  buffer: Float32Array<any> | ArrayLike<number>,
  sampleRate: number,
  threshold: number = 0.15,
  minFreq: number = 50,
  maxFreq: number = 1200
): YINResult {
  const bufferSize = buffer.length;

  // 1. Calculate Signal RMS (Energy check to filter out silence)
  let sumSquare = 0;
  for (let i = 0; i < bufferSize; i++) {
    sumSquare += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sumSquare / bufferSize);
  if (rms < 0.005) {
    return { pitch: -1, clarity: 0 };
  }

  // Determine lag limits based on target frequency range
  // minTau corresponding to maxFreq, maxTau corresponding to minFreq
  const minTau = Math.floor(sampleRate / maxFreq);
  const maxTau = Math.min(Math.floor(sampleRate / minFreq), Math.floor(bufferSize / 2));

  if (minTau >= maxTau || maxTau >= bufferSize) {
    return { pitch: -1, clarity: 0 };
  }

  const yinBuffer = new Float32Array(maxTau + 1);

  // 2. Difference Function d(tau)
  for (let tau = 1; tau <= maxTau; tau++) {
    let diffSum = 0;
    const limit = bufferSize - tau;
    for (let i = 0; i < limit; i++) {
      const delta = buffer[i] - buffer[i + tau];
      diffSum += delta * delta;
    }
    yinBuffer[tau] = diffSum;
  }

  // 3. Cumulative Mean Normalized Difference Function d'(tau)
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] = (yinBuffer[tau] * tau) / runningSum;
  }

  // 4. Absolute Threshold Search
  let tauFound = -1;

  for (let tau = minTau; tau <= maxTau; tau++) {
    if (yinBuffer[tau] < threshold) {
      // Find local minimum around this tau
      while (tau + 1 <= maxTau && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauFound = tau;
      break;
    }
  }

  // If no tau was below threshold, find global minimum in tau range
  if (tauFound === -1) {
    let globalMinVal = Infinity;
    for (let tau = minTau; tau <= maxTau; tau++) {
      if (yinBuffer[tau] < globalMinVal) {
        globalMinVal = yinBuffer[tau];
        tauFound = tau;
      }
    }
  }

  if (tauFound <= 0 || tauFound >= maxTau) {
    return { pitch: -1, clarity: 0 };
  }

  // 5. Parabolic Interpolation for Sub-sample Accuracy
  let betterTau: number;
  const x0 = tauFound < 1 ? tauFound : tauFound - 1;
  const x2 = tauFound + 1 < maxTau ? tauFound + 1 : tauFound;

  if (x0 === tauFound) {
    betterTau = yinBuffer[tauFound] < yinBuffer[x2] ? tauFound : x2;
  } else if (x2 === tauFound) {
    betterTau = yinBuffer[tauFound] < yinBuffer[x0] ? tauFound : x0;
  } else {
    const s0 = yinBuffer[x0];
    const s1 = yinBuffer[tauFound];
    const s2 = yinBuffer[x2];
    
    // Parabolic vertex formula: tau + (s2 - s0) / (2 * (2 * s1 - s2 - s0))
    const denominator = 2 * (2 * s1 - s2 - s0);
    if (denominator !== 0) {
      betterTau = tauFound + (s2 - s0) / denominator;
    } else {
      betterTau = tauFound;
    }
  }

  // 6. Calculate frequency and clarity
  const pitch = sampleRate / betterTau;
  const clarity = Math.max(0, Math.min(1, 1 - yinBuffer[tauFound]));

  // Basic sanity validation
  if (pitch < minFreq || pitch > maxFreq || clarity < 0.5) {
    return { pitch: -1, clarity };
  }

  return { pitch, clarity };
}
