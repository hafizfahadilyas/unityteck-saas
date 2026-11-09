import { describe, expect, it } from 'vitest';
import { previewBrandLockedPrompt } from './aiBrandIdentity';

describe('previewBrandLockedPrompt', () => {
  it('returns raw prompt when brand lock is off', () => {
    expect(
      previewBrandLockedPrompt("A women's handbag on a table", {
        brandLock: false,
        paletteHex: ['#1A2B3C'],
        persona: 'luxury',
        campaign: 'none',
      }),
    ).toBe("A women's handbag on a table");
  });

  it('merges colors and luxury persona when brand lock is on', () => {
    const out = previewBrandLockedPrompt("A women's handbag on a table", {
      brandLock: true,
      paletteHex: ['#1A2B3C', '#E0E0E0'],
      persona: 'luxury',
      campaign: 'none',
    });
    expect(out).toContain('handbag');
    expect(out).toContain('#1A2B3C');
    expect(out).toContain('#E0E0E0');
    expect(out).toContain('luxury');
    expect(out).toContain('4K');
  });

  it('adds Ramadan campaign hint', () => {
    const out = previewBrandLockedPrompt('beach and ocean', {
      brandLock: true,
      paletteHex: ['#0F766E'],
      persona: 'modern',
      campaign: 'ramadan',
    });
    expect(out).toContain('Ramadan');
    expect(out).toContain('#0F766E');
  });
});
