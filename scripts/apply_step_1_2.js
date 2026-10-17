import fs from 'fs';

let content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');

// 1. Update imports
content = content.replace(
  "FEATURED_HOME_SEATS,",
  "TOP_10_SEAT_COVERS,\n  HOME_PAGE_PRODUCTS,\n  FEATURED_HOME_SEATS,"
);

// 2. Add new states after "const [filterFeedback, setFilterFeedback] = useState<string | null>(null);"
const stateTarget = "const [filterFeedback, setFilterFeedback] = useState<string | null>(null);";
const stateAdd = `const [filterFeedback, setFilterFeedback] = useState<string | null>(null);
  const [homeSeatDisplayLimit, setHomeSeatDisplayLimit] = useState(24);
  const [selectedProductGalleryImg, setSelectedProductGalleryImg] = useState<string | null>(null);
  const [catalogMaterialFilter, setCatalogMaterialFilter] = useState<'all' | 'leather' | 'fabric'>('all');`;

content = content.replace(stateTarget, stateAdd);

console.log('Step 1 & 2 applied.');
fs.writeFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', content, 'utf8');
