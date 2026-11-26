import { describe, expect, it } from 'vitest';
import { matchTrafficSourceLabel } from './trafficSource';

describe('matchTrafficSourceLabel', () => {
  it('maps WhatsApp / Facebook / Instagram UTM sources', () => {
    expect(matchTrafficSourceLabel('whatsapp')).toBe('WhatsApp');
    expect(matchTrafficSourceLabel('wa')).toBe('WhatsApp');
    expect(matchTrafficSourceLabel('facebook')).toBe('Facebook');
    expect(matchTrafficSourceLabel('fb')).toBe('Facebook');
    expect(matchTrafficSourceLabel('instagram')).toBe('Instagram');
    expect(matchTrafficSourceLabel('ig')).toBe('Instagram');
  });

  it('maps TikTok, Snapchat, Google', () => {
    expect(matchTrafficSourceLabel('tiktok')).toBe('TikTok');
    expect(matchTrafficSourceLabel('snapchat')).toBe('Snapchat');
    expect(matchTrafficSourceLabel('google')).toBe('Google Ads');
  });
});
