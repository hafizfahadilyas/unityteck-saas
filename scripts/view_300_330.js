import fs from 'fs';

const content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 300; i < 330; i++) {
  console.log(`L${i+1}: ${lines[i]}`);
}
