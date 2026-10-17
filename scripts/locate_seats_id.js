import fs from 'fs';

const file = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
const lines = file.split('\n');

for (let i = 1000; i < lines.length; i++) {
  if (lines[i].includes('id="featured-seats-section"')) {
    console.log(`Found id="featured-seats-section" at line ${i+1}`);
    console.log(lines.slice(i, i + 100).join('\n'));
    break;
  }
}
