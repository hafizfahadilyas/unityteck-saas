import fs from 'fs';

const file = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
const lines = file.split('\n');

for (let i = 1200; i < lines.length; i++) {
  if (lines[i].includes('viewMode === \'catalog\'') || lines[i].includes('selectedProduct &&')) {
    console.log(`Line ${i+1}: ${lines[i].trim()}`);
  }
}
