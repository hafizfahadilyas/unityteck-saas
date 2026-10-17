import fs from 'fs';

const bleco = fs.readFileSync('src/data/blecoStoreData.ts', 'utf8');
const lines = bleco.split('\n');
console.log('Total lines:', lines.length);
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export const')) {
    console.log(`Line ${i + 1}: ${lines[i].substring(0, 80)}`);
  }
}
