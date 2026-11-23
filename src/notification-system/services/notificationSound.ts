/**
 * Dashboard notification chime (Web Audio) — works on mobile after a user gesture unlocks audio.
 * No external mp3; synthesized tones so Hostinger static deploy stays lean.
 */

const MUTE_KEY = 'souq_notification_sound_muted';

type AlertKind = 'order' | 'customer' | 'alert';

let audioCtx: AudioContext | null = null;
let unlockBound = false;
let lastPlayAt = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AC =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    return audioCtx;
  } catch {
    return null;
  }
}

export function isNotificationSoundMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setNotificationSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* ignore quota */
  }
  try {
    window.dispatchEvent(
      new CustomEvent('souq:notification_sound_mute', { detail: { muted } }),
    );
  } catch {
    /* ignore */
  }
}

/** Call from any click/touch so iOS/Android allow later autoplay of chimes. */
export function unlockNotificationAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    // Tiny silent buffer — required unlock path on Safari / Chrome Android
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    /* ignore */
  }
}

export function ensureNotificationAudioUnlock(): () => void {
  if (typeof window === 'undefined' || unlockBound) {
    return () => undefined;
  }
  unlockBound = true;

  const unlock = () => {
    unlockNotificationAudio();
  };

  const opts: AddEventListenerOptions = { capture: true, passive: true };
  window.addEventListener('pointerdown', unlock, opts);
  window.addEventListener('touchstart', unlock, opts);
  window.addEventListener('keydown', unlock, opts);
  window.addEventListener('click', unlock, opts);

  return () => {
    window.removeEventListener('pointerdown', unlock, opts);
    window.removeEventListener('touchstart', unlock, opts);
    window.removeEventListener('keydown', unlock, opts);
    window.removeEventListener('click', unlock, opts);
    unlockBound = false;
  };
}

function tone(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  gainPeak: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(gainPeak, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

function vibrateFor(kind: AlertKind): void {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    if (kind === 'order') navigator.vibrate([90, 50, 120]);
    else if (kind === 'customer') navigator.vibrate([70, 40, 70]);
    else navigator.vibrate([60, 40, 60]);
  } catch {
    /* ignore */
  }
}

/**
 * Play a short dashboard alert chime. Safe to call often — debounced.
 */
export function playNotificationSound(kind: AlertKind = 'alert'): void {
  if (typeof window === 'undefined') return;
  if (isNotificationSoundMuted()) return;
  if (document.visibilityState === 'hidden') return;

  const now = Date.now();
  if (now - lastPlayAt < 900) return;
  lastPlayAt = now;

  unlockNotificationAudio();
  const ctx = getAudioContext();
  if (!ctx) {
    vibrateFor(kind);
    return;
  }

  try {
    if (ctx.state === 'suspended') {
      void ctx.resume().then(() => playNotificationSound(kind));
      return;
    }

    const t0 = ctx.currentTime + 0.01;
    if (kind === 'order') {
      tone(ctx, 880, t0, 0.14, 0.22);
      tone(ctx, 1174.7, t0 + 0.12, 0.18, 0.2);
      tone(ctx, 1396.9, t0 + 0.26, 0.22, 0.16);
    } else if (kind === 'customer') {
      tone(ctx, 740, t0, 0.12, 0.18);
      tone(ctx, 988, t0 + 0.14, 0.2, 0.16);
    } else {
      tone(ctx, 830, t0, 0.12, 0.18);
      tone(ctx, 1108, t0 + 0.13, 0.2, 0.15);
    }
  } catch {
    /* ignore autoplay failures */
  }

  vibrateFor(kind);
}

export function inferAlertSoundKind(item: {
  category?: string;
  destination?: string;
  registryCode?: string;
}): AlertKind {
  const cat = String(item.category || '').toLowerCase();
  const dest = String(item.destination || '').toLowerCase();
  const code = String(item.registryCode || '').toLowerCase();
  if (
    dest === 'orders' ||
    cat.includes('order') ||
    cat.includes('payment') ||
    code.includes('order') ||
    code.includes('payment')
  ) {
    return 'order';
  }
  if (dest === 'customers' || cat.includes('customer') || code.includes('customer')) {
    return 'customer';
  }
  return 'alert';
}
