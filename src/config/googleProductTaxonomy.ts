/**
 * Official Google product category paths (taxonomy-with-ids, en-US).
 * Stored value is the path Google Merchant accepts. IDs are for reference.
 */
export interface GoogleTaxonomyOption {
  id: string;
  path: string;
}

export const GOOGLE_PRODUCT_TAXONOMY: readonly GoogleTaxonomyOption[] = [
  { id: '1', path: 'Animals & Pet Supplies' },
  { id: '166', path: 'Apparel & Accessories' },
  { id: '8', path: 'Arts & Entertainment' },
  { id: '2559', path: 'Arts & Entertainment > Party & Celebration > Gift Giving' },
  { id: '2899', path: 'Arts & Entertainment > Party & Celebration > Gift Giving > Fresh Cut Flowers' },
  { id: '53', path: 'Arts & Entertainment > Party & Celebration > Gift Giving > Gift Cards & Certificates' },
  { id: '94', path: 'Arts & Entertainment > Party & Celebration > Gift Giving > Gift Wrapping' },
  { id: '95', path: 'Arts & Entertainment > Party & Celebration > Gift Giving > Greeting & Note Cards' },
  { id: '537', path: 'Baby & Toddler' },
  { id: '5859', path: 'Baby & Toddler > Baby Gift Sets' },
  { id: '111', path: 'Business & Industrial' },
  { id: '141', path: 'Cameras & Optics' },
  { id: '222', path: 'Electronics' },
  { id: '412', path: 'Food, Beverages & Tobacco' },
  { id: '1868', path: 'Food, Beverages & Tobacco > Beverages > Coffee' },
  { id: '136', path: 'Food, Beverages & Tobacco > Food Items > Food Gift Baskets' },
  { id: '436', path: 'Furniture' },
  { id: '1395', path: 'Furniture > Tables > Accent Tables > Coffee Tables' },
  { id: '632', path: 'Hardware' },
  { id: '469', path: 'Health & Beauty' },
  { id: '536', path: 'Home & Garden' },
  { id: '6936', path: 'Home & Garden > Decor > Dried Flowers' },
  { id: '3988', path: 'Home & Garden > Kitchen & Dining > Kitchen Appliance Accessories > Coffee Maker & Espresso Machine Accessories' },
  { id: '734', path: 'Home & Garden > Kitchen & Dining > Kitchen Appliance Accessories > Coffee Maker & Espresso Machine Accessories > Coffee Grinders' },
  { id: '736', path: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines' },
  { id: '1388', path: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines > Drip Coffee Makers' },
  { id: '1647', path: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines > Electric & Stovetop Espresso Pots' },
  { id: '2422', path: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines > Espresso Machines' },
  { id: '1557', path: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines > French Presses' },
  { id: '2247', path: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines > Percolators' },
  { id: '5286', path: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines > Vacuum Coffee Makers' },
  { id: '6740', path: 'Home & Garden > Kitchen & Dining > Tableware > Coffee & Tea Sets' },
  { id: '652', path: 'Home & Garden > Kitchen & Dining > Tableware > Coffee Servers & Tea Pots' },
  { id: '985', path: 'Home & Garden > Plants' },
  { id: '984', path: 'Home & Garden > Plants > Flowers' },
  { id: '6762', path: 'Home & Garden > Plants > Indoor & Outdoor Plants' },
  { id: '543558', path: 'Home & Garden > Plants > Indoor & Outdoor Plants > Potted Houseplants' },
  { id: '2802', path: 'Home & Garden > Plants > Seeds' },
  { id: '1684', path: 'Home & Garden > Plants > Trees' },
  { id: '5181', path: 'Luggage & Bags' },
  { id: '783', path: 'Media' },
  { id: '922', path: 'Office Supplies' },
  { id: '5605', path: 'Religious & Ceremonial' },
  { id: '2092', path: 'Software' },
  { id: '988', path: 'Sporting Goods' },
  { id: '1239', path: 'Toys & Games' },
  { id: '888', path: 'Vehicles & Parts' },
  { id: '5613', path: 'Vehicles & Parts > Vehicle Parts & Accessories' },
  { id: '899', path: 'Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts' },
  { id: '913', path: 'Vehicles & Parts > Vehicle Parts & Accessories > Vehicle Maintenance, Care & Decor' },
] as const;

export function isKnownGoogleTaxonomy(value: string): boolean {
  const needle = value.trim().toLowerCase();
  if (!needle) return false;
  return GOOGLE_PRODUCT_TAXONOMY.some(
    (row) => row.path.toLowerCase() === needle || row.id === value.trim(),
  );
}
