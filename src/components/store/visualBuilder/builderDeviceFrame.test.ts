import assert from 'node:assert/strict';
import { deviceStyleCss, frameWidthPx, isWidgetVisibleOnDevice, visibleFrameBlocks } from './builderDeviceFrame.ts';

assert.equal(frameWidthPx('desktop'), 1280);
assert.equal(frameWidthPx('laptop'), 1280);
assert.equal(frameWidthPx('tablet'), 768);
assert.equal(frameWidthPx('mobile'), 390);

const desktopOnly = { visible: true, visibleDesktop: true, visibleMobile: false };
assert.equal(isWidgetVisibleOnDevice(desktopOnly, 'mobile'), false);
assert.equal(isWidgetVisibleOnDevice(desktopOnly, 'desktop'), true);
assert.equal(isWidgetVisibleOnDevice({ visible: false, visibleMobile: true }, 'mobile'), false);

const styled = {
  style: {
    desktop: { padding: 40, color: '#111111' },
    mobile: { padding: 12, fontSize: 14, align: 'center' as const },
  },
};
assert.equal(deviceStyleCss(styled, 'mobile').padding, '12px');
assert.equal(deviceStyleCss(styled, 'mobile').fontSize, '14px');
assert.equal(deviceStyleCss(styled, 'desktop').padding, '40px');
assert.equal(deviceStyleCss(styled, 'laptop').color, '#111111');

const sized = {
  style: {
    desktop: { padding: 40, maxWidth: 960 },
    mobile: { padding: 12, fontSize: 14, maxWidth: '100%' },
  },
};
const reloaded = JSON.parse(JSON.stringify(sized));
assert.equal(deviceStyleCss(reloaded, 'mobile').maxWidth, '100%');
assert.equal(deviceStyleCss(reloaded, 'desktop').maxWidth, '960px');
assert.equal(deviceStyleCss(reloaded, 'desktop').padding, '40px');
assert.notEqual(reloaded.style.mobile.maxWidth, reloaded.style.desktop.maxWidth);

const tabletHidden = { id: 'gap', visible: true, visibleTablet: false, visibleMobile: true };
assert.equal(visibleFrameBlocks([tabletHidden, { id: 'keep', visible: true }], 'tablet').map((b) => b.id).join(','), 'keep');
assert.equal(visibleFrameBlocks([tabletHidden], 'mobile').length, 1);
assert.equal(visibleFrameBlocks([{ id: 'm', visible: true, visibleMobile: false }], 'mobile').length, 0);
console.log('builder device frame ok');
