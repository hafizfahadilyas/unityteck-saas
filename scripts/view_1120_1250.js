import fs from 'fs';

const content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 1120; i < 1250; i++) {
  console.log(`L${i+1}: ${lines[i]}`);
}
