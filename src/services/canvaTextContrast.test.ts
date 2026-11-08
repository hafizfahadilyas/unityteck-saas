import { contrastRatio, ensureReadableTextStyle, isLightSurface } from './canvaTextContrast';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(contrastRatio('#0f172a', '#ffffff') > 10, 'dark on white should be strong');
assert(contrastRatio('#faf6f0', '#f7f1e8') < 2, 'cream on cream should be weak');

const fixedLight = ensureReadableTextStyle('#faf6f0', 'transparent', '#f7f1e8', {
  preferPill: true,
});
assert(fixedLight.bgColor !== 'transparent' || contrastRatio(fixedLight.fontColor, '#f7f1e8') >= 4.2, 'light text fixed');

const badge = ensureReadableTextStyle('#faf6f0', '#3d2314', '#f7f1e8');
assert(contrastRatio(badge.fontColor, badge.bgColor) >= 4.2, 'badge pair readable');

const darkCanvas = ensureReadableTextStyle('#2a170e', 'transparent', '#2a170e', { preferPill: true });
assert(contrastRatio(darkCanvas.fontColor, darkCanvas.bgColor === 'transparent' ? '#2a170e' : darkCanvas.bgColor) >= 4.2, 'dark canvas readable');

assert(isLightSurface('#ffffff') === true, 'white is light');
assert(isLightSurface('#0f172a') === false, 'slate is dark');

console.log('canvaTextContrast.test.ts OK');
