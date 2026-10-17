import fs from 'fs';

const file = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
const lines = file.split('\n');

for (let i = 200; i < 400; i++) {
  if (lines[i].includes('viewMode ===') || lines[i].includes('filteredProducts') || lines[i].includes('homeProducts') || lines[i].includes('slice')) {
    console.log(`L${i+1}: ${lines[i].trim()}`);
  }
}
