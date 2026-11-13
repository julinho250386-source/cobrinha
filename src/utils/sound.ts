class SoundEffects {
  private ctx: AudioContext | null = null;
  private muted = false;

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.08,
    delay = 0
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playEat() {
    this.playTone(520, 0.08, 'triangle', 0.08, 0);
    this.playTone(720, 0.09, 'triangle', 0.07, 0.045);
  }

  playGoldenEat() {
    this.playTone(660, 0.09, 'sine', 0.09, 0);
    this.playTone(880, 0.1, 'sine', 0.09, 0.06);
    this.playTone(1174, 0.14, 'sine', 0.08, 0.12);
  }

  playLevelUp() {
    this.playTone(440, 0.1, 'triangle', 0.08, 0);
    this.playTone(554.37, 0.1, 'triangle', 0.08, 0.08);
    this.playTone(659.25, 0.12, 'triangle', 0.08, 0.16);
    this.playTone(880, 0.22, 'triangle', 0.09, 0.24);
  }

  playGameOver() {
    this.playTone(300, 0.14, 'sawtooth', 0.06, 0);
    this.playTone(220, 0.18, 'sawtooth', 0.055, 0.11);
    this.playTone(150, 0.28, 'sawtooth', 0.05, 0.24);
  }
}

export const soundFX = new SoundEffects();
