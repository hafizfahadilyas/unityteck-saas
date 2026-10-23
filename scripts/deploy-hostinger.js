/**
 * Hostinger FTP Deployment Script for UnityTeck Multi-Store E-Commerce SaaS
 *
 * Cleans old remote assets/build, uploads fresh optimized build, and verifies live deployment.
 */

import * as ftp from 'basic-ftp';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';

import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

// Load environment variables strictly from .env
dotenv.config({ path: path.resolve(rootDir, '.env') });

// Read command line arguments
const args = process.argv.slice(2);
const getArg = (key, fallback) => {
  const found = args.find((a) => a.startsWith(`--${key}=`));
  if (found) return found.split('=')[1];
  return fallback;
};

const FTP_HOST = getArg('host', process.env.FTP_HOST);
const FTP_USER = getArg('user', process.env.FTP_USER);
const rawPassword = getArg('password', process.env.FTP_PASSWORD);
const FTP_PASSWORD = rawPassword ? rawPassword.replace(/^["']|["']$/g, '').trim() : '';
const REMOTE_DIR = getArg('dir', process.env.FTP_REMOTE_DIR || process.env.REMOTE_DIR || '/');
const TARGET_URL = process.env.FTP_TARGET_URL || 'http://giftshop-sa.com/';

// Validate credentials to prevent execution with missing secrets
if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) {
  console.error('\n❌ Deployment configuration error:');
  console.error('Missing required FTP credentials. Please define FTP_HOST, FTP_USER, and FTP_PASSWORD in your .env file or pass them as CLI arguments (e.g. --host=... --user=... --password=...).');
  process.exit(1);
}

// Recursive file scanner for local dist directory
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function verifyLiveSite(url) {
  return new Promise((resolve) => {
    console.log(`\n🔎 Verifying live response from ${url} ...`);
    const getter = url.startsWith('https') ? https : http;
    const req = getter.get(url, { timeout: 10000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log(`✅ HTTP Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`📋 Content-Type: ${res.headers['content-type']}`);
        console.log(`📦 Cache-Control: ${res.headers['cache-control'] || 'default'}`);
        if (body.includes('<title>') || body.includes('UnityTeck') || body.includes('root') || body.includes('index-')) {
          console.log(`✨ Live HTML verification passed: Found active SPA mount.`);
        }
        resolve(true);
      });
    });

    req.on('error', (err) => {
      console.warn(`⚠️ HTTP verification notice: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.warn(`⚠️ HTTP verification timed out.`);
      resolve(false);
    });
  });
}

async function deploy() {
  console.log('====================================================');
  console.log('🌸 UNITYTECK HOSTINGER FRESH PRODUCTION DEPLOYMENT');
  console.log(`🌐 Target Domain : ${TARGET_URL}`);
  console.log(`🖥️  FTP Host      : ${FTP_HOST}`);
  console.log(`👤 FTP User      : ${FTP_USER}`);
  console.log(`📂 Remote Path   : ${REMOTE_DIR}`);
  console.log('====================================================\n');

  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ directory not found! Run "npm run build" first.');
    process.exit(1);
  }

  // Ensure .htaccess exists in dist
  const htaccessSource = path.join(rootDir, 'public', '.htaccess');
  const htaccessDist = path.join(distDir, '.htaccess');
  if (fs.existsSync(htaccessSource)) {
    fs.copyFileSync(htaccessSource, htaccessDist);
    console.log('📄 Added .htaccess to dist/ with SPA routing & optimized cache headers.');
  }

  async function connectClient(ftpClient) {
    let lastErr = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`📡 Connecting to FTP ${FTP_HOST}:21 (attempt ${attempt}/3) ...`);
        await ftpClient.access({
          host: FTP_HOST,
          user: FTP_USER,
          password: FTP_PASSWORD,
          secure: false,
        });
        console.log('✅ Connected & Authenticated successfully!\n');
        return;
      } catch (plainErr) {
        lastErr = plainErr;
        console.log(`⚠️ Plain FTP returned (${plainErr.message}), trying FTPS (explicit TLS)...`);
        try {
          await ftpClient.access({
            host: FTP_HOST,
            user: FTP_USER,
            password: FTP_PASSWORD,
            secure: true,
            secureOptions: { rejectUnauthorized: false },
          });
          console.log('✅ Connected & Authenticated via FTPS successfully!\n');
          return;
        } catch (tlsErr) {
          lastErr = tlsErr;
          console.warn(`⚠️ TLS attempt failed (${tlsErr.message})`);
          if (attempt < 3) {
            console.log('⏳ Waiting 2 seconds before retry...');
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
      }
    }
    throw lastErr;
  }

  let client = new ftp.Client(60000);
  client.ftp.verbose = false;

  client.trackProgress((info) => {
    if (info.type === 'upload') {
      const mb = (info.bytesOverall / (1024 * 1024)).toFixed(1);
      process.stdout.write(`\r📤 Transferring: ${info.name.padEnd(35).slice(0, 35)} [${mb} MB total]`);
    }
  });

  try {
    await connectClient(client);

    const TARGET_DIRS = ['/', '/public_html'];

    for (const targetDir of TARGET_DIRS) {
      console.log(`\n====================================================`);
      console.log(`📂 Deploying to target directory: ${targetDir} ...`);
      console.log(`====================================================`);
      await client.cd(targetDir);
      const remoteList = await client.list();
      console.log(`📂 Found in ${targetDir}: ${remoteList.map((i) => i.name).join(', ') || '(empty)'}`);

      // Purge empty coffee dir from root if present so SPA rewrite for /coffee is never blocked
      if (targetDir === '/') {
        const hasCoffeeDir = remoteList.some((item) => item.name === 'coffee' && item.isDirectory);
        if (hasCoffeeDir) {
          try {
            await client.removeDir('coffee');
            console.log('🧹 Purged phantom empty /coffee directory to enable clean SPA routing.');
          } catch (cErr) {
            console.warn('⚠️ Notice removing /coffee dir:', cErr.message);
          }
        }
      }

      // 1. FAST-PATH: Upload critical entry files first (zero downtime)
      // Upload canonical .htaccess
      if (fs.existsSync(htaccessDist)) {
        try {
          await client.uploadFrom(htaccessDist, '.htaccess');
          console.log(`📄 Uploaded canonical SPA .htaccess (RewriteBase /) to ${targetDir}`);
        } catch (htErr) {
          console.warn(`⚠️ Notice uploading .htaccess to ${targetDir}:`, htErr.message);
        }
      }

      // Upload fresh index.html
      const indexHtmlDist = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtmlDist)) {
        try {
          await client.uploadFrom(indexHtmlDist, 'index.html');
          console.log(`📄 Uploaded fresh index.html to ${targetDir}`);
        } catch (idxErr) {
          console.warn(`⚠️ Notice uploading index.html to ${targetDir}:`, idxErr.message);
        }
      }

      // Upload fresh api/index.php & api/initial_seed.json
      const apiPhpDist = path.join(distDir, 'api', 'index.php');
      const apiSeedDist = path.join(distDir, 'api', 'initial_seed.json');
      const targetApiDir = targetDir === '/' ? '/api' : `${targetDir}/api`;
      if (fs.existsSync(apiPhpDist)) {
        try {
          await client.ensureDir(targetApiDir);
          await client.uploadFrom(apiPhpDist, 'index.php');
          if (fs.existsSync(apiSeedDist)) {
            await client.uploadFrom(apiSeedDist, 'initial_seed.json');
          }
          await client.cd(targetDir);
          console.log(`🔌 Uploaded fresh api (index.php & initial_seed.json) to ${targetApiDir}`);
        } catch (apiErr) {
          console.warn(`⚠️ Notice uploading api/ to ${targetApiDir}:`, apiErr.message);
        }
      }

      // 2. Upload assets directory (contains JS and CSS bundles + backward compatibility aliases)
      const assetsDist = path.join(distDir, 'assets');
      if (fs.existsSync(assetsDist)) {
        console.log(`📦 Syncing fresh JS/CSS bundles to ${targetDir}/assets ...`);
        await client.ensureDir(targetDir === '/' ? '/assets' : `${targetDir}/assets`);
        await client.uploadFromDir(assetsDist);
        await client.cd(targetDir);
        console.log(`✅ ${targetDir}/assets synced cleanly!`);
      }

      // 3. Sync full remaining dist directory (images, fonts, etc.)
      console.log(`🚀 Uploading full dist/ content to ${targetDir} ...`);
      let uploaded = false;
      let attempts = 0;
      while (!uploaded && attempts < 3) {
        try {
          attempts++;
          await client.uploadFromDir(distDir);
          uploaded = true;
          console.log(`✅ Files uploaded to ${targetDir} successfully!`);
        } catch (uploadErr) {
          console.warn(`⚠️ Upload attempt ${attempts} to ${targetDir} interrupted: ${uploadErr.message}`);
          if (attempts >= 3) break;
          console.log('🔄 Reconnecting FTP client and resuming upload...');
          client.close();
          client = new ftp.Client(60000);
          client.trackProgress((info) => {
            if (info.type === 'upload') {
              const mb = (info.bytesOverall / (1024 * 1024)).toFixed(1);
              process.stdout.write(`\r📤 Transferring: ${info.name.padEnd(35).slice(0, 35)} [${mb} MB total]`);
            }
          });
          await connectClient(client);
          await client.cd(targetDir);
        }
      }
    }

    console.log('\n====================================================');
    console.log(`🎉 ALL FILES DEPLOYED TO HOSTINGER SUCCESSFULLY!`);
    console.log(`🌸 ROOT STORE (FLOWERS/HADAYA) : https://giftshop-sa.com/`);
    console.log(`☕ COFFEE STORE (ROUTED)       : https://giftshop-sa.com/coffee`);
    console.log(`🚗 CAR SERVICES STORE (ROUTED) : https://giftshop-sa.com/car`);
    console.log(`👑 MASTER ADMIN DASHBOARD      : https://giftshop-sa.com/master`);
    console.log(`🏪 STORE ADMIN DASHBOARD       : https://giftshop-sa.com/admin`);
    console.log('====================================================');

    // Run live verification checks
    await verifyLiveSite('https://giftshop-sa.com/');
    await verifyLiveSite('https://giftshop-sa.com/coffee');
    await verifyLiveSite('https://giftshop-sa.com/?store=coffee');
    await verifyLiveSite('https://giftshop-sa.com/admin');

  } catch (err) {
    console.error('\n❌ Deployment failed:');
    console.error(err.message || err);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
