/**
 * Sequential store order numbers: #001, #002, #003…
 */

const SEQ_PATTERNS = [
  /^#?0*(\d+)$/i,
  /^sa-0*(\d+)$/i,
  /^ord-0*(\d+)$/i,
  /^wm-mk-0*(\d+)$/i,
];

/** Extract numeric sequence from any known order-number format */
export function parseOrderSequence(orderNumber: string | null | undefined): number {
  if (!orderNumber) return 0;
  const raw = String(orderNumber).trim();
  for (const re of SEQ_PATTERNS) {
    const m = raw.match(re);
    if (m) return parseInt(m[1], 10) || 0;
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length > 0 && digits.length <= 6) return parseInt(digits, 10) || 0;
  return 0;
}

/** Format as #001, #002, … (3+ digits) */
export function formatOrderNumber(seq: number): string {
  const n = Math.max(1, Math.floor(seq));
  return `#${String(n).padStart(3, '0')}`;
}

/** Next free sequential number for a store given existing order numbers */
export function nextSequentialOrderNumber(
  existingOrderNumbers: Array<string | null | undefined>,
): string {
  let max = 0;
  for (const num of existingOrderNumbers) {
    const n = parseOrderSequence(num);
    if (n > max) max = n;
  }
  return formatOrderNumber(max + 1);
}

/** Display helper — prefer #001 style when parseable, else original */
export function displayOrderNumber(orderNumber: string | null | undefined): string {
  if (!orderNumber) return '#001';
  const seq = parseOrderSequence(orderNumber);
  if (seq > 0) return formatOrderNumber(seq);
  return orderNumber;
}
