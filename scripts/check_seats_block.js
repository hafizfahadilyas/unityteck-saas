import fs from 'fs';

const content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');

// Find the section id="featured-seats-section" and its entire block
const startIdx = content.indexOf('<section id="featured-seats-section"');
if (startIdx !== -1) {
  const nextSectionIdx = content.indexOf('<section', startIdx + 50);
  console.log('Found featured-seats-section at', startIdx, 'next section at', nextSectionIdx);
  console.log(content.substring(startIdx, startIdx + 800));
}
