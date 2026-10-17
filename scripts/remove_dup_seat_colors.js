import fs from 'fs';

let cur = fs.readFileSync('src/data/blecoStoreData.ts', 'utf8');

// Find the second SEAT_COLORS and remove it
const firstIdx = cur.indexOf('export const SEAT_COLORS: SeatColorOption[] = [');
if (firstIdx !== -1) {
  const secondIdx = cur.indexOf('export const SEAT_COLORS: SeatColorOption[] = [', firstIdx + 1);
  if (secondIdx !== -1) {
    const endBlock = cur.indexOf('];', secondIdx);
    if (endBlock !== -1) {
      cur = cur.substring(0, secondIdx) + cur.substring(endBlock + 2);
      console.log('Removed duplicate SEAT_COLORS!');
      fs.writeFileSync('src/data/blecoStoreData.ts', cur, 'utf8');
    }
  }
}
