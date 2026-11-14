/**
 * Phase 10 local inventory — ensure Phase 1–9 files + App wiring exist (no network).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mustExist = [
  'public/api/master_phase1_ops.php',
  'public/api/master_phase2to5_ops.php',
  'public/api/master_phase6to9_ops.php',
  'public/api/live_extensions.php',
  'src/components/master/MasterUiKit.tsx',
  'src/components/master/MasterIntegrationsHub.tsx',
  'src/components/master/MasterReportsOps.tsx',
  'src/components/master/MasterOpsMonitor.tsx',
  'src/components/master/MasterMessagingHub.tsx',
  'src/components/master/MasterGovernanceHub.tsx',
  'src/components/master/MasterSupportCenter.tsx',
  'src/components/master/MasterSecurityCenter.tsx',
  'src/components/master/MasterAccountManagement.tsx',
  'docs/32-souq-plus-phase1-gap-matrix.md',
  'docs/33-souq-plus-phase2-5-roadmap.md',
  'docs/34-souq-plus-phase6-9-roadmap.md',
  'docs/35-souq-plus-phase10-11-test-deploy.md',
  'scripts/smoke-master-phase9.mjs',
  'scripts/smoke-master-phase10.mjs',
];

const missing = mustExist.filter((f) => !fs.existsSync(path.join(root, f)));
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
const live = fs.readFileSync(path.join(root, 'public/api/live_extensions.php'), 'utf8');
const hot = fs.readFileSync(path.join(root, 'scripts/deploy-api-hotfiles.js'), 'utf8');

const checks = [
  { name: 'App wires MasterMessagingHub', ok: app.includes('MasterMessagingHub') },
  { name: 'App wires MasterGovernanceHub', ok: app.includes('MasterGovernanceHub') },
  { name: 'App wires MasterIntegrationsHub', ok: app.includes('MasterIntegrationsHub') },
  { name: 'live_extensions dispatches phase6to9', ok: live.includes('souq_phase6to9_ops_dispatch') },
  { name: 'live_extensions dispatches phase2to5', ok: live.includes('souq_phase2to5_ops_dispatch') },
  { name: 'hotfiles includes phase6to9 php', ok: hot.includes('master_phase6to9_ops.php') },
];

const failed = [
  ...missing.map((f) => `missing file: ${f}`),
  ...checks.filter((c) => !c.ok).map((c) => c.name),
];

if (failed.length) {
  console.error(JSON.stringify({ ok: false, failed }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, files: mustExist.length, checks: checks.length }, null, 2));
console.log('PASS: Phase 10 local inventory');
