import assert from 'node:assert/strict';
import {
  applySiteKitCallback,
  realTrackingId,
  seoSetupStep,
  siteKitDoneMessage,
  storeGoogleEmail,
  storePublicHost,
} from './storeSeoSetup.ts';

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

const applied = applySiteKitCallback({
  integration: {
    google_account_email: 'owner@shop.sa',
    ga4_property_id: '555',
    ga4_measurement_id: 'G-REAL123',
    gtm_container_id: 'GTM-ABC123',
    gsc_site_url: 'https://shop.sa/',
  },
  site_kit: {
    sitemap_url: 'https://shop.sa/sitemap.xml',
    sitemap_submitted: true,
    indexing_homepage_pinged: true,
    linked: { ga4: true, search_console: true, gtm: true, ads: false },
  },
});
assert.ok(applied);
assert.equal(applied!.seoPatch.googleConnected, true);
assert.equal(applied!.seoPatch.ga4MeasurementId, 'G-REAL123');
assert.equal(applied!.seoPatch.gtmContainerId, 'GTM-ABC123');
assert.equal(applied!.linked.ga4, true);
assert.equal(applied!.linked.gtm, true);
assert.equal(applySiteKitCallback({}), null);
assert.match(siteKitDoneMessage(applied!.linked, 'owner@shop.sa', false), /Done — Google connected/);
assert.match(siteKitDoneMessage(applied!.linked, 'owner@shop.sa', true), /تم — ربط جوجل نجح/);
console.log('store seo setup ok');
