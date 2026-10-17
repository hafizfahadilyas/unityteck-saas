import fs from 'fs';

const file = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
const lines = file.split('\n');

for (let i = 1205; i < lines.length; i++) {
  if (lines[i].includes('cardSelectedColors') || lines[i].includes('currentImage') || lines[i].includes('activeColor')) {
    console.log(`L${i+1}: ${lines[i].trim()}`);
  }
}
