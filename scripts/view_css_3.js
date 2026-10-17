import fs from 'fs';

const css = fs.readFileSync('src/themes/saudiaTransport/saudiaTransport.css', 'utf8');
console.log(css.substring(3000, 5500));
