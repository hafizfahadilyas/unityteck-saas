import fs from 'fs';

const file = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
const lines = file.split('\n');

for (let i = 527; i < 1205; i++) {
  if (lines[i].includes('<section') || lines[i].includes('FEATURED_') || lines[i].includes('.map(') || lines[i].includes('h2') || lines[i].includes('h3')) {
    if (lines[i].trim().startsWith('<') || lines[i].includes('map')) {
      console.log(`L${i+1}: ${lines[i].trim().substring(0, 80)}`);
    }
  }
}
