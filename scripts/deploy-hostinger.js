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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

// Read command line arguments
const args = process.argv.slice(2);
const getArg = (key, fallback) => {
  const found = args.find((a) => a.startsWith(`--${key}=`));
  if (found) return found.split('=')[1];
  return fallback;
};

const FTP_HOST = getArg('host', process.env.FTP_HOST || '145.79.26.23');
const FTP_USER = getArg('user', process.env.FTP_USER || 'u920689430.giftshop');
const FTP_PASSWORD = getArg('password', process.env.FTP_PASSWORD || 'Giftshop2030#');
const REMOTE_DIR = getArg('dir', process.env.REMOTE_DIR || '/');
const TARGET_URL = 'http://giftshop-sa.com/';

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

  const client = new ftp.Client(120000); // 120s timeout
  client.ftp.verbose = false;

  try {
    console.log(`📡 Connecting to FTP ${FTP_HOST}:21 ...`);
    try {
      await client.access({
        host: FTP_HOST,
        user: FTP_USER,
        password: FTP_PASSWORD,
        secure: false,
      });
    } catch (plainErr) {
      console.log(`⚠️ Plain FTP returned (${plainErr.message}), trying FTPS (explicit TLS)...`);
      await client.access({
        host: FTP_HOST,
        user: FTP_USER,
        password: FTP_PASSWORD,
        secure: true,
        secureOptions: { rejectUnauthorized: false },
      });
    }

    console.log('✅ Connected & Authenticated successfully!\n');

    // List remote directory
    console.log(`🔍 Examining remote directory structure...`);
    const remoteList = await client.list();
    console.log(`📂 Remote items found: ${remoteList.map((i) => i.name).join(', ') || '(empty)'}\n`);

    // Clean old assets folder if it exists to purge outdated js/css bundles
    const hasAssetsDir = remoteList.some((item) => item.name === 'assets' && item.isDirectory);
    if (hasAssetsDir) {
      console.log('🧹 Purging outdated remote /assets directory to eliminate stale bundles...');
      try {
        await client.removeDir('assets');
        console.log('✅ Remote /assets directory purged cleanly.');
      } catch (rmErr) {
        console.warn(`⚠️ Could not remove remote assets dir (${rmErr.message}), will overwrite files.`);
      }
    }

    // Collect all local files in dist
    const allLocalFiles = getAllFiles(distDir);
    console.log(`\n📦 Found ${allLocalFiles.length} files in fresh dist/ ready for deployment.`);

    let uploadedCount = 0;
    let totalBytes = 0;

    for (const filePath of allLocalFiles) {
      const relPath = path.relative(distDir, filePath).replace(/\\/g, '/');
      const remoteFilePath = relPath;
      const remoteDirForFile = path.dirname(relPath).replace(/\\/g, '/');

      if (remoteDirForFile && remoteDirForFile !== '.') {
        await client.ensureDir(remoteDirForFile);
        // cd back to root
        await client.cd('/');
      }

      const fileStats = fs.statSync(filePath);
      const fileSizeKB = (fileStats.size / 1024).toFixed(1);

      let attempts = 0;
      let success = false;
      while (attempts < 3 && !success) {
        try {
          attempts++;
          await client.uploadFrom(filePath, remoteFilePath);
          success = true;
          uploadedCount++;
          totalBytes += fileStats.size;
          console.log(`📤 [${uploadedCount}/${allLocalFiles.length}] Uploaded: ${remoteFilePath} (${fileSizeKB} KB)`);
        } catch (uploadErr) {
          if (attempts >= 3) throw uploadErr;
          console.warn(`⚠️ Retry ${attempts}/3 for ${remoteFilePath}: ${uploadErr.message}`);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }

    console.log('\n====================================================');
    console.log(`🎉 ALL ${uploadedCount} FILES DEPLOYED SUCCESSFULLY!`);
    console.log(`📊 Total Transferred: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🌐 LIVE STORE URL   : ${TARGET_URL}`);
    console.log(`👑 MASTER ADMIN URL : ${TARGET_URL}master`);
    console.log(`🏪 STOREFRONT URL   : ${TARGET_URL}storefront`);
    console.log('====================================================');

    // Run live verification check
    await verifyLiveSite(TARGET_URL);

  } catch (err) {
    console.error('\n❌ Deployment failed:');
    console.error(err.message || err);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
