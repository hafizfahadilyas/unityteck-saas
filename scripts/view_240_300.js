import fs from 'fs';

const content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 240; i < 300; i++) {
  console.log(`L${i+1}: ${lines[i]}`);
}
