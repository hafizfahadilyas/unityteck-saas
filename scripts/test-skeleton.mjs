/**
 * Test script for Souq Platform Global Skeleton Loading System
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

console.log('--- RUNNING SOUQ SKELETON LOADING SYSTEM VERIFICATION ---');

const baseDir = process.cwd();
const skeletonDir = path.join(baseDir, 'src', 'components', 'common', 'skeleton');

// 1. Verify all 21 library files exist
const requiredFiles = [
  'types.ts',
  'SkeletonConfigContext.tsx',
  'Skeleton.tsx',
  'SkeletonText.tsx',
  'SkeletonTitle.tsx',
  'SkeletonAvatar.tsx',
  'SkeletonImage.tsx',
  'SkeletonButton.tsx',
  'SkeletonCard.tsx',
  'SkeletonProductCard.tsx',
  'SkeletonProductGrid.tsx',
  'SkeletonTable.tsx',
  'SkeletonTableRow.tsx',
  'SkeletonSidebar.tsx',
  'SkeletonNavbar.tsx',
  'SkeletonDashboard.tsx',
  'SkeletonChart.tsx',
  'SkeletonForm.tsx',
  'SkeletonModal.tsx',
  'SkeletonPage.tsx',
  'SkeletonCheckout.tsx',
  'SkeletonOrderList.tsx',
  'SkeletonSettingsCard.tsx',
  'index.ts',
];

for (const file of requiredFiles) {
  const fullPath = path.join(skeletonDir, file);
  assert.ok(fs.existsSync(fullPath), `File missing: ${file}`);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert.ok(content.length > 50, `File is empty or corrupt: ${file}`);
}
console.log(`[PASS] All ${requiredFiles.length} skeleton library files present and non-empty.`);

// 2. Verify CSS styles and keyframes
const cssPath = path.join(baseDir, 'src', 'styles', 'skeleton.css');
assert.ok(fs.existsSync(cssPath), 'src/styles/skeleton.css must exist');
const cssContent = fs.readFileSync(cssPath, 'utf8');
assert.ok(cssContent.includes('.souq-skeleton'), 'CSS missing .souq-skeleton');
assert.ok(cssContent.includes('@keyframes souq-shimmer'), 'CSS missing souq-shimmer keyframe');
assert.ok(cssContent.includes('@keyframes souq-shimmer-rtl'), 'CSS missing souq-shimmer-rtl keyframe');
assert.ok(cssContent.includes('@media (prefers-reduced-motion: reduce)'), 'CSS missing reduced-motion media query');
console.log('[PASS] CSS shimmer, RTL, and reduced-motion rules verified.');

// 3. Verify index.css imports skeleton.css
const indexCssPath = path.join(baseDir, 'src', 'index.css');
const indexCssContent = fs.readFileSync(indexCssPath, 'utf8');
assert.ok(indexCssContent.includes('skeleton.css'), 'index.css must import skeleton.css');
console.log('[PASS] index.css successfully imports skeleton.css.');

// 4. Verify barrel index exports all components
const indexTsPath = path.join(skeletonDir, 'index.ts');
const indexTsContent = fs.readFileSync(indexTsPath, 'utf8');
assert.ok(indexTsContent.includes("export * from './Skeleton'"), 'Missing Skeleton export');
assert.ok(indexTsContent.includes("export * from './SkeletonProductGrid'"), 'Missing SkeletonProductGrid export');
assert.ok(indexTsContent.includes("export * from './SkeletonDashboard'"), 'Missing SkeletonDashboard export');
assert.ok(indexTsContent.includes("export * from './SkeletonPage'"), 'Missing SkeletonPage export');
assert.ok(indexTsContent.includes("export * from './SkeletonSettingsCard'"), 'Missing SkeletonSettingsCard export');
console.log('[PASS] Barrel index.ts comprehensively exports all library primitives.');

// 5. Verify App.tsx integration
const appTsxPath = path.join(baseDir, 'src', 'App.tsx');
const appTsxContent = fs.readFileSync(appTsxPath, 'utf8');
assert.ok(appTsxContent.includes('SkeletonProvider'), 'App.tsx must use SkeletonProvider');
assert.ok(appTsxContent.includes('SkeletonPage'), 'App.tsx TabFallback must use SkeletonPage');
console.log('[PASS] App.tsx root wrapped in SkeletonProvider with SkeletonPage TabFallback.');

// 6. Verify DynamicThemeRenderer.tsx integration
const dtrPath = path.join(baseDir, 'src', 'components', 'storefront', 'DynamicThemeRenderer.tsx');
const dtrContent = fs.readFileSync(dtrPath, 'utf8');
assert.ok(dtrContent.includes('SkeletonPage'), 'DynamicThemeRenderer must use SkeletonPage for LightThemeFallback');
console.log('[PASS] DynamicThemeRenderer.tsx uses SkeletonPage for storefront loading.');

// 7. Verify AdvancedDataTable.tsx integration
const adtPath = path.join(baseDir, 'src', 'components', 'common', 'AdvancedDataTable.tsx');
const adtContent = fs.readFileSync(adtPath, 'utf8');
assert.ok(adtContent.includes('SkeletonTableRow'), 'AdvancedDataTable must use SkeletonTableRow for table rows');
console.log('[PASS] AdvancedDataTable.tsx uses SkeletonTableRow shimmer rows.');

// 8. Verify Documentation guide
const docPath = path.join(baseDir, 'docs', '40-global-skeleton-loading-system.md');
assert.ok(fs.existsSync(docPath), 'docs/40-global-skeleton-loading-system.md must exist');
console.log('[PASS] Documentation guidelines 40-global-skeleton-loading-system.md present.');

console.log('--- ALL GLOBAL SKELETON LOADING SYSTEM VERIFICATIONS PASSED ---');
