import assert from 'node:assert/strict';
import { deviceStyleCss, frameWidthPx, isWidgetVisibleOnDevice } from './builderDeviceFrame.ts';

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
console.log('builder device frame ok');
