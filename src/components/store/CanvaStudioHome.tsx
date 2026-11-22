import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Home,
  LayoutTemplate,
  FilePlus2,
  Smartphone,
  Ratio,
  RectangleHorizontal,
  Megaphone,
  Images,
  Package,
  Award,
  Monitor,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Heart,
  type LucideIcon,
} from 'lucide-react';
import type { Store } from '../../types';
import {
  listCanvaTemplatesForStore,
  resolveCanvaLayerLabel,
  type CanvaDesignTemplate,
  type CanvaTemplateCategory,
} from '../../data/ksaCanvaTemplates';
import { isCanvaTemplateUnlocked } from '../../services/canvaTemplateAccess';
import {
  listMyCanvaTemplates,
  type CanvaMyTemplate,
} from '../../services/canvaMyTemplates';
import {
  isCanvaFavorite,
  listCanvaFavoriteIds,
  toggleCanvaFavorite,
} from '../../services/canvaFavorites';
import { ensureReadableTextStyle, resolveCanvasApproxColor } from '../../services/canvaTextContrast';

export type CanvaHomeOpenTarget =
  | { kind: 'premade'; template: CanvaDesignTemplate }
  | { kind: 'mine'; template: CanvaMyTemplate }
  | { kind: 'blank'; width: number; height: number; label: string; blankId?: string };

type Props = {
  store: Pick<
    Store,
    'id' | 'slug' | 'name' | 'nameAr' | 'category' | 'plan' | 'masterGrantedPro' | 'canvaTemplatesPerCategory'
  >;
  isAr: boolean;
  activeImageUrl?: string;
  previewProduct?: {
    name?: string;
    nameAr?: string;
    price?: number | string | null;
    category?: string;
    categoryAr?: string;
  } | null;
  onOpenEditor: (target: CanvaHomeOpenTarget) => void;
};

type FormatChip = {
  id: string;
  labelEn: string;
  labelAr: string;
  w: number;
  h: number;
  Icon: LucideIcon;
  blankId?: string;
  category?: CanvaTemplateCategory | 'all';
};

const FORMAT_CHIPS: FormatChip[] = [
  { id: 'blank', labelEn: 'Blank', labelAr: 'فارغ', w: 1080, h: 1080, Icon: FilePlus2, blankId: 'blank-square' },
  { id: 'story', labelEn: 'Story', labelAr: 'ستوري', w: 1080, h: 1920, Icon: Smartphone, blankId: 'blank-story', category: 'social' },
  { id: 'portrait', labelEn: 'Portrait', labelAr: 'عمودي', w: 1080, h: 1350, Icon: Ratio, blankId: 'blank-portrait', category: 'social' },
  { id: 'post', labelEn: 'Post', labelAr: 'منشور', w: 1080, h: 1080, Icon: Images, blankId: 'blank-square', category: 'social' },
  { id: 'banner', labelEn: 'Banner', labelAr: 'بنر', w: 1600, h: 600, Icon: RectangleHorizontal, blankId: 'blank-banner', category: 'banner' },
  { id: 'ads', labelEn: 'Ads', labelAr: 'إعلان', w: 1200, h: 628, Icon: Megaphone, blankId: 'blank-ads', category: 'ads' },
  { id: 'product', labelEn: 'Product', labelAr: 'منتج', w: 1080, h: 1080, Icon: Package, blankId: 'blank-product', category: 'product' },
  { id: 'logo', labelEn: 'Logo', labelAr: 'شعار', w: 800, h: 800, Icon: Award, blankId: 'blank-logo', category: 'logo' },
  { id: 'desktop', labelEn: 'Wide', labelAr: 'عريض', w: 1920, h: 1080, Icon: Monitor, blankId: 'blank-banner', category: 'banner' },
];

