/**
 * CW-12 — Product Catalog: sort/filter/device gates, form + SF + builder (≠ slider/carousel).
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { emptyShopCatalog } from '../../../../themes/settings/coffeeModularSettings.ts';
import {
  catalogColumns,
  catalogPerPage,
  catalogShowsOnDevice,
  filterCatalogProducts,
  shopCardFlags,
  sortCatalogProducts,
} from '../../../../themes/coffeeRoasters/components/coffeeProductCatalogLogic.ts';

const rows = [
  { id: 'a', name: 'Machine A', nameAr: 'ماكينة أ', category: 'machines', basePrice: 1000, isFeatured: true, salesCount: 5, stock: 2 },
  { id: 'b', name: 'Mill B', nameAr: 'مطحنة ب', category: 'mills', basePrice: 400, salesCount: 0, stock: 0 },
  { id: 'c', name: 'Cab C', nameAr: 'خزانة ج', category: 'cabinets', basePrice: 800, isFeatured: true, salesCount: 12, stock: 4 },
];

const shop = emptyShopCatalog();
assert.equal(catalogShowsOnDevice(shop, 'desktop'), true);
assert.equal(catalogShowsOnDevice({ ...shop, enabled: false }, 'desktop'), false);
assert.equal(catalogShowsOnDevice({ ...shop, showOnMobile: false }, 'mobile'), false);
assert.equal(catalogColumns(shop, 'desktop'), 4);
assert.equal(catalogColumns({ ...shop, columnsMobile: 1 }, 'mobile'), 1);
assert.equal(catalogPerPage({ ...shop, perPage: 12 }), 12);
assert.equal(catalogPerPage({ ...shop, perPage: 2 }), 24);

const priceAsc = sortCatalogProducts(rows, 'price-asc');
assert.equal(priceAsc[0].id, 'b');
const best = sortCatalogProducts(rows, 'best_selling');
assert.equal(best[0].id, 'c');
assert.equal(sortCatalogProducts(rows, 'best_selling').every((p) => (p.salesCount || 0) > 0), true);

const filtered = filterCatalogProducts(rows, { categoryId: 'mills', onlyInStock: true });
assert.equal(filtered.length, 0, 'out-of-stock mill filtered out');
assert.equal(filterCatalogProducts(rows, { maxPrice: 500 }).map((p) => p.id).join(','), 'b');

const flags = shopCardFlags({ showWishlist: true, showAddToCart: false });
assert.equal(flags.showWishlist, true);
assert.equal(flags.showAddToCart, false);
assert.equal(flags.showPrice, true);

const formPath = join(process.cwd(), 'src/components/store/themeSettings/coffee/CoffeeProductCatalogForm.tsx');
assert.ok(existsSync(formPath), 'Product Catalog form missing');
const form = readFileSync(formPath, 'utf8');
assert.match(form, /data-product-catalog-tab/);
assert.match(form, /data-product-catalog-panel="filters"/);
assert.match(form, /data-product-catalog-panel="style"/);
assert.match(form, /data-product-catalog-panel="layout"/);
assert.match(form, /data-product-catalog-edit/);
assert.match(form, /useCoffeeDraft\('shop'\)/);
assert.equal(form.includes('productCarousel'), false, 'Catalog must not use productCarousel draft');
assert.equal(form.includes('productSlider'), false, 'Catalog must not use productSlider draft');
assert.equal(form.includes('coffeeModularSeed'), false);

const sf = readFileSync(join(process.cwd(), 'src/themes/coffeeRoasters/components/CoffeeProductCatalogSection.tsx'), 'utf8');
assert.match(sf, /data-customize-section="C-SHOP"/);
assert.equal(sf.includes('coffeeModularSeed'), false);

const page = readFileSync(join(process.cwd(), 'src/themes/coffeeRoasters/components/ProductsListPage.tsx'), 'utf8');
assert.match(page, /shopCardFlags/);
assert.match(page, /data-customize-section="C-SHOP"/);
assert.match(page, /sortCatalogProducts/);

const blocks = readFileSync(join(process.cwd(), 'src/components/store/visualBuilder/CoffeeBuilderBlocks.tsx'), 'utf8');
assert.match(blocks, /case 'product_catalog':/);
assert.match(blocks, /CoffeeProductCatalogSection|ProductCatalogBuilderPreview/);
assert.equal(
  /case 'product_catalog':[\s\S]*?FeaturedProductsPreview/.test(blocks),
  false,
  'product_catalog must not render FeaturedProductsPreview',
);

assert.ok(existsSync(join(process.cwd(), 'docs/reference/coffee-widget-ui/19-product-catalog.png')));

console.log('coffee product catalog controls ok');
