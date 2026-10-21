/**
 * Saudi Arabia (+966) Telecom & Mobile Number Utilities
 * Compliant with CITC (Communications, Space & Technology Commission) specifications.
 */

/**
 * Normalizes any variation of a Saudi phone number into E.164 format (+9665XXXXXXXX).
 * Accepts: '0551234567', '551234567', '966551234567', '+966551234567', '00966551234567'
 */
export function normalizeSaudiPhone(phone?: string | null): string {
  if (!phone) return '';

  // Clean out non-digits except initial +
  let cleaned = phone.trim().replace(/[^\d+]/g, '');

  // Strip international prefixes
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }
  if (!cleaned.startsWith('+') && cleaned.startsWith('966')) {
    cleaned = '+' + cleaned;
  }

  // Handle local 05XXXXXXXX
  const match05 = cleaned.match(/^05(\d{8})$/);
  if (match05) {
    return `+9665${match05[1]}`;
  }

  // Handle local 5XXXXXXXX
  const match5 = cleaned.match(/^5(\d{8})$/);
  if (match5) {
    return `+9665${match5[1]}`;
  }

  // Handle already +9665XXXXXXXX
  const matchPlus = cleaned.match(/^\+9665(\d{8})$/);
  if (matchPlus) {
    return `+9665${matchPlus[1]}`;
  }

  // Handle without plus: 9665XXXXXXXX
  const matchNoPlus = cleaned.match(/^9665(\d{8})$/);
  if (matchNoPlus) {
    return `+9665${matchNoPlus[1]}`;
  }

  // Return cleaned if unable to parse as Saudi mobile
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Validates if the phone number is a genuine Saudi mobile (+9665XXXXXXXX).
 */
export function isValidSaudiMobile(phone?: string | null): boolean {
  if (!phone) return false;
  const normalized = normalizeSaudiPhone(phone);
  return /^\+9665\d{8}$/.test(normalized);
}

/**
 * Formats a Saudi mobile for beautiful UI display, e.g. "+966 55 123 4567"
 */
export function formatSaudiDisplay(phone?: string | null): string {
  if (!phone) return '';
  const normalized = normalizeSaudiPhone(phone);
  const match = normalized.match(/^\+966(5\d)(\d{3})(\d{4})$/);
  if (match) {
    return `+966 ${match[1]} ${match[2]} ${match[3]}`;
  }
  return normalized;
}

export function getCleanWhatsAppDigits(phone?: string | null): string {
  if (!phone) return '966549876543';
  let cleaned = phone.trim().replace(/\D/g, '');
  if (cleaned.startsWith('05')) {
    cleaned = '966' + cleaned.slice(1);
  } else if (cleaned.startsWith('5') && cleaned.length === 9) {
    cleaned = '966' + cleaned;
  } else if (!cleaned.startsWith('966') && cleaned.length === 9) {
    cleaned = '966' + cleaned;
  }
  return cleaned || '966549876543';
}

/**
 * Builds an official WhatsApp direct link (wa.me) for instant customer chat
 */
export function getWhatsAppChatUrl(phone?: string | null, message?: string): string {
  const cleanDigits = getCleanWhatsAppDigits(phone);
  const baseUrl = `https://wa.me/${cleanDigits}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}

/**
 * Interpolates notification template string with real dynamic variables
 */
export function interpolateNotificationTemplate(
  template: string,
  variables: Record<string, string | number | undefined | null>
): string {
  let output = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    output = output.split(placeholder).join(String(value ?? ''));
  }
  return output;
}
