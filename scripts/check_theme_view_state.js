import fs from 'fs';

const file = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');

console.log('File has TOP_10_SEAT_COVERS import:', file.includes('TOP_10_SEAT_COVERS'));
console.log('File has HOME_PAGE_PRODUCTS import:', file.includes('HOME_PAGE_PRODUCTS'));
console.log('File lines count:', file.split('\n').length);
