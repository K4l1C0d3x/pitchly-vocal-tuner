# Pitchly — Full Technical Documentation & Mathematical Theory

Pitchly is a high-precision, low-latency pitch detection engine engineered with the Web Audio API, TypeScript, and the YIN Digital Signal Processing (DSP) algorithm. The platform is designed for vocalists, instrumentalists, and piano technicians requiring fundamental frequency identification, semitone classification under 12-tone equal temperament (12-TET), and cents deviation measurement.

---

## Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Acoustic and Mathematical Foundations](#2-acoustic-and-mathematical-foundations)
   - [12-Tone Equal Temperament (12-TET)](#21-12-tone-equal-temperament-12-tet)
   - [Core Equations](#22-core-equations)
   - [Step-by-Step Worked Calculation](#23-step-by-step-worked-calculation)
3. [Digital Signal Processing: YIN Pitch Detection Algorithm](#3-digital-signal-processing-yin-pitch-detection-algorithm)
   - [RMS Energy Filter](#step-1-rms-energy-filter)
   - [Difference Function](#step-2-difference-function)
   - [Cumulative Mean Normalized Difference Function](#step-3-cumulative-mean-normalized-difference-function)
   - [Absolute Thresholding](#step-4-absolute-thresholding)
   - [Sub-Sample Parabolic Interpolation](#step-5-sub-sample-parabolic-interpolation)
   - [Fundamental Frequency and Clarity Computation](#step-6-fundamental-frequency-and-clarity-computation)
4. [Acoustic Decay and Pitch Retention System](#4-acoustic-decay-and-pitch-retention-system)
5. [Vector SVG Geometry and Hydration Synchronization](#5-vector-svg-geometry-and-hydration-synchronization)
6. [Industrial Hardware Design System](#6-industrial-hardware-design-system)
7. [Technology Stack](#7-technology-stack)
8. [Directory Structure](#8-directory-structure)
9. [Installation and Local Execution](#9-installation-and-local-execution)
10. [Automated Testing and Verification](#10-automated-testing-and-verification)

---

## 1. Architectural Overview

Pitchly captures continuous audio input directly from the hardware input stream using the Web Audio API, processes the raw floating-point pulse-code modulation (PCM) time-domain signal at 60 frames per second, extracts the fundamental frequency via autocorrelation-based DSP, maps the frequency to standard musical scale metrics, and renders the output via a synchronized vector gauge.

```
+-----------------------------------------------------------------------+
|                             Audio Source                              |
|          (Hardware Microphone Stream or Synthetic Test Oscillator)     |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                       Web Audio API AudioContext                      |
|                  44.1 kHz / 48.0 kHz Sample Frequency                 |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                    AnalyserNode (Float32Array Buffer)                 |
|                   Buffer Size = 4096 Samples per Frame                |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                       YIN Pitch Detection Engine                      |
|   RMS Energy Filter -> Difference Function -> Cumulative Mean Normalization   |
|         -> Absolute Thresholding -> Parabolic Sub-sample Peak Refinement      |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                         12-TET Pitch Calculator                       |
|        Exact MIDI Number -> Note Name & Octave -> Target Frequency     |
|                         -> Cents Deviation Calculation                |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                  Pitch Retention (Peak Latch State Machine)           |
|      Retains decaying piano notes; clears on subsequent key attack    |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                     Hardware Dashboard Interface                      |
|      Vector SVG Needle Gauge + 7-Segment LCD Note Readout Display     |
+-----------------------------------------------------------------------+
```

---

## 2. Acoustic and Mathematical Foundations

### 2.1 12-Tone Equal Temperament (12-TET)

Standard Western music divides each octave into 12 logarithmic semitones. Each semitone ratio is defined by the twelfth root of two:

$$r = 2^{1/12} \approx 1.059463094359$$

Pitchly anchors all tuning calculations to concert pitch A4, standard at 440.0 Hz, with support for adjustable reference calibrations ranging from 430.0 Hz to 450.0 Hz.

### 2.2 Core Equations

#### 1. Frequency of an Arbitrary MIDI Note Number ($n$)

Given MIDI note number $n$ (where $A_4 = 69$):

$$f(n) = A_4 \cdot 2^{\frac{n - 69}{12}}$$

#### 2. MIDI Note Derivation from Detected Fundamental Frequency ($f$)

Given fundamental frequency $f$ in Hertz:

$$\text{exactMidi} = 69 + 12 \cdot \log_2\left(\frac{f}{A_4}\right)$$

$$n_{\text{midi}} = \text{round}(\text{exactMidi})$$

#### 3. Note Name and Octave Identification

The semitone index within the octave is derived by modulo arithmetic:

$$\text{index} = (n_{\text{midi}} \bmod 12 + 12) \bmod 12$$

$$\text{Mapping: } [0 \to \text{C}, 1 \to \text{C\#}, 2 \to \text{D}, 3 \to \text{D\#}, 4 \to \text{E}, 5 \to \text{F}, 6 \to \text{F\#}, 7 \to \text{G}, 8 \to \text{G\#}, 9 \to \text{A}, 10 \to \text{A\#}, 11 \to \text{B}]$$

The octave index is computed as:

$$\text{Octave} = \left\lfloor \frac{n_{\text{midi}}}{12} \right\rfloor - 1$$

#### 4. Exact Target Frequency Calculation

The exact target frequency of the closest semitone is:

$$f_{\text{target}} = A_4 \cdot 2^{\frac{n_{\text{midi}} - 69}{12}}$$

#### 5. Cents Deviation Calculation

One semitone contains 100 cents; an octave contains 1200 cents. The logarithmic deviation from the target pitch in cents is:

$$cents = 1200 \cdot \log_2\left(\frac{f}{f_{\text{target}}}\right)$$

Tuning classification is structured into three discrete intervals:

- **In Tune**: $|cents| \le 5.0\text{ cents}$
- **Flat**: $cents < -5.0\text{ cents}$
- **Sharp**: $cents > +5.0\text{ cents}$

### 2.3 Step-by-Step Worked Calculation

**Scenario**: A musical tone is detected at fundamental frequency $f = 148.1\text{ Hz}$ under reference calibration $A_4 = 440.0\text{ Hz}$.

1. **Calculate the fractional MIDI value**:

   $$\text{exactMidi} = 69 + 12 \cdot \log_2\left(\frac{148.1}{440.0}\right)$$

   $$\log_2\left(\frac{148.1}{440.0}\right) = \log_2(0.3365909) \approx -1.570766$$

   $$\text{exactMidi} = 69 + 12 \cdot (-1.570766) = 69 - 18.84919 = 50.15081$$

2. **Determine the nearest integer semitone**:

   $$n_{\text{midi}} = \text{round}(50.15081) = 50$$

3. **Derive Note Name and Octave**:

   $$\text{index} = 50 \bmod 12 = 2 \implies \text{D}$$

   $$\text{Octave} = \left\lfloor \frac{50}{12} \right\rfloor - 1 = 4 - 1 = 3 \implies \text{D3}$$

4. **Compute Target Frequency**:

   $$f_{\text{target}} = 440.0 \cdot 2^{\frac{50 - 69}{12}} = 440.0 \cdot 2^{\frac{-19}{12}} \approx 146.8324\text{ Hz}$$

5. **Compute Cents Deviation**:

   $$cents = 1200 \cdot \log_2\left(\frac{148.1}{146.8324}\right) = 1200 \cdot \log_2(1.008633) \approx +14.9\text{ cents}$$

6. **Final Classification**:

   $$\mathbf{148.1\text{ Hz} \implies \text{D3} \implies \text{Target: } 146.83\text{ Hz} \implies +14.9\text{ cents (Sharp)}}$$

---

## 3. Digital Signal Processing: YIN Pitch Detection Algorithm

Pitchly implements the YIN algorithm (de Cheveigné and Kawahara, 2002), an autocorrelation-based DSP technique that optimizes time-domain period estimation while mitigating harmonic octave errors.

### Step 1: RMS Energy Filter

To prevent CPU cycles on ambient noise and zero-input silence, the root mean square (RMS) amplitude is evaluated over buffer size $W = 4096$:

$$\text{RMS} = \sqrt{\frac{1}{W} \sum_{j=0}^{W-1} x[j]^2}$$

If $\text{RMS} < 0.005$, the frame is marked as silence ($\text{pitch} = -1$), halting further processing.

### Step 2: Difference Function

The difference function $d(\tau)$ calculates the square difference between signal $x$ and its time-lagged counterpart $x(t + \tau)$ for lag parameters $\tau \in [\tau_{\min}, \tau_{\max}]$:

$$d(\tau) = \sum_{j=0}^{W - \tau - 1} (x[j] - x[j + \tau])^2$$

Lags are constrained to physical musical limits:

$$\tau_{\min} = \left\lfloor \frac{f_s}{f_{\max}} \right\rfloor, \quad \tau_{\max} = \min\left(\left\lfloor \frac{f_s}{f_{\min}} \right\rfloor, \left\lfloor \frac{W}{2} \right\rfloor\right)$$

Where $f_{\min} = 50.0\text{ Hz}$, $f_{\max} = 1200.0\text{ Hz}$, and $f_s$ is the audio context sample rate (typically 44100 Hz or 48000 Hz).

### Step 3: Cumulative Mean Normalized Difference Function

Standard autocorrelation functions frequently select false harmonics at zero lag ($\tau = 0$) or higher octave multiples. The cumulative mean normalized difference function $d'(\tau)$ addresses this:

$$d'(0) = 1$$

$$d'(\tau) = \frac{d(\tau)}{\frac{1}{\tau} \sum_{j=1}^{\tau} d(j)}$$

This normalizes the function so it begins at 1.0 at zero lag and drops toward zero as strong periodic correlation occurs.

### Step 4: Absolute Thresholding

The algorithm traverses $d'(\tau)$ from $\tau_{\min}$ to $\tau_{\max}$ to locate the first local minimum falling below the absolute threshold:

$$\text{threshold} = 0.15$$

When a value below threshold is encountered, the search continues locally until $d'(\tau + 1) \ge d'(\tau)$ to capture the local dip minimum. If no value drops below threshold, the global minimum across the lag range is selected as a secondary candidate.

### Step 5: Sub-Sample Parabolic Interpolation

Because sampling occurs at discrete intervals, the true continuous period rarely coincides with an integer sample point. Parabolic interpolation fits a curve through discrete points $(\tau - 1, d'(\tau - 1))$, $(\tau, d'(\tau))$, and $(\tau + 1, d'(\tau + 1))$:

$$\tau_{\text{refined}} = \tau + \frac{s_2 - s_0}{2 (2 s_1 - s_2 - s_0)}$$

Where:

$$s_0 = d'(\tau - 1), \quad s_1 = d'(\tau), \quad s_2 = d'(\tau + 1)$$

### Step 6: Fundamental Frequency and Clarity Computation

The fundamental frequency $f_0$ and pitch clarity metric are computed from the interpolated lag:

$$f_0 = \frac{f_s}{\tau_{\text{refined}}}$$

$$\text{Clarity} = \max\left(0, \min\left(1, 1 - d'(\tau)\right)\right)$$

Frames with $\text{Clarity} < 0.50$ or frequencies outside $[50\text{ Hz}, 1200\text{ Hz}]$ are discarded as non-tonal noise.

---

## 4. Acoustic Decay and Pitch Retention System

### Problem Formulation

Acoustic instruments, such as grand and upright pianos, emit an initial sharp transient attack followed by a decaying resonant body. Standard real-time pitch detectors reset immediately to zero or null values as soon as signal energy decreases below the noise gate threshold. This behavior prevents musicians and tuners from inspecting the pitch characteristics of a struck key once it is released.

### Solution: Peak Latch State Machine

Pitchly incorporates a retention latch layer within the frame dispatch cycle:

```typescript
if (activeSource !== 'off' && pitchDetails.frequency > 0 && clarity > 0.45) {
  setLastDetectedPitch(pitchDetails);
  setIsLiveSignal(true);
} else {
  setIsLiveSignal(false);
}
```

1. **Active Resonance Phase**: While the note vibrates above threshold, the engine streams real-time cents and frequency fluctuations at 60 FPS.
2. **Key Release Phase**: Once energy decays, the engine retains the terminal frequency, target pitch, note designation, and needle position, displaying a visual retention state indicator.
3. **Subsequent Attack Phase**: Upon striking another key, the latch resets automatically and binds to the newly incoming fundamental frequency without manual clearing.

---

## 5. Vector SVG Geometry and Hydration Synchronization

### Vector Coordinate Transformation

The analog tuner gauge needle is rendered within a normalized coordinate system:

$$\text{viewBox} = (0, 0, 200, 100)$$

The gauge pivot is situated at $(X_0, Y_0) = (100, 88)$. Given deviation $cents \in [-50, +50]$, the angular deflection in radians is:

$$\theta = \left(\frac{cents}{50} \cdot 60^\circ - 90^\circ\right) \cdot \frac{\pi}{180^\circ}$$

The terminal needle coordinates for radius $R = 72$ are computed trigonometrically:

$$X_2 = 100 + R \cdot \cos(\theta)$$

$$Y_2 = 88 + R \cdot \sin(\theta)$$

### Hydration Mismatch Resolution

In universal React and Next.js applications, server-side rendering (Node.js) and client runtime hydration (browser V8 engine) serialize 64-bit floating-point numbers with minor representation divergences in their lowest-order decimal digits. This divergence triggers DOM attribute hydration warnings during hydration.

Pitchly standardizes all SVG geometric coordinates to three decimal places:

```typescript
const x1 = Number((100 + innerR * Math.cos(angleRad)).toFixed(3));
const y1 = Number((88 + innerR * Math.sin(angleRad)).toFixed(3));
const x2 = Number((100 + outerR * Math.cos(angleRad)).toFixed(3));
const y2 = Number((88 + outerR * Math.sin(angleRad)).toFixed(3));
```

This enforces strict character-level parity across server-rendered HTML payloads and client DOM hydration.

---

## 6. Industrial Hardware Design System

Pitchly features an interface inspired by tactile analog stompboxes and digital graphic equalizer equipment (Boss Pocket GT and Boss GT-200):

- **Left Chassis Unit (Pitchly GT - Control and Signal Generation)**:
  - Textured matte charcoal casing (`#1f2329` to `#2b3038`).
  - Tactile rotary potentiometer with perimeter indicator notch for reference pitch tuning ($430\text{ Hz}$ to $450\text{ Hz}$).
  - Real-time RMS audio input meter.
  - Test tone generator with presets for $148.1\text{ Hz}$ (D3 Sharp), $146.83\text{ Hz}$ (D3 Target), $440.0\text{ Hz}$ (A4), and $261.63\text{ Hz}$ (Middle C), alongside a continuous variable slider.
  - Chrome heavy-duty footswitch with mint-green status LED for microphone activation and bypass.
- **Right Chassis Unit (Pitchly GT-200 - Display and Visualization)**:
  - Vector SVG arc gauge calibrated from $-50$ to $+50$ cents with dynamic needle deflection.
  - High-contrast 7-segment digital display showing note designation, detected frequency, target frequency, and cents offset.

---

## 7. Technology Stack

| Layer | Component | Specification |
| :--- | :--- | :--- |
| **Framework** | Next.js | App Router, Server and Client Components |
| **Runtime Library** | React | React 19 |
| **Language** | TypeScript | Strict configuration, ES2022 target |
| **Styling** | Tailwind CSS | Version 4 PostCSS integration with custom hardware shaders |
| **Audio Core** | Web Audio API | `AudioContext`, `AnalyserNode`, `MediaStreamAudioSourceNode` |
| **DSP Engine** | Custom TypeScript | YIN autocorrelation algorithm implementation |
| **Package Manager** | pnpm | Hard-linked package resolution and dependency isolation |
| **Test Runner** | Vitest | Unit verification of mathematical and DSP routines |

---

## 8. Directory Structure

```
vocal pitch/
├── DOCUMENTATION.md               # Complete reference manual and mathematical derivations
├── README.md                      # Overview and quickstart guide
├── next.config.mjs                # Next.js configuration
├── package.json                   # Project scripts and dependencies
├── pnpm-lock.yaml                 # Locked dependency tree
├── postcss.config.js              # PostCSS plugin definitions
├── tsconfig.json                  # Strict TypeScript compiler options
└── src/
    ├── app/
    │   ├── globals.css            # Base styles and hardware chassis classes
    │   ├── layout.tsx             # Root document layout and metadata
    │   └── page.tsx               # Main dual-chassis hardware console view
    ├── components/
    │   ├── NoteDisplay.tsx        # 7-segment digital LCD readout component
    │   ├── TestToneGenerator.tsx  # Synthetic oscillator signal generator
    │   ├── TunerControls.tsx      # Footswitch, rotary knob, and input meter
    │   └── TunerGauge.tsx         # Vector SVG arc gauge and needle
    └── lib/
        ├── audio/
        │   └── AudioTunerEngine.ts # Web Audio API hardware session controller
        └── dsp/
            ├── __tests__/
            │   └── pitchDetection.test.ts # Vitest automated test suite
            ├── pitchMath.ts       # 12-TET frequency, MIDI, and cents math
            └── yin.ts             # Time-domain YIN pitch detection algorithm
```

---

## 9. Installation and Local Execution

### Prerequisites

- Node.js (version 20.0.0 or higher)
- pnpm (version 10.0.0 or higher)

### Setup Commands

1. **Clone the repository**:
   ```bash
   git clone https://github.com/K4l1C0d3x/pitchly-vocal-tuner.git
   cd pitchly-vocal-tuner
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Execute unit test suite**:
   ```bash
   pnpm test
   ```

4. **Launch development server**:
   ```bash
   pnpm dev
   ```

5. **Compile optimized production build**:
   ```bash
   pnpm run build
   pnpm start
   ```

Open `http://localhost:3000` in a Web Audio API-compliant browser (Google Chrome, Mozilla Firefox, Microsoft Edge, or Apple Safari).

---

## 10. Automated Testing and Verification

The mathematical and signal processing modules are validated using automated unit tests with synthetic sine signals:

- **Concert Pitch Verification**: Tests exact MIDI 69 correspondence, 440.0 Hz target frequency, and zero-cent deviation for A4.
- **Microtonal Sharp Pitch Test**: Validates the $148.1\text{ Hz}$ benchmark tone, ensuring proper identification of D3, $146.83\text{ Hz}$ target frequency, and $+14.9\text{ cents}$ deviation.
- **Flat Pitch Test**: Validates negative cents derivation for $145.5\text{ Hz}$ against the D3 target.
- **YIN Sine Wave Pitch Accuracy**: Generates synthetic float arrays of pure sine waves at $440.0\text{ Hz}$ and $146.83\text{ Hz}$, asserting accuracy within $0.1\text{ Hz}$ and clarity exceeding $0.85$.
- **Silence and Zero-Vector Rejection**: Verifies that flatline zero buffers are rejected and return unpitched states without NaN exceptions.

To execute the test suite:

```bash
pnpm test
```
