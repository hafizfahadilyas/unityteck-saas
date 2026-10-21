/**
 * Logistics Barcode & Shipping Waybill Utility (Code 128 & Carrier Specifications)
 * Produces crisp, standalone SVG Barcodes (Code 128 / Code 39) with carrier logos & styling
 * for Saudi national logistics couriers: SMSA Express, SPL (Saudi Post), Aramex, and DHL.
 */

export type CourierCarrierCode = 'smsa' | 'spl' | 'aramex' | 'dhl' | 'generic';

export interface ShippingLabelData {
  carrier: CourierCarrierCode;
  carrierName: string;
  carrierNameAr: string;
  trackingNumber: string;
  awbNumber: string;
  orderNumber: string;
  orderDate: string;
  sender: {
    name: string;
    nameAr?: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  recipient: {
    name: string;
    nameAr?: string;
    phone: string;
    altPhone?: string;
    address: string;
    city: string;
    district?: string;
    postalCode?: string;
    country: string;
  };
  packageDetails: {
    weightKg: number;
    pieces: number;
    contentDescription: string;
    contentDescriptionAr?: string;
    declaredValueSar: number;
    dimensionsCm?: string;
  };
  payment: {
    method: 'prepaid' | 'cod';
    codAmountSar?: number;
    currency: string;
  };
  routing: {
    hubCode: string; // e.g. "JED-HUB-01", "RUH-CENTRAL", "MAK-VIP"
    serviceType: string; // "Express Delivery", "Next Day AM", "SND (Same Day)"
    serviceTypeAr?: string;
    routeCode: string; // e.g. "SA-MAK-098"
  };
}

/**
 * Encodes an alphanumeric string into Code 128B barcode pattern
 * Code 128 specifies variable width bars (1 to 4 modules) for high scanning reliability.
 */
const CODE128_PATTERNS: Record<number, string> = {
  0: '212222', 1: '222122', 2: '222221', 3: '121223', 4: '121322',
  5: '131222', 6: '122213', 7: '122312', 8: '132212', 9: '221213',
  10: '221312', 11: '231212', 12: '112232', 13: '122132', 14: '122231',
  15: '113222', 16: '123122', 17: '123221', 18: '223211', 19: '221132',
  20: '221231', 21: '213212', 22: '223112', 23: '312131', 24: '311222',
  25: '321122', 26: '321221', 27: '312212', 28: '322112', 29: '322211',
  30: '212123', 31: '212321', 32: '232121', 33: '111323', 34: '131123',
  35: '131321', 36: '112313', 37: '132113', 38: '132311', 39: '211313',
  40: '231113', 41: '231311', 42: '112133', 43: '112331', 44: '132131',
  45: '113123', 46: '113321', 47: '133121', 48: '313121', 49: '211331',
  50: '231131', 51: '213113', 52: '213311', 53: '213131', 54: '311123',
  55: '311321', 56: '331121', 57: '312113', 58: '312311', 59: '332111',
  60: '314111', 61: '221411', 62: '431111', 63: '111224', 64: '111422',
  65: '121124', 66: '121421', 67: '141122', 68: '141221', 69: '112214',
  70: '112412', 71: '122114', 72: '122411', 73: '142112', 74: '142211',
  75: '241211', 76: '221114', 77: '413111', 78: '241112', 79: '134111',
  80: '111242', 81: '121142', 82: '121241', 83: '114212', 84: '124112',
  85: '124211', 86: '411212', 87: '421112', 88: '421211', 89: '212141',
  90: '214121', 91: '412121', 92: '111143', 93: '111341', 94: '131141',
  95: '114113', 96: '114311', 97: '411113', 98: '411311', 99: '113141',
  100: '114131', 101: '311141', 102: '411131', 103: '211412', 104: '211214', // Start B
  105: '211232', 106: '2331112', // Stop
};

/**
 * Generates an SVG Data URI or inline SVG string for Code 128 barcode
 */
export function generateCode128Svg(
  text: string,
  options: {
    height?: number;
    barWidth?: number;
    showText?: boolean;
    fillColor?: string;
  } = {}
): string {
  const { height = 54, barWidth = 2, showText = true, fillColor = '#000000' } = options;
  const clean = text.trim();

  // Start with Start Code B (104)
  const patternCodes: number[] = [104];
  let checkSum = 104;

  for (let i = 0; i < clean.length; i++) {
    const ascii = clean.charCodeAt(i);
    const code = ascii - 32; // Code 128B mapping
    if (code >= 0 && code <= 95) {
      patternCodes.push(code);
      checkSum += code * (i + 1);
    }
  }

  // Modulo 103 checksum
  patternCodes.push(checkSum % 103);
  // Stop code (106)
  patternCodes.push(106);

  // Convert pattern codes to bars
  let fullPattern = '';
  for (const c of patternCodes) {
    fullPattern += CODE128_PATTERNS[c] || '212222';
  }

  let totalModules = 0;
  for (let i = 0; i < fullPattern.length; i++) {
    totalModules += parseInt(fullPattern[i], 10);
  }

  const quietZone = 10;
  const svgWidth = (totalModules + quietZone * 2) * barWidth;
  const svgHeight = height + (showText ? 18 : 0);

  let currentX = quietZone * barWidth;
  let rects = '';
  let isBar = true;

  for (let i = 0; i < fullPattern.length; i++) {
    const width = parseInt(fullPattern[i], 10) * barWidth;
    if (isBar) {
      rects += `<rect x="${currentX}" y="0" width="${width}" height="${height}" fill="${fillColor}" />`;
    }
    currentX += width;
    isBar = !isBar;
  }

  const textElement = showText
    ? `<text x="${svgWidth / 2}" y="${height + 14}" text-anchor="middle" font-family="monospace, monospace" font-size="12" font-weight="bold" fill="${fillColor}">${clean}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" shape-rendering="crispEdges"><rect width="${svgWidth}" height="${svgHeight}" fill="#ffffff"/>${rects}${textElement}</svg>`;
}

/**
 * Returns formatted carrier brand metadata & official colors
 */
export function getCarrierBrand(carrier: CourierCarrierCode | string): {
  code: CourierCarrierCode;
  nameEn: string;
  nameAr: string;
  primaryColor: string;
  accentColor: string;
  logoBg: string;
  badgeText: string;
  serviceCenterPhone: string;
} {
  const norm = carrier.toLowerCase();
  if (norm.includes('smsa')) {
    return {
      code: 'smsa',
      nameEn: 'SMSA Express',
      nameAr: 'سمسا إكسبريس',
      primaryColor: '#e11d48', // SMSA Red/Crimson
      accentColor: '#1e293b',
      logoBg: '#fff1f2',
      badgeText: 'SMSA PRIORITY 24H',
      serviceCenterPhone: '920009999',
    };
  }
  if (norm.includes('spl') || norm.includes('post') || norm.includes('سبل')) {
    return {
      code: 'spl',
      nameEn: 'SPL (Saudi Post)',
      nameAr: 'سبل - البريد السعودي',
      primaryColor: '#00875a', // SPL Emerald Green
      accentColor: '#0f172a',
      logoBg: '#ecfdf5',
      badgeText: 'SPL PARCEL EXPEDITE',
      serviceCenterPhone: '19992',
    };
  }
  if (norm.includes('aramex') || norm.includes('أرامكس')) {
    return {
      code: 'aramex',
      nameEn: 'Aramex',
      nameAr: 'أرامكس للشحن السريع',
      primaryColor: '#ea580c', // Aramex Orange
      accentColor: '#0f172a',
      logoBg: '#fff7ed',
      badgeText: 'ARAMEX DOMESTIC PARCEL',
      serviceCenterPhone: '920027447',
    };
  }
  if (norm.includes('dhl')) {
    return {
      code: 'dhl',
      nameEn: 'DHL Express',
      nameAr: 'دي إتش إل إكسبريس',
      primaryColor: '#d97706', // DHL Yellow / Amber
      accentColor: '#b91c1c',
      logoBg: '#fef3c7',
      badgeText: 'DHL DOMESTIC EXPRESS',
      serviceCenterPhone: '8003450000',
    };
  }

  return {
    code: 'generic',
    nameEn: 'Express Fleet Logistics',
    nameAr: 'الأسطول السريع للخدمات اللوجستية',
    primaryColor: '#0284c7', // Sky Blue
    accentColor: '#0f172a',
    logoBg: '#f0f9ff',
    badgeText: 'EXPRESS WAYBILL',
    serviceCenterPhone: '+966 12 555 8899',
  };
}
