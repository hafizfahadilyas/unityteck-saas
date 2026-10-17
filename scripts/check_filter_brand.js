import fs from 'fs';

const file = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
const lines = file.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('filteredProducts') || lines[i].includes('p.brand') || lines[i].includes('formMake')) {
    console.log(`L${i+1}: ${lines[i].trim()}`);
  }
}
