import fs from 'fs';

const file = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
const lines = file.split('\n');

for (let i = 850; i < lines.length; i++) {
  if (lines[i].includes('featured-seats-section') || lines[i].includes('FEATURED_HOME_SEATS')) {
    console.log(`Found around line ${i+1}`);
    console.log(lines.slice(i, i + 80).join('\n'));
    break;
  }
}
