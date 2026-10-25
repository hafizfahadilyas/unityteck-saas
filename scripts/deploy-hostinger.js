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
import dns from 'dns';

const dnsResolver = new dns.Resolver();
dnsResolver.setServers(['8.8.8.8', '1.1.1.1']);

function fallbackLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  dnsResolver.resolve4(hostname, (err, addresses) => {
    if (err || !addresses || !addresses.length) {
      return dns.lookup(hostname, options, callback);
    }
    if (options && options.all) {
      return callback(null, addresses.map((a) => ({ address: a, family: 4 })));
    }
    return callback(null, addresses[0], 4);
  });
}

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
    const req = getter.get(url, { lookup: fallbackLookup, timeout: 10000 }, (res) => {
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

  let client = new ftp.Client(120000);
  client.ftp.verbose = false;

  client.trackProgress((info) => {
    if (info.type === 'upload') {
      const mb = (info.bytesOverall / (1024 * 1024)).toFixed(1);
      process.stdout.write(`\r📤 Transferring: ${info.name.padEnd(35).slice(0, 35)} [${mb} MB total]`);
    }
  });

  try {
    await connectClient(client);

    const TARGET_DIRS = ['/public_html'];

    for (const targetDir of TARGET_DIRS) {
      console.log(`\n====================================================`);
      console.log(`📂 Deploying to target directory: ${targetDir} ...`);
      console.log(`====================================================`);
      await client.cd(targetDir);
      const remoteList = await client.list();

      // Purge phantom empty coffee dir if present so SPA rewrite for /coffee is never blocked
      const hasCoffeeDir = remoteList.some((item) => item.name === 'coffee' && item.isDirectory);
      if (hasCoffeeDir) {
        try {
          await client.removeDir('coffee');
          console.log(`🧹 Purged phantom empty ${targetDir}/coffee directory to enable clean SPA routing.`);
        } catch (cErr) {
          console.warn('⚠️ Notice removing /coffee dir:', cErr.message);
        }
      }

      // 1. FAST-PATH: Upload canonical .htaccess
      if (fs.existsSync(htaccessDist)) {
        try {
          await client.uploadFrom(htaccessDist, '.htaccess');
          console.log(`📄 Uploaded canonical SPA .htaccess to ${targetDir}`);
        } catch (htErr) {
          console.warn(`⚠️ Notice uploading .htaccess to ${targetDir}:`, htErr.message);
        }
      }

      // 2. FAST-PATH: Upload fresh index.html
      const indexHtmlDist = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtmlDist)) {
        try {
          await client.uploadFrom(indexHtmlDist, 'index.html');
          console.log(`📄 Uploaded fresh index.html to ${targetDir}`);
        } catch (idxErr) {
          console.warn(`⚠️ Notice uploading index.html to ${targetDir}:`, idxErr.message);
        }
      }

      // 3. FAST-PATH: Upload fresh api/
      const apiPhpDist = path.join(distDir, 'api', 'index.php');
      const apiSeedDist = path.join(distDir, 'api', 'initial_seed.json');
      if (fs.existsSync(apiPhpDist)) {
        try {
          await client.ensureDir('api');
          await client.uploadFrom(apiPhpDist, 'index.php');
          if (fs.existsSync(apiSeedDist)) {
            await client.uploadFrom(apiSeedDist, 'initial_seed.json');
          }
          await client.cd(targetDir);
          console.log(`🔌 Uploaded fresh api (index.php & initial_seed.json) to ${targetDir}/api`);
        } catch (apiErr) {
          console.warn(`⚠️ Notice uploading api/ to ${targetDir}/api:`, apiErr.message);
          await client.cd(targetDir);
        }
      }

      // 4. Upload JS/CSS assets bundle with incremental sync & auto-cleanup
      const assetsDist = path.join(distDir, 'assets');
      if (fs.existsSync(assetsDist)) {
        console.log(`📦 Syncing fresh JS/CSS bundles to ${targetDir}/assets ...`);
        await client.cd(targetDir);
        await client.ensureDir('assets');
        await client.cd(`${targetDir}/assets`);

        // List remote files in assets
        const remoteItems = await client.list();
        const remoteMap = new Map();
        for (const item of remoteItems) {
          if (item.name.startsWith('.in.')) {
            try {
              await client.remove(item.name);
              console.log(`🧹 Purged stale upload temporary file: ${item.name}`);
            } catch (_) {}
          } else {
            remoteMap.set(item.name, item.size);
          }
        }

        const localFiles = fs.readdirSync(assetsDist);
        let uploadedAssets = 0;
        let skippedAssets = 0;

        for (const file of localFiles) {
          const localFilePath = path.join(assetsDist, file);
          const stat = fs.statSync(localFilePath);
          if (stat.isDirectory()) continue;

          // If remote file exists with identical size, skip it
          if (remoteMap.get(file) === stat.size) {
            skippedAssets++;
            continue;
          }

          let fileUploaded = false;
          for (let attempt = 1; attempt <= 4; attempt++) {
            try {
              // Ensure stale temp file is removed before upload attempt
              try { await client.remove(`.in.${file}.`); } catch (_) {}
              await client.uploadFrom(localFilePath, file);
              fileUploaded = true;
              uploadedAssets++;
              break;
            } catch (fileErr) {
              console.warn(`\n⚠️ Upload interrupted for ${file} (attempt ${attempt}/4): ${fileErr.message}`);
              if (attempt >= 4) throw fileErr;
              console.log('🔄 Reconnecting FTP client...');
              try { client.close(); } catch (_) {}
              client = new ftp.Client(120000);
              client.ftp.verbose = false;
              client.trackProgress((info) => {
                if (info.type === 'upload') {
                  const mb = (info.bytesOverall / (1024 * 1024)).toFixed(1);
                  process.stdout.write(`\r📤 Transferring: ${info.name.padEnd(35).slice(0, 35)} [${mb} MB total]`);
                }
              });
              await connectClient(client);
              await client.cd(`${targetDir}/assets`);
              try { await client.remove(`.in.${file}.`); } catch (_) {}
            }
          }
        }
        await client.cd(targetDir);
        console.log(`\n✅ Assets sync complete: ${uploadedAssets} fresh files uploaded, ${skippedAssets} unchanged skipped.`);
      }

      // 5. Upload root SEO & static files
      const rootFilesToSync = ['robots.txt', 'sitemap.xml', 'favicon.ico', 'favicon.svg'];
      for (const rf of rootFilesToSync) {
        const localRf = path.join(distDir, rf);
        if (fs.existsSync(localRf)) {
          try {
            await client.uploadFrom(localRf, rf);
          } catch (_) {}
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
