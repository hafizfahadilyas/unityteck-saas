import fs from 'fs';

const content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');

const modalStart = content.indexOf('{selectedProduct && (() => {');
const imgIdx = content.indexOf('<img', modalStart);
console.log(content.substring(imgIdx, imgIdx + 300));
