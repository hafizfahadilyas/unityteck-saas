/** Per-product Learn More (coffee PDP) content lives in custom_fields. */
export const LEARN_MORE_FIELD_PREFIX = 'learn-more-';
export const LEARN_MORE_SPEC_PREFIX = 'catalog-spec-';
/** Reserved custom_fields row for product-page comparison banner (image only). */
export const COMPARISON_BANNER_FIELD_ID = '__comparison_banner';

export type LearnMoreFieldLike = {
  id?: string;
  type?: string;
  name?: string;
  nameAr?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  contentEn?: string;
  contentAr?: string;
  hidden?: boolean;
  value?: string;
};

function isContentFieldType(type: string | undefined): boolean {
  return String(type || '').trim().toLowerCase() === 'content';
}

export function isCoffeeProductEditorStore(opts: {
  storeId?: string | null;
  themeId?: string | null;
  slug?: string | null;
}): boolean {
  const storeId = String(opts.storeId || '').toLowerCase();
  const themeId = String(opts.themeId || '').toLowerCase();
  const slug = String(opts.slug || '').toLowerCase();
  if (storeId === 'store-coffee' || storeId.includes('coffee')) return true;
  if (themeId.includes('coffee')) return true;
  if (slug.includes('coffee') || slug.includes('hibrew')) return true;
  return false;
}

export function isLearnMoreSpecField(field: LearnMoreFieldLike | null | undefined): boolean {
  return String(field?.id || '').startsWith(LEARN_MORE_SPEC_PREFIX);
}

/**
 * Content blocks that render as Learn More cinematic feature banners.
 * Only `learn-more-*` ids — plain Custom Field type "Content" must stay on the buy page.
 */
export function isLearnMoreSectionField(field: LearnMoreFieldLike | null | undefined): boolean {
  if (!field || isLearnMoreSpecField(field)) return false;
  return String(field.id || '').startsWith(LEARN_MORE_FIELD_PREFIX);
}

export function isComparisonBannerField(field: LearnMoreFieldLike | null | undefined): boolean {
  return String(field?.id || '') === COMPARISON_BANNER_FIELD_ID;
}

export function comparisonBannerUrlFromFields(
  fields: LearnMoreFieldLike[] | null | undefined,
): string {
  const row = (fields || []).find((f) => isComparisonBannerField(f));
  return String(row?.imageUrl || '').trim();
}

export function upsertComparisonBannerField<T extends LearnMoreFieldLike>(
  fields: T[],
  imageUrl: string,
): T[] {
  const rest = fields.filter((f) => !isComparisonBannerField(f));
  const url = String(imageUrl || '').trim();
  if (!url) return rest;
  return [
    ...rest,
    {
      id: COMPARISON_BANNER_FIELD_ID,
      name: 'Comparison Banner',
      nameAr: 'صورة المقارنة',
      type: 'Content',
      hidden: true,
      imageUrl: url,
    } as T,
  ];
}

/** Purchase / checkout custom fields — exclude Learn More story + specs + comparison banner. */
export function isPurchaseCustomField(field: LearnMoreFieldLike | null | undefined): boolean {
  if (!field) return false;
  if (isComparisonBannerField(field)) return false;
  if (isLearnMoreSpecField(field) || isLearnMoreSectionField(field)) return false;
  return true;
}

export function newLearnMoreSectionId(): string {
  return `${LEARN_MORE_FIELD_PREFIX}${Date.now()}`;
}

export function newLearnMoreSpecId(): string {
  return `${LEARN_MORE_SPEC_PREFIX}${Date.now()}`;
}

export function specsFromLearnMoreFields(fields: LearnMoreFieldLike[] | null | undefined): Array<{
  label: string;
  value: string;
  labelAr?: string;
  valueAr?: string;
}> {
  return (fields || [])
    .filter((f) => isLearnMoreSpecField(f) && !f.hidden)
    .map((f) => ({
      label: String(f.name || '').trim(),
      labelAr: String(f.nameAr || f.name || '').trim() || undefined,
      value: String(f.contentEn || f.value || '').trim(),
      valueAr: String(f.contentAr || f.contentEn || f.value || '').trim() || undefined,
    }))
    .filter((s) => s.label || s.value || s.labelAr || s.valueAr);
}
