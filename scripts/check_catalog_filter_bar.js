import fs from 'fs';

const content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');

const filterBarStart = content.indexOf('{/* Filter Bar */}');
if (filterBarStart !== -1) {
  const filterBarEnd = content.indexOf('{/* Full Grid */}', filterBarStart);
  console.log('Filter bar from', filterBarStart, 'to', filterBarEnd);
  console.log(content.substring(filterBarStart, filterBarEnd));
}
