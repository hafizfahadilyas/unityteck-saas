import React, { useEffect, useMemo, useState, useDeferredValue } from 'react';
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
  Upload,
  Type,
  Presentation,
  Filter,
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
import { StoreFontSelect } from './fonts/StoreFontSelect';
import {
  STORE_ARABIC_FONT_COUNT,
  STORE_ENGLISH_FONT_COUNT,
  ensureStoreGoogleFontLoaded,
} from '../../data/storeGoogleFontsCatalog';
import {
  resolveDesignTitle,
  resolveTemplatePreviewUrl,
  detectTemplateLanguage,
  hasArabicChars,
} from '../../services/canvaTemplateTitles';

export type CanvaHomeOpenTarget =
  | { kind: 'premade'; template: CanvaDesignTemplate }
  | { kind: 'mine'; template: CanvaMyTemplate }
  | { kind: 'blank'; width: number; height: number; label: string; blankId?: string }
  | { kind: 'import'; file?: File }
  | { kind: 'fonts' };

function stubLayerLabel(tpl: CanvaMyTemplate, isAr: boolean): string {
  const n = tpl.layers?.length || tpl.layerCount || 0;
  return `${n} ${isAr ? 'طبقة' : 'layers'}`;
}

function isPptxOrImportTemplate(t: CanvaMyTemplate): boolean {
  const id = String(t.id || '');
  return (
    t.source === 'pptx' ||
    t.source === 'master' ||
    t.source === 'psd' ||
    Boolean(t.fromMaster) ||
    id.startsWith('mytpl-pptx-') ||
    id.startsWith('dsd-pptx-')
  );
}

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

