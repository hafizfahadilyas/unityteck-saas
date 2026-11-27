import { describe, expect, it } from 'vitest';
import { matchTrafficSourceLabel } from './trafficSource';

describe('matchTrafficSourceLabel lifetime attribution', () => {
  it('maps bare google to Organic Search (never invent Google Ads)', () => {
    expect(matchTrafficSourceLabel('google')).toBe('Organic Search');
    expect(matchTrafficSourceLabel('google.com')).toBe('Organic Search');
  });

  it('maps paid google signals to Google Ads', () => {
    expect(matchTrafficSourceLabel('google', 'cpc')).toBe('Google Ads');
    expect(matchTrafficSourceLabel('gads')).toBe('Google Ads');
    expect(matchTrafficSourceLabel('adwords')).toBe('Google Ads');
  });

  it('keeps social channels', () => {
    expect(matchTrafficSourceLabel('whatsapp')).toBe('WhatsApp');
    expect(matchTrafficSourceLabel('instagram')).toBe('Instagram');
    expect(matchTrafficSourceLabel('fb')).toBe('Facebook');
  });
});
