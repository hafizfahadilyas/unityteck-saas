import fs from 'fs';

const file = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
const lines = file.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('viewMode')) {
    console.log(`L${idx+1}: ${l.trim()}`);
  }
});
