/**
 * One-shot: update store-1 ownerEmail in live Hostinger SQLite via temp PHP + FTP.
 * Usage: node scripts/set-live-gift-email.js [--target=flowers|central|both]
 */

import * as ftp from 'basic-ftp';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

const NEW_EMAIL = 'p4pakistan098@gmail.com';
const STORE_ID = 'store-1';
const TMP_NAME = '_tmp_set_gift_email.php';
const OLD_EMAILS = ['giftshop2030m@gmail.com'];

const arg = process.argv.find((a) => a.startsWith('--target='));
const targetKey = (arg ? arg.split('=')[1] : 'both').toLowerCase();

function account(name, source) {
  const host = String(source.host || '').trim();
  const user = String(source.user || '').trim();
  const password = String(source.password || '').trim();
  if (!host || !user || !password) return null;
  return {
    name,
    host,
    user,
    password,
    dir: (source.dir || '/').replace(/\/$/, '') || '',
    baseUrl: (source.url || '').replace(/\/$/, ''),
  };
}

const targets = {
  flowers: account('flowers', {
    host: process.env.FTP_FLOWERS_HOST || process.env.FTP_HOST,
    user: process.env.FTP_FLOWERS_USER || process.env.FTP_USER,
    password: process.env.FTP_FLOWERS_PASSWORD || process.env.FTP_PASSWORD,
    dir: process.env.FTP_FLOWERS_DIR || process.env.FTP_REMOTE_DIR || '/public_html',
    url: process.env.FTP_FLOWERS_URL || process.env.FTP_TARGET_URL || 'https://giftshop-sa.com/',
  }),
  central: account('central', {
    host: process.env.FTP_CENTRAL_HOST,
    user: process.env.FTP_CENTRAL_USER,
    password: process.env.FTP_CENTRAL_PASSWORD,
    dir: process.env.FTP_CENTRAL_DIR || '/',
    url: process.env.FTP_CENTRAL_URL || 'https://mieraf-ksa.com/',
  }),
};

const PHP_BODY = `<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', '0');

$newEmail = ${JSON.stringify(NEW_EMAIL)};
$storeId = ${JSON.stringify(STORE_ID)};
$oldEmails = ${JSON.stringify(OLD_EMAILS)};

$candidates = [
    __DIR__ . '/api/data/platform.sqlite',
    __DIR__ . '/public/api/data/platform.sqlite',
];
$dbPath = null;
foreach ($candidates as $p) {
    if (is_file($p) && is_readable($p) && is_writable($p)) {
        $dbPath = $p;
        break;
    }
}
if ($dbPath === null) {
    foreach ($candidates as $p) {
        if (is_file($p)) {
            $dbPath = $p;
            break;
        }
    }
}
if ($dbPath === null) {
    echo json_encode(['ok' => false, 'error' => 'sqlite_not_found', 'tried' => $candidates]);
    exit;
}

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Throwable $e) {
    echo json_encode(['ok' => false, 'error' => 'pdo_failed', 'message' => $e->getMessage()]);
    exit;
}

$st = $pdo->prepare('SELECT id, data FROM stores WHERE id = ?');
$st->execute([$storeId]);
$row = $st->fetch(PDO::FETCH_ASSOC);
if (!$row) {
    echo json_encode(['ok' => false, 'error' => 'store_not_found', 'store_id' => $storeId]);
    exit;
}

$data = json_decode((string)($row['data'] ?? ''), true);
if (!is_array($data)) {
    $data = [];
}
$before = $data['ownerEmail'] ?? null;
$data['ownerEmail'] = $newEmail;
if (array_key_exists('email', $data)) {
    $data['email'] = $newEmail;
}

$upd = $pdo->prepare("UPDATE stores SET data = ?, updated_at = datetime('now') WHERE id = ?");
$upd->execute([json_encode($data, JSON_UNESCAPED_UNICODE), $storeId]);

$usersUpdated = 0;
$hasUsers = $pdo->query("SELECT 1 FROM sqlite_master WHERE type='table' AND name='users' LIMIT 1")->fetchColumn();
if ($hasUsers) {
    $cols = [];
    foreach ($pdo->query("PRAGMA table_info(users)") as $col) {
        $cols[] = $col['name'];
    }
    $sets = [];
    $params = [];
    if (in_array('email', $cols, true)) {
        $sets[] = 'email = ?';
        $params[] = $newEmail;
    }
    if (in_array('ownerEmail', $cols, true)) {
        $sets[] = 'ownerEmail = ?';
        $params[] = $newEmail;
    }
    if ($sets !== []) {
        $sql = 'UPDATE users SET ' . implode(', ', $sets) . ' WHERE store_id = ? OR id = ?';
        $params[] = $storeId;
        $params[] = 'user-' . $storeId;
        $u = $pdo->prepare($sql);
        $u->execute($params);
        $usersUpdated += $u->rowCount();
    }
    foreach ($oldEmails as $old) {
        if ($old === '' || !in_array('email', $cols, true)) {
            continue;
        }
        $u2 = $pdo->prepare('UPDATE users SET email = ? WHERE email = ?');
        $u2->execute([$newEmail, $old]);
        $usersUpdated += $u2->rowCount();
    }
}

$afterRow = $pdo->prepare('SELECT data FROM stores WHERE id = ?');
$afterRow->execute([$storeId]);
$afterData = json_decode((string)$afterRow->fetchColumn(), true);
$after = is_array($afterData) ? ($afterData['ownerEmail'] ?? null) : null;

@unlink(__FILE__);

echo json_encode([
    'ok' => true,
    'store_id' => $storeId,
    'before' => $before,
    'after' => $after,
    'users_updated' => $usersUpdated,
    'db' => basename(dirname($dbPath)) . '/' . basename($dbPath),
], JSON_UNESCAPED_UNICODE);
`;