function truncate(raw: string, max = 34): string {
  const t = raw.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function relativeUpdated(iso: string, isAr: boolean): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 60) return isAr ? `منذ ${mins || 1} د` : `${mins || 1}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return isAr ? `منذ ${hrs} س` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return isAr ? `منذ ${days} ي` : `${days}d ago`;
}

/** Canva home row: shared height so tall/wide look aligned (not jagged). */
const HOME_THUMB_H = 168;

function canvaRowCardWidthPx(width: number, height: number): number {
  const ratio = Math.max(0.45, Math.min(2.4, width / Math.max(1, height)));
  return Math.round(Math.max(96, Math.min(280, HOME_THUMB_H * ratio)));
}

const PremadeThumb: React.FC<{
  template: CanvaDesignTemplate;
  isAr: boolean;
  storeName: string;
  productName: string;
  priceLabel: string;
  categoryName: string;
  activeImageUrl?: string;
  /**
   * equal = same box (For you) · canvaRow = same HEIGHT, width from aspect (Canva “prepared for you”)
   */
  layout?: 'equal' | 'canvaRow';
}> = ({
  template,
  isAr,
  storeName,
  productName,
  priceLabel,
  categoryName,
  activeImageUrl,
  layout = 'equal',
}) => {
  const isBlank = template.niche === 'blank';
  const canvasApprox = resolveCanvasApproxColor(
    template.backdropId,
    template.customSolidColor || '#ffffff',
  );
  const headline = template.elements.find((e) => e.type === 'headline' || e.type === 'custom_text');
  const badge = template.elements.find((e) => e.type === 'badge');
  const label = headline
    ? resolveCanvaLayerLabel(headline, { isAr, storeName, productName, priceLabel, categoryName })
    : isAr
      ? template.nameAr
      : template.nameEn;
  const badgeLabel = badge
    ? resolveCanvaLayerLabel(badge, { isAr, storeName, productName, priceLabel, categoryName })
    : '';

  const boxStyle: React.CSSProperties =
    layout === 'canvaRow'
      ? {
          height: HOME_THUMB_H,
          width: '100%',
          background: template.previewGradient || '#f1f5f9',
        }
      : {
          aspectRatio: '3 / 4',
          width: '100%',
          height: 'auto',
          background: template.previewGradient || '#f1f5f9',
        };

  return (
    <div
      className="relative overflow-hidden rounded-xl ring-1 ring-black/5 shrink-0"
      style={boxStyle}
    >
      {/* Design preview fills equal frame (cover) — real WxH still opens in editor */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div
          className="relative shrink-0"
          style={
            layout === 'equal'
              ? {
                  width: '100%',
                  height: '100%',
                  background: template.previewGradient || '#f1f5f9',
                }
              : {
                  aspectRatio: `${template.width} / ${template.height}`,
                  height: '100%',
                  maxWidth: '100%',
                  background: template.previewGradient || '#f1f5f9',
                }
          }
        >
          {!isBlank && template.productPosPct.scale > 0 && activeImageUrl ? (
            <img
              src={activeImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}
        </div>
      </div>
      {badgeLabel && badge ? (
        <span
          className="absolute top-2 start-2 z-10 px-1.5 py-0.5 rounded text-[9px] font-black max-w-[70%] truncate"
          style={{
            color: ensureReadableTextStyle(badge.fontColor || '#fff', badge.bgColor || '#0f172a', canvasApprox)
              .fontColor,
            background:
              ensureReadableTextStyle(badge.fontColor || '#fff', badge.bgColor || '#0f172a', canvasApprox)
                .bgColor || '#0f172a',
          }}
        >
          {truncate(badgeLabel, 18)}
        </span>
      ) : null}
      {isBlank ? (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 z-10">
          <FilePlus2 className="w-6 h-6 opacity-70" />
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 z-10 px-2 pb-2 pt-6 bg-gradient-to-t from-black/45 to-transparent">
          <p className="text-[10px] sm:text-[11px] font-black leading-snug line-clamp-2 text-white">
            {truncate(label || (isAr ? template.nameAr : template.nameEn), 40)}
          </p>
        </div>
      )}
      {template.tier === 'pro' ? (
        <span className="absolute bottom-2 end-2 z-10 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-black/55 text-white">
          {isAr ? 'خاص' : 'Pro'}
        </span>
      ) : null}
    </div>
  );
};

export const CanvaStudioHome: React.FC<Props> = ({
  store,
  isAr,
  activeImageUrl,
  previewProduct = null,
  onOpenEditor,
}) => {
  const [search, setSearch] = useState('');
  const [hubTab, setHubTab] = useState<'home' | 'templates'>('home');
  const [myTemplates, setMyTemplates] = useState<CanvaMyTemplate[]>([]);
  const [continueLimit, setContinueLimit] = useState(12);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const forYouRef = React.useRef<HTMLDivElement | null>(null);
  const mixedSectionRef = React.useRef<HTMLDivElement | null>(null);
  const mixedRowRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rows = await listMyCanvaTemplates(store.id);
      if (!cancelled) setMyTemplates(rows);
    })();
    setFavoriteIds(listCanvaFavoriteIds(store.id));
    return () => {
      cancelled = true;
    };
  }, [store.id]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const toggleFavorite = (templateId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const on = toggleCanvaFavorite(store.id, templateId);
    setFavoriteIds(listCanvaFavoriteIds(store.id));
    void on;
  };

  const storeName = (isAr ? store.nameAr || store.name : store.name) || '';
  const productName = previewProduct
    ? (isAr ? previewProduct.nameAr || previewProduct.name : previewProduct.name) || ''
    : '';
  const priceLabel =
    previewProduct?.price != null && previewProduct.price !== ''
      ? `${previewProduct.price} ${'⃁'}`
      : '';
  const categoryName = previewProduct
    ? (isAr ? previewProduct.categoryAr || previewProduct.category : previewProduct.category) || ''
    : '';

  const catalogList = useMemo(() => {
    let list = listCanvaTemplatesForStore(store, 'all').filter((t) => t.niche !== 'blank');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.nameEn.toLowerCase().includes(q) ||
          t.nameAr.includes(search.trim()) ||
          t.category.includes(q),
      );
    }
    return list;
  }, [store, search]);

  /** Section 1 — for you: prefer social / square-ish unlocked templates */
  const forYouTemplates = useMemo(() => {
    const unlocked = catalogList.filter((t) => isCanvaTemplateUnlocked(t, store));
    const social = unlocked.filter((t) => t.category === 'social');
    const pool = social.length >= 6 ? social : unlocked;
    return pool.slice(0, 12);
  }, [catalogList, store]);

  /** Section 2 — continue designing: this store's saved / master designs */
  const continueDesigns = useMemo(() => {
    let list = myTemplates.filter((t) => t.storeId === store.id);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.nameEn.toLowerCase().includes(q) ||
          t.nameAr.includes(search.trim()) ||
          t.category.includes(q),
      );
    }
    if (favoritesOnly) {
      list = list.filter((t) => favoriteSet.has(t.id) || isCanvaFavorite(store.id, t.id));
    }
    // Favorites first, then recent
    list = [...list].sort((a, b) => {
      const af = favoriteSet.has(a.id) ? 1 : 0;
      const bf = favoriteSet.has(b.id) ? 1 : 0;
      if (af !== bf) return bf - af;
      return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });
    return list;
  }, [myTemplates, store.id, search, favoritesOnly, favoriteSet]);

  /** Section 3 — mixed sizes carousel (square + portrait + landscape) */
  const mixedTemplates = useMemo(() => {
    const unlocked = catalogList.filter((t) => isCanvaTemplateUnlocked(t, store));
    const byRatio = (t: CanvaDesignTemplate) => {
      const r = t.width / Math.max(1, t.height);
      if (r < 0.75) return 0; // tall
      if (r > 1.25) return 2; // wide
      return 1; // square
    };
    const tall = unlocked.filter((t) => byRatio(t) === 0);
    const square = unlocked.filter((t) => byRatio(t) === 1);
    const wide = unlocked.filter((t) => byRatio(t) === 2);
    const mixed: CanvaDesignTemplate[] = [];
    const max = Math.max(tall.length, square.length, wide.length, 1);
    for (let i = 0; i < max && mixed.length < 24; i++) {
      if (square[i]) mixed.push(square[i]);
      if (tall[i]) mixed.push(tall[i]);
      if (wide[i]) mixed.push(wide[i]);
    }
    return mixed.length > 0 ? mixed : unlocked.slice(0, 18);
  }, [catalogList, store]);

  const openPremade = (tpl: CanvaDesignTemplate) => {
    if (!isCanvaTemplateUnlocked(tpl, store)) return;
    onOpenEditor({ kind: 'premade', template: tpl });
  };

  const openFormat = (chip: FormatChip) => {
    onOpenEditor({
      kind: 'blank',
      width: chip.w,
      height: chip.h,
      label: isAr ? chip.labelAr : chip.labelEn,
      blankId: chip.blankId,
    });
  };

  const scrollRow = (ref: React.RefObject<HTMLDivElement | null>, dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.7), behavior: 'smooth' });
  };

  const sectionHead = (title: string, onSeeAll?: () => void) => (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="cs-canva-home-title text-lg sm:text-xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
        {title}
      </h2>
      {onSeeAll ? (
        <button
          type="button"
          onClick={onSeeAll}
          className="cs-canva-home-link text-sm font-bold cursor-pointer shrink-0"
          style={{ color: 'var(--accent)' }}
        >
          {isAr ? 'عرض الكل' : 'See all'}
        </button>
      ) : null}
    </div>
  );

  return (
    <div
      className="cs-canva-home u-page w-full min-w-0 max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 pb-16"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Hero — own glass panel */}
      <section className="cs-canva-home-glass cs-canva-home-hero relative overflow-hidden rounded-3xl mt-2 mb-5 px-4 sm:px-8 pt-8 pb-6 text-center">
        <div className="cs-canva-home-hero-glow pointer-events-none" aria-hidden />
        <h1
          className="relative text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight max-w-3xl mx-auto leading-snug"
          style={{ color: 'var(--accent)' }}
        >
          {isAr ? 'ماذا ستصمم اليوم؟' : 'What will you design today?'}
        </h1>

        <div className="relative mt-4 flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setHubTab('home')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black border cursor-pointer ${
              hubTab === 'home' ? 'text-white border-transparent' : 'cs-canva-home-pill'
            }`}
            style={
              hubTab === 'home'
                ? { background: 'var(--accent)', borderColor: 'var(--accent)' }
                : { color: 'var(--text)', borderColor: 'var(--glass-border, var(--border))' }
            }
          >
            <Home className="w-3.5 h-3.5" />
            {isAr ? 'الرئيسية' : 'Home'}
          </button>
          <button
            type="button"
            onClick={() => {
              setHubTab('templates');
              mixedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black border cursor-pointer ${
              hubTab === 'templates' ? 'text-white border-transparent' : 'cs-canva-home-pill'
            }`}
            style={
              hubTab === 'templates'
                ? { background: 'var(--accent)', borderColor: 'var(--accent)' }
                : { color: 'var(--text)', borderColor: 'var(--glass-border, var(--border))' }
            }
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            {isAr ? 'القوالب' : 'Templates'}
          </button>
        </div>

        <div className="relative mt-4 max-w-2xl mx-auto">
          <label className="cs-canva-home-search flex items-center gap-2 rounded-full border px-4 py-2.5 focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]">
            <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isAr ? 'ابحث عن قوالب وتصاميم…' : 'Search templates and designs…'
              }
              className="flex-1 min-w-0 bg-transparent text-sm outline-none"
              style={{ color: 'var(--text)' }}
            />
          </label>
        </div>

        {/* Format chips */}
        <div className="relative mt-6 flex gap-3 overflow-x-auto pb-1 justify-start sm:justify-center scrollbar-thin">
          {FORMAT_CHIPS.map((chip) => {
            const Icon = chip.Icon;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => openFormat(chip)}
                className="cs-canva-home-chip shrink-0 flex flex-col items-center gap-1.5 w-[4.5rem] cursor-pointer group"
                title={`${chip.w}×${chip.h}`}
              >
                <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform"
                  style={{ background: 'var(--accent)' }}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold truncate w-full" style={{ color: 'var(--text)' }}>
                  {isAr ? chip.labelAr : chip.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 1 — For you (own glass panel) */}
      <section className="cs-canva-home-glass rounded-3xl mb-5 px-4 sm:px-6 py-5">
        {sectionHead(isAr ? 'مقترحة لك' : 'For you', () => {
          setHubTab('templates');
          mixedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        })}
        <div className="relative">
          <button
            type="button"
            aria-label={isAr ? 'التالي' : 'Next'}
            onClick={() => scrollRow(forYouRef, isAr ? 1 : -1)}
            className="cs-canva-home-nav hidden sm:flex absolute top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full border items-center justify-center cursor-pointer"
            style={{ [isAr ? 'left' : 'right']: '-0.35rem' } as React.CSSProperties}
          >
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div
            ref={forYouRef}
            className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth items-stretch"
          >
            {forYouTemplates.map((tpl) => (
              <button
                key={`fy-${tpl.id}`}
                type="button"
                onClick={() => openPremade(tpl)}
                className="cs-canva-home-card snap-start shrink-0 w-[9.25rem] sm:w-[10.25rem] text-start cursor-pointer group flex flex-col"
              >
                <PremadeThumb
                  template={tpl}
                  isAr={isAr}
                  storeName={storeName}
                  productName={productName}
                  priceLabel={priceLabel}
                  categoryName={categoryName}
                  activeImageUrl={activeImageUrl}
                  layout="equal"
                />
                <p className="mt-1.5 text-[11px] font-bold line-clamp-2 min-h-[2.5rem] group-hover:underline" style={{ color: 'var(--text)' }}>
                  {isAr ? tpl.nameAr : tpl.nameEn}
                </p>
              </button>
            ))}
            {forYouTemplates.length === 0 && (
              <p className="text-sm py-8" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد قوالب مطابقة' : 'No matching templates'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 2 — Continue designing (own glass panel) */}
      <section className="cs-canva-home-glass rounded-3xl mb-5 px-4 sm:px-6 py-5">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h2 className="cs-canva-home-title text-lg sm:text-xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            {isAr ? 'واصل التصميم' : 'Continue designing'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFavoritesOnly((v) => !v)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border cursor-pointer ${
                favoritesOnly ? 'text-white border-transparent' : 'cs-canva-home-pill'
              }`}
              style={
                favoritesOnly
                  ? { background: 'var(--accent)', borderColor: 'var(--accent)' }
                  : { color: 'var(--text)', borderColor: 'var(--glass-border, var(--border))' }
              }
            >
              <Heart className={`w-3 h-3 ${favoritesOnly ? 'fill-current' : ''}`} />
              {isAr ? 'المفضلة' : 'Favorites'}
            </button>
            <button
              type="button"
              onClick={() => setContinueLimit((n) => Math.max(n, continueDesigns.length || 12))}
              className="cs-canva-home-link text-sm font-bold cursor-pointer shrink-0"
              style={{ color: 'var(--accent)' }}
            >
              {isAr ? 'عرض الكل' : 'See all'}
            </button>
          </div>
        </div>
        {continueDesigns.length === 0 ? (
          <div className="cs-canva-home-empty rounded-2xl border border-dashed px-4 py-10 text-center text-sm">
            {favoritesOnly
              ? isAr
                ? 'لا توجد تصاميم في المفضلة.'
                : 'No favorite designs yet.'
              : isAr
                ? 'لا توجد تصاميم محفوظة بعد. اختر قالباً من الأسفل للبدء.'
                : 'No saved designs yet. Pick a template below to start.'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {continueDesigns.slice(0, continueLimit).map((tpl) => {
                const fav = favoriteSet.has(tpl.id);
                return (
                <button
                  key={`cont-${tpl.id}`}
                  type="button"
                  onClick={() => onOpenEditor({ kind: 'mine', template: tpl })}
                  className="text-start cursor-pointer group min-w-0"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden ring-1 ring-black/5 bg-slate-100">
                    {tpl.previewDataUrl ? (
                      <img
                        src={tpl.previewDataUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {tpl.layers.length} {isAr ? 'طبقة' : 'layers'}
                      </span>
                    )}
                    <span className="absolute top-1.5 end-1.5 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-black/50 text-white">
                      {tpl.fromMaster || tpl.source === 'master'
                        ? isAr
                          ? 'ماستر'
                          : 'Master'
                        : isAr
                          ? 'خاص'
                          : 'Private'}
                    </span>
                    <button
                      type="button"
                      aria-label={fav ? (isAr ? 'إزالة من المفضلة' : 'Remove favorite') : (isAr ? 'إضافة للمفضلة' : 'Add favorite')}
                      onClick={(e) => toggleFavorite(tpl.id, e)}
                      className="absolute top-1.5 start-1.5 z-10 w-7 h-7 rounded-full bg-black/45 text-white flex items-center justify-center cursor-pointer hover:bg-black/65"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${fav ? 'fill-current' : ''}`}
                        style={fav ? { color: 'var(--accent)' } : undefined}
                      />
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] font-bold line-clamp-2 group-hover:underline" style={{ color: 'var(--text)' }}>
                    {isAr ? tpl.nameAr || tpl.nameEn : tpl.nameEn}
                  </p>
                  <div className="mt-0.5 flex items-center justify-between gap-1 text-[9px]" style={{ color: 'var(--muted)' }}>
                    <span className="truncate">
                      {tpl.width}×{tpl.height}
                      {tpl.updatedAt ? ` · ${relativeUpdated(tpl.updatedAt, isAr)}` : ''}
                    </span>
                    {fav ? (
                      <Heart className="w-3 h-3 shrink-0 fill-current" style={{ color: 'var(--accent)' }} />
                    ) : null}
                  </div>
                </button>
              );
              })}
            </div>
            {continueDesigns.length > continueLimit ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setContinueLimit((n) => n + 12)}
                  className="px-4 py-2 rounded-full text-xs font-black border cursor-pointer bg-[var(--surface)]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  {isAr ? 'عرض المزيد' : 'Show more'}
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* 3 — Templates prepared for you (own glass panel) */}
      <section className="cs-canva-home-glass rounded-3xl mb-4 px-4 sm:px-6 py-5" ref={mixedSectionRef}>
        {sectionHead(isAr ? 'قوالب مُعدّة من أجلك' : 'Templates prepared for you', () =>
          setHubTab('templates'),
        )}
        <p className="text-xs mb-3 -mt-1" style={{ color: 'var(--muted)' }}>
          {isAr
            ? 'نفس الارتفاع لكل البطاقات — العرض يتبع المقاس. انقر لفتح المحرر.'
            : 'Same card height for every template — width follows size. Click to open the editor.'}
        </p>
        <div className="relative">
          <button
            type="button"
            aria-label={isAr ? 'التالي' : 'Next'}
            onClick={() => scrollRow(mixedRowRef, isAr ? 1 : -1)}
            className="cs-canva-home-nav hidden sm:flex absolute top-[84px] -translate-y-1/2 z-10 w-9 h-9 rounded-full border items-center justify-center cursor-pointer"
            style={{ [isAr ? 'left' : 'right']: '-0.35rem' } as React.CSSProperties}
          >
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div
            ref={mixedRowRef}
            className="flex gap-3 overflow-x-auto pb-3 items-start snap-x snap-mandatory scroll-smooth"
          >
            {mixedTemplates.map((tpl) => {
              const cardW = canvaRowCardWidthPx(tpl.width, tpl.height);
              return (
                <button
                  key={`mx-${tpl.id}`}
                  type="button"
                  onClick={() => openPremade(tpl)}
                  className="cs-canva-home-card snap-start shrink-0 text-start cursor-pointer group flex flex-col"
                  style={{ width: cardW }}
                >
                  <PremadeThumb
                    template={tpl}
                    isAr={isAr}
                    storeName={storeName}
                    productName={productName}
                    priceLabel={priceLabel}
                    categoryName={categoryName}
                    activeImageUrl={activeImageUrl}
                    layout="canvaRow"
                  />
                  <p className="mt-1.5 text-[11px] font-bold line-clamp-2 min-h-[2.5rem] group-hover:underline" style={{ color: 'var(--text)' }}>
                    {isAr ? tpl.nameAr : tpl.nameEn}
                  </p>
                  <p className="text-[9px] font-mono" style={{ color: 'var(--muted)' }}>
                    {tpl.width}×{tpl.height}
                  </p>
                </button>
              );
            })}
            {mixedTemplates.length === 0 && (
              <p className="text-sm py-8 flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                <Sparkles className="w-4 h-4" />
                {isAr ? 'لا توجد قوالب مطابقة' : 'No matching templates'}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
