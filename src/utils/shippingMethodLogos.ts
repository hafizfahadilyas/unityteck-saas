/**
 * Official shipping-method / courier PNGs (public/shipping-methods).
 * Source pack: طرق الشحن
 */

export type ShippingCourierLogoId =
  | 'aramex'
  | 'aymakan'
  | 'dhl'
  | 'jt'
  | 'redbox'
  | 'smsa';

export type ShippingCourierOption = {
  id: ShippingCourierLogoId;
  code: string;
  labelEn: string;
  labelAr: string;
  logoSrc: string;
};

const BASE = '/shipping-methods';

/** Map courier code → PNG in /public/shipping-methods */
export const SHIPPING_METHOD_LOGO: Record<ShippingCourierLogoId, string> = {
  aramex: `${BASE}/aramex.png`,
  aymakan: `${BASE}/aymakan.png`,
  dhl: `${BASE}/dhl-express.png`,
  jt: `${BASE}/jt-express.png`,
  redbox: `${BASE}/redbox.png`,
  smsa: `${BASE}/smsa.png`,
};

/** Dashboard / checkout courier tiles from طرق الشحن pack. */
export const SHIPPING_COURIER_OPTIONS: ShippingCourierOption[] = [
  {
    id: 'redbox',
    code: 'redbox',
    labelEn: 'RedBox',
    labelAr: 'ريدبوكس',
    logoSrc: SHIPPING_METHOD_LOGO.redbox,
  },
  {
    id: 'smsa',
    code: 'smsa',
    labelEn: 'SMSA Express',
    labelAr: 'سمسا إكسبريس',
    logoSrc: SHIPPING_METHOD_LOGO.smsa,
  },
  {
    id: 'aramex',
    code: 'aramex',
    labelEn: 'Aramex',
    labelAr: 'أرامكس',
    logoSrc: SHIPPING_METHOD_LOGO.aramex,
  },
  {
    id: 'aymakan',
    code: 'aymakan',
    labelEn: 'AyMakan',
    labelAr: 'أي مكان',
    logoSrc: SHIPPING_METHOD_LOGO.aymakan,
  },
  {
    id: 'dhl',
    code: 'dhl',
    labelEn: 'DHL Express',
    labelAr: 'دي إتش إل إكسبريس',
    logoSrc: SHIPPING_METHOD_LOGO.dhl,
  },
  {
    id: 'jt',
    code: 'jt',
    labelEn: 'J&T Express',
    labelAr: 'جيه آند تي إكسبريس',
    logoSrc: SHIPPING_METHOD_LOGO.jt,
  },
];

const CODE_ALIASES: Record<string, ShippingCourierLogoId> = {
  aramex: 'aramex',
  arx: 'aramex',
  aymakan: 'aymakan',
  aymalan: 'aymakan',
  dhl: 'dhl',
  'dhl-express': 'dhl',
  dhlexpress: 'dhl',
  jt: 'jt',
  'j&t': 'jt',
  'jt-express': 'jt',
  jtexpress: 'jt',
  redbox: 'redbox',
  'red-box': 'redbox',
  smsa: 'smsa',
};

/** Resolve logo path from courier_code, provider, or method name. */
export function shippingMethodLogoSrc(
  codeOrName: string | undefined | null,
): string | null {
  if (!codeOrName) return null;
  const raw = codeOrName.trim().toLowerCase();
  if (!raw) return null;

  const compact = raw.replace(/[\s_]+/g, '-');
  const keyed =
    CODE_ALIASES[compact] ||
    CODE_ALIASES[raw.replace(/[^a-z0-9&]/g, '')];
  if (keyed) return SHIPPING_METHOD_LOGO[keyed];

  if (raw.includes('aramex') || raw.includes('أرامكس')) return SHIPPING_METHOD_LOGO.aramex;
  if (
    raw.includes('aymakan') ||
    raw.includes('aymalan') ||
    raw.includes('أي مكان') ||
    raw.includes('ايمكان')
  ) {
    return SHIPPING_METHOD_LOGO.aymakan;
  }
  if (raw.includes('dhl') || raw.includes('دي إتش إل') || raw.includes('دي اتش ال')) {
    return SHIPPING_METHOD_LOGO.dhl;
  }
  if (
    raw.includes('j&t') ||
    raw.includes('j and t') ||
    /(^|[^a-z])jt([^a-z]|$)/.test(raw) ||
    raw.includes('جيه')
  ) {
    return SHIPPING_METHOD_LOGO.jt;
  }
  if (raw.includes('redbox') || raw.includes('ريدبوكس')) return SHIPPING_METHOD_LOGO.redbox;
  if (raw.includes('smsa') || raw.includes('سمسا')) return SHIPPING_METHOD_LOGO.smsa;

  return null;
}
