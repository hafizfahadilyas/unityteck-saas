import { describe, expect, it } from 'vitest';
import {
  isEphemeralImageUrl,
  isPersistableChromeImageUrl,
  parseStoreChrome,
} from './storeChrome';
import { isChromeIdbUrl } from './storeChromeImageStore';

describe('store chrome wallpaper / sidebar persist helpers', () => {
  it('treats blob and data URLs as ephemeral only', () => {
    expect(isEphemeralImageUrl('blob:https://local/abc')).toBe(true);
    expect(isEphemeralImageUrl('data:image/png;base64,aaa')).toBe(true);
    expect(isEphemeralImageUrl('chrome-idb://store-1/shellWallpaper?v=1')).toBe(false);
    expect(isEphemeralImageUrl('https://cdn.example/wall.webp')).toBe(false);
  });

  it('keeps chrome-idb and http as persistable', () => {
    expect(isPersistableChromeImageUrl('chrome-idb://store-1/bgImage?v=2')).toBe(true);
    expect(isPersistableChromeImageUrl('https://giftshop-sa.com/storage/x.webp')).toBe(true);
    expect(isPersistableChromeImageUrl('blob:https://local/abc')).toBe(false);
  });

  it('parseStoreChrome keeps chrome-idb wallpaper + sidebar bg', () => {
    const shell = 'chrome-idb://store-coffee/shellWallpaper?v=9';
    const bg = 'chrome-idb://store-coffee/bgImage?v=9';
    const parsed = parseStoreChrome({
      shellWallpaper: shell,
      bgImage: bg,
      fill: 'image',
      shellWallpaperPreset: 'custom',
    });
    expect(isChromeIdbUrl(parsed.shellWallpaper)).toBe(true);
    expect(parsed.shellWallpaper).toBe(shell);
    expect(parsed.bgImage).toBe(bg);
    expect(parsed.shellWallpaperPreset).toBe('custom');
    expect(parsed.fill).toBe('image');
  });

  it('parseStoreChrome keeps ephemeral preview for live paint', () => {
    const blob = 'blob:http://localhost:5173/preview-1';
    const parsed = parseStoreChrome({
      shellWallpaper: blob,
      bgImage: blob,
      fill: 'image',
    });
    expect(parsed.shellWallpaper).toBe(blob);
    expect(parsed.bgImage).toBe(blob);
  });
});
