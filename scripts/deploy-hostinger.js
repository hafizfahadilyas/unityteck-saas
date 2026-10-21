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
const FTP_PASSWORD = getArg('password', process.env.FTP_PASSWORD);
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
    console.log(`📡 Connecting to FTP ${FTP_HOST}:21 ...`);
    try {
      await ftpClient.access({
        host: FTP_HOST,
        user: FTP_USER,
        password: FTP_PASSWORD,
        secure: false,
      });
    } catch (plainErr) {
      console.log(`⚠️ Plain FTP returned (${plainErr.message}), trying FTPS (explicit TLS)...`);
      await ftpClient.access({
        host: FTP_HOST,
        user: FTP_USER,
        password: FTP_PASSWORD,
        secure: true,
        secureOptions: { rejectUnauthorized: false },
      });
    }
    console.log('✅ Connected & Authenticated successfully!\n');
  }

  let client = new ftp.Client(300000);
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

      // Clean old assets folder if it exists to purge outdated js/css bundles
      const hasAssetsDir = remoteList.some((item) => item.name === 'assets' && item.isDirectory);
      if (hasAssetsDir) {
        console.log(`🧹 Purging outdated ${targetDir}/assets directory...`);
        try {
          await client.removeDir('assets');
          console.log(`✅ ${targetDir}/assets purged cleanly.`);
        } catch (rmErr) {
          console.warn(`⚠️ Could not remove remote assets dir (${rmErr.message}), will overwrite files.`);
        }
      }

      console.log(`🚀 Uploading fresh dist/ bundle to ${targetDir} ...`);
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
          if (attempts >= 3) throw uploadErr;
          console.log('🔄 Reconnecting FTP client and resuming upload...');
          client.close();
          client = new ftp.Client(300000);
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
    console.log(`🌐 ROOT STORE (FLOWERS/HADAYA) : https://giftshop-sa.com/`);
    console.log(`🌐 COFFEE STORE (PUBLIC_HTML)  : https://giftshop-sa.com/public_html/`);
    console.log(`👑 ADMIN DASHBOARD             : https://giftshop-sa.com/admin`);
    console.log(`☕ COFFEE ADMIN                : https://giftshop-sa.com/admin?store=coffee`);
    console.log('====================================================');

    // Run live verification checks
    await verifyLiveSite('https://giftshop-sa.com/');
    await verifyLiveSite('https://giftshop-sa.com/public_html/');
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
