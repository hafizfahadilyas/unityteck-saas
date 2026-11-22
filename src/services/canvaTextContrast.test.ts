import { contrastRatio, ensureReadableTextStyle, isLightSurface } from './canvaTextContrast';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(contrastRatio('#0f172a', '#ffffff') > 10, 'dark on white should be strong');
assert(contrastRatio('#faf6f0', '#f7f1e8') < 2, 'cream on cream should be weak');

// Light text on light canvas → flip to dark ink (no forced dark pill)
const fixedLight = ensureReadableTextStyle('#faf6f0', 'transparent', '#ffffff', {
  preferPill: true,
});
assert(fixedLight.fontColor === '#0f172a', 'light text on white → dark ink');
assert(fixedLight.bgColor === 'transparent', 'prefer transparent when flip is enough');
assert(contrastRatio(fixedLight.fontColor, '#ffffff') >= 4.5, 'full readable on white');

const cream = ensureReadableTextStyle('#faf6f0', 'transparent', '#f7f1e8', {
  preferPill: true,
});
assert(contrastRatio(cream.fontColor, cream.bgColor === 'transparent' ? '#f7f1e8' : cream.bgColor) >= 4.5, 'cream canvas readable');

const badge = ensureReadableTextStyle('#faf6f0', '#3d2314', '#f7f1e8');
assert(contrastRatio(badge.fontColor, badge.bgColor) >= 4.5, 'badge pair readable');

const darkCanvas = ensureReadableTextStyle('#2a170e', 'transparent', '#2a170e', { preferPill: true });
assert(darkCanvas.fontColor === '#f8fafc', 'dark canvas → light ink');
assert(
  contrastRatio(darkCanvas.fontColor, darkCanvas.bgColor === 'transparent' ? '#2a170e' : darkCanvas.bgColor) >= 4.5,
  'dark canvas readable',
);

// White-on-white import case (PPTX / Canva) must become black
const whiteOnWhite = ensureReadableTextStyle('#ffffff', 'transparent', '#ffffff');
assert(whiteOnWhite.fontColor === '#0f172a', 'white-on-white → black');
assert(whiteOnWhite.bgColor === 'transparent', 'no pill when flip works');

assert(isLightSurface('#ffffff') === true, 'white is light');
assert(isLightSurface('#0f172a') === false, 'slate is dark');

console.log('canvaTextContrast.test.ts OK');
