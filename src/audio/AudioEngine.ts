// Web Audio API tactile procedural sound synthesizer

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.8;
  private musicVolume: number = 0.5;
  private isUnlocked: boolean = false;

  // Pentatonic scale frequencies in Hz (C4, D4, E4, G4, A4, C5, D5, E5, G5, A5, C6)
  private readonly PENTATONIC = [
    261.63, 293.66, 329.63, 392.00, 440.00,
    523.25, 587.33, 659.25, 783.99, 880.00,
    1046.50
  ];

  constructor() {
    // Lazy initialize on first interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.isUnlocked = true;
  }

  public unlock() {
    this.initContext();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  // 1. Pick Peg (warm tactile wooden click)
  public playWoodPick() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.Q.setValueAtTime(3.0, t);

    const vol = this.sfxVolume * 0.45;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // 2. Snap Peg to Hole (satisfying wooden thud + snap)
  public playWoodSnap() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // Thump
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(180, t);
    osc1.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    gain1.gain.setValueAtTime(this.sfxVolume * 0.6, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.14);

    // Click
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(800, t);
    osc2.frequency.exponentialRampToValueAtTime(200, t + 0.04);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    gain2.gain.setValueAtTime(this.sfxVolume * 0.25, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc2.connect(filter);
    filter.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(t);
    osc2.stop(t + 0.06);
  }

  // 3. Whoosh / Tension Drag sound
  public playWhoosh() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.18, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  // 4. Crossing Resolved note (bell chime)
  public playCrossResolved(noteIdx: number = 0) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freq = this.PENTATONIC[noteIdx % this.PENTATONIC.length];

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    // Harmonic shimmer
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, t);

    const vol = this.sfxVolume * 0.35;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.5);
    osc2.stop(t + 0.5);
  }

  // 5. Rope Fully Untangled & Freed (lush harmonious chord)
  public playRopeFreed(noteIdx: number = 0, combo: number = 1) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const baseIndex = (noteIdx + Math.min(combo - 1, 4)) % (this.PENTATONIC.length - 4);
    const chordNotes = [
      this.PENTATONIC[baseIndex],
      this.PENTATONIC[baseIndex + 2],
      this.PENTATONIC[baseIndex + 4],
      this.PENTATONIC[baseIndex + 5] || this.PENTATONIC[baseIndex] * 2,
    ];

    chordNotes.forEach((freq, i) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + i * 0.05;
      const osc = this.ctx.createOscillator();
      const harmonic = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      harmonic.type = 'triangle';
      harmonic.frequency.setValueAtTime(freq * 1.5, t);

      const vol = (this.sfxVolume * 0.28) / (1 + i * 0.2);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

      osc.connect(gain);
      harmonic.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      harmonic.start(t);
      osc.stop(t + 0.9);
      harmonic.stop(t + 0.9);
    });
  }

  // 6. Cascade Step (accelerated higher chime)
  public playCascadeStep(step: number) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freq = this.PENTATONIC[Math.min(this.PENTATONIC.length - 1, 3 + step * 2)];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.38);
  }

  // 7. Tape Rewind for Undo
  public playTapeRewind() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.22);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.Q.setValueAtTime(2.0, t);

    gain.gain.setValueAtTime(this.sfxVolume * 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // 8. Invalid Move Bounce
  public playInvalidBounce() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.setValueAtTime(120, t + 0.07);

    gain.gain.setValueAtTime(this.sfxVolume * 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // 9. Victory Fanfare (melodic arpeggio)
  public playVictoryFanfare() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.00, len: 0.25 }, // C5
      { f: 659.25, d: 0.12, len: 0.25 }, // E5
      { f: 783.99, d: 0.24, len: 0.25 }, // G5
      { f: 880.00, d: 0.36, len: 0.35 }, // A5
      { f: 1046.50, d: 0.50, len: 0.90 }, // C6
      { f: 1318.51, d: 0.52, len: 0.90 }, // E6
      { f: 1567.98, d: 0.54, len: 1.10 }, // G6
    ];

    notes.forEach(({ f, d, len }) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + d;
      const osc = this.ctx.createOscillator();
      const shimmer = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(f * 2, t);

      const vol = this.sfxVolume * 0.32;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + len);

      osc.connect(gain);
      shimmer.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      shimmer.start(t);
      osc.stop(t + len + 0.05);
      shimmer.stop(t + len + 0.05);
    });
  }
}

export const audio = new AudioEngine();
