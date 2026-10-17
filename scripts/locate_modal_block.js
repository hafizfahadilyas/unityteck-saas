import fs from 'fs';

const content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');

const modalStart = content.indexOf('{selectedProduct && (() => {');
const modalEnd = content.indexOf('})()}', modalStart) + 5;

if (modalStart !== -1 && modalEnd !== -1) {
  console.log('Found modal from', modalStart, 'to', modalEnd);
  console.log(content.substring(modalStart, modalStart + 600));
}
