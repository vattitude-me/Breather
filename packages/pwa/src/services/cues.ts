let ctx: AudioContext | null = null;

export function chime(frequency = 432) {
  try {
    ctx ??= new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.5);
  } catch { /* audio unavailable */ }
}

export const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

export function pulse() {
  if (canVibrate) navigator.vibrate(35);
}
