import { describe, expect, it } from 'vitest';
import { normalizeStoreCustomCode, scopeStoreCss } from './storeScopedCustomCode';

describe('storeScopedCustomCode', () => {
  it('keeps empty custom code empty', () => {
    expect(normalizeStoreCustomCode(null).customCss).toBe('');
    expect(normalizeStoreCustomCode({}).customFontFamily).toBe('');
  });

  it('scopes CSS to the active store wrapper', () => {
    const scoped = scopeStoreCss('.price{color:red}', 'store-a');
    expect(scoped).toContain('[data-store-id="store-a"] .price');
    expect(scoped).not.toContain('store-b');
  });

  it('drops selectors that target another store id', () => {
    const scoped = scopeStoreCss('#store-b .x{color:blue}.ok{color:red}', 'store-a');
    expect(scoped).not.toContain('store-b');
    expect(scoped).toContain('[data-store-id="store-a"] .ok');
  });
});
