/**
 * File-by-file FTP backup of old flowers Hostinger → backups/
 * Reconnects often (Hostinger 421 idle timeout). Skips existing files.
 * Redacts .env*. Does not print passwords.
 *
 * Usage: node scripts/backup-flowers-old-ftp.js [--resume=DIR]
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import dotenv from 'dotenv';
import * as ftp from 'basic-ftp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.resolve(rootDir, '.env') });

const args = process.argv.slice(2);
const resumeArg = args.find((a) => a.startsWith('--resume='))?.split('=')[1];

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = resumeArg
  ? path.resolve(resumeArg)
  : path.resolve(rootDir, 'backups', `flowers-old-hostinger-${stamp}`);
const mirrorDir = path.join(outDir, 'mirror');
const manifestPath = path.join(outDir, 'MANIFEST.json');
const progressPath = path.join(outDir, 'progress.json');

const host = process.env.FTP_FLOWERS_HOST || process.env.FTP_HOST;
const user = process.env.FTP_FLOWERS_USER || process.env.FTP_USER;
const password = process.env.FTP_FLOWERS_PASSWORD || process.env.FTP_PASSWORD;

const PRIORITY_DIRS = [
  'public_html',
  'api',
  'includes',
  'src',
  // root /assets = thousands of stale Vite chunks; public_html/assets already covered
  'images',
  'fonts',
  'currency',
  'payment-methods',
  'shipping-methods',
  'hero-frames',
  'coffee-theme-refs',
  'theme-mockups',
];

/** Skip these root dirs (already mirrored under public_html or non-essential for restore). */
const SKIP_ROOT_DIRS = new Set(['assets']);

const SECRET_NAMES = new Set(['.env', '.env.local', '.env.production', '.env.backup', 'auth.json', 'credentials.json']);

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function countFiles(dir) {
  let n = 0;
  let bytes = 0;
  const walk = (p) => {
    if (!fs.existsSync(p)) return;
    for (const ent of fs.readdirSync(p, { withFileTypes: true })) {
      const full = path.join(p, ent.name);
      if (ent.isDirectory()) walk(full);
      else {
        n += 1;
        bytes += fs.statSync(full).size;
      }
    }
  };
  walk(dir);
  return { n, bytes };
}

function redactSecrets(dir) {
  const redacted = [];
  const walk = (p) => {
    if (!fs.existsSync(p)) return;
    for (const ent of fs.readdirSync(p, { withFileTypes: true })) {
      const full = path.join(p, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === 'node_modules' || ent.name === '.git') continue;
        walk(full);
        continue;
      }
      const base = ent.name.toLowerCase();
      if (SECRET_NAMES.has(base) || base.startsWith('.env')) {
        const raw = fs.readFileSync(full);
        const sha = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
        fs.writeFileSync(
          full,
          `# REDACTED in backup (${new Date().toISOString()})\n# original_sha256_16=${sha}\n# size_bytes=${raw.length}\n`,
          'utf8',
        );
        redacted.push(path.relative(mirrorDir, full).replace(/\\/g, '/'));
      }
    }
  };
  walk(dir);
  return redacted;
}

async function connect() {
  const client = new ftp.Client(60_000);
  client.ftp.verbose = false;
  await client.access({ host, user, password, secure: false });
  return client;
}

function loadProgress() {
  if (!fs.existsSync(progressPath)) return { done: {} };
  try {
    return JSON.parse(fs.readFileSync(progressPath, 'utf8'));
  } catch {
    return { done: {} };
  }
}

function saveProgress(prog) {
  fs.writeFileSync(progressPath, JSON.stringify(prog));
}

async function listDir(client, remotePath) {
  return client.list(remotePath);
}

async function downloadOne(client, remoteFile, localFile, size) {
  ensureDir(path.dirname(localFile));
  if (fs.existsSync(localFile)) {
    const st = fs.statSync(localFile);
    if (size > 0 && st.size === size) return 'skip';
    if (size <= 0 && st.size > 0) return 'skip';
  }
  await client.downloadTo(localFile, remoteFile);
  return 'ok';
}

async function walkAndDownload(remotePath, localPath, prog) {
  let client = await connect();
  let ops = 0;
  const reconnectEvery = 40;

  const visit = async (rPath, lPath) => {
    let entries;
    try {
      entries = await listDir(client, rPath);
    } catch (err) {
      console.warn(`list fail ${rPath}: ${err.message} — reconnect`);
      try {
        client.close();
      } catch {
        /* */
      }
      client = await connect();
      entries = await listDir(client, rPath);
    }

    const dirs = entries.filter((e) => e.isDirectory);
    const files = entries.filter((e) => e.isFile);

    for (const f of files) {
      const remoteFile = rPath === '/' ? `/${f.name}` : `${rPath.replace(/\/$/, '')}/${f.name}`;
      const localFile = path.join(lPath, f.name);
      const key = remoteFile;
      if (prog.done[key]) continue;

      try {
        if (ops >= reconnectEvery) {
          try {
            client.close();
          } catch {
            /* */
          }
          client = await connect();
          ops = 0;
        }
        const res = await downloadOne(client, remoteFile, localFile, f.size || 0);
        prog.done[key] = true;
        ops += 1;
        if (Object.keys(prog.done).length % 50 === 0) {
          saveProgress(prog);
          console.log(`  progress files=${Object.keys(prog.done).length} last=${remoteFile}`);
        }
        if (res === 'ok') ops += 0;
      } catch (err) {
        console.warn(`fail ${remoteFile}: ${err.message} — reconnect retry`);
        try {
          client.close();
        } catch {
          /* */
        }
        await new Promise((r) => setTimeout(r, 800));
        client = await connect();
        ops = 0;
        try {
          await downloadOne(client, remoteFile, localFile, f.size || 0);
          prog.done[key] = true;
          saveProgress(prog);
        } catch (err2) {
          console.warn(`SKIP ${remoteFile}: ${err2.message}`);
        }
      }
    }

    for (const d of dirs) {
      const remoteDir = rPath === '/' ? `/${d.name}` : `${rPath.replace(/\/$/, '')}/${d.name}`;
      const localDir = path.join(lPath, d.name);
      ensureDir(localDir);
      await visit(remoteDir, localDir);
    }
  };

  try {
    await visit(remotePath, localPath);
  } finally {
    try {
      client.close();
    } catch {
      /* */
    }
    saveProgress(prog);
  }
}

