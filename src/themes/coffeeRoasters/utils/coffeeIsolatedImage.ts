/**
 * Prefer cut-out / isolated product shots (no lifestyle BG) for cards & mega menu.
 * Hero/banner lifestyle photos stay untouched.
 */

const BY_PRODUCT_ID: Record<string, string> = {
  'hb-barista-accessories-kit': '/images/hibrew_barista_kit_isolated.jpg',
  'hb-boltfilter-58-naked': '/images/hibrew_portafilter_isolated.jpg',
  'hb-ceramic-cup-set': '/images/hibrew_ceramic_cup_isolated.jpg',
  'hb-paper-cups-500': '/images/hibrew_ceramic_cup_isolated.jpg',
  'hb-barista-smart-scale': '/images/hibrew_scale_isolated.jpg',
  'hb-barista-silver-pro': '/images/product_machine_silver_pro.png',
  'hb-h10a-dualboiler': '/images/hibrew_h7a_flagship_machine.png',
  'hb-classic-duo': '/images/product_machine_compact_black.png',
  'hb-g5-mill': '/images/hibrew_grinder_isolated.jpg',
  'hb-oak-cabinet': '/images/hibrew_cabinet_isolated.jpg',
  'hb-v60-drip': '/images/hibrew_v60_isolated.jpg',
  'hb-h4a-portable': '/images/hibrew_h4a_portable_isolated.jpg',
  'hb-drip-carafe': '/images/product_machine_drip_carafe.png',
};

const BY_PATH_FRAGMENT: Array<[RegExp, string]> = [
  [/barista_accessories|hibrew_barista_kit/i, '/images/hibrew_barista_kit_isolated.jpg'],
  [/portafilter|boltfilter/i, '/images/hibrew_portafilter_isolated.jpg'],
  [/ceramic_cup|stoneware/i, '/images/hibrew_ceramic_cup_isolated.jpg'],
  [/paper_cups/i, '/images/hibrew_ceramic_cup_isolated.jpg'],
  [/scale/i, '/images/hibrew_scale_isolated.jpg'],
  [/product_machine_silver|barista.?classic.?pro|barista.?silver/i, '/images/product_machine_silver_pro.png'],
  [/h7a|dual.?boiler|flagship_coffee_machine|hibrew_h7a/i, '/images/hibrew_h7a_flagship_machine.png'],
  [/grinder|mill|g5/i, '/images/hibrew_grinder_isolated.jpg'],
  [/cabinet|corner|oak/i, '/images/hibrew_cabinet_isolated.jpg'],
  [/v60/i, '/images/hibrew_v60_isolated.jpg'],
  [/h4a|portable|capsule/i, '/images/hibrew_h4a_portable_isolated.jpg'],
  [/drip_carafe|drip.?brewer/i, '/images/product_machine_drip_carafe.png'],
  [/delonghi|compact_black/i, '/images/product_machine_compact_black.png'],
];

/** Card / mega-menu / grid — isolated product cutout when known. */
export function coffeeIsolatedCardImage(productId?: string | null, fallbackUrl?: string | null): string {
  const id = String(productId || '').trim();
  if (id && BY_PRODUCT_ID[id]) return BY_PRODUCT_ID[id];
  const url = String(fallbackUrl || '').trim();
  if (!url) return id && BY_PRODUCT_ID[id] ? BY_PRODUCT_ID[id] : '';
  if (/_isolated\.(jpg|png|webp)|product_machine_.*\.png|hibrew_h7a_flagship|flagship_coffee_machine_5th\.png/i.test(url)) {
    return url;
  }
  for (const [re, path] of BY_PATH_FRAGMENT) {
    if (re.test(url) || re.test(id)) return path;
  }
  return url;
}
