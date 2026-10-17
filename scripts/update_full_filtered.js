import fs from 'fs';

let content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');

// 1. Fix fullFilteredProducts to include formMake, formYear, catalogMaterialFilter
const oldFiltered = `  const fullFilteredProducts = useMemo(() => {
    return storeCatalog.filter(product => {
      if (activeCategory) {
        if (activeCategory.id === 'cat-floors' && product.type !== 'floor-mat') return false;
        if (activeCategory.id === 'cat-clothing' && product.type !== 'seat-cover') return false;
      }
      if (activeBrand) {
        const matchesBrand = product.brand?.toLowerCase() === activeBrand.nameEn.toLowerCase() ||
                             product.brand === activeBrand.nameAr ||
                             product.tags?.some(t => t.toLowerCase() === activeBrand.nameEn.toLowerCase() || t === activeBrand.nameAr);
        if (!matchesBrand && product.brand !== 'جميع الماركات' && product.type !== 'floor-mat') return false;
      }
      if (formModel !== 'all') {
        const m = formModel.toLowerCase();
        const matchesModel = product.name.toLowerCase().includes(m) || product.tags?.some(t => t.toLowerCase().includes(m));
        if (!matchesModel && product.type === 'seat-cover') return false;
      }
      if (formColor !== 'all') {
        const matchesColor = product.name.includes(formColor) || product.tags?.some(t => t.includes(formColor));
        if (!matchesColor && product.type === 'seat-cover') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQ = product.name.toLowerCase().includes(q) || 
                         (product.brand && product.brand.toLowerCase().includes(q)) || 
                         product.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchesQ) return false;
      }
      return true;
    }).sort((a, b) => {
      const pA = a.discountedPrice || a.price;
      const pB = b.discountedPrice || b.price;
      if (catalogSort === 'price-asc') return pA - pB;
      if (catalogSort === 'price-desc') return pB - pA;
      return 0;
    });
  }, [storeCatalog, activeBrand, activeCategory, formModel, formColor, searchQuery, catalogSort]);`;

const newFiltered = `  const fullFilteredProducts = useMemo(() => {
    return storeCatalog.filter(product => {
      if (activeCategory) {
        if (activeCategory.id === 'cat-floors' && product.type !== 'floor-mat') return false;
        if (activeCategory.id === 'cat-clothing' && product.type !== 'seat-cover') return false;
      }
      if (formMake !== 'all') {
        const bLower = formMake.toLowerCase();
        const matchesMake = (product.brand && product.brand.toLowerCase() === bLower) ||
                            product.tags?.some(t => t.toLowerCase() === bLower) ||
                            (product.name && product.name.toLowerCase().includes(bLower));
        if (!matchesMake && product.type !== 'floor-mat') return false;
      } else if (activeBrand) {
        const matchesBrand = product.brand?.toLowerCase() === activeBrand.nameEn.toLowerCase() ||
                             product.brand === activeBrand.nameAr ||
                             product.tags?.some(t => t.toLowerCase() === activeBrand.nameEn.toLowerCase() || t === activeBrand.nameAr);
        if (!matchesBrand && product.brand !== 'جميع الماركات' && product.type !== 'floor-mat') return false;
      }
      if (formModel !== 'all') {
        const m = formModel.toLowerCase();
        const matchesModel = product.name.toLowerCase().includes(m) || product.tags?.some(t => t.toLowerCase().includes(m));
        if (!matchesModel && product.type === 'seat-cover') return false;
      }
      if (formYear !== 'all') {
        const yr = formYear.toLowerCase();
        const matchesYear = product.name.includes(yr) || product.tags?.some(t => t.includes(yr));
        if (!matchesYear) return false;
      }
      if (formColor !== 'all') {
        const matchesColor = product.name.includes(formColor) || product.tags?.some(t => t.includes(formColor));
        if (!matchesColor && product.type === 'seat-cover') return false;
      }
      if (catalogMaterialFilter !== 'all') {
        if (catalogMaterialFilter === 'leather' && !product.name.includes('جلد') && !product.tags?.includes('جلد')) return false;
        if (catalogMaterialFilter === 'fabric' && !product.name.includes('قماش') && !product.tags?.includes('قماش')) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQ = product.name.toLowerCase().includes(q) || 
                         (product.brand && product.brand.toLowerCase().includes(q)) || 
                         product.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchesQ) return false;
      }
      return true;
    }).sort((a, b) => {
      const pA = a.discountedPrice || a.price;
      const pB = b.discountedPrice || b.price;
      if (catalogSort === 'price-asc') return pA - pB;
      if (catalogSort === 'price-desc') return pB - pA;
      return (b.salesCount || 0) - (a.salesCount || 0);
    });
  }, [storeCatalog, activeBrand, activeCategory, formMake, formModel, formYear, formColor, catalogMaterialFilter, searchQuery, catalogSort]);`;

if (content.includes(oldFiltered)) {
  content = content.replace(oldFiltered, newFiltered);
  console.log('fullFilteredProducts updated successfully!');
} else {
  console.log('WARNING: oldFiltered not found exactly, check formatting.');
}

fs.writeFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', content, 'utf8');
