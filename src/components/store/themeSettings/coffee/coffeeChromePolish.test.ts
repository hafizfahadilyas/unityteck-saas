/**
 * CW-15 — #1–2 chrome polish (announcements + main menu).
 * Run: node --experimental-strip-types src/components/store/themeSettings/coffee/coffeeChromePolish.test.ts
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const ann = readFileSync(
  join(root, 'src/components/store/themeSettings/coffee/CoffeeAnnouncementsForm.tsx'),
  'utf8',
);
assert.match(ann, /data-ann-tab/);
assert.match(ann, /data-ann-panel="layout"/);
assert.match(ann, /data-ann-panel="style"/);
assert.match(ann, /data-ann-controls="enable"/);
assert.match(ann, /data-ann-controls="action-display"/);
assert.match(ann, /contentWidth/);
assert.match(ann, /barHeight/);
assert.equal(ann.includes('bg-[#2563EB]'), false, 'Announcements must not hardcode blue CTA');
assert.equal(ann.includes('bg-emerald-600'), false, 'Announcements must use Holst not emerald brand');
assert.match(ann, /var\(--portal-cta\)/);

const shell = readFileSync(
  join(root, 'src/components/store/themeSettings/coffee/CoffeeWordSettingsShell.tsx'),
  'utf8',
);
assert.match(shell, /unity-btn-primary/);
assert.match(shell, /data-preview-device/);
assert.equal(shell.includes('bg-[#2563EB]'), false, 'Shell device/save must use Holst');

const headerForm = readFileSync(
  join(root, 'src/components/store/themeSettings/HeaderElementsForm.tsx'),
  'utf8',
);
assert.match(headerForm, /data-menu-panel="products"/);
assert.match(headerForm, /data-menu-panel="devices"/);
assert.match(headerForm, /data-menu-device=\{device\}/);
assert.match(headerForm, /data-nav-controls="mega-source"/);
assert.match(headerForm, /data-mega-edit="products"/);
assert.match(headerForm, /data-mega-picker="manual"/);
assert.match(headerForm, /menuProductSource/);
assert.match(headerForm, /menuMaxProducts/);
assert.match(headerForm, /menuProductOverrides/);
assert.match(headerForm, /deviceLayouts/);
assert.match(headerForm, /tabletLinks/);
assert.match(headerForm, /unity-btn-primary/);
assert.match(headerForm, /var\(--portal-cta\)/);
assert.match(headerForm, /embedded \? 'navigation'/);

const headerSettings = readFileSync(
  join(root, 'src/themes/settings/headerCustomSettings.ts'),
  'utf8',
);
assert.match(headerSettings, /menuProductSource\?:/);
assert.match(headerSettings, /menuProductOverrides\?:/);
assert.match(headerSettings, /HeaderMenuDeviceLayout/);
assert.match(headerSettings, /deviceLayouts\?:/);

const headerSf = readFileSync(
  join(root, 'src/themes/coffeeRoasters/components/Header.tsx'),
  'utf8',
);
assert.match(headerSf, /menuMaxProducts/);
assert.match(headerSf, /menuProductSource/);
assert.match(headerSf, /menuProductOverrides/);
assert.match(headerSf, /applyMegaOverride/);
assert.match(headerSf, /megaMax/);

const inspector = readFileSync(
  join(root, 'src/components/store/visualBuilder/header/HeaderElementInspector.tsx'),
  'utf8',
);
assert.match(inspector, /data-menu-panel="products"/);
assert.match(inspector, /data-menu-panel="devices"/);

assert.ok(existsSync(join(root, 'docs/reference/coffee-widget-ui/01-promotional-announcements.png')));
assert.ok(existsSync(join(root, 'docs/reference/coffee-widget-ui/02-main-menu.png')));

console.log('coffee chrome polish ok');
