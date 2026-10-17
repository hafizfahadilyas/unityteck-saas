import fs from 'fs';

const file = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
const lines = file.split('\n');

console.log('--- CATALOG VIEW (1426 - 1500) ---');
console.log(lines.slice(1425, 1495).join('\n'));

console.log('--- QUICK VIEW MODAL (1695 - 1765) ---');
console.log(lines.slice(1694, 1765).join('\n'));
