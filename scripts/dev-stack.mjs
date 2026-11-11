/**
 * Start Laravel API (:8010) + Vite admin together.
 * Vite proxies /api → 127.0.0.1:8010 — without API, every call is 502.
 *
 * Usage: npm run dev:stack
 * Optional: npm run dev:stack -- --port=3011
 */
import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = path.join(root, 'apps', 'api');
const isWin = process.platform === 'win32';

const portArg = process.argv.find((a) => a.startsWith('--port='));
const vitePort = portArg ? portArg.split('=')[1] : process.env.VITE_PORT || '3010';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function canConnect(host, port, timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    const done = (ok) => {
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error', () => done(false));
  });
}

function spawnProc(command, args, cwd, name) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: isWin,
    env: process.env,
  });
  child.on('exit', (code, signal) => {
    if (signal) {
      console.error(`[${name}] killed (${signal})`);
      process.exit(1);
    }
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      process.exit(code);
    }
  });
  return child;
}

async function main() {
  const apiUp = await canConnect('127.0.0.1', 8010);
  let apiChild = null;
  if (apiUp) {
    console.log('[dev-stack] Laravel API already listening on :8010');
  } else {
    console.log('[dev-stack] Starting Laravel API on :8010 …');
    // Windows PHP CLI defaults can kill artisan serve after max_execution_time (120s)
    apiChild = spawnProc(
      'php',
      ['-d', 'max_execution_time=0', 'artisan', 'serve', '--host=127.0.0.1', '--port=8010'],
      apiDir,
      'api',
    );
    let ready = false;
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      if (await canConnect('127.0.0.1', 8010)) {
        ready = true;
        break;
      }
    }
    if (!ready) {
      console.error(
        '[dev-stack] API did not open :8010. Run: npm run api:serve',
      );
      if (apiChild) apiChild.kill();
      process.exit(1);
    }
    console.log('[dev-stack] API ready on http://127.0.0.1:8010');
  }

  console.log(`[dev-stack] Starting Vite on :${vitePort} …`);
  const viteChild = spawnProc(
    isWin ? 'npx.cmd' : 'npx',
    ['vite', `--port=${vitePort}`, '--host=0.0.0.0'],
    root,
    'vite',
  );

  const shutdown = () => {
    try {
      viteChild?.kill();
    } catch {
      /* ignore */
    }
    try {
      apiChild?.kill();
    } catch {
      /* ignore */
    }
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
