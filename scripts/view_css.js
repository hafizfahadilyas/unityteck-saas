import fs from 'fs';

const css = fs.readFileSync('src/themes/saudiaTransport/saudiaTransport.css', 'utf8');
console.log('CSS length:', css.length);
console.log(css.substring(0, 1000));
