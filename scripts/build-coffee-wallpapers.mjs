/**
 * Full-bleed scenic coffee wallpapers for object-fit:cover (JPG + WebP).
 * No square product cutouts — those leave white plates / letterbox on hero.
 *
 * Usage: node scripts/build-coffee-wallpapers.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imgDir = path.join(__dirname, '../public/images');

const W = 1920;
const H = 900;
const MW = 1080;
const MH = 1440;

/** Scenic sources — different crops so each slide feels unique. */
const jobs = [
  {
    out: 'coffee_wallpaper_lifestyle',
    scene: 'coffee_hero_almari_imageonly_desktop.jpg',
    position: 'centre',
  },
  {
    out: 'coffee_wallpaper_oak',
    scene: 'coffee_hero_almari_full_desktop.jpg',
    position: 'centre',
  },
  {
    out: 'coffee_wallpaper_marble',
    scene: 'coffee_hero_almari_imageonly_desktop.jpg',
    position: 'entropy',
  },
  {
    out: 'coffee_wallpaper_najdi',
    scene: 'coffee_hero_almari_full_desktop.jpg',
    position: 'right',
  },
  {
    out: 'coffee_wallpaper_villa',
    scene: 'coffee_hero_almari_imageonly_desktop.jpg',
    position: 'left',
  },
  {
    out: 'coffee_wallpaper_makkah',
    scene: 'coffee_corner_luxury_station_1791219182840.jpg',
    position: 'centre',
  },
];

async function writePair(base, desktopBuf) {
  await sharp(desktopBuf).jpeg({ quality: 84, mozjpeg: true }).toFile(`${base}_desktop.jpg`);
  await sharp(desktopBuf).webp({ quality: 80 }).toFile(`${base}_desktop.webp`);
  const mobile = await sharp(desktopBuf)
    .resize(MW, MH, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  await sharp(mobile).jpeg({ quality: 82, mozjpeg: true }).toFile(`${base}_mobile.jpg`);
  await sharp(mobile).webp({ quality: 78 }).toFile(`${base}_mobile.webp`);
  console.log(
    path.basename(base),
    `${Math.round(fs.statSync(`${base}_desktop.jpg`).size / 1024)}kb`,
    `${Math.round(fs.statSync(`${base}_desktop.webp`).size / 1024)}kb webp`,
  );
}

for (const job of jobs) {
  const scenePath = path.join(imgDir, job.scene);
  if (!fs.existsSync(scenePath)) {
    console.warn('skip missing scene', job.out, job.scene);
    continue;
  }
  const desktopBuf = await sharp(scenePath)
    .resize(W, H, { fit: 'cover', position: job.position })
    .sharpen({ sigma: 0.6 })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  await writePair(path.join(imgDir, job.out), desktopBuf);
}

console.log('done');
