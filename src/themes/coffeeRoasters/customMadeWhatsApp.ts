import { coffeeWhatsAppDigits } from '../settings/coffeeModularSettings';

export type CustomMadeWhatsAppInput = {
  customOrderUrl?: string | null;
  whatsappNumber?: string | null;
  storeWhatsapp?: string | null;
  storePhone?: string | null;
  label?: string;
  language?: 'AR' | 'EN';
};

/**
 * Custom Made · Design & Build → this store's WhatsApp only.
 * Returns wa.me href, or null when no number (caller may open custom-order page).
 * Never invents a fallback phone.
 */
export function resolveCustomMadeWhatsAppHref(input: CustomMadeWhatsAppInput): string | null {
  const rawUrl = String(input.customOrderUrl || '').trim();
  if (/wa\.me|whatsapp\.com|api\.whatsapp/i.test(rawUrl)) {
    return /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl.replace(/^\/+/, '')}`;
  }
  // Identity / store contact wins over any leftover section mirror
  const phone = coffeeWhatsAppDigits(
    input.storeWhatsapp || input.storePhone || input.whatsappNumber || '',
  );
  if (!phone) return null;
  const isAr = input.language === 'AR';
  const label =
    (input.label || '').trim() ||
    (isAr ? 'تفصيل حسب الطلب · تصميم وتنفيذ' : 'Custom Made · Design & Build');
  const msg = isAr
    ? `السلام عليكم، أود الاستفسار عن ${label}`
    : `Hello, I would like to inquire about ${label}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
