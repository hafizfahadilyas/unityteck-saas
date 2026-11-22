import { describe, expect, it } from 'vitest';
import { shellLumaFromAverage } from './shellWallpaperLuma';

describe('shellWallpaperLuma', () => {
  it('marks bright photos as light shell (dark page titles)', () => {
    expect(shellLumaFromAverage(0.75)).toBe('light');
    expect(shellLumaFromAverage(0.42)).toBe('light');
  });

  it('marks dark photos as dark shell (light page titles)', () => {
    expect(shellLumaFromAverage(0.41)).toBe('dark');
    expect(shellLumaFromAverage(0.12)).toBe('dark');
  });
});
