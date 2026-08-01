// Simple Web Audio synth for game sounds
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

export function initAudio() {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume: number = 0.1, detune: number = 0) {
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playJump() {
  playTone(400, 0.12, 'square', 0.08);
  playTone(600, 0.08, 'square', 0.05);
}

export function playDeath() {
  playTone(200, 0.3, 'sawtooth', 0.12);
  playTone(150, 0.4, 'sawtooth', 0.08);
  setTimeout(() => playTone(100, 0.3, 'sawtooth', 0.06), 100);
}

export function playOrb() {
  playTone(800, 0.1, 'sine', 0.08);
  setTimeout(() => playTone(1200, 0.1, 'sine', 0.06), 50);
}

export function playStart() {
  playTone(440, 0.1, 'square', 0.06);
  setTimeout(() => playTone(550, 0.1, 'square', 0.06), 80);
  setTimeout(() => playTone(660, 0.15, 'square', 0.08), 160);
}
