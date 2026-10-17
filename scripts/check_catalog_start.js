import fs from 'fs';

const content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');

const catalogIdx = content.indexOf('{viewMode === \'catalog\' && (');
if (catalogIdx !== -1) {
  console.log('Catalog view starts at', catalogIdx);
  console.log(content.substring(catalogIdx, catalogIdx + 1200));
}
