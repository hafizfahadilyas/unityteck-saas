/** Master-configurable public SEO link patterns (WordPress-style permalinks). */

export type SeoPermalinkPreset = 'plain' | 'post_name' | 'date' | 'post_type' | 'custom';

export type SeoLinkSettings = {
  preset: SeoPermalinkPreset;
  /** Include yyyy/mm/dd segments when preset is date or custom uses date tokens. */
  dateInUrl: boolean;
  /** Public content type segment: product | post | page | custom label */
  postType: string;
  productPattern: string;
  categoryPattern: string;
  blogPattern: string;
  pagePattern: string;
  /** Absolute or store-relative OG / share thumbnail (1200×630). */
  defaultOgImage: string;
  twitterCard: 'summary' | 'summary_large_image';
};

export const DEFAULT_SEO_LINK_SETTINGS: SeoLinkSettings = {
  preset: 'post_name',
  dateInUrl: false,
  postType: 'product',
  productPattern: '/{post_type}/{slug}',
  categoryPattern: '/category/{slug}',
  blogPattern: '/blog/{slug}',
  pagePattern: '/{slug}',
  defaultOgImage: '',
  twitterCard: 'summary_large_image',
};

const PRESET_PATTERNS: Record<
  Exclude<SeoPermalinkPreset, 'custom'>,
  Pick<SeoLinkSettings, 'productPattern' | 'categoryPattern' | 'blogPattern' | 'pagePattern' | 'dateInUrl'>
> = {
  plain: {
    productPattern: '/?p={id}',
    categoryPattern: '/?cat={slug}',
    blogPattern: '/?post={slug}',
    pagePattern: '/?page={slug}',
    dateInUrl: false,
  },
  post_name: {
    productPattern: '/{post_type}/{slug}',
    categoryPattern: '/category/{slug}',
    blogPattern: '/blog/{slug}',
    pagePattern: '/{slug}',
    dateInUrl: false,
  },
  date: {
    productPattern: '/{yyyy}/{mm}/{dd}/{slug}',
    categoryPattern: '/category/{slug}',
    blogPattern: '/{yyyy}/{mm}/{slug}',
    pagePattern: '/{slug}',
    dateInUrl: true,
  },
  post_type: {
    productPattern: '/{post_type}/{yyyy}/{mm}/{slug}',
    categoryPattern: '/{post_type}/category/{slug}',
    blogPattern: '/{post_type}/{slug}',
    pagePattern: '/{post_type}/page/{slug}',
    dateInUrl: true,
  },
};

export function applySeoPermalinkPreset(
  preset: SeoPermalinkPreset,
  current: SeoLinkSettings,
): SeoLinkSettings {
  if (preset === 'custom') {
    return { ...current, preset: 'custom' };
  }
  const base = PRESET_PATTERNS[preset];
  return {
    ...current,
    preset,
    ...base,
  };
}

export function normalizeSeoLinkSettings(raw: unknown): SeoLinkSettings {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const presetRaw = String(src.preset || DEFAULT_SEO_LINK_SETTINGS.preset);
  const preset = (
    ['plain', 'post_name', 'date', 'post_type', 'custom'].includes(presetRaw)
      ? presetRaw
      : 'post_name'
  ) as SeoPermalinkPreset;
  const twitterRaw = String(src.twitterCard || DEFAULT_SEO_LINK_SETTINGS.twitterCard);
  return {
    preset,
    dateInUrl: src.dateInUrl === undefined ? DEFAULT_SEO_LINK_SETTINGS.dateInUrl : Boolean(src.dateInUrl),
    postType: String(src.postType || DEFAULT_SEO_LINK_SETTINGS.postType).trim() || 'product',
    productPattern: String(src.productPattern || DEFAULT_SEO_LINK_SETTINGS.productPattern),
    categoryPattern: String(src.categoryPattern || DEFAULT_SEO_LINK_SETTINGS.categoryPattern),
    blogPattern: String(src.blogPattern || DEFAULT_SEO_LINK_SETTINGS.blogPattern),
    pagePattern: String(src.pagePattern || DEFAULT_SEO_LINK_SETTINGS.pagePattern),
    defaultOgImage: String(src.defaultOgImage || ''),
    twitterCard: twitterRaw === 'summary' ? 'summary' : 'summary_large_image',
  };
}

type BuildCtx = {
  origin: string;
  storeSlug?: string;
  slug?: string;
  id?: string;
  postType?: string;
  date?: Date;
};

function fillPattern(pattern: string, ctx: BuildCtx): string {
  const d = ctx.date || new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return pattern
    .replace(/\{post_type\}/g, encodeURIComponent(ctx.postType || 'product'))
    .replace(/\{slug\}/g, encodeURIComponent(ctx.slug || 'sample'))
    .replace(/\{id\}/g, encodeURIComponent(ctx.id || '1'))
    .replace(/\{yyyy\}/g, yyyy)
    .replace(/\{mm\}/g, mm)
    .replace(/\{dd\}/g, dd)
    .replace(/\{store\}/g, encodeURIComponent(ctx.storeSlug || 'store'));
}

/**
 * Builds a public SEO path for a content type using Master link settings.
 * Custom domains use path-only; shared hosts keep ?store= for SPA routing.
 */
export function buildSeoPublicUrl(
  settings: SeoLinkSettings,
  kind: 'product' | 'category' | 'blog' | 'page',
  ctx: BuildCtx & { useQueryStore?: boolean },
): string {
  const pattern =
    kind === 'product'
      ? settings.productPattern
      : kind === 'category'
        ? settings.categoryPattern
        : kind === 'blog'
          ? settings.blogPattern
          : settings.pagePattern;
  const path = fillPattern(pattern, {
    ...ctx,
    postType: ctx.postType || settings.postType,
  });
  const origin = (ctx.origin || '').replace(/\/$/, '');
  if (path.startsWith('/?') || path.startsWith('?')) {
    const q = path.replace(/^\//, '');
    if (ctx.useQueryStore && ctx.storeSlug) {
      const joiner = q.includes('?') ? '&' : '?';
      return `${origin}${q}${joiner}store=${encodeURIComponent(ctx.storeSlug)}`;
    }
    return `${origin}${q.startsWith('?') ? q : `/${q}`}`;
  }
  if (ctx.useQueryStore && ctx.storeSlug) {
    const joiner = path.includes('?') ? '&' : '?';
    return `${origin}${path}${joiner}store=${encodeURIComponent(ctx.storeSlug)}`;
  }
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}
