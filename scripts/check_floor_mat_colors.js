import fs from 'fs';

const bak = fs.readFileSync('src/data/blecoStoreData.ts.bak', 'utf8');
const matColMatch = bak.match(/export const FLOOR_MAT_COLORS[\s\S]*?\];/);
if (matColMatch) {
  console.log('FLOOR_MAT_COLORS exists in bak:');
  console.log(matColMatch[0]);
}

const typeMatch = bak.match(/export interface FloorMatColorOption[\s\S]*?\}/);
if (typeMatch) {
  console.log('FloorMatColorOption interface:');
  console.log(typeMatch[0]);
}
