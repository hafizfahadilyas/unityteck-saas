/**
 * Design Studio — text / layer animation timeline + transitions (Canva-style).
 */

export type CanvaAnimPreset =
  | 'none'
  | 'fade'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'zoom'
  | 'pop'
  | 'bounce'
  | 'typewriter';

export type CanvaAnimEase = 'linear' | 'easeOut' | 'easeIn' | 'easeInOut' | 'spring';

export type CanvaLayerMotion = {
  animIn?: CanvaAnimPreset;
  animOut?: CanvaAnimPreset;
  /** Enter animation length */
  animDurationMs?: number;
  /** Exit animation length */
  animOutDurationMs?: number;
  /** Start delay from timeline 0 */
  animDelayMs?: number;
  animEase?: CanvaAnimEase;
};

export type MotionSample = {
  opacity: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  /** 0–1 for typewriter reveal */
  typeProgress: number;
  visible: boolean;
};

export const CANVA_ANIM_PRESETS: Array<{
  id: CanvaAnimPreset;
  labelEn: string;
  labelAr: string;
}> = [
  { id: 'none', labelEn: 'None', labelAr: 'بدون' },
  { id: 'fade', labelEn: 'Fade', labelAr: 'تلاشي' },
  { id: 'slideUp', labelEn: 'Slide up', labelAr: 'انزلاق لأعلى' },
  { id: 'slideDown', labelEn: 'Slide down', labelAr: 'انزلاق لأسفل' },
  { id: 'slideLeft', labelEn: 'Slide left', labelAr: 'انزلاق لليسار' },
  { id: 'slideRight', labelEn: 'Slide right', labelAr: 'انزلاق لليمين' },
  { id: 'zoom', labelEn: 'Zoom', labelAr: 'تكبير' },
  { id: 'pop', labelEn: 'Pop', labelAr: 'ظهور سريع' },
  { id: 'bounce', labelEn: 'Bounce', labelAr: 'ارتداد' },
  { id: 'typewriter', labelEn: 'Typewriter', labelAr: 'آلة كاتبة' },
];

export const CANVA_ANIM_EASES: Array<{
  id: CanvaAnimEase;
  labelEn: string;
  labelAr: string;
}> = [
  { id: 'linear', labelEn: 'Linear', labelAr: 'خطي' },
  { id: 'easeOut', labelEn: 'Ease out', labelAr: 'تخفيف خروج' },
  { id: 'easeIn', labelEn: 'Ease in', labelAr: 'تخفيف دخول' },
  { id: 'easeInOut', labelEn: 'Ease in-out', labelAr: 'تخفيف دخول وخروج' },
  { id: 'spring', labelEn: 'Spring', labelAr: 'زنبرك' },
];

export function applyEase(t: number, ease: CanvaAnimEase = 'easeOut'): number {
  const x = Math.max(0, Math.min(1, t));
  switch (ease) {
    case 'linear':
      return x;
    case 'easeIn':
      return x * x;
    case 'easeInOut':
      return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    case 'spring': {
      // Overshoot then settle
      const c = Math.min(1, x * 1.15);
      return 1 - Math.pow(1 - c, 3) * Math.cos(c * Math.PI * 1.2);
    }
    case 'easeOut':
    default:
      return 1 - Math.pow(1 - x, 3);
  }
}

