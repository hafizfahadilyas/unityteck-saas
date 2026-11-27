import fs from 'fs';
import path from 'path';
import * as ftp from 'basic-ftp';
import dotenv from 'dotenv';

dotenv.config();

const ftpConfig = {
  host: process.env.FTP_CENTRAL_HOST || process.env.FTP_HOST || '195.35.43.149',
  user: process.env.FTP_CENTRAL_USER || process.env.FTP_USER || 'u393490678',
  password: process.env.FTP_CENTRAL_PASSWORD || process.env.FTP_PASSWORD || 'E-Commerce2026@Hostinger',
  port: parseInt(process.env.FTP_CENTRAL_PORT || process.env.FTP_PORT || '21', 10),
  secure: false,
};

async function main() {
  const client = new ftp.Client(30000);
  console.log('Connecting to FTP for API and Payment Methods deploy...');
  await client.access(ftpConfig);
  console.log('Connected!');

  // 1. Upload public/api/index.php and master_control_center_ops.php
  const apiFiles = [
    { local: 'public/api/index.php', rel: 'index.php' },
    { local: 'public/api/master_control_center_ops.php', rel: 'master_control_center_ops.php' },
  ];
  const apiTargetDirs = ['/api', '/public_html/api'];
  for (const dir of apiTargetDirs) {
    try {
      await client.ensureDir(dir);
      await client.cd(dir);
      for (const f of apiFiles) {
        if (fs.existsSync(f.local)) {
          await client.uploadFrom(f.local, f.rel);
          console.log(`✓ Uploaded API file to ${dir}/${f.rel}`);
        }
      }
    } catch (e) {
      console.warn(`API upload error for ${dir}:`, e.message);
    }
  }

  // 2. Upload payment methods
  const pmDir = 'public/payment-methods';
  const pmFiles = fs.readdirSync(pmDir);
  console.log(`\nFound ${pmFiles.length} payment method files in ${pmDir}`);

  const pmTargets = [
    '/payment-methods',
    '/public_html/payment-methods',
    '/souq-default/payment-methods',
    '/public_html/souq-default/payment-methods',
  ];

  for (const targetDir of pmTargets) {
    try {
      await client.ensureDir(targetDir);
      await client.cd(targetDir);
      for (const f of pmFiles) {
        const localPath = path.join(pmDir, f);
        await client.uploadFrom(localPath, f);
      }
      console.log(`✓ Uploaded all payment methods to ${targetDir}`);
    } catch (e) {
      console.warn(`Payment methods upload error for ${targetDir}:`, e.message);
    }
  }

  client.close();
  console.log('\nDeploy complete! Running probe...');
}

main().catch(console.error);
