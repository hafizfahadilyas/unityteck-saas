import fs from 'fs';

const content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');

const modalIdx = content.indexOf('{selectedProduct && (');
if (modalIdx !== -1) {
  console.log(content.substring(modalIdx, modalIdx + 1600));
}
