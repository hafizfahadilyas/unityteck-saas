/**
 * Store contact isolation — one WhatsApp + one email per store_id.
 * Run: node --experimental-strip-types src/themes/settings/storeContact.test.ts
 */
import assert from 'node:assert/strict';
import {
  emptyStoreContact,
  isRetiredContactDigits,
  normalizeWhatsAppDigits,
  scrubPublicEmail,
  resolveStoreContact,
} from './storeContact.ts';

assert.equal(normalizeWhatsAppDigits(''), '');
assert.equal(normalizeWhatsAppDigits('+966 5 1234 5678'), '966512345678');
assert.equal(normalizeWhatsAppDigits('0512345678'), '966512345678');
assert.equal(normalizeWhatsAppDigits('+966549876543'), '', 'retired coffee demo WA stripped');
assert.equal(normalizeWhatsAppDigits('966581617712'), '', 'retired flowers demo WA stripped');
assert.equal(normalizeWhatsAppDigits('9668008440443'), '', 'retired header fallback stripped');
assert.ok(isRetiredContactDigits('966500000000'));

assert.equal(scrubPublicEmail('support@hibrew.sa'), '');
assert.equal(scrubPublicEmail('billing@makkah-gifts.sa'), '');
assert.equal(scrubPublicEmail('hello@my-store.sa'), 'hello@my-store.sa');

assert.equal(emptyStoreContact('x').hasWhatsApp, false);

// Without localStorage identity, empty contacts (no invented demos)
const bare = resolveStoreContact('store-new-tenant', { id: 'store-new-tenant', name: 'New' });
assert.equal(bare.whatsappDigits, '');
assert.equal(bare.email, '');
assert.equal(bare.hasWhatsApp, false);

console.log('storeContact.test.ts OK');
