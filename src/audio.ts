import type { FlightState } from './session';

type Cue = 'landmark' | 'complete' | 'incomplete' | 'crash';

const cues: Record<Cue, readonly number[]> = {
  landmark: [660, 880],
  complete: [523, 659, 784],
  incomplete: [440, 349],
  crash: [170, 105],
};

export class GameAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private engine: OscillatorNode | null = null;
  private muted = false;

  get isMuted(): boolean {
    return this.muted;
  }

  start(): void {
    if (this.context) {
      void this.context.resume();
      return;
    }
    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = this.muted ? 0 : 0.24;
    master.connect(context.destination);

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 250;
    const engineGain = context.createGain();
    engineGain.gain.value = 0;
    const engine = context.createOscillator();
    engine.type = 'sawtooth';
    engine.frequency.value = 65;
    engine.connect(filter);
    filter.connect(engineGain);
    engineGain.connect(master);
    engine.start();

    this.context = context;
    this.master = master;
    this.engineGain = engineGain;
    this.engine = engine;
    void context.resume();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.24, this.context.currentTime, 0.02);
    }
    return this.muted;
  }

  update(state: FlightState): void {
    if (!this.context || !this.engineGain || !this.engine) return;
    const now = this.context.currentTime;
    const playing = !state.paused && !state.result;
    this.engineGain.gain.setTargetAtTime(
      playing ? 0.07 + state.throttle * 0.17 + state.speed / 400 : 0,
      now,
      0.07,
    );
    this.engine.frequency.setTargetAtTime(60 + state.throttle * 65 + state.speed * 1.6, now, 0.08);
  }

  cue(kind: Cue): void {
    if (!this.context || !this.master || this.muted) return;
    const context = this.context;
    const master = this.master;
    const now = context.currentTime;
    cues[kind].forEach((frequency, index) => {
      const start = now + index * (kind === 'crash' ? 0.1 : 0.14);
      const duration = kind === 'crash' ? 0.28 : 0.18;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = kind === 'crash' ? 'sawtooth' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      if (kind === 'crash')
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.65, start + duration);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(kind === 'crash' ? 0.42 : 0.28, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + duration);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
  }
}
