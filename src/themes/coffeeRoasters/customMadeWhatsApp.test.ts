import assert from 'node:assert/strict';
import { resolveCustomMadeWhatsAppHref } from './customMadeWhatsApp.ts';

assert.equal(
  resolveCustomMadeWhatsAppHref({
    customOrderUrl: 'https://wa.me/966501234567',
  }),
  'https://wa.me/966501234567',
);

assert.equal(
  resolveCustomMadeWhatsAppHref({
    storeWhatsapp: '0501234567',
    language: 'EN',
    label: 'Custom Made · Design & Build',
  }),
  `https://wa.me/966501234567?text=${encodeURIComponent('Hello, I would like to inquire about Custom Made · Design & Build')}`,
);

assert.equal(
  resolveCustomMadeWhatsAppHref({
    whatsappNumber: '966511122233',
    language: 'AR',
    label: 'تفصيل حسب الطلب',
  }),
  `https://wa.me/966511122233?text=${encodeURIComponent('السلام عليكم، أود الاستفسار عن تفصيل حسب الطلب')}`,
);

// No fake fallback when store has no WhatsApp
assert.equal(resolveCustomMadeWhatsAppHref({ customOrderUrl: 'custom-order' }), null);
assert.equal(resolveCustomMadeWhatsAppHref({}), null);

console.log('customMadeWhatsApp ok');