async function main() {
  if (!host || !user || !password) {
    console.error('Missing FTP_FLOWERS_* (or FTP_*) in .env');
    process.exit(1);
  }

  ensureDir(mirrorDir);
  const prog = loadProgress();
  console.log(`Local out: ${outDir}`);
  console.log(`FTP host: ${host} user: ${user}`);
  console.log(`Resume keys already done: ${Object.keys(prog.done).length}`);

  // Root listing to order priority dirs first
  let rootEntries;
  {
    const c = await connect();
    try {
      rootEntries = await c.list('/');
    } finally {
      c.close();
    }
  }

  const rootDirs = rootEntries.filter((e) => e.isDirectory).map((e) => e.name);
  const rootFiles = rootEntries.filter((e) => e.isFile);

  const orderedDirs = [
    ...PRIORITY_DIRS.filter((d) => rootDirs.includes(d)),
    ...rootDirs.filter((d) => !PRIORITY_DIRS.includes(d) && !SKIP_ROOT_DIRS.has(d)),
  ].filter((d) => {
    if (SKIP_ROOT_DIRS.has(d)) {
      console.log(`⏭ skip root /${d} (use public_html/${d} instead)`);
      return false;
    }
    return true;
  });

  // Root files first (small config)
  console.log('→ root files');
  {
    let client = await connect();
    let ops = 0;
    try {
      for (const f of rootFiles) {
        const remoteFile = `/${f.name}`;
        const localFile = path.join(mirrorDir, f.name);
        if (prog.done[remoteFile]) continue;
        try {
          if (ops >= 40) {
            client.close();
            client = await connect();
            ops = 0;
          }
          await downloadOne(client, remoteFile, localFile, f.size || 0);
          prog.done[remoteFile] = true;
          ops += 1;
        } catch (err) {
          console.warn(`root fail ${f.name}: ${err.message}`);
          try {
            client.close();
          } catch {
            /* */
          }
          client = await connect();
          ops = 0;
        }
      }
    } finally {
      try {
        client.close();
      } catch {
        /* */
      }
      saveProgress(prog);
    }
  }

  for (const name of orderedDirs) {
    console.log(`→ /${name}`);
    await walkAndDownload(`/${name}`, path.join(mirrorDir, name), prog);
  }

  const redacted = redactSecrets(mirrorDir);
  const { n, bytes } = countFiles(mirrorDir);
  const manifest = {
    created_at: new Date().toISOString(),
    source: 'old-flowers-hostinger-ftp',
    domain: 'giftshop-sa.com',
    store_id: 'store-1',
    ftp_host: host,
    ftp_user: user,
    file_count: n,
    bytes,
    dirs_found: rootDirs,
    redacted_secrets: redacted,
    note: 'Pre-delete safety backup. Domain stays on old Hostinger; hosting → central.',
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Files: ${n}  Bytes: ${bytes}`);

  const zipName = `flowers-old-hostinger-${path.basename(outDir).replace('flowers-old-hostinger-', '')}.zip`;
  const zipPath = path.join(outDir, zipName);
  console.log('Zipping…');
  const ps = spawnSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `Compress-Archive -Path '${mirrorDir.replace(/'/g, "''")}\\*' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`,
    ],
    { encoding: 'utf8', maxBuffer: 40 * 1024 * 1024 },
  );
  if (ps.status !== 0) {
    console.warn('Zip failed (mirror kept):', (ps.stderr || ps.stdout || '').slice(0, 400));
  } else {
    manifest.zip = zipName;
    manifest.zip_bytes = fs.statSync(zipPath).size;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`Zip: ${zipPath} (${manifest.zip_bytes} bytes)`);
  }

  const repoNoteDir = path.resolve(rootDir, 'docs', 'backups');
  ensureDir(repoNoteDir);
  const noteName = `flowers-old-hostinger-${path.basename(outDir).replace(/^flowers-old-hostinger-/, '')}.md`;
  const notePath = path.join(repoNoteDir, noteName);
  fs.writeFileSync(
    notePath,
    `# Flowers old Hostinger backup

- **When:** ${manifest.created_at}
- **Store:** \`store-1\` / giftshop-sa.com
- **Local:** \`backups/${path.basename(outDir)}/\` (gitignored — full mirror + zip)
- **Files / bytes:** ${n} / ${bytes}
- **Secrets:** .env* redacted (${redacted.length})
- **Purpose:** Safety before deleting old website hosting.

Commerce DB for store-1 already on central MySQL \`u393490678_ksa\`.
`,
    'utf8',
  );
  console.log(`Repo note: ${notePath}`);
  console.log('DONE');
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