async function openClient(target) {
  const client = new ftp.Client(90000);
  client.ftp.verbose = false;
  const base = { host: target.host, user: target.user, password: target.password };
  try {
    await client.access({ ...base, secure: true, secureOptions: { rejectUnauthorized: false } });
  } catch {
    await client.access({ ...base, secure: false });
  }
  return client;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(60000) });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 500), status: res.status };
  }
  return { status: res.status, body };
}

async function getStoreOwnerEmail(baseUrl) {
  const { body } = await fetchJson(`${baseUrl}/api/stores`);
  const list = body?.data;
  if (!Array.isArray(list)) return { error: 'invalid_stores_response', body };
  const row = list.find((s) => s.id === STORE_ID);
  return { ownerEmail: row?.ownerEmail ?? null };
}

async function runOnTarget(target) {
  const remoteRoot = target.dir.startsWith('/') ? target.dir : `/${target.dir}`;
  const remotePath = `${remoteRoot}/${TMP_NAME}`.replace(/\/{2,}/g, '/');
  const localTmp = path.join(os.tmpdir(), TMP_NAME);

  console.log(`\n=== ${target.name} (${target.baseUrl}) ===`);

  const patchTry = await fetchJson(`${target.baseUrl}/api/stores/${STORE_ID}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerEmail: NEW_EMAIL, email: NEW_EMAIL }),
  });
  console.log('PATCH /api/stores/store-1:', patchTry.status, patchTry.body?.message || patchTry.body?.ok || '');

  fs.writeFileSync(localTmp, PHP_BODY, 'utf8');
  const client = await openClient(target);
  try {
    await client.ensureDir(remoteRoot || '/');
    await client.uploadFrom(localTmp, remotePath);
    console.log('Uploaded temp PHP.');
  } finally {
    client.close();
  }

  const hitUrl = `${target.baseUrl}/${TMP_NAME}`;
  const hit = await fetchJson(hitUrl);
  console.log('Invoke temp PHP:', hit.status, JSON.stringify(hit.body));

  const client2 = await openClient(target);
  try {
    await client2.remove(remotePath);
    console.log('Removed temp PHP via FTP.');
  } catch (e) {
    console.warn('FTP remove temp PHP:', e.message);
  } finally {
    client2.close();
  }

  try {
    fs.unlinkSync(localTmp);
  } catch {
    /* ignore */
  }

  const verify = await getStoreOwnerEmail(target.baseUrl);
  console.log('Verify GET /api/stores store-1 ownerEmail:', verify.ownerEmail ?? verify.error);
  return {
    target: target.name,
    patch: patchTry,
    php: hit.body,
    ownerEmail: verify.ownerEmail,
    success: verify.ownerEmail === NEW_EMAIL,
  };
}

const selected =
  targetKey === 'both' ? ['flowers', 'central'] : targetKey === 'flowers' || targetKey === 'central' ? [targetKey] : null;

if (!selected) {
  console.error('Use --target=flowers, --target=central, or --target=both');
  process.exit(1);
}

const runList = selected.map((k) => targets[k]).filter(Boolean);
if (runList.length === 0) {
  console.error('No FTP targets configured in .env');
  process.exit(1);
}

const results = [];
for (const t of runList) {
  results.push(await runOnTarget(t));
}

const ok = results.every((r) => r.success);
console.log('\n--- Summary ---');
for (const r of results) {
  console.log(`${r.target}: ${r.success ? 'OK' : 'FAIL'} ownerEmail=${r.ownerEmail ?? '?'}`);
}
process.exit(ok ? 0 : 1);
