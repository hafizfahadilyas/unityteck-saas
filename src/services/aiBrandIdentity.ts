/**
 * Per-store AI brand identity helpers (client).
 * Real palette / persona / style refs only — never invent another tenant's brand.
 */

export type AiBrandPersona =
  | 'minimalist'
  | 'luxury'
  | 'vibrant'
  | 'eco'
  | 'modern'
  | 'traditional_saudi'
  | 'playful'
  | 'cinematic';

export type AiCampaignPreset =
  | 'none'
  | 'founding_day'
  | 'ramadan'
  | 'eid'
  | 'national_day'
  | 'black_friday'
  | 'white_friday'
  | 'back_to_school'
  | 'mothers_day'
  | 'seasonal_sale';

export type AiOutputTemplate =
  | 'product_square'
  | 'instagram_post'
  | 'instagram_story'
  | 'snapchat_story'
  | 'store_banner'
  | 'web_landscape'
  | 'catalog_portrait';

export type AiLogoPosition = 'top_start' | 'top_end' | 'bottom_start' | 'bottom_end';

export type AiStyleReferenceStatus = 'waiting' | 'partial' | 'ready';

export interface AiBrandProfile {
  store_id: string;
  palette_hex: string[];
  persona: AiBrandPersona;
  brand_lock_default: boolean;
  logo_overlay_enabled: boolean;
  logo_overlay_position: AiLogoPosition;
  logo_url: string | null;
  store_accent_color?: string | null;
  style_reference_urls: string[];
  style_reference_count: number;
  style_reference_status: AiStyleReferenceStatus;
  style_reference_target_min: number;
  style_reference_target_max: number;
  persisted: boolean;
}

export const AI_PERSONAS: { id: AiBrandPersona; labelEn: string; labelAr: string }[] = [
  { id: 'minimalist', labelEn: 'Minimalist', labelAr: 'بسيط' },
  { id: 'luxury', labelEn: 'Luxury', labelAr: 'فاخر' },
  { id: 'vibrant', labelEn: 'Vibrant', labelAr: 'نابض' },
  { id: 'eco', labelEn: 'Eco-friendly', labelAr: 'صديق للبيئة' },
  { id: 'modern', labelEn: 'Modern', labelAr: 'عصري' },
  { id: 'traditional_saudi', labelEn: 'Saudi heritage', labelAr: 'تراث سعودي' },
  { id: 'playful', labelEn: 'Playful', labelAr: 'مرح' },
  { id: 'cinematic', labelEn: 'Cinematic', labelAr: 'سينمائي' },
];

export const AI_CAMPAIGNS: { id: AiCampaignPreset; labelEn: string; labelAr: string }[] = [
  { id: 'none', labelEn: 'No campaign', labelAr: 'بدون حملة' },
  { id: 'founding_day', labelEn: 'Founding Day', labelAr: 'يوم التأسيس' },
  { id: 'ramadan', labelEn: 'Ramadan', labelAr: 'رمضان' },
  { id: 'eid', labelEn: 'Eid', labelAr: 'العيد' },
  { id: 'national_day', labelEn: 'National Day', labelAr: 'اليوم الوطني' },
  { id: 'black_friday', labelEn: 'Black Friday', labelAr: 'الجمعة السوداء' },
  { id: 'white_friday', labelEn: 'White Friday', labelAr: 'الجمعة البيضاء' },
  { id: 'back_to_school', labelEn: 'Back to school', labelAr: 'العودة للمدارس' },
  { id: 'mothers_day', labelEn: "Mother's Day", labelAr: 'يوم الأم' },
  { id: 'seasonal_sale', labelEn: 'Seasonal sale', labelAr: 'تخفيضات موسمية' },
];

export const AI_OUTPUT_TEMPLATES: {
  id: AiOutputTemplate;
  aspect: '1:1' | '4:5' | '9:16' | '16:9' | '4:3' | '3:4';
  labelEn: string;
  labelAr: string;
}[] = [
  { id: 'product_square', aspect: '1:1', labelEn: 'Product square', labelAr: 'منتج مربع' },
  { id: 'instagram_post', aspect: '4:5', labelEn: 'Instagram post', labelAr: 'منشور إنستغرام' },
  { id: 'instagram_story', aspect: '9:16', labelEn: 'Instagram story', labelAr: 'قصة إنستغرام' },
  { id: 'snapchat_story', aspect: '9:16', labelEn: 'Snapchat story', labelAr: 'قصة سناب شات' },
  { id: 'store_banner', aspect: '16:9', labelEn: 'Store banner', labelAr: 'بانر المتجر' },
  { id: 'web_landscape', aspect: '4:3', labelEn: 'Web landscape', labelAr: 'أفقي للموقع' },
  { id: 'catalog_portrait', aspect: '3:4', labelEn: 'Catalog portrait', labelAr: 'عمودي للكتالوج' },
];

export const AI_LOGO_POSITIONS: { id: AiLogoPosition; labelEn: string; labelAr: string }[] = [
  { id: 'top_start', labelEn: 'Top start', labelAr: 'أعلى البداية' },
  { id: 'top_end', labelEn: 'Top end', labelAr: 'أعلى النهاية' },
  { id: 'bottom_start', labelEn: 'Bottom start', labelAr: 'أسفل البداية' },
  { id: 'bottom_end', labelEn: 'Bottom end', labelAr: 'أسفل النهاية' },
];

/** Client-side preview of brand-locked merge (server is source of truth). */
export function previewBrandLockedPrompt(
  userPrompt: string,
  opts: {
    brandLock: boolean;
    paletteHex: string[];
    persona: AiBrandPersona;
    campaign: AiCampaignPreset;
  },
): string {
  const prompt = userPrompt.trim();
  if (!prompt || !opts.brandLock) return prompt;

  const personaHint: Record<AiBrandPersona, string> = {
    minimalist: 'minimalist and modern style, clean negative space',
    luxury: 'luxury cinematic lighting, premium refined aesthetic',
    vibrant: 'vibrant energetic color blocking, bold commercial energy',
    eco: 'eco-friendly natural materials, soft organic textures',
    modern: 'modern clean commercial brand style',
    traditional_saudi: 'Saudi heritage elegance, warm hospitality mood',
    playful: 'playful friendly lifestyle composition',
    cinematic: 'cinematic shallow depth of field, dramatic premium light',
  };

  const campaignHint: Partial<Record<AiCampaignPreset, string>> = {
    founding_day: 'Saudi Founding Day campaign mood while preserving store brand colors',
    ramadan: 'Ramadan campaign atmosphere while preserving store brand colors',
    eid: 'Eid celebration campaign mood while preserving store brand colors',
    national_day: 'Saudi National Day campaign mood while preserving store brand colors',
    black_friday: 'Black Friday promotional urgency while preserving store brand colors',
    white_friday: 'White Friday KSA sale campaign while preserving store brand colors',
    back_to_school: 'back-to-school campaign mood while preserving store brand colors',
    mothers_day: "Mother's Day gift campaign mood while preserving store brand colors",
    seasonal_sale: 'seasonal sale promotional layout while preserving store brand colors',
  };

  const parts = [prompt, personaHint[opts.persona] || personaHint.modern];
  const colors = opts.paletteHex.filter(Boolean).slice(0, 5);
  if (colors.length) {
    parts.push(`dominant colors: ${colors.join(' and ')}`);
  }
  const camp = campaignHint[opts.campaign];
  if (camp) parts.push(camp);
  parts.push('high quality 4K');
  return parts.join(', ');
}
