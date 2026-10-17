import fs from 'fs';

const content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');
const modalStart = content.indexOf('{selectedProduct && (() => {');
const modalEnd = content.indexOf('})()}', modalStart) + 5;

console.log(content.substring(modalStart, modalEnd));
