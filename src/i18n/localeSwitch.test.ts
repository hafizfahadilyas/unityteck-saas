/**
 * Full-speed admin locale switch — both languages always on for every store.
 */
import assert from 'node:assert/strict';
import { translate } from './dict';
import type { AppLocale } from './prefs';

const ADMIN_LOCALES: AppLocale[] = ['ar', 'en'];

assert.deepEqual(ADMIN_LOCALES, ['ar', 'en'], 'admin chrome must always expose AR + EN');

assert.equal(translate('ar', 'navDashboard'), 'الرئيسية');
assert.equal(translate('en', 'navDashboard'), 'Home');
assert.equal(translate('ar', 'dashWelcome'), 'لوحة التحكم');
assert.equal(translate('en', 'dashWelcome'), 'Dashboard');

// Never cross-mix: missing key returns key id, not the other language.
assert.equal(translate('ar', 'navDashboard'), 'الرئيسية');
assert.notEqual(translate('ar', 'navDashboard'), translate('en', 'navDashboard'));

console.log('localeSwitch.test.ts: OK');
