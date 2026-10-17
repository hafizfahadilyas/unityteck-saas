import fs from 'fs';

const cur = fs.readFileSync('src/data/blecoStoreData.ts', 'utf8');
const lines = cur.split('\n');

const occurrences = [];
lines.forEach((l, idx) => {
  if (l.includes('export const SEAT_COLORS')) {
    occurrences.push(idx + 1);
  }
});
console.log('Occurrences of SEAT_COLORS at lines:', occurrences);
