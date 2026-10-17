import fs from 'fs';

const file = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
console.log('SaudiaTransportThemeView length:', file.length);
console.log('Has tabs or views:', file.includes('activeTab') || file.includes('currentView'));
const matches = file.match(/const \[activeTab[^;]+;/);
if (matches) console.log(matches[0]);
const navMatches = file.match(/handleNav[^{]+{/g);
if (navMatches) console.log(navMatches);
