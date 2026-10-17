import fs from 'fs';

const content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');

const catalogIdx = content.indexOf('{viewMode === \'catalog\' && (');
if (catalogIdx !== -1) {
  console.log(content.substring(catalogIdx + 5000, catalogIdx + 7000));
}
