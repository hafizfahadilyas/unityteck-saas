import fs from 'fs';

const file = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
const lines = file.split('\n');

for (let i = 0; i < 200; i++) {
  if (lines[i].includes('const [') || lines[i].includes('function') || lines[i].includes('return (')) {
    console.log(`L${i+1}: ${lines[i].trim()}`);
  }
}