const CATEGORY_FILTERS: Array<{ id: 'all' | CanvaTemplateCategory; labelEn: string; labelAr: string }> = [
  { id: 'all', labelEn: 'All', labelAr: 'الكل' },
  { id: 'social', labelEn: 'Social', labelAr: 'منشورات' },
  { id: 'banner', labelEn: 'Banner', labelAr: 'بنرات' },
  { id: 'product', labelEn: 'Product', labelAr: 'منتجات' },
  { id: 'ads', labelEn: 'Ads', labelAr: 'إعلانات' },
  { id: 'logo', labelEn: 'Logo', labelAr: 'شعارات' },
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

/** Canva home row: shared height so tall/wide look aligned and spacious. */
const HOME_THUMB_H = 210;

function canvaRowCardWidthPx(width: number, height: number): number {
  const ratio = Math.max(0.5, Math.min(2.4, width / Math.max(1, height)));
  return Math.round(Math.max(140, Math.min(360, HOME_THUMB_H * ratio)));
}

/** Memoized Premade Card Preview Thumb to prevent unnecessary re-renders */
const PremadeThumb: React.FC<{
  template: CanvaDesignTemplate;
  isAr: boolean;
  storeName: string;
  productName: string;
  priceLabel: string;
  categoryName: string;
  activeImageUrl?: string;
  layout?: 'equal' | 'canvaRow';
}> = React.memo(({
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
  const badge = template.elements.find((e) => e.type === 'badge');
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
      className="relative overflow-hidden rounded-2xl ring-1 ring-black/5 shrink-0 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-[1.01]"
      style={boxStyle}
    >
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div
          className="relative shrink-0 flex items-center justify-center"
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
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}
        </div>
      </div>

      {badgeLabel && badge ? (
        <span
          className="absolute top-2.5 start-2.5 z-10 px-2 py-0.5 rounded-full text-[9px] font-black max-w-[80%] truncate shadow-sm backdrop-blur-sm"
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

      {isBlank && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 z-10">
          <FilePlus2 className="w-8 h-8 opacity-70" />
        </div>
      )}

      {template.tier === 'pro' ? (
        <span className="absolute bottom-2.5 end-2.5 z-10 text-[8.5px] font-black px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm shadow-sm">
          {isAr ? 'خاص' : 'Pro'}
        </span>
      ) : null}
    </div>
  );
});
PremadeThumb.displayName = 'PremadeThumb';

/** Memoized Professional / Imported Template Card */
const PptxGridCard: React.FC<{
  tpl: CanvaMyTemplate;
  isAr: boolean;
  isOpening: boolean;
  isFav: boolean;
  onOpen: (tpl: CanvaMyTemplate) => void;
  onToggleFav: (id: string, e: React.MouseEvent) => void;
}> = React.memo(({ tpl, isAr, isOpening, isFav, onOpen, onToggleFav }) => {
  const displayTitle = resolveDesignTitle(tpl, isAr);
  const badgeLabel =
    tpl.source === 'pptx' || String(tpl.id).startsWith('mytpl-pptx-') || String(tpl.id).startsWith('dsd-pptx-')
      ? isAr ? 'احترافي' : 'PRO'
      : tpl.source === 'psd'
        ? 'PSD'
        : isAr ? 'قالب' : 'Template';
  const previewSrc = resolveTemplatePreviewUrl(tpl) || tpl.previewDataUrl;

  return (
    <button
      type="button"
      onClick={() => onOpen(tpl)}
      disabled={isOpening}
      className="cs-canva-home-card text-start cursor-pointer group flex flex-col min-w-0 disabled:opacity-60 transition-transform duration-200 hover:-translate-y-0.5"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '240px' }}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl ring-1 ring-black/5 bg-slate-100 shadow-sm transition-all group-hover:shadow-md">
        {previewSrc ? (
          <img
            src={previewSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[10px] font-bold text-slate-700 px-3 text-center bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-slate-200">
            <Presentation className="w-8 h-8 text-amber-600 opacity-90" />
            <span className="text-[10px] font-semibold text-slate-700">
              {isOpening ? (isAr ? 'جاري الفتح…' : 'Opening…') : stubLayerLabel(tpl, isAr)}
            </span>
          </span>
        )}

        {/* Source Badge */}
        <span className="absolute top-2 end-2 text-[8.5px] font-black px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm shadow-sm">
          {badgeLabel}
        </span>

        {/* Favorite Button */}
        <button
          type="button"
          aria-label={isFav ? (isAr ? 'إزالة من المفضلة' : 'Remove favorite') : (isAr ? 'إضافة للمفضلة' : 'Add favorite')}
          onClick={(e) => onToggleFav(tpl.id, e)}
          className="absolute top-2 start-2 z-10 w-7 h-7 rounded-full bg-black/45 text-white flex items-center justify-center cursor-pointer hover:bg-black/65 transition-colors"
        >
          <Heart
            className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`}
            style={isFav ? { color: 'var(--accent)' } : undefined}
          />
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-0.5 min-w-0">
        <p
          className="text-xs sm:text-[13px] font-bold line-clamp-2 leading-snug break-words group-hover:text-[var(--accent)] transition-colors"
          style={{ color: 'var(--text)' }}
          dir="auto"
          title={displayTitle}
        >
          {displayTitle}
        </p>
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--muted)' }}>
          <span className="font-mono">{tpl.width}×{tpl.height}</span>
          <span className="opacity-40">•</span>
          <span>{stubLayerLabel(tpl, isAr)}</span>
        </div>
      </div>
    </button>
  );
});
PptxGridCard.displayName = 'PptxGridCard';

export const CanvaStudioHome: React.FC<Props> = ({
  store,
  isAr,
  activeImageUrl,
  previewProduct = null,
  onOpenEditor,
}) => {
  const [viewMode, setViewMode] = useState<'home' | 'all-pptx'>('home');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [hubTab, setHubTab] = useState<'home' | 'templates'>('home');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CanvaTemplateCategory>('all');
  const [langFilter, setLangFilter] = useState<'all' | 'en' | 'ar'>('all');
  const [myTemplates, setMyTemplates] = useState<CanvaMyTemplate[]>([]);
  const [pptxHydrating, setPptxHydrating] = useState(true);
  const [pptxOpeningId, setPptxOpeningId] = useState<string | null>(null);
  const [continueLimit, setContinueLimit] = useState(12);
  const [pptxLimit, setPptxLimit] = useState(12);
  const [pptxApiPage, setPptxApiPage] = useState(1);
  const [pptxApiHasMore, setPptxApiHasMore] = useState(false);
  const [pptxLoadingMore, setPptxLoadingMore] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [homeFontPreview, setHomeFontPreview] = useState(isAr ? 'Cairo' : 'Inter');

  const forYouRef = React.useRef<HTMLDivElement | null>(null);
  const mixedSectionRef = React.useRef<HTMLDivElement | null>(null);
  const mixedRowRef = React.useRef<HTMLDivElement | null>(null);
  const pptxRowRef = React.useRef<HTMLDivElement | null>(null);
  const pptxSectionRef = React.useRef<HTMLDivElement | null>(null);
  const homeImportInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPptxHydrating(true);
    setPptxApiPage(1);

    // Guaranteed failsafe: Never leave PPTX in stuck loading state past 1.2 seconds
    const safetyTimer = window.setTimeout(() => {
      if (!cancelled) setPptxHydrating(false);
    }, 1200);

    void (async () => {
      // 1) Instant paint from IndexedDB — 0 delay, super fast
      try {
        const cached = await listMyCanvaTemplates(store.id);
        if (!cancelled) {
          setMyTemplates(cached);
          setPptxHydrating(false);
          window.clearTimeout(safetyTimer);
        }
      } catch {
        if (!cancelled) setPptxHydrating(false);
      }

      // 2) Background lean API stubs (top 15) — timeout-safe
      try {
        const { hydratePptxStudioPackForStore } = await import('../../services/canvaPptxPackHydrate');
        const result = await hydratePptxStudioPackForStore(store.id, { page: 1, perPage: 15 });
        if (cancelled) return;
        setPptxApiHasMore(Boolean(result.hasMore));
        setPptxApiPage(result.page || 1);
        const rows = await listMyCanvaTemplates(store.id);
        if (!cancelled) {
          setMyTemplates(rows);
          setPptxHydrating(false);
          window.clearTimeout(safetyTimer);
        }
      } catch {
        if (!cancelled) setPptxHydrating(false);
      }
    })();
    setFavoriteIds(listCanvaFavoriteIds(store.id));
    return () => {
      cancelled = true;
      window.clearTimeout(safetyTimer);
    };
  }, [store.id]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const toggleFavorite = (templateId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCanvaFavorite(store.id, templateId);
    setFavoriteIds(listCanvaFavoriteIds(store.id));
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
    if (deferredSearch.trim()) {
      const q = deferredSearch.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.nameEn.toLowerCase().includes(q) ||
          t.nameAr.includes(deferredSearch.trim()) ||
          t.category.includes(q),
      );
    }
    return list;
  }, [store, deferredSearch]);

  /** Section 1 — for you: prefer social / square-ish unlocked templates */
  const forYouTemplates = useMemo(() => {
    const unlocked = catalogList.filter((t) => isCanvaTemplateUnlocked(t, store));
    const social = unlocked.filter((t) => t.category === 'social');
    const pool = social.length >= 6 ? social : unlocked;
    return pool.slice(0, 12);
  }, [catalogList, store]);

  /** PowerPoint / imported packs — this store_id only */
  const pptxDesigns = useMemo(() => {
    let list = myTemplates.filter((t) => t.storeId === store.id && isPptxOrImportTemplate(t));

    // Category filter
    if (categoryFilter !== 'all') {
      list = list.filter((t) => t.category === categoryFilter);
    }

    // Language filter
    if (langFilter === 'en') {
      list = list.filter((t) => detectTemplateLanguage(t) !== 'ar');
    } else if (langFilter === 'ar') {
      list = list.filter((t) => detectTemplateLanguage(t) === 'ar' || detectTemplateLanguage(t) === 'universal');
    }

    // Deferred search filter
    if (deferredSearch.trim()) {
      const q = deferredSearch.trim().toLowerCase();
      list = list.filter((t) => {
        const enTitle = resolveDesignTitle(t, false).toLowerCase();
        const arTitle = resolveDesignTitle(t, true);
        return (
          enTitle.includes(q) ||
          arTitle.includes(deferredSearch.trim()) ||
          t.category.includes(q)
        );
      });
    }

    return [...list].sort((a, b) =>
      String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')),
    );
  }, [myTemplates, store.id, deferredSearch, categoryFilter, langFilter]);

  const loadMorePptx = async () => {
    if (pptxLoadingMore) return;
    if (pptxLimit < pptxDesigns.length) {
      setPptxLimit((n) => n + 12);
      return;
    }
    if (!pptxApiHasMore) {
      setPptxLimit((n) => Math.max(n, pptxDesigns.length || 12));
      return;
    }
    setPptxLoadingMore(true);
    try {
      const nextPage = pptxApiPage + 1;
      const { hydratePptxStudioPackForStore } = await import('../../services/canvaPptxPackHydrate');
      const result = await hydratePptxStudioPackForStore(store.id, { page: nextPage, perPage: 15 });
      setPptxApiPage(result.page || nextPage);
      setPptxApiHasMore(Boolean(result.hasMore));
      const rows = await listMyCanvaTemplates(store.id);
      setMyTemplates(rows);
      setPptxLimit((n) => n + 12);
    } catch {
      /* keep current */
    } finally {
      setPptxLoadingMore(false);
    }
  };

  /** Section 2 — continue designing: merchant-saved (non-pack) designs */
  const continueDesigns = useMemo(() => {
    let list = myTemplates.filter(
      (t) => t.storeId === store.id && (!isPptxOrImportTemplate(t) || t.source === 'studio'),
    );
    if (deferredSearch.trim()) {
      const q = deferredSearch.trim().toLowerCase();
      list = list.filter(
        (t) =>
          resolveDesignTitle(t, false).toLowerCase().includes(q) ||
          resolveDesignTitle(t, true).includes(deferredSearch.trim()) ||
          t.category.includes(q),
      );
    }
    if (favoritesOnly) {
      list = list.filter((t) => favoriteSet.has(t.id) || isCanvaFavorite(store.id, t.id));
    }
    list = [...list].sort((a, b) => {
      const af = favoriteSet.has(a.id) ? 1 : 0;
      const bf = favoriteSet.has(b.id) ? 1 : 0;
      if (af !== bf) return bf - af;
      return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });
    return list;
  }, [myTemplates, store.id, deferredSearch, favoritesOnly, favoriteSet]);

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

  /** Lazy-load PPTX layers only when merchant clicks (keeps home ultra fast). */
  const openMineTemplate = async (tpl: CanvaMyTemplate) => {
    if (pptxOpeningId) return;
    setPptxOpeningId(tpl.id);
    try {
      let ready = tpl;
      if (!tpl.layers?.length) {
        const { getMyCanvaTemplate } = await import('../../services/canvaMyTemplates');
        const localFull = await getMyCanvaTemplate(store.id, tpl.id);
        if (localFull?.layers?.length) {
          ready = localFull;
        } else {
          const { ensurePptxTemplateLayers } = await import('../../services/canvaPptxPackHydrate');
          ready = await ensurePptxTemplateLayers(store.id, tpl);
        }
      }
      onOpenEditor({ kind: 'mine', template: ready });
    } finally {
      setPptxOpeningId(null);
    }
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

  /** Preload heavy editor on hover so click opens with 0ms latency */
  const handlePreloadEditor = React.useCallback(() => {
    void import('./CanvaImageStudioModal');
  }, []);

  const sectionHead = (title: string, onSeeAll?: () => void) => (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="cs-canva-home-title text-lg sm:text-xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
        {title}
      </h2>
      {onSeeAll ? (
        <button
          type="button"
          onClick={onSeeAll}
          className="cs-canva-home-link text-sm font-bold cursor-pointer shrink-0 hover:underline transition-all"
          style={{ color: 'var(--accent)' }}
        >
          {isAr ? 'عرض الكل' : 'See all'}
        </button>
      ) : null}
    </div>
  );

  // ═════════════════════════════════════════════════════════════════════════
  // VIEW MODE: ALL PPTX & IMPORTED TEMPLATES (Dedicated Full Page View)
  // ═════════════════════════════════════════════════════════════════════════
  if (viewMode === 'all-pptx') {
    return (
      <div
        className="cs-canva-home u-page w-full min-w-0 max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 pb-10"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between gap-3 pt-3 pb-4">
          <button
            type="button"
            onClick={() => setViewMode('home')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-black cursor-pointer cs-canva-home-pill hover:scale-[1.02] transition-transform"
            style={{ color: 'var(--text)', borderColor: 'var(--border)' }}
          >
            {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span>{isAr ? 'العودة للرئيسية' : 'Back to Studio Home'}</span>
          </button>
          <button
            type="button"
            onClick={() => homeImportInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black text-white cursor-pointer shadow-sm hover:opacity-95"
            style={{ background: 'var(--accent)' }}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isAr ? 'استيراد ملف جديد' : 'Import New File'}</span>
          </button>
        </div>

        {/* Filter & Search Header Panel */}
        <div className="cs-canva-home-glass rounded-3xl p-5 sm:p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                {isAr ? 'جميع القوالب والتصاميم الاحترافية' : 'All Professional Design Templates'}
              </h1>
              <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? `قوالب هذا المتجر (${pptxDesigns.length} قالب متاح) — انقر على أي تصميم لفتحه وتعديله.`
                  : `Store templates (${pptxDesigns.length} available) — click any design to edit in canvas.`}
              </p>
            </div>
            {/* Search Input */}
            <div className="w-full sm:w-72">
              <label className="cs-canva-home-search flex items-center gap-2 rounded-full border px-3.5 py-2">
                <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isAr ? 'ابحث في القوالب…' : 'Search templates…'}
                  className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm outline-none"
                  style={{ color: 'var(--text)' }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-xs opacity-60 hover:opacity-100"
                  >
                    ✕
                  </button>
                )}
              </label>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold me-1" style={{ color: 'var(--muted)' }}>
                {isAr ? 'التصنيف:' : 'Category:'}
              </span>
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                    categoryFilter === cat.id ? 'text-white border-transparent' : 'cs-canva-home-pill'
                  }`}
                  style={
                    categoryFilter === cat.id
                      ? { background: 'var(--accent)', borderColor: 'var(--accent)' }
                      : { color: 'var(--text)', borderColor: 'var(--border)' }
                  }
                >
                  {isAr ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>

            {/* Language Filter Pills — NO MIXING */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold me-1" style={{ color: 'var(--muted)' }}>
                {isAr ? 'اللغة:' : 'Language:'}
              </span>
              <button
                type="button"
                onClick={() => setLangFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  langFilter === 'all' ? 'text-white border-transparent' : 'cs-canva-home-pill'
                }`}
                style={
                  langFilter === 'all'
                    ? { background: 'var(--accent)', borderColor: 'var(--accent)' }
                    : { color: 'var(--text)', borderColor: 'var(--border)' }
                }
              >
                {isAr ? 'الكل' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setLangFilter('en')}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  langFilter === 'en' ? 'text-white border-transparent' : 'cs-canva-home-pill'
                }`}
                style={
                  langFilter === 'en'
                    ? { background: 'var(--accent)', borderColor: 'var(--accent)' }
                    : { color: 'var(--text)', borderColor: 'var(--border)' }
                }
              >
                {isAr ? 'إنجليزية' : 'English Only'}
              </button>
              <button
                type="button"
                onClick={() => setLangFilter('ar')}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  langFilter === 'ar' ? 'text-white border-transparent' : 'cs-canva-home-pill'
                }`}
                style={
                  langFilter === 'ar'
                    ? { background: 'var(--accent)', borderColor: 'var(--accent)' }
                    : { color: 'var(--text)', borderColor: 'var(--border)' }
                }
              >
                {isAr ? 'عربية' : 'Arabic Only'}
              </button>
            </div>
          </div>
        </div>

        {/* Grid of Templates */}
        {pptxDesigns.length === 0 ? (
          <div className="cs-canva-home-glass rounded-3xl p-12 text-center space-y-3">
            <p className="text-base font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'لا توجد قوالب مطابقة للتصفية الحالية' : 'No templates match your current filters'}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {isAr ? 'جرّب إعادة ضبط خيارات البحث أو التصنيف' : 'Try resetting your search or category filters'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setLangFilter('all');
              }}
              className="px-4 py-2 rounded-full text-xs font-black border cursor-pointer cs-canva-home-pill"
              style={{ color: 'var(--text)', borderColor: 'var(--border)' }}
            >
              {isAr ? 'إعادة ضبط التصفية' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {pptxDesigns.map((tpl) => (
              <PptxGridCard
                key={`all-pptx-${tpl.id}`}
                tpl={tpl}
                isAr={isAr}
                isOpening={pptxOpeningId === tpl.id}
                isFav={favoriteSet.has(tpl.id)}
                onOpen={openMineTemplate}
                onToggleFav={toggleFavorite}
              />
            ))}
          </div>
        )}

        {/* Cloud Hydrate / Load More Button */}
        {pptxApiHasMore && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => void loadMorePptx()}
              disabled={pptxLoadingMore}
              className="px-6 py-2.5 rounded-full text-xs font-black border cursor-pointer cs-canva-home-pill shadow-sm hover:scale-[1.02] transition-transform disabled:opacity-60"
              style={{ color: 'var(--text)', borderColor: 'var(--border)' }}
            >
              {pptxLoadingMore
                ? isAr ? 'جاري تحميل المزيد من السحابة…' : 'Loading more from cloud…'
                : isAr ? 'تحميل المزيد من القوالب' : 'Load More Templates'}
            </button>
          </div>
        )}

        {/* Hidden Import Input */}
        <input
          ref={homeImportInputRef}
          type="file"
          accept=".pptx,.ppt,.psd,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,image/vnd.adobe.photoshop,image/png,image/jpeg,image/webp,image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) {
              onOpenEditor({ kind: 'import' });
              return;
            }
            onOpenEditor({ kind: 'import', file });
          }}
        />
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // VIEW MODE: HOME
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="cs-canva-home u-page w-full min-w-0 max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 pb-6"
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
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-xs opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            )}
          </label>
        </div>

        {/* Format chips + Import / Fonts / Slides */}
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
          <button
            type="button"
            onClick={() => homeImportInputRef.current?.click()}
            className="cs-canva-home-chip shrink-0 flex flex-col items-center gap-1.5 w-[4.5rem] cursor-pointer group"
            title={isAr ? 'استيراد قالب / فوتوشوب / صورة' : 'Import Template / PSD / Image'}
          >
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform"
              style={{ background: 'var(--accent)' }}
            >
              <Upload className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold truncate w-full" style={{ color: 'var(--text)' }}>
              {isAr ? 'استيراد' : 'Import'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenEditor({ kind: 'fonts' })}
            className="cs-canva-home-chip shrink-0 flex flex-col items-center gap-1.5 w-[4.5rem] cursor-pointer group"
            title={isAr ? 'خطوط عربية وإنجليزية' : 'Arabic & English fonts'}
          >
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform"
              style={{ background: 'var(--accent)' }}
            >
              <Type className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold truncate w-full" style={{ color: 'var(--text)' }}>
              {isAr ? 'الخطوط' : 'Fonts'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('all-pptx')}
            className="cs-canva-home-chip shrink-0 flex flex-col items-center gap-1.5 w-[4.5rem] cursor-pointer group"
            title={isAr ? 'عرض جميع القوالب الاحترافية' : 'View all professional templates'}
          >
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform"
              style={{ background: 'var(--accent)' }}
            >
              <Presentation className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold truncate w-full" style={{ color: 'var(--text)' }}>
              {isAr ? 'احترافي' : 'PRO'}
            </span>
          </button>
        </div>
        <div className="mt-4 max-w-md mx-auto text-start space-y-1.5">
          <p className="text-[10px] font-bold" style={{ color: 'var(--muted)' }}>
            {isAr
              ? `خطوط المتجر — عربي ${STORE_ARABIC_FONT_COUNT} · إنجليزي ${STORE_ENGLISH_FONT_COUNT}`
              : `Store fonts — Arabic ${STORE_ARABIC_FONT_COUNT} · English ${STORE_ENGLISH_FONT_COUNT}`}
          </p>
          <StoreFontSelect
            isAr={isAr}
            value={homeFontPreview}
            onChange={(face) => {
              setHomeFontPreview(face);
              ensureStoreGoogleFontLoaded(face);
            }}
            className="w-full"
          />
          <button
            type="button"
            onClick={() => onOpenEditor({ kind: 'fonts' })}
            className="text-[10px] font-bold cursor-pointer hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            {isAr ? 'فتح محرر الخطوط' : 'Open fonts in editor'}
          </button>
        </div>
        <input
          ref={homeImportInputRef}
          type="file"
          accept=".pptx,.ppt,.psd,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,image/vnd.adobe.photoshop,image/png,image/jpeg,image/webp,image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) {
              onOpenEditor({ kind: 'import' });
              return;
            }
            onOpenEditor({ kind: 'import', file });
          }}
        />
      </section>

      {/* 1 — For you (own glass panel) */}
      <section className="cs-canva-home-glass rounded-3xl mb-5 px-4 sm:px-6 py-5">
        {sectionHead(isAr ? 'مقترحة لك' : 'For you', () => {
          setHubTab('templates');
          mixedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        })}
        <div className="relative min-w-0">
          <button
            type="button"
            aria-label={isAr ? 'التالي' : 'Next'}
            onClick={() => scrollRow(forYouRef, isAr ? 1 : -1)}
            className="cs-canva-home-nav hidden sm:flex absolute top-[84px] -translate-y-1/2 z-10 w-9 h-9 rounded-full border items-center justify-center cursor-pointer pointer-events-auto"
            style={{ [isAr ? 'left' : 'right']: '0.25rem' } as React.CSSProperties}
          >
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div
            ref={forYouRef}
            className="flex gap-3 overflow-x-auto pb-2 pe-10 sm:pe-12 snap-x snap-mandatory scroll-smooth items-stretch"
          >
            {forYouTemplates.map((tpl) => (
              <button
                key={`fy-${tpl.id}`}
                type="button"
                onClick={() => openPremade(tpl)}
                onMouseEnter={handlePreloadEditor}
                className="cs-canva-home-card snap-start shrink-0 w-[11.5rem] sm:w-[13.5rem] text-start cursor-pointer group flex flex-col min-w-0"
                style={{ contentVisibility: 'auto', containIntrinsicSize: '216px 270px' }}
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
                <div className="mt-2 flex flex-col gap-0.5 min-w-0">
                  <p
                    className="text-xs sm:text-[13px] font-bold line-clamp-2 leading-snug break-words group-hover:text-[var(--accent)] transition-colors"
                    style={{ color: 'var(--text)' }}
                    dir="auto"
                    title={isAr ? tpl.nameAr : tpl.nameEn}
                  >
                    {isAr ? tpl.nameAr : tpl.nameEn}
                  </p>
                  <p className="text-[10px] font-mono shrink-0" style={{ color: 'var(--muted)' }}>
                    {tpl.width}×{tpl.height}
                  </p>
                </div>
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
                const title = resolveDesignTitle(tpl, isAr);
                return (
                  <button
                    key={`cont-${tpl.id}`}
                    type="button"
                    onClick={() => void openMineTemplate(tpl)}
                    onMouseEnter={handlePreloadEditor}
                    className="text-start cursor-pointer group min-w-0"
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '160px 180px' }}
                    disabled={pptxOpeningId === tpl.id}
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden ring-1 ring-black/5 bg-slate-100">
                      {tpl.previewDataUrl ? (
                        <img
                          src={tpl.previewDataUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {stubLayerLabel(tpl, isAr)}
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
                    <p
                      className="mt-2 text-xs sm:text-[13px] font-bold line-clamp-2 leading-snug break-words group-hover:text-[var(--accent)] transition-colors"
                      style={{ color: 'var(--text)' }}
                      dir="auto"
                      title={title}
                    >
                      {title}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-1 text-[10px]" style={{ color: 'var(--muted)' }}>
                      <span className="truncate font-mono">
                        {tpl.width}×{tpl.height}
                        {tpl.updatedAt ? ` · ${relativeUpdated(tpl.updatedAt, isAr)}` : ''}
                      </span>
                      {fav ? (
                        <Heart className="w-3.5 h-3.5 shrink-0 fill-current" style={{ color: 'var(--accent)' }} />
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

      {/* 3 — PowerPoint / imported templates (this store only) */}
      <section
        className="cs-canva-home-glass rounded-3xl mb-5 px-4 sm:px-6 py-5"
        ref={pptxSectionRef}
      >
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h2
            className="cs-canva-home-title text-lg sm:text-xl font-black tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            {isAr ? 'قوالب التصميم الاحترافية' : 'Professional Design Templates'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => homeImportInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black text-white cursor-pointer"
              style={{ background: 'var(--accent)' }}
            >
              <Upload className="w-3 h-3" />
              {isAr ? 'استيراد ملف' : 'Import file'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all-pptx')}
              className="cs-canva-home-link text-sm font-bold cursor-pointer shrink-0 hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              {isAr ? 'عرض الكل' : 'See all'}
            </button>
          </div>
        </div>
        <p className="text-xs mb-3 -mt-1" style={{ color: 'var(--muted)' }}>
          {isAr
            ? 'قوالب هذا المتجر فقط — انقر للتعديل في المحرر. يمكنك أيضاً استيراد ملفات التصميم الخاصة بك.'
            : 'This store only — click to edit. Or import your own design templates.'}
        </p>

        {pptxHydrating && pptxDesigns.length === 0 ? (
          <div className="flex gap-3 overflow-hidden pb-3">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={`pptx-skel-${idx}`}
                className="shrink-0 animate-pulse rounded-2xl bg-slate-100/80 p-2 flex flex-col gap-2"
                style={{ width: 140 }}
              >
                <div
                  className="w-full rounded-xl bg-slate-200/90 flex items-center justify-center"
                  style={{ height: HOME_THUMB_H }}
                >
                  <Presentation className="w-6 h-6 text-slate-400 opacity-50" />
                </div>
                <div className="h-3 w-3/4 rounded bg-slate-200/90" />
                <div className="h-2 w-1/3 rounded bg-slate-200/70" />
              </div>
            ))}
          </div>
        ) : pptxDesigns.length === 0 ? (
          <div className="cs-canva-home-empty rounded-2xl border border-dashed px-4 py-8 text-center space-y-3">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'لا توجد قوالب مستوردة بعد لهذا المتجر.'
                : 'No imported templates for this store yet.'}
            </p>
            <button
              type="button"
              onClick={() => homeImportInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black text-white cursor-pointer"
              style={{ background: 'var(--accent)' }}
            >
              <Upload className="w-3.5 h-3.5" />
              {isAr ? 'استيراد قالب الآن' : 'Import template now'}
            </button>
          </div>
        ) : (
          <div className="relative min-w-0">
            <button
              type="button"
              aria-label={isAr ? 'التالي' : 'Next'}
              onClick={() => scrollRow(pptxRowRef, isAr ? 1 : -1)}
              className="cs-canva-home-nav hidden sm:flex absolute top-[84px] -translate-y-1/2 z-10 w-9 h-9 rounded-full border items-center justify-center cursor-pointer"
              style={{ [isAr ? 'left' : 'right']: '0.25rem' } as React.CSSProperties}
            >
              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <div
              ref={pptxRowRef}
              className="flex gap-3 overflow-x-auto pb-3 pe-10 sm:pe-12 items-start snap-x snap-mandatory scroll-smooth"
            >
              {pptxDesigns.slice(0, pptxLimit).map((tpl) => {
                const cardW = canvaRowCardWidthPx(tpl.width, tpl.height);
                const title = resolveDesignTitle(tpl, isAr);
                const badgeLabel =
                  tpl.source === 'pptx' || String(tpl.id).startsWith('mytpl-pptx-')
                    ? isAr ? 'احترافي' : 'PRO'
                    : tpl.source === 'psd'
                      ? 'PSD'
                      : isAr ? 'مستورد' : 'PRO';

                const rowPreviewSrc = resolveTemplatePreviewUrl(tpl) || tpl.previewDataUrl;

                return (
                  <button
                    key={`pptx-${tpl.id}`}
                    type="button"
                    onClick={() => void openMineTemplate(tpl)}
                    onMouseEnter={handlePreloadEditor}
                    disabled={pptxOpeningId === tpl.id}
                    className="cs-canva-home-card snap-start shrink-0 text-start cursor-pointer group flex flex-col min-w-0 disabled:opacity-60"
                    style={{ width: cardW, contentVisibility: 'auto', containIntrinsicSize: `${cardW}px 270px` }}
                  >
                    <div
                      className="relative overflow-hidden rounded-xl ring-1 ring-black/5 bg-slate-100 shrink-0"
                      style={{ height: HOME_THUMB_H, width: '100%' }}
                    >
                      {rowPreviewSrc ? (
                        <img
                          src={rowPreviewSrc}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold text-slate-700 px-3 text-center bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-slate-200">
                          <Presentation className="w-6 h-6 text-amber-600 opacity-90" />
                          <span className="text-[10px] font-semibold text-slate-700">
                            {pptxOpeningId === tpl.id
                              ? isAr
                                ? 'جاري الفتح…'
                                : 'Opening…'
                              : stubLayerLabel(tpl, isAr)}
                          </span>
                        </span>
                      )}
                      <span className="absolute top-1.5 end-1.5 text-[8px] font-black px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm shadow-sm">
                        {badgeLabel}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-col gap-0.5 min-w-0">
                      <p
                        className="text-xs sm:text-[13px] font-bold line-clamp-2 leading-snug break-words group-hover:text-[var(--accent)] transition-colors"
                        style={{ color: 'var(--text)' }}
                        dir="auto"
                        title={title}
                      >
                        {title}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--muted)' }}>
                        <span className="font-mono">{tpl.width}×{tpl.height}</span>
                        <span className="opacity-40">•</span>
                        <span>{stubLayerLabel(tpl, isAr)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions: View all in new page OR show more in row */}
            <div className="mt-3 flex justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setViewMode('all-pptx')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black border cursor-pointer bg-[var(--surface)] hover:scale-105 transition-transform"
                style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? `عرض الكل في صفحة كاملة (${pptxDesigns.length})`
                    : `View All on New Page (${pptxDesigns.length})`}
                </span>
              </button>
              {pptxDesigns.length > pptxLimit && (
                <button
                  type="button"
                  onClick={() => void loadMorePptx()}
                  disabled={pptxLoadingMore}
                  className="px-4 py-2 rounded-full text-xs font-black border cursor-pointer bg-[var(--surface)] disabled:opacity-60"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  {pptxLoadingMore
                    ? isAr ? 'جاري التحميل…' : 'Loading…'
                    : isAr ? 'عرض المزيد هنا' : 'Show more in row'}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 4 — Templates prepared for you (own glass panel) */}
      <section className="cs-canva-home-glass rounded-3xl mb-4 px-4 sm:px-6 py-5" ref={mixedSectionRef}>
        {sectionHead(isAr ? 'قوالب مُعدّة من أجلك' : 'Templates prepared for you', () =>
          setHubTab('templates'),
        )}
        <p className="text-xs mb-3 -mt-1" style={{ color: 'var(--muted)' }}>
          {isAr
            ? 'نفس الارتفاع لكل البطاقات — العرض يتبع المقاس. انقر لفتح المحرر.'
            : 'Same card height for every template — width follows size. Click to open the editor.'}
        </p>
        <div className="relative min-w-0">
          <button
            type="button"
            aria-label={isAr ? 'التالي' : 'Next'}
            onClick={() => scrollRow(mixedRowRef, isAr ? 1 : -1)}
            className="cs-canva-home-nav hidden sm:flex absolute top-[84px] -translate-y-1/2 z-10 w-9 h-9 rounded-full border items-center justify-center cursor-pointer"
            style={{ [isAr ? 'left' : 'right']: '0.25rem' } as React.CSSProperties}
          >
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div
            ref={mixedRowRef}
            className="flex gap-3 overflow-x-auto pb-3 pe-10 sm:pe-12 items-start snap-x snap-mandatory scroll-smooth"
          >
            {mixedTemplates.map((tpl) => {
              const cardW = canvaRowCardWidthPx(tpl.width, tpl.height);
              return (
                <button
                  key={`mx-${tpl.id}`}
                  type="button"
                  onClick={() => openPremade(tpl)}
                  onMouseEnter={handlePreloadEditor}
                  className="cs-canva-home-card snap-start shrink-0 text-start cursor-pointer group flex flex-col min-w-0"
                  style={{ width: cardW, contentVisibility: 'auto', containIntrinsicSize: `${cardW}px 270px` }}
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
                  <div className="mt-2 flex flex-col gap-0.5 min-w-0">
                    <p
                      className="text-xs sm:text-[13px] font-bold line-clamp-2 leading-snug break-words group-hover:text-[var(--accent)] transition-colors"
                      style={{ color: 'var(--text)' }}
                      dir="auto"
                      title={isAr ? tpl.nameAr : tpl.nameEn}
                    >
                      {isAr ? tpl.nameAr : tpl.nameEn}
                    </p>
                    <p className="text-[10px] font-mono shrink-0" style={{ color: 'var(--muted)' }}>
                      {tpl.width}×{tpl.height}
                    </p>
                  </div>
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
