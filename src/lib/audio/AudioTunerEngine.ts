import { detectPitchYIN } from '@/lib/dsp/yin';
import { getPitchDetails, PitchDetails } from '@/lib/dsp/pitchMath';

export interface TunerFrameData {
  pitchDetails: PitchDetails;
  clarity: number;
  rms: number;
  isListening: boolean;
  activeSource: 'mic' | 'generator' | 'off';
}

export type TunerCallback = (data: TunerFrameData) => void;

export class AudioTunerEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private generatorOsc: OscillatorNode | null = null;
  private generatorGain: GainNode | null = null;

  private animFrameId: number | null = null;
  private buffer: Float32Array = new Float32Array(4096);
  private onFrame: TunerCallback | null = null;

  private referenceA4: number = 440;
  private activeSource: 'mic' | 'generator' | 'off' = 'off';

  constructor(referenceA4: number = 440) {
    this.referenceA4 = referenceA4;
  }

  public setReferenceA4(freq: number) {
    this.referenceA4 = freq;
  }

  public setCallback(cb: TunerCallback) {
    this.onFrame = cb;
  }

  private initAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Starts listening to microphone stream.
   */
  public async startMic(): Promise<boolean> {
    try {
      this.stop(); // Stop any active generator or mic session

      const ctx = this.initAudioContext();
      
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 4096;
      this.buffer = new Float32Array(this.analyser.fftSize);

      this.micSource = ctx.createMediaStreamSource(this.micStream);
      this.micSource.connect(this.analyser);
      // We do NOT connect mic to ctx.destination to prevent feedback howl!

      this.activeSource = 'mic';
      this.startLoop();
      return true;
    } catch (err) {
      console.error('Failed to access microphone:', err);
      this.activeSource = 'off';
      return false;
    }
  }

  /**
   * Starts playing a synthetic test tone (sine wave oscillator) into the tuner.
   */
  public startTestTone(frequency: number): boolean {
    try {
      this.stop();

      const ctx = this.initAudioContext();

      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 4096;
      this.buffer = new Float32Array(this.analyser.fftSize);

      this.generatorOsc = ctx.createOscillator();
      this.generatorOsc.type = 'sine';
      this.generatorOsc.frequency.setValueAtTime(frequency, ctx.currentTime);

      this.generatorGain = ctx.createGain();
      this.generatorGain.gain.setValueAtTime(0.2, ctx.currentTime); // moderate volume

      this.generatorOsc.connect(this.generatorGain);
      this.generatorGain.connect(this.analyser);
      // Send to speaker so user can hear the test tone
      this.generatorGain.connect(ctx.destination);

      this.generatorOsc.start();
      this.activeSource = 'generator';
      this.startLoop();
      return true;
    } catch (err) {
      console.error('Failed to start test tone generator:', err);
      this.activeSource = 'off';
      return false;
    }
  }

  /**
   * Updates test tone frequency while generator is running.
   */
  public setTestToneFrequency(freq: number) {
    if (this.generatorOsc && this.audioCtx && this.activeSource === 'generator') {
      this.generatorOsc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    }
  }

  /**
   * Stops microphone or generator stream.
   */
  public stop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }

    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }

    if (this.generatorOsc) {
      try {
        this.generatorOsc.stop();
        this.generatorOsc.disconnect();
      } catch {}
      this.generatorOsc = null;
    }

    if (this.generatorGain) {
      this.generatorGain.disconnect();
      this.generatorGain = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    this.activeSource = 'off';

    if (this.onFrame) {
      this.onFrame({
        pitchDetails: getPitchDetails(0, this.referenceA4),
        clarity: 0,
        rms: 0,
        isListening: false,
        activeSource: 'off',
      });
    }
  }

  private startLoop() {
    const processFrame = () => {
      if (!this.analyser || !this.audioCtx || this.activeSource === 'off') {
        return;
      }

      this.analyser.getFloatTimeDomainData(this.buffer as any);
      const sampleRate = this.audioCtx.sampleRate;

      // Calculate RMS for volume meter
      let sumSquare = 0;
      for (let i = 0; i < this.buffer.length; i++) {
        sumSquare += this.buffer[i] * this.buffer[i];
      }
      const rms = Math.sqrt(sumSquare / this.buffer.length);

      // Run YIN Pitch Detection
      const yinResult = detectPitchYIN(this.buffer as any, sampleRate);
      const pitchDetails = getPitchDetails(yinResult.pitch, this.referenceA4);

      if (this.onFrame) {
        this.onFrame({
          pitchDetails,
          clarity: yinResult.clarity,
          rms,
          isListening: true,
          activeSource: this.activeSource,
        });
      }

      this.animFrameId = requestAnimationFrame(processFrame);
    };

    processFrame();
  }

  public getActiveSource() {
    return this.activeSource;
  }
}
