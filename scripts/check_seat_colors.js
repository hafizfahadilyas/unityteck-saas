import fs from 'fs';

const bleco = fs.readFileSync('src/data/blecoStoreData.ts', 'utf8');
const colMatch = bleco.match(/export const SEAT_COLORS: SeatColorOption\[\] = \[([\s\S]*?)\];/);
if (colMatch) {
  console.log(colMatch[0]);
}
