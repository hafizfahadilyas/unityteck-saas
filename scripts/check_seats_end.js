import fs from 'fs';

const content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
const startIdx = content.indexOf('<section id="featured-seats-section"');
const nextSectionIdx = content.indexOf('<section', startIdx + 50);

console.log('Section block from 56429 to', nextSectionIdx);
console.log(content.substring(nextSectionIdx - 300, nextSectionIdx + 150));
