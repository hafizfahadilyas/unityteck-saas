import assert from 'node:assert/strict';
import { realTrackingId, seoSetupStep, storeGoogleEmail, storePublicHost } from './storeSeoSetup.ts';

assert.equal(realTrackingId('G-UNITYKSA01-COFFE'), '');
assert.equal(realTrackingId('GTM-KSA9901-FLOW'), '');
assert.equal(realTrackingId('google-site-verification=KSA-FLOW-AUTO'), '');
assert.equal(realTrackingId('properties/398210451'), '');
assert.equal(realTrackingId('G-REAL123'), 'G-REAL123');
assert.equal(storeGoogleEmail({ ownerEmail: 'mieraf.sa8@gmail.com' }), 'mieraf.sa8@gmail.com');
assert.equal(storeGoogleEmail({ ownerEmail: '', email: 'owner@shop.sa' }), 'owner@shop.sa');
assert.equal(storeGoogleEmail({ ownerEmail: '' }), '');
assert.equal(storePublicHost({ custom_domain: 'https://hibrew.sa/shop' }), 'hibrew.sa');
assert.equal(storePublicHost({ custom_domain: '', domain: '', demo_domain: 'www.mieraf-ksa.com' }), 'mieraf-ksa.com');
assert.equal(seoSetupStep({ ownerEmail: 'a@b.com', custom_domain: '' }), 'need_domain');
assert.equal(seoSetupStep({ ownerEmail: '', custom_domain: 'shop.sa' }), 'need_email');
assert.equal(seoSetupStep({ ownerEmail: 'a@b.com', domain: 'shop.sa' }), 'ready');
assert.equal(seoSetupStep({ ownerEmail: 'a@b.com', demo_domain: 'mieraf-ksa.com' }), 'ready');
console.log('store seo setup ok');