function enterFromPreset(
  preset: CanvaAnimPreset,
  p: number,
): Pick<MotionSample, 'opacity' | 'offsetX' | 'offsetY' | 'scale' | 'typeProgress'> {
  const inv = 1 - p;
  switch (preset) {
    case 'fade':
      return { opacity: p, offsetX: 0, offsetY: 0, scale: 1, typeProgress: 1 };
    case 'slideUp':
      return { opacity: p, offsetX: 0, offsetY: 48 * inv, scale: 1, typeProgress: 1 };
    case 'slideDown':
      return { opacity: p, offsetX: 0, offsetY: -48 * inv, scale: 1, typeProgress: 1 };
    case 'slideLeft':
      return { opacity: p, offsetX: 56 * inv, offsetY: 0, scale: 1, typeProgress: 1 };
    case 'slideRight':
      return { opacity: p, offsetX: -56 * inv, offsetY: 0, scale: 1, typeProgress: 1 };
    case 'zoom':
      return { opacity: p, offsetX: 0, offsetY: 0, scale: 0.55 + 0.45 * p, typeProgress: 1 };
    case 'pop':
      return {
        opacity: p,
        offsetX: 0,
        offsetY: 0,
        scale: p < 0.7 ? 0.4 + p * 0.9 : 1 + (1 - p) * 0.15,
        typeProgress: 1,
      };
    case 'bounce':
      return {
        opacity: Math.min(1, p * 1.2),
        offsetX: 0,
        offsetY: Math.sin(p * Math.PI) * -28 * inv,
        scale: 0.85 + 0.15 * p,
        typeProgress: 1,
      };
    case 'typewriter':
      return { opacity: 1, offsetX: 0, offsetY: 0, scale: 1, typeProgress: p };
    case 'none':
    default:
      return { opacity: 1, offsetX: 0, offsetY: 0, scale: 1, typeProgress: 1 };
  }
}

function exitToPreset(
  preset: CanvaAnimPreset,
  p: number,
): Pick<MotionSample, 'opacity' | 'offsetX' | 'offsetY' | 'scale' | 'typeProgress'> {
  // p = 0 at start of exit, 1 at fully gone
  const base = enterFromPreset(preset === 'typewriter' ? 'fade' : preset, 1 - p);
  return base;
}

/** Sample motion for a layer at timeline time (ms). */
export function sampleLayerMotion(
  motion: CanvaLayerMotion | undefined,
  timeMs: number,
  timelineMs: number,
): MotionSample {
  const animIn = motion?.animIn || 'none';
  const animOut = motion?.animOut || 'none';
  const delay = Math.max(0, motion?.animDelayMs ?? 0);
  const durIn = Math.max(80, motion?.animDurationMs ?? 600);
  const durOut = Math.max(80, motion?.animOutDurationMs ?? 450);
  const ease = motion?.animEase || 'easeOut';
  const total = Math.max(timelineMs, delay + durIn + 200);

  if (timeMs < delay) {
    if (animIn === 'none') {
      return { opacity: 1, offsetX: 0, offsetY: 0, scale: 1, typeProgress: 1, visible: true };
    }
    return { opacity: 0, offsetX: 0, offsetY: 0, scale: 1, typeProgress: 0, visible: false };
  }

  const local = timeMs - delay;
  const holdEnd = Math.max(durIn, total - delay - (animOut !== 'none' ? durOut : 0));

  // Enter
  if (local < durIn && animIn !== 'none') {
    const p = applyEase(local / durIn, ease);
    const s = enterFromPreset(animIn, p);
    const visible =
      animIn === 'typewriter' ? s.typeProgress > 0.01 : s.opacity > 0.02;
    return { ...s, visible };
  }

  // Hold
  if (local < holdEnd || animOut === 'none') {
    return { opacity: 1, offsetX: 0, offsetY: 0, scale: 1, typeProgress: 1, visible: true };
  }

  // Exit
  const exitLocal = local - holdEnd;
  const p = applyEase(Math.min(1, exitLocal / durOut), ease);
  const s = exitToPreset(animOut, p);
  return { ...s, visible: s.opacity > 0.02 };
}

export function clipTextByTypeProgress(text: string, typeProgress: number): string {
  if (typeProgress >= 0.999) return text;
  if (typeProgress <= 0) return '';
  const n = Math.max(0, Math.floor(text.length * typeProgress));
  return text.slice(0, n);
}

export function defaultTimelineMs(elements: CanvaLayerMotion[]): number {
  let max = 3000;
  for (const el of elements) {
    const delay = el.animDelayMs ?? 0;
    const din = el.animDurationMs ?? 600;
    const dout = el.animOut && el.animOut !== 'none' ? el.animOutDurationMs ?? 450 : 0;
    max = Math.max(max, delay + din + dout + 800);
  }
  return Math.min(15000, Math.max(1500, max));
}
