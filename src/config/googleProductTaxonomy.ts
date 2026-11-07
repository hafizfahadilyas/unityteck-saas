/**
 * Official Google product category paths (taxonomy-with-ids, en-US).
 * Stored value is the English path Google Merchant accepts. UI shows pathAr in Arabic mode.
 */
export interface GoogleTaxonomyOption {
  id: string;
  path: string;
  pathAr: string;
}

export const GOOGLE_PRODUCT_TAXONOMY: readonly GoogleTaxonomyOption[] = [
  { id: '1', path: 'Animals & Pet Supplies', pathAr: 'الحيوانات ومستلزمات الحيوانات الأليفة' },
  { id: '166', path: 'Apparel & Accessories', pathAr: 'الملابس والإكسسوارات' },
  { id: '8', path: 'Arts & Entertainment', pathAr: 'الفنون والترفيه' },
  {
    id: '2559',
    path: 'Arts & Entertainment > Party & Celebration > Gift Giving',
    pathAr: 'الفنون والترفيه > الحفلات والاحتفالات > تقديم الهدايا',
  },
  {
    id: '2899',
    path: 'Arts & Entertainment > Party & Celebration > Gift Giving > Fresh Cut Flowers',
    pathAr: 'الفنون والترفيه > الحفلات والاحتفالات > تقديم الهدايا > زهور مقطوفة طازجة',
  },
  {
    id: '53',
    path: 'Arts & Entertainment > Party & Celebration > Gift Giving > Gift Cards & Certificates',
    pathAr: 'الفنون والترفيه > الحفلات والاحتفالات > تقديم الهدايا > بطاقات وقسائم الهدايا',
  },
  {
    id: '94',
    path: 'Arts & Entertainment > Party & Celebration > Gift Giving > Gift Wrapping',
    pathAr: 'الفنون والترفيه > الحفلات والاحتفالات > تقديم الهدايا > تغليف الهدايا',
  },
  {
    id: '95',
    path: 'Arts & Entertainment > Party & Celebration > Gift Giving > Greeting & Note Cards',
    pathAr: 'الفنون والترفيه > الحفلات والاحتفالات > تقديم الهدايا > بطاقات التهنئة والملاحظات',
  },
  { id: '537', path: 'Baby & Toddler', pathAr: 'الرضع والأطفال الصغار' },
  {
    id: '5859',
    path: 'Baby & Toddler > Baby Gift Sets',
    pathAr: 'الرضع والأطفال الصغار > مجموعات هدايا الأطفال',
  },
  { id: '111', path: 'Business & Industrial', pathAr: 'الأعمال والصناعة' },
  { id: '141', path: 'Cameras & Optics', pathAr: 'الكاميرات والبصريات' },
  { id: '222', path: 'Electronics', pathAr: 'الإلكترونيات' },
  { id: '412', path: 'Food, Beverages & Tobacco', pathAr: 'الطعام والمشروبات والتبغ' },
  {
    id: '1868',
    path: 'Food, Beverages & Tobacco > Beverages > Coffee',
    pathAr: 'الطعام والمشروبات والتبغ > المشروبات > القهوة',
  },
  {
    id: '136',
    path: 'Food, Beverages & Tobacco > Food Items > Food Gift Baskets',
    pathAr: 'الطعام والمشروبات والتبغ > المواد الغذائية > سلال هدايا الطعام',
  },
  { id: '436', path: 'Furniture', pathAr: 'الأثاث' },
  {
    id: '1395',
    path: 'Furniture > Tables > Accent Tables > Coffee Tables',
    pathAr: 'الأثاث > الطاولات > طاولات جانبية > طاولات القهوة',
  },
  { id: '632', path: 'Hardware', pathAr: 'الأدوات والمعدات' },
  { id: '469', path: 'Health & Beauty', pathAr: 'الصحة والجمال' },
  { id: '536', path: 'Home & Garden', pathAr: 'المنزل والحديقة' },
  {
    id: '6936',
    path: 'Home & Garden > Decor > Dried Flowers',
    pathAr: 'المنزل والحديقة > الديكور > الزهور المجففة',
  },
  {
    id: '3988',
    path: 'Home & Garden > Kitchen & Dining > Kitchen Appliance Accessories > Coffee Maker & Espresso Machine Accessories',
    pathAr:
      'المنزل والحديقة > المطبخ والطعام > ملحقات أجهزة المطبخ > ملحقات صانعات القهوة وآلات الإسبريسو',
  },
  {
    id: '734',
    path: 'Home & Garden > Kitchen & Dining > Kitchen Appliance Accessories > Coffee Maker & Espresso Machine Accessories > Coffee Grinders',
    pathAr:
      'المنزل والحديقة > المطبخ والطعام > ملحقات أجهزة المطبخ > ملحقات صانعات القهوة وآلات الإسبريسو > مطاحن القهوة',
  },
  {
    id: '736',
    path: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines',
    pathAr: 'المنزل والحديقة > المطبخ والطعام > أجهزة المطبخ > صانعات القهوة وآلات الإسبريسو',
  },
  {
    id: '1388',
    path: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines > Drip Coffee Makers',
    pathAr:
      'المنزل والحديقة > المطبخ والطعام > أجهزة المطبخ > صانعات القهوة وآلات الإسبريسو > صانعات القهوة بالتنقيط',
  },
  {
    id: '1647',
    path: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines > Electric & Stovetop Espresso Pots',
    pathAr:
      'المنزل والحديقة > المطبخ والطعام > أجهزة المطبخ > صانعات القهوة وآلات الإسبريسو > أواني إسبريسو كهربائية وعلى الموقد',
  },
  {
    id: '2422',
    path: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines > Espresso Machines',
    pathAr: 'المنزل والحديقة > المطبخ والطعام > أجهزة المطبخ > صانعات القهوة وآلات الإسبريسو > آلات الإسبريسو',
  },
  {
    id: '1557',
    path: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines > French Presses',
    pathAr: 'المنزل والحديقة > المطبخ والطعام > أجهزة المطبخ > صانعات القهوة وآلات الإسبريسو > المكبس الفرنسي',
  },
  {
    id: '2247',
    path: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines > Percolators',
    pathAr: 'المنزل والحديقة > المطبخ والطعام > أجهزة المطبخ > صانعات القهوة وآلات الإسبريسو > أجهزة الغليان',
  },
  {
    id: '5286',
    path: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines > Vacuum Coffee Makers',
    pathAr:
      'المنزل والحديقة > المطبخ والطعام > أجهزة المطبخ > صانعات القهوة وآلات الإسبريسو > صانعات القهوة بالتفريغ',
  },
  {
    id: '6740',
    path: 'Home & Garden > Kitchen & Dining > Tableware > Coffee & Tea Sets',
    pathAr: 'المنزل والحديقة > المطبخ والطعام > أدوات المائدة > أطقم القهوة والشاي',
  },
  {
    id: '652',
    path: 'Home & Garden > Kitchen & Dining > Tableware > Coffee Servers & Tea Pots',
    pathAr: 'المنزل والحديقة > المطبخ والطعام > أدوات المائدة > أوعية تقديم القهوة وأباريق الشاي',
  },
  { id: '985', path: 'Home & Garden > Plants', pathAr: 'المنزل والحديقة > النباتات' },
  {
    id: '984',
    path: 'Home & Garden > Plants > Flowers',
    pathAr: 'المنزل والحديقة > النباتات > الزهور',
  },
  {
    id: '6762',
    path: 'Home & Garden > Plants > Indoor & Outdoor Plants',
    pathAr: 'المنزل والحديقة > النباتات > نباتات داخلية وخارجية',
  },
  {
    id: '543558',
    path: 'Home & Garden > Plants > Indoor & Outdoor Plants > Potted Houseplants',
    pathAr: 'المنزل والحديقة > النباتات > نباتات داخلية وخارجية > نباتات منزلية في أصص',
  },
  {
    id: '2802',
    path: 'Home & Garden > Plants > Seeds',
    pathAr: 'المنزل والحديقة > النباتات > البذور',
  },
  {
    id: '1684',
    path: 'Home & Garden > Plants > Trees',
    pathAr: 'المنزل والحديقة > النباتات > الأشجار',
  },
  { id: '5181', path: 'Luggage & Bags', pathAr: 'الحقائب والأمتعة' },
  { id: '783', path: 'Media', pathAr: 'الوسائط' },
  { id: '922', path: 'Office Supplies', pathAr: 'مستلزمات المكتب' },
  { id: '5605', path: 'Religious & Ceremonial', pathAr: 'الديني والطقوسي' },
  { id: '2092', path: 'Software', pathAr: 'البرمجيات' },
  { id: '988', path: 'Sporting Goods', pathAr: 'المستلزمات الرياضية' },
  { id: '1239', path: 'Toys & Games', pathAr: 'الألعاب والدمى' },
  { id: '888', path: 'Vehicles & Parts', pathAr: 'المركبات وقطع الغيار' },
  {
    id: '5613',
    path: 'Vehicles & Parts > Vehicle Parts & Accessories',
    pathAr: 'المركبات وقطع الغيار > قطع وإكسسوارات المركبات',
  },
  {
    id: '899',
    path: 'Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts',
    pathAr: 'المركبات وقطع الغيار > قطع وإكسسوارات المركبات > قطع مركبات آلية',
  },
  {
    id: '913',
    path: 'Vehicles & Parts > Vehicle Parts & Accessories > Vehicle Maintenance, Care & Decor',
    pathAr: 'المركبات وقطع الغيار > قطع وإكسسوارات المركبات > صيانة المركبات والعناية والزينة',
  },
] as const;

export function isKnownGoogleTaxonomy(value: string): boolean {
  const needle = value.trim().toLowerCase();
  if (!needle) return false;
  return GOOGLE_PRODUCT_TAXONOMY.some(
    (row) =>
      row.path.toLowerCase() === needle ||
      row.pathAr === value.trim() ||
      row.id === value.trim(),
  );
}

/** Display label for UI chrome; stored API value stays English `path`. */
export function googleTaxonomyLabel(row: GoogleTaxonomyOption, isAr: boolean): string {
  return isAr ? row.pathAr : row.path;
}
