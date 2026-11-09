# Pitchly

Pitchly is a low-latency live vocal and instrument tuner application built with Next.js, TypeScript, the Web Audio API, and the YIN Digital Signal Processing (DSP) algorithm. It provides real-time fundamental frequency ($f_0$) tracking, semitone mapping under 12-tone equal temperament (12-TET), cents deviation measurement, and decaying note retention within an industrial hardware aesthetic.

For complete mathematical proofs, step-by-step worked derivations, and detailed DSP pipeline explanations, consult the [Full Technical Documentation](DOCUMENTATION.md).

---

## System Architecture

Audio is captured continuously from the hardware microphone, analyzed in the time domain, evaluated against harmonic thresholds, mapped to musical intervals, and rendered at 60 FPS:

```
[Audio Input] 
      |
      v
[Web Audio API AudioContext] (44.1 / 48.0 kHz)
      |
      v
[AnalyserNode] (4096-Sample Float32 PCM Buffer)
      |
      v
[YIN DSP Pitch Detector]
   - RMS Energy Noise Gate
   - Difference Function d(tau)
   - Cumulative Mean Normalized Difference d'(tau)
   - Absolute Thresholding (th = 0.15)
   - Parabolic Sub-sample Peak Interpolation
      |
      v
[12-TET Mathematical Mapper]
   - MIDI Note Number: round(69 + 12 * log2(f / A4))
   - Target Frequency: A4 * 2^((n - 69) / 12)
   - Cents Deviation: 1200 * log2(f / f_target)
      |
      v
[Pitch Retention State Machine]
   - Live Attack Tracking -> Release Latch -> Onset Replacement
      |
      v
[Hardware Dashboard]
   - Vector SVG Arc Needle Gauge + 7-Segment Retro LCD Readout
```

---

## Key Features

- **True DSP Fundamental Pitch Extraction**: Avoids static FFT lookup approximations by implementing the YIN autocorrelation algorithm with parabolic sub-sample peak interpolation.
- **12-Tone Equal Temperament (12-TET)**: Converts raw Hertz values into standard semitone notation with calibrated concert pitch A4 reference (adjustable between 430 Hz and 450 Hz).
- **Pitch Retention (Peak Latch)**: Designed for acoustic instruments and pianos where sounds decay rapidly; holds the detected pitch upon key release and updates automatically when a new note is played.
- **Vector SVG Gauge**: High-precision vector needle calibrated across a -50 to +50 cents arc with precision coordinate rounding to eliminate SSR/hydration mismatches.
- **Integrated Test Pitch Generator**: Built-in synthetic sine wave oscillator supporting preset microtonal checks (such as 148.1 Hz / D3 +15 cents sharp) and continuous frequency adjustment.
- **Industrial Hardware Aesthetic**: Dark charcoal metallic dual-chassis layout inspired by Boss stompboxes and graphic equalizers (Pocket GT and GT-200).

---

## Core Mathematical Formulation

### 1. Fundamental Frequency to Semitone Number

$$n_{\text{midi}} = \text{round}\left(69 + 12 \cdot \log_2\left(\frac{f}{A_4}\right)\right)$$

### 2. Exact Target Frequency

$$f_{\text{target}} = A_4 \cdot 2^{\frac{n_{\text{midi}} - 69}{12}}$$

### 3. Cents Deviation

$$cents = 1200 \cdot \log_2\left(\frac{f}{f_{\text{target}}}\right)$$

- **In Tune**: $|cents| \le 5\text{ cents}$
- **Flat**: $cents < -5\text{ cents}$
- **Sharp**: $cents > +5\text{ cents}$

### 4. YIN Sub-Sample Refinement

Discrete candidate lag $\tau$ is refined via parabolic interpolation over points $s_0 = d'(\tau - 1)$, $s_1 = d'(\tau)$, and $s_2 = d'(\tau + 1)$:

$$\tau_{\text{refined}} = \tau + \frac{s_2 - s_0}{2 (2 s_1 - s_2 - s_0)}$$

$$f_0 = \frac{f_s}{\tau_{\text{refined}}}$$

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router) |
| **User Interface** | React 19, TypeScript, Tailwind CSS 4 |
| **Audio & DSP** | Web Audio API (`AudioContext`, `AnalyserNode`), Custom YIN Algorithm |
| **Package Manager** | pnpm |
| **Testing** | Vitest |

---

## Quickstart

### Prerequisites

- Node.js version 20 or higher
- pnpm version 10 or higher

### Installation & Execution

1. Clone the repository:
   ```bash
   git clone https://github.com/K4l1C0d3x/pitchly-vocal-tuner.git
   cd pitchly-vocal-tuner
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the automated test suite:
   ```bash
   pnpm test
   ```

4. Start the local development server:
   ```bash
   pnpm dev
   ```

5. Open `http://localhost:3000` in a Web Audio API-compliant browser.

---

## Verification

The unit test suite validates pitch calculation accuracy and noise rejection:

- Reference A4 (440.0 Hz) mapping and 0-cent target verification.
- Microtonal benchmark test (148.1 Hz mapping to D3, 146.83 Hz target, +14.9 cents sharp).
- YIN DSP fundamental estimation on synthetic sine wave buffers.
- Silence and low-energy noise floor rejection.

Run tests:
```bash
pnpm test
```

---

## Documentation

For the in-depth architectural manual, complete equations, acoustic derivations, and worked calculations, refer to [DOCUMENTATION.md](DOCUMENTATION.md).
