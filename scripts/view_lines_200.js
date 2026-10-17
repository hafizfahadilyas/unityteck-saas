import fs from 'fs';

const file = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
const lines = file.split('\n');
console.log(lines.slice(200, 260).join('\n'));
