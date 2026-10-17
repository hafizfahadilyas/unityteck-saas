import fs from 'fs';

const file = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');

// Check imports
console.log('Imports blecoStoreData:');
const m = file.match(/import \{[\s\S]*?\} from '\.\.\/\.\.\/data\/blecoStoreData';/);
if (m) console.log(m[0]);
