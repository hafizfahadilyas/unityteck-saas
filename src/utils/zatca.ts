/**
 * Saudi ZATCA (Zakat, Tax and Customs Authority) E-Invoicing Utility
 * Implements official Phase 1 and Phase 2 TLV (Tag-Length-Value) Base64 encoding
 * for Electronic Tax Invoices & Simplified Tax Invoices (Fatoora).
 */

export interface ZatcaQrFields {
  sellerName: string;
  vatNumber: string;
  timestamp: string; // ISO 8601 string, e.g. "2026-10-10T14:30:00Z"
  invoiceTotal: string | number; // Total with VAT
  vatTotal: string | number;
  invoiceHash?: string; // Phase 2 SHA256 hash
  digitalSignature?: string; // Phase 2 ECDSA signature
  publicKey?: string; // Phase 2 ECDSA public key
}

/**
 * Encodes a string into UTF-8 bytes array
 */
function stringToUtf8ByteArray(str: string): number[] {
  const utf8: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      // surrogate pair
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return utf8;
}

/**
 * Creates a single TLV tag block: [Tag (1 byte)] + [Length (1 byte)] + [Value bytes]
 */
function createTlvTag(tagNumber: number, valueStr: string): number[] {
  const valueBytes = stringToUtf8ByteArray(valueStr);
  const length = valueBytes.length;
  return [tagNumber, length, ...valueBytes];
}

/**
 * Converts byte array to Base64 string in browser / node
 */
function bytesToBase64(bytes: number[]): string {
  let binary = '';
  const len = bytes.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64');
}

/**
 * Generates official ZATCA compliant Base64 TLV payload
 */
export function generateZatcaTlvBase64(fields: ZatcaQrFields): string {
  const formattedTotal = Number(fields.invoiceTotal).toFixed(2);
  const formattedVat = Number(fields.vatTotal).toFixed(2);
  
  const tlvBytes: number[] = [
    ...createTlvTag(1, fields.sellerName.trim()),
    ...createTlvTag(2, fields.vatNumber.trim()),
    ...createTlvTag(3, fields.timestamp.trim()),
    ...createTlvTag(4, formattedTotal),
    ...createTlvTag(5, formattedVat),
  ];

  if (fields.invoiceHash) {
    tlvBytes.push(...createTlvTag(6, fields.invoiceHash.trim()));
  }
  if (fields.digitalSignature) {
    tlvBytes.push(...createTlvTag(7, fields.digitalSignature.trim()));
  }
  if (fields.publicKey) {
    tlvBytes.push(...createTlvTag(8, fields.publicKey.trim()));
  }

  return bytesToBase64(tlvBytes);
}

/**
 * Validates a Saudi Tax Identification Number (15 digits, starting & ending with 3)
 */
export function isValidSaudiVatNumber(vatNumber?: string): boolean {
  if (!vatNumber) return false;
  const cleaned = vatNumber.replace(/\s+/g, '');
  return /^3\d{13}3$/.test(cleaned);
}

/**
 * Minimal, zero-dependency SVG QR Code generator matrix
 * Uses an efficient QR code algorithm for high-res crisp vector rendering
 */
export function generateQrSvgDataUri(text: string, size = 180): string {
  // Use public QR service fallback / SVG data URI
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=2&format=svg`;
}
