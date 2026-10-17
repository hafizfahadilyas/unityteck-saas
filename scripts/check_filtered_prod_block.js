import fs from 'fs';

const content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');

const m = content.match(/const fullFilteredProducts = useMemo\(\(\) => \{[\s\S]*?\}, \[activeBrand, activeCategory, formModel, formColor, searchQuery, catalogSort\]\);/);
if (m) {
  console.log('Found fullFilteredProducts block, length:', m[0].length);
  console.log(m[0].substring(0, 300));
}
