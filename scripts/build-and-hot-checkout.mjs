#!/usr/bin/env node
/**
 * Exclusive: acquire deploy lock → vite build → snapshot → hot FTP flowers+central.
 */
import { spawnSync } from 'node:child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { acquireDeployLock } from './deploy-lock.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const release = acquireDeployLock('build-hot-checkout');

try {
  console.log('1) vite build…');
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' },
  });
  if (build.status !== 0) process.exit(build.status || 1);

  const targetArg = process.argv.find((a) => a.startsWith('--target=')) || '--target=all';
  console.log('2) hot upload checkout UI…', targetArg);
  const up = spawnSync('node', ['scripts/hot-upload-checkout-ui.mjs', targetArg], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, SOUQ_SKIP_DEPLOY_LOCK: '1' },
  });
  process.exit(up.status || 0);
} finally {
  release();
}
