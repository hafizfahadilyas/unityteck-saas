import React, { useEffect, useMemo, useState } from 'react';
import {
  Lock,
  Search,
  Sparkles,
  FilePlus2,
  Upload,
  Trash2,
  RectangleHorizontal,
  Images,
  Smartphone,
  Megaphone,
  Package,
  Ratio,
  Award,
  LayoutTemplate,
  Monitor,
  Ruler,
  Check,
  type LucideIcon,
} from 'lucide-react';
import type { Store } from '../../types';
import {
  CANVA_TEMPLATE_CATEGORIES,
  getCanvaTemplate,
  resolveCanvaLayerLabel,
  type CanvaDesignTemplate,
  type CanvaTemplateCategory,
  type CanvaTemplateNiche,
  listCanvaTemplatesForStore,
  resolveStoreCanvaNiche,
} from '../../data/ksaCanvaTemplates';
import {
  countUnlockedInCategory,
  isCanvaTemplateUnlocked,
} from '../../services/canvaTemplateAccess';
import type { CanvaMyTemplate } from '../../services/canvaMyTemplates';
import { fetchDailyDesignTemplates } from '../../services/storeStudioDesigns';
import { ensureReadableTextStyle, resolveCanvasApproxColor } from '../../services/canvaTextContrast';

function truncatePreviewLabel(raw: string, max = 26): string {
  const t = raw.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1)).trim()}…`;
}

/** Map UI category → Laravel daily catalog category (ads reuse banner pool). */
function toDailyApiCategory(
  cat: CanvaTemplateCategory | 'all',
): 'banner' | 'logo' | 'product' | 'social' | 'category' | null {
  if (cat === 'all') return null;
  if (cat === 'ads') return 'banner';
  return cat;
}

export interface CanvaTemplatesPanelProps {
  store: Pick<
    Store,
    'id' | 'slug' | 'name' | 'nameAr' | 'category' | 'plan' | 'masterGrantedPro' | 'canvaTemplatesPerCategory'
  >;
  isAr: boolean;
  selectedTemplateId: string | null;
  activeImageUrl?: string;
  /** Live product fields for dynamic preview — never fake SAR / brand */
  previewProduct?: {
    name?: string;
    nameAr?: string;
    price?: number | string | null;
    category?: string;
    categoryAr?: string;
  } | null;
  myTemplates?: CanvaMyTemplate[];
  onApply: (template: CanvaDesignTemplate) => void;
  onApplyMyTemplate?: (template: CanvaMyTemplate) => void;
  onDeleteMyTemplate?: (templateId: string) => void;
  onOpenUploadTab?: () => void;
  onRequestPro: () => void;
  onSelectFormatPreset?: (width: number, height: number, label: string) => void;
  /** When set, category tabs are hidden and list is scoped to this category */
  lockedCategory?: CanvaTemplateCategory;
  /**
   * library = القوالب hub: premade + master + uploads for everyone on this store.
   * for_you = niche-filtered starter list.
   */
  defaultNiche?: 'library' | 'for_you' | 'blank' | 'all' | 'mine' | 'master';
}

/** True mini-canvas preview — safe bands only (no stacked overlap / unreadable text). */
const TemplatePreviewCard: React.FC<{
  template: CanvaDesignTemplate;
  isAr: boolean;
  activeImageUrl?: string;
  storeNiche: CanvaTemplateNiche;
  storeName?: string;
  productName?: string;
  priceLabel?: string;
  categoryName?: string;
}> = ({ template, isAr, activeImageUrl, storeName, productName, priceLabel, categoryName }) => {
  const isBlank = template.niche === 'blank';
  const isLogo = template.category === 'logo';
  const isLandscape = template.width > template.height * 1.2;
  const isPortrait = template.height > template.width * 1.05;

  // Live store/product image only — no cross-tenant sample product photos
  const previewImg = activeImageUrl || '';

  const canvasApprox = resolveCanvasApproxColor(template.backdropId, template.customSolidColor || '#ffffff');

  // Prefer badge → headline → price/CTA — skip subtitle + shapes to stop overlap in thumbs
  const previewLayers = (() => {
    const typed = template.elements.filter(
      (e) => e.type !== 'shape' && e.type !== 'icon' && e.type !== 'image' && e.type !== 'sticker',
    );
    const badges = typed.filter((e) => e.type === 'badge');
    const headlines = typed.filter((e) => e.type === 'headline' || e.type === 'custom_text');
    const prices = typed.filter((e) => e.type === 'price');
    const pick = [...badges.slice(0, 1), ...headlines.slice(0, 1), ...prices.slice(0, 1)].slice(0, 3);
    return pick.length > 0 ? pick : typed.slice(0, 2);
  })();

  return (
    <div className="w-full flex items-center justify-center rounded-lg bg-slate-100/60 dark:bg-white/5 p-1.5 min-h-[7.5rem]">
    <div
      className="relative overflow-hidden select-none rounded-md ring-1 ring-slate-200 w-full"
      style={{
        aspectRatio: `${template.width} / ${template.height}`,
        maxHeight: isPortrait ? 168 : isLandscape ? 96 : 120,
        maxWidth: isPortrait ? 96 : '100%',
        background: template.previewGradient,
      }}
    >
      {/* Product / subject — capped scale, mid zone only (never covers text band) */}
      {!isBlank && !isLogo && template.productPosPct.scale > 0 && previewImg && (
        <div
          className="absolute z-10 flex items-center justify-center pointer-events-none"
          style={{
            left: `${template.productPosPct.x * 100}%`,
            top: `${Math.min(template.productPosPct.y, isLandscape ? 0.55 : 0.42) * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: `${Math.min(template.productPosPct.scale, isLandscape ? 38 : 48)}%`,
            height: `${Math.min(template.productPosPct.scale, isLandscape ? 38 : 48)}%`,
          }}
        >
          <img
            src={previewImg}
            alt=""
            className="max-w-full max-h-full object-contain drop-shadow-sm"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Text / badge — max 3, truncated, contrast-fixed */}
      {previewLayers.map((layer, i) => {
        const raw = resolveCanvaLayerLabel(layer, {
          isAr,
          storeName,
          productName,
          priceLabel,
          categoryName,
        });
        if (!raw) return null;
        const label = truncatePreviewLabel(raw.split('\n')[0], layer.type === 'headline' ? 28 : 18);
        const isBadge = layer.type === 'badge' || layer.type === 'price';
        const align = layer.textAlign || 'center';
        const readable = ensureReadableTextStyle(
          layer.fontColor,
          layer.bgColor,
          canvasApprox,
          { preferPill: true, minRatio: 4.5 },
        );
        const fs =
          layer.type === 'headline'
            ? 'text-[8px] sm:text-[9px] font-black leading-tight tracking-tight'
            : 'text-[7px] sm:text-[8px] font-bold leading-tight tracking-tight';
        // Safe bands: badges near top, headlines near bottom — avoid mid collision with product
        const safeTop =
          layer.type === 'badge'
            ? Math.min(layer.yPct || 0.1, 0.18)
            : layer.type === 'price'
              ? Math.max(layer.yPct || 0.9, 0.86)
              : Math.max(layer.yPct || 0.78, isLandscape ? 0.42 : 0.72);
        const safeLeft = isLandscape && align === 'left' ? Math.min(layer.xPct || 0.08, 0.12) : layer.xPct || 0.5;
        const xform =
          align === 'left'
            ? 'translate(0, -50%)'
            : align === 'right'
              ? 'translate(-100%, -50%)'
              : 'translate(-50%, -50%)';
        const hasFill = Boolean(readable.bgColor && readable.bgColor !== 'transparent');
        return (
          <div
            key={`tx-${i}`}
            className={`absolute z-20 px-1.5 py-0.5 truncate ${fs} ${
              isLandscape && align === 'left' ? 'max-w-[46%]' : 'max-w-[72%]'
            }`}
            style={{
              left: `${safeLeft * 100}%`,
              top: `${safeTop * 100}%`,
              transform: xform,
              color: readable.fontColor,
              background: hasFill
                ? readable.bgColor
                : isBadge
                  ? 'rgba(15,23,42,0.92)'
                  : 'transparent',
              borderRadius: layer.borderRadius ? Math.min(layer.borderRadius, 12) : 8,
              textAlign: align,
              whiteSpace: 'nowrap',
              boxShadow: 'none',
              textShadow: 'none',
            }}
            title={raw}
          >
            {label}
          </div>
        );
      })}

      {isBlank && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 text-slate-600 pointer-events-none">
          <FilePlus2 className="w-5 h-5 opacity-80" aria-hidden />
          <span className="sr-only">{isAr ? 'فارغ' : 'BLANK'}</span>
        </div>
      )}

      {/* Size chip — solid opaque so it never looks blurry on gradients */}
      <div className={`absolute z-30 ${isBlank ? 'top-1.5 end-1.5' : 'bottom-1.5 end-1.5'}`}>
        <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-white text-slate-900 border border-slate-300">
          {template.width}×{template.height}
        </span>
      </div>
    </div>
    </div>
  );
};

export const CanvaTemplatesPanel: React.FC<CanvaTemplatesPanelProps> = ({
  store,
  isAr,
  selectedTemplateId,
  activeImageUrl,
  previewProduct = null,
  myTemplates = [],
  onApply,
  onApplyMyTemplate,
  onDeleteMyTemplate,
  onOpenUploadTab,
  onRequestPro,
  onSelectFormatPreset,
  lockedCategory,
  defaultNiche = 'library',
}) => {
  const storeNiche = useMemo(() => resolveStoreCanvaNiche(store), [store]);
  const [activeCategory, setActiveCategory] = useState<CanvaTemplateCategory | 'all'>(
    lockedCategory || 'all',
  );

  React.useEffect(() => {
    if (lockedCategory) {
      setActiveCategory(lockedCategory);
    }
  }, [lockedCategory]);
  const [nicheFilter, setNicheFilter] = useState<
    'library' | 'for_you' | 'blank' | 'all' | 'mine' | 'master'
  >(defaultNiche === 'for_you' ? 'for_you' : defaultNiche || 'library');

  useEffect(() => {
    if (defaultNiche) setNicheFilter(defaultNiche);
  }, [defaultNiche]);
  const [search, setSearch] = useState('');
  const [dailyIds, setDailyIds] = useState<string[]>([]);
  /** Selected format size — templates list filters to matching WxH (full layers for that size) */
  const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);
  const [sizeFilter, setSizeFilter] = useState<{ w: number; h: number } | null>(null);
  const [customW, setCustomW] = useState(1080);
  const [customH, setCustomH] = useState(1080);
  const [showCustomSize, setShowCustomSize] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const apiCat = toDailyApiCategory(activeCategory);
    if (!apiCat || nicheFilter === 'mine' || nicheFilter === 'master') {
      setDailyIds([]);
      return;
    }
    void (async () => {
      try {
        const pick = await fetchDailyDesignTemplates(store.id, apiCat);
        if (cancelled) return;
        setDailyIds(Array.isArray(pick?.template_ids) ? pick!.template_ids : []);
      } catch {
        if (!cancelled) setDailyIds([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.id, activeCategory, nicheFilter]);

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

  const filteredMyTemplates = useMemo(() => {
    let list = myTemplates.filter(
      (t) => t.storeId === store.id && !t.fromMaster && t.source !== 'master',
    );
    if (activeCategory !== 'all') {
      list = list.filter((t) => t.category === activeCategory);
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (t) =>
        t.nameEn.toLowerCase().includes(q) ||
        t.nameAr.includes(search) ||
        t.category.includes(q),
    );
  }, [myTemplates, store.id, activeCategory, search]);

  /** Newest saved designs with PNG/WebP preview — surface above premade grid */
  const recentSavedWithPreview = useMemo(() => {
    return myTemplates
      .filter(
        (t) =>
          t.storeId === store.id &&
          Boolean(t.previewDataUrl) &&
          !t.fromMaster &&
          t.source !== 'master',
      )
      .slice(0, 6);
  }, [myTemplates, store.id]);

  /** Master Admin distributed designs — editable after open */
  const filteredMasterTemplates = useMemo(() => {
    let list = myTemplates.filter(
      (t) => t.storeId === store.id && (t.fromMaster === true || t.source === 'master'),
    );
    if (activeCategory !== 'all') {
      list = list.filter((t) => t.category === activeCategory);
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (t) =>
        t.nameEn.toLowerCase().includes(q) ||
        t.nameAr.includes(search) ||
        t.category.includes(q),
    );
  }, [myTemplates, store.id, activeCategory, search]);

  const canvaExploreCards: Array<{
    id: string;
    labelEn: string;
    labelAr: string;
    w: number;
    h: number;
    Icon: LucideIcon;
    blankId?: string;
    category?: CanvaTemplateCategory | 'all';
    isCustom?: boolean;
  }> = [
    {
      id: 'blank',
      labelEn: 'Blank',
      labelAr: 'فارغ',
      w: 1080,
      h: 1080,
      Icon: FilePlus2,
      blankId: 'blank-square',
      category: 'all',
    },
    {
      id: 'story',
      labelEn: 'Story',
      labelAr: 'ستوري',
      w: 1080,
      h: 1920,
      Icon: Smartphone,
      blankId: 'blank-story',
      category: 'social',
    },
    {
      id: 'portrait',
      labelEn: 'Portrait',
      labelAr: 'عمودي',
      w: 1080,
      h: 1350,
      Icon: Ratio,
      blankId: 'blank-portrait',
      category: 'social',
    },
    {
      id: 'banner',
      labelEn: 'Banner',
      labelAr: 'بنر',
      w: 1600,
      h: 600,
      Icon: RectangleHorizontal,
      blankId: 'blank-banner',
      category: 'banner',
    },
    {
      id: 'ads',
      labelEn: 'Ads',
      labelAr: 'إعلان',
      w: 1200,
      h: 628,
      Icon: Megaphone,
      blankId: 'blank-ads',
      category: 'ads',
    },
    {
      id: 'instagram',
      labelEn: 'Post',
      labelAr: 'منشور',
      w: 1080,
      h: 1080,
      Icon: Images,
      blankId: 'blank-square',
      category: 'social',
    },
    {
      id: 'product',
      labelEn: 'Product',
      labelAr: 'منتج',
      w: 1080,
      h: 1080,
      Icon: Package,
      blankId: 'blank-product',
      category: 'product',
    },
    {
      id: 'logo',
      labelEn: 'Logo',
      labelAr: 'شعار',
      w: 800,
      h: 800,
      Icon: Award,
      blankId: 'blank-logo',
      category: 'logo',
    },
    {
      id: 'cover',
      labelEn: 'Cover',
      labelAr: 'غلاف',
      w: 1200,
      h: 800,
      Icon: LayoutTemplate,
      blankId: 'blank-category',
      category: 'category',
    },
    {
      id: 'landscape',
      labelEn: 'Landscape',
      labelAr: 'أفقي',
      w: 1920,
      h: 1080,
      Icon: Monitor,
      blankId: 'blank-landscape',
      category: 'banner',
    },
    {
      id: 'custom',
      labelEn: 'Custom',
      labelAr: 'مخصص',
      w: 0,
      h: 0,
      Icon: Ruler,
      isCustom: true,
    },
  ];

  const applyFormatSize = (opts: {
    id: string;
    w: number;
    h: number;
    labelEn: string;
    labelAr: string;
    blankId?: string;
    category?: CanvaTemplateCategory | 'all';
  }) => {
    const w = Math.max(64, Math.min(4000, Math.round(opts.w)));
    const h = Math.max(64, Math.min(4000, Math.round(opts.h)));
    setSelectedFormatId(opts.id);
    setSizeFilter({ w, h });
    setShowCustomSize(opts.id === 'custom');
    if (opts.category === 'all') {
      setActiveCategory('all');
      setNicheFilter('blank');
    } else if (opts.category) {
      setActiveCategory(opts.category);
      setNicheFilter('for_you');
    }
    const label = isAr ? opts.labelAr : opts.labelEn;
    onSelectFormatPreset?.(w, h, `${label} ${w}×${h}`);
    if (opts.blankId) {
      const blank = getCanvaTemplate(opts.blankId);
      if (blank) onApply(blank);
    } else {
      onApply({
        id: `blank-custom-${w}x${h}`,
        category: 'social',
        sort: 0,
        tier: 'free',
        niche: 'blank',
        nameEn: `Custom ${w}×${h}`,
        nameAr: `مخصص ${w}×${h}`,
        width: w,
        height: h,
        backdropId: 'pure-white',
        productPosPct: { x: 0.5, y: 0.5, scale: 0 },
        previewGradient: 'linear-gradient(135deg,#ffffff,#f1f5f9)',
        elements: [],
      });
    }
  };

  // Generic chrome only — never surface coffee/flowers pack names in UI
  const nicheLabel = isAr ? 'قوالب متجرك' : 'Your templates';

  const dailyTemplates = useMemo(() => {
    if (dailyIds.length === 0) return [] as CanvaDesignTemplate[];
    return dailyIds
      .map((id) => getCanvaTemplate(id))
      .filter((t): t is CanvaDesignTemplate => Boolean(t));
  }, [dailyIds]);

  const templates = useMemo(() => {
    if (nicheFilter === 'mine' || nicheFilter === 'master') return [];

    let list = listCanvaTemplatesForStore(store, activeCategory);

    if (nicheFilter === 'blank') {
      list = list.filter((t) => t.niche === 'blank');
    } else if (nicheFilter === 'for_you') {
      list = list.filter(
        (t) => t.niche === 'blank' || t.niche === storeNiche || t.niche === 'general',
      );
    } else if (nicheFilter === 'library' || nicheFilter === 'all') {
      // Full catalog for القوالب — blank + store niche + general (no fake cross-tenant rows)
      list = list.filter(
        (t) =>
          t.niche === 'blank' ||
          t.niche === storeNiche ||
          t.niche === 'general' ||
          t.tier === 'free' ||
          t.tier === 'pro',
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.nameEn.toLowerCase().includes(q) ||
          t.nameAr.includes(search) ||
          t.niche.includes(q) ||
          t.elements.some(
            (e) =>
              (e.textEn || '').toLowerCase().includes(q) ||
              (e.textAr || '').includes(search),
          ),
      );
    }

    // Size lock — only full templates that match the chosen canvas WxH
    if (sizeFilter) {
      list = list.filter(
        (t) =>
          Math.abs(t.width - sizeFilter.w) <= 2 && Math.abs(t.height - sizeFilter.h) <= 2,
      );
    }

    // Surface today's 5 first when API returned real catalog IDs
    if (dailyIds.length > 0) {
      const dailySet = new Set(dailyIds);
      list = [
        ...list.filter((t) => dailySet.has(t.id)),
        ...list.filter((t) => !dailySet.has(t.id)),
      ];
    }

    return list;
  }, [activeCategory, search, store, nicheFilter, storeNiche, dailyIds, sizeFilter]);

  const counts = useMemo(() => {
    if (activeCategory === 'all') {
      return { unlocked: templates.length, total: templates.length, limit: null };
    }
    return countUnlockedInCategory(activeCategory, store);
  }, [activeCategory, store, templates.length]);

  return (
    <div className="space-y-3">
      {/* Explore formats — Blank first */}
      <div className="space-y-1.5 pb-2 border-b border-border/60">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-muted flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            {isAr ? 'مقاسات وقوالب جاهزة' : 'Formats & premade'}
          </span>
          <span className="text-[10px] text-muted shrink-0">
            {sizeFilter ? `${sizeFilter.w}×${sizeFilter.h} · ` : ''}
            {templates.length} {isAr ? 'قالب' : 'templates'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {canvaExploreCards.map((card) => {
            const Icon = card.Icon;
            const isActive = selectedFormatId === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  if (card.isCustom) {
                    setSelectedFormatId('custom');
                    setShowCustomSize(true);
                    return;
                  }
                  applyFormatSize({
                    id: card.id,
                    w: card.w,
                    h: card.h,
                    labelEn: card.labelEn,
                    labelAr: card.labelAr,
                    blankId: card.blankId,
                    category: card.category,
                  });
                }}
                className={`cs-format-card group relative flex flex-col items-center justify-center gap-1 min-h-[5rem] px-1.5 py-2 rounded-xl cursor-pointer text-center transition-all ${
                  isActive ? 'cs-format-card-active' : ''
                }`}
                title={
                  card.isCustom
                    ? isAr
                      ? 'مقاس مخصص'
                      : 'Custom size'
                    : `${isAr ? card.labelAr : card.labelEn} · ${card.w}×${card.h}`
                }
              >
                <span
                  className={`cs-format-card-ratio flex items-center justify-center ${
                    card.isCustom ? 'cs-format-card-icon w-7 h-7 rounded-lg' : ''
                  }`}
                  style={
                    card.isCustom
                      ? undefined
                      : {
                          aspectRatio: `${card.w} / ${card.h}`,
                          width:
                            card.h > card.w * 1.05
                              ? 16
                              : card.w > card.h * 1.2
                                ? 32
                                : 22,
                        }
                  }
                  aria-hidden
                >
                  <Icon
                    className={card.isCustom ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'}
                    strokeWidth={2.25}
                  />
                </span>
                <span className="text-[10px] sm:text-[11px] font-black leading-tight tracking-tight">
                  {isAr ? card.labelAr : card.labelEn}
                </span>
                <span className="cs-format-card-size text-[8px] font-bold font-mono tabular-nums leading-none">
                  {card.isCustom
                    ? isAr
                      ? 'عرض × ارتفاع'
                      : 'W × H'
                    : `${card.w}×${card.h}`}
                </span>
              </button>
            );
          })}
        </div>

        {showCustomSize && (
          <div className="cs-format-custom flex flex-col gap-2 p-2.5 rounded-xl">
            <div className="flex items-center gap-2">
              <label className="flex-1 space-y-1">
                <span className="text-[9px] font-bold text-muted block">
                  {isAr ? 'العرض' : 'Width'}
                </span>
                <input
                  type="number"
                  min={64}
                  max={4000}
                  value={customW}
                  onChange={(e) => setCustomW(Number(e.target.value) || 64)}
                  className="w-full px-2 py-1.5 rounded-lg text-xs font-mono border border-slate-200 bg-white text-slate-900"
                />
              </label>
              <span className="text-muted text-xs font-black pt-4">×</span>
              <label className="flex-1 space-y-1">
                <span className="text-[9px] font-bold text-muted block">
                  {isAr ? 'الارتفاع' : 'Height'}
                </span>
                <input
                  type="number"
                  min={64}
                  max={4000}
                  value={customH}
                  onChange={(e) => setCustomH(Number(e.target.value) || 64)}
                  className="w-full px-2 py-1.5 rounded-lg text-xs font-mono border border-slate-200 bg-white text-slate-900"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() =>
                applyFormatSize({
                  id: 'custom',
                  w: customW,
                  h: customH,
                  labelEn: 'Custom',
                  labelAr: 'مخصص',
                  category: 'all',
                })
              }
              className="cs-btn-primary w-full py-2 rounded-lg text-[11px] font-black text-white flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              {isAr ? 'تطبيق المقاس المخصص' : 'Apply custom size'}
            </button>
          </div>
        )}

        {sizeFilter && (
          <button
            type="button"
            onClick={() => {
              setSelectedFormatId(null);
              setSizeFilter(null);
              setShowCustomSize(false);
              setActiveCategory(lockedCategory || 'all');
              setNicheFilter('for_you');
            }}
            className="text-[10px] font-bold text-muted hover:text-[var(--accent,#1d8b94)] cursor-pointer"
          >
            {isAr ? 'إظهار كل المقاسات' : 'Show all sizes'}
          </button>
        )}
      </div>

      {/* Niche pills — library hub first (القوالب = everyone sees ready designs) */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            {
              id: 'library' as const,
              en: 'All templates',
              ar: 'كل القوالب',
            },
            { id: 'for_you' as const, en: nicheLabel, ar: nicheLabel },
            {
              id: 'master' as const,
              en: 'Master',
              ar: 'الماستر',
            },
            { id: 'mine' as const, en: 'My uploads', ar: 'قوالبي المرفوعة' },
            { id: 'blank' as const, en: 'Blank', ar: 'فارغ' },
            { id: 'all' as const, en: 'All formats', ar: 'كل المقاسات' },
          ] as const
        ).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setNicheFilter(p.id)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black border cursor-pointer transition-colors ${
              nicheFilter === p.id
                ? 'text-white border-transparent'
                : 'border-slate-200 text-slate-600 bg-white'
            }`}
            style={
              nicheFilter === p.id
                ? { background: 'var(--accent, #1d8b94)', borderColor: 'var(--accent, #1d8b94)' }
                : undefined
            }
          >
            {isAr ? p.ar : p.en}
            {p.id === 'mine' && filteredMyTemplates.length > 0
              ? ` (${filteredMyTemplates.length})`
              : ''}
            {p.id === 'master' && filteredMasterTemplates.length > 0
              ? ` (${filteredMasterTemplates.length})`
              : ''}
          </button>
        ))}
      </div>

      {nicheFilter === 'library' && (
        <div className="space-y-3 pb-2 border-b border-slate-200">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            {isAr
              ? 'كل القوالب الجاهزة لهذا المتجر: الماستر، المرفوعة، والقوالب السعودية — ظاهرة للجميع هنا.'
              : 'All ready designs for this store: Master, uploads, and Saudi premades — visible here for everyone.'}
          </p>
          {filteredMasterTemplates.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                {isAr ? `من الماستر (${filteredMasterTemplates.length})` : `From Master (${filteredMasterTemplates.length})`}
              </span>
              <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pe-1">
                {filteredMasterTemplates.slice(0, 8).map((tpl) => (
                  <button
                    key={`lib-m-${tpl.id}`}
                    type="button"
                    onClick={() => onApplyMyTemplate?.(tpl)}
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-start cursor-pointer hover:border-[var(--accent,#1d8b94)]"
                  >
                    <div className="relative aspect-square rounded-md overflow-hidden bg-slate-100 mb-1">
                      {tpl.previewDataUrl ? (
                        <img src={tpl.previewDataUrl} alt="" className="w-full h-full object-contain" loading="lazy" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-500">
                          {tpl.layers.length} {isAr ? 'طبقة' : 'layers'}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-black truncate block text-slate-800">
                      {isAr ? tpl.nameAr || tpl.nameEn : tpl.nameEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {filteredMyTemplates.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                {isAr ? `مرفوعات المتجر (${filteredMyTemplates.length})` : `Store uploads (${filteredMyTemplates.length})`}
              </span>
              <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pe-1">
                {filteredMyTemplates.slice(0, 8).map((tpl) => (
                  <button
                    key={`lib-u-${tpl.id}`}
                    type="button"
                    onClick={() => onApplyMyTemplate?.(tpl)}
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-start cursor-pointer hover:border-[var(--accent,#1d8b94)]"
                  >
                    <div className="relative aspect-square rounded-md overflow-hidden bg-slate-100 mb-1">
                      {tpl.previewDataUrl ? (
                        <img src={tpl.previewDataUrl} alt="" className="w-full h-full object-contain" loading="lazy" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-500">
                          {tpl.layers.length} {isAr ? 'طبقة' : 'layers'}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-black truncate block text-slate-800">
                      {isAr ? tpl.nameAr || tpl.nameEn : tpl.nameEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {nicheFilter === 'master' && (
        <div className="space-y-2">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            {isAr
              ? 'قوالب أنشأها الماستر وأرسلها لهذا المتجر. نقرة = فتح للتعديل الكامل (نص، خلفية، طبقات).'
              : 'Designs Master Admin created and sent to this store. One click = open fully editable (text, BG, layers).'}
          </p>
          <button
            type="button"
            onClick={onOpenUploadTab}
            className="w-full py-2 rounded-lg border border-dashed border-slate-300 text-[10px] font-black text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer bg-white hover:border-emerald-500"
          >
            <Upload className="w-3.5 h-3.5" />
            {isAr ? 'رفع بي إن جي / جيه بي جيه / بي إس دي للتعديل' : 'Upload PNG / JPG / PSD to edit'}
          </button>
          <div className="grid grid-cols-2 gap-2.5 max-h-[min(420px,50vh)] overflow-y-auto pe-1">
            {filteredMasterTemplates.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  className={`group relative rounded-lg border p-1.5 bg-white flex flex-col ${
                    isSelected ? 'ring-1 border-emerald-500' : 'border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    className="w-full text-start cursor-pointer"
                    onClick={() => onApplyMyTemplate?.(tpl)}
                  >
                    <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#f8fafc_0%_50%)] bg-[length:12px_12px] border border-slate-200">
                      {tpl.previewDataUrl ? (
                        <img
                          src={tpl.previewDataUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[9px] text-slate-500 font-bold">
                          {tpl.layers.length} {isAr ? 'طبقة' : 'layers'}
                        </div>
                      )}
                      <span className="absolute top-1 start-1 text-[8px] font-black px-1.5 py-0.5 rounded bg-[var(--accent,#1d8b94)] text-white">
                        {isAr ? 'ماستر' : 'Master'}
                      </span>
                    </div>
                    <div className="mt-1.5 px-0.5">
                      <div className="text-[10px] font-black text-slate-800 truncate">
                        {isAr ? tpl.nameAr || tpl.nameEn : tpl.nameEn}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {tpl.width}×{tpl.height} · {tpl.layers.length}{' '}
                        {isAr ? 'طبقة' : 'layers'}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
          {filteredMasterTemplates.length === 0 && (
            <p className="text-[11px] text-center text-slate-500 py-6 border border-dashed border-slate-200 rounded-xl">
              {isAr
                ? 'لا قوالب من الماستر بعد. عندما يحفظ الماستر لمتجرك ستظهر هنا.'
                : 'No Master templates yet. When Master saves to your store, they appear here.'}
            </p>
          )}
        </div>
      )}

      {nicheFilter === 'mine' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onOpenUploadTab}
            className="w-full py-2 rounded-lg border border-dashed border-slate-300 text-[10px] font-black text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer bg-white hover:border-emerald-500"
          >
            <Upload className="w-3.5 h-3.5" />
            {isAr ? 'رفع بي إن جي / جيه بي جيه / بي إس دي' : 'Upload PNG / JPG / PSD'}
          </button>
          <div className="grid grid-cols-2 gap-2.5 max-h-[min(420px,50vh)] overflow-y-auto pe-1">
            {filteredMyTemplates.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  className={`group relative rounded-lg border p-1.5 bg-white flex flex-col ${
                    isSelected ? 'ring-1 border-emerald-500' : 'border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    className="w-full text-start cursor-pointer"
                    onClick={() => onApplyMyTemplate?.(tpl)}
                  >
                    <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#f8fafc_0%_50%)] bg-[length:12px_12px] border border-slate-200">
                      {tpl.previewDataUrl ? (
                        <img
                          src={tpl.previewDataUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[9px] text-slate-500 font-bold">
                          {tpl.layers.length} {isAr ? 'طبقة' : 'layers'}
                        </div>
                      )}
                      <span className="absolute bottom-1 end-1 px-1.5 py-0.5 rounded text-[7px] font-bold bg-white/95 text-slate-800 border border-slate-200">
                        {tpl.width}×{tpl.height}
                      </span>
                    </div>
                  </button>
                  <div className="mt-1.5 flex items-center justify-between gap-1 px-0.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-black truncate text-slate-900">
                        {isAr ? tpl.nameAr || tpl.nameEn : tpl.nameEn}
                      </div>
                      <div className="text-[8px] text-emerald-700 font-bold">
                        {isAr ? 'مرفوع · قابل للتعديل' : 'Uploaded · editable'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteMyTemplate?.(tpl.id)}
                      className="shrink-0 p-1 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 cursor-pointer"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredMyTemplates.length === 0 && (
            <div className="py-6 text-center text-xs text-muted">
              {isAr
                ? 'لا توجد قوالب مرفوعة بعد. ارفع ملف بي إس دي أو صورة من تبويب الرفع.'
                : 'No uploads yet. Upload a PSD or image from the Uploads tab.'}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-muted absolute start-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            isAr
              ? 'ابحث في القوالب الجاهزة...'
              : 'Search premade templates...'
          }
          className="w-full ps-8 pe-3 py-1.5 rounded-lg text-xs border bg-white text-slate-900 border-slate-200 focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-slate-400"
        />
      </div>

      {/* Category pills */}
      {!lockedCategory ? (
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-black border cursor-pointer transition-colors ${
            activeCategory === 'all'
              ? 'text-white border-transparent'
              : 'border-slate-200 text-slate-600 bg-white hover:border-slate-400'
          }`}
          style={
            activeCategory === 'all'
              ? { background: 'var(--accent, #1d8b94)', borderColor: 'var(--accent, #1d8b94)' }
              : undefined
          }
        >
          {isAr ? 'الكل' : 'All'}
        </button>
        {CANVA_TEMPLATE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCategory(c.id)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black border cursor-pointer transition-colors ${
              activeCategory === c.id
                ? 'text-white border-transparent'
                : 'border-slate-200 text-slate-600 bg-white hover:border-slate-400'
            }`}
            style={
              activeCategory === c.id
                ? { background: 'var(--accent, #1d8b94)', borderColor: 'var(--accent, #1d8b94)' }
                : undefined
            }
          >
            {isAr ? c.labelAr : c.labelEn}
          </button>
        ))}
      </div>
      ) : (
        <p className="text-[10px] font-bold" style={{ color: 'var(--accent)' }}>
          {isAr
            ? CANVA_TEMPLATE_CATEGORIES.find((c) => c.id === lockedCategory)?.labelAr || lockedCategory
            : CANVA_TEMPLATE_CATEGORIES.find((c) => c.id === lockedCategory)?.labelEn || lockedCategory}
        </p>
      )}

      {nicheFilter !== 'mine' && activeCategory !== 'all' && counts.limit != null && (
        <p className="text-[10px] text-muted">
          {isAr
            ? `${counts.unlocked} من ${counts.total} مفتوح في الباقة الحالية`
            : `${counts.unlocked} of ${counts.total} unlocked on your plan`}
        </p>
      )}

      {nicheFilter !== 'mine' && dailyTemplates.length > 0 && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1.5">
          <span className="text-[10px] font-black text-amber-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {isAr ? `قوالب اليوم (${dailyTemplates.length})` : `Today's templates (${dailyTemplates.length})`}
          </span>
          <span className="text-[9px] font-bold text-amber-700/80">
            {isAr ? 'تتجدد يومياً' : 'Rotates daily'}
          </span>
        </div>
      )}

      {/* Last saved — real PNG/WebP thumbs (no overlap with premade layer mash) */}
      {nicheFilter !== 'mine' && nicheFilter !== 'master' && recentSavedWithPreview.length > 0 && (
        <div className="cs-saved-strip space-y-1.5 pb-2 border-b border-slate-200 rounded-xl p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              {isAr ? 'آخر القوالب المحفوظة' : 'Last saved templates'}
            </span>
            <button
              type="button"
              onClick={() => setNicheFilter('mine')}
              className="text-[9px] font-bold text-[var(--accent,#1d8b94)] cursor-pointer"
            >
              {isAr ? 'عرض الكل' : 'View all'}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {recentSavedWithPreview.map((tpl) => (
              <button
                key={`recent-${tpl.id}`}
                type="button"
                onClick={() => onApplyMyTemplate?.(tpl)}
                className={`cs-saved-thumb relative aspect-square rounded-lg overflow-hidden border cursor-pointer bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#f8fafc_0%_50%)] bg-[length:10px_10px] ${
                  selectedTemplateId === tpl.id
                    ? 'ring-2 ring-[var(--accent,#1d8b94)] border-[var(--accent,#1d8b94)]'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
                title={isAr ? tpl.nameAr || tpl.nameEn : tpl.nameEn}
              >
                {tpl.previewDataUrl && (
                  <img
                    src={tpl.previewDataUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain"
                    loading="lazy"
                  />
                )}
                <span className="absolute bottom-0 inset-x-0 px-1 py-0.5 text-[7px] font-bold bg-black/55 text-white truncate text-center">
                  {isAr ? tpl.nameAr || tpl.nameEn : tpl.nameEn}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Template grid — responsive cards (premade packs) */}
      {nicheFilter !== 'mine' && (
      <div className="grid grid-cols-2 gap-2.5 max-h-[min(520px,55vh)] overflow-y-auto pe-1">
        {templates.map((tpl) => {
          const unlocked = isCanvaTemplateUnlocked(tpl, store);
          const isSelected = selectedTemplateId === tpl.id;
          const isDaily = dailyIds.includes(tpl.id);
          const typeTag =
            tpl.niche === 'blank'
              ? isAr
                ? 'فارغ'
                : 'Blank'
              : isDaily
                ? isAr
                  ? 'اليوم'
                  : 'Today'
                : isAr
                  ? 'قالب'
                  : 'Template';

          return (
            <div
              key={tpl.id}
              className={`group relative rounded-lg border p-1.5 transition-colors flex flex-col bg-white ${
                isSelected ? 'ring-1' : isDaily ? 'border-amber-300' : 'border-slate-200 hover:border-slate-400'
              }`}
              style={
                isSelected
                  ? {
                      borderColor: 'var(--accent, #1d8b94)',
                      boxShadow: '0 0 0 1px color-mix(in srgb, var(--accent, #1d8b94) 30%, transparent)',
                    }
                  : undefined
              }
            >
              {isDaily && (
                <span className="absolute top-2 start-2 z-20 px-1.5 py-0.5 rounded text-[7px] font-black bg-amber-500 text-white">
                  {isAr ? 'اليوم' : 'TODAY'}
                </span>
              )}
              <button
                type="button"
                className="w-full text-start cursor-pointer"
                onClick={() => (unlocked ? onApply(tpl) : onRequestPro())}
              >
                <TemplatePreviewCard
                  template={tpl}
                  isAr={isAr}
                  activeImageUrl={activeImageUrl}
                  storeNiche={storeNiche}
                  storeName={storeName}
                  productName={productName}
                  priceLabel={priceLabel}
                  categoryName={categoryName}
                />
              </button>

              <div className="mt-1.5 flex items-center justify-between gap-1 px-0.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-black truncate text-slate-900">
                    {isAr ? tpl.nameAr : tpl.nameEn}
                  </div>
                  <div className="text-[8px] text-slate-500 flex items-center gap-1 font-mono">
                    <span
                      className="font-bold not-italic font-sans"
                      style={{ color: isDaily ? '#b45309' : 'var(--accent, #1d8b94)' }}
                    >
                      {typeTag}
                    </span>
                    <span>·</span>
                    <span
                      style={{
                        color: tpl.tier === 'pro' ? 'var(--tone-warn, #d97706)' : 'var(--accent, #1d8b94)',
                      }}
                    >
                      {tpl.tier === 'pro' ? (isAr ? 'برو' : 'PRO') : isAr ? 'مجاني' : 'FREE'}
                    </span>
                  </div>
                </div>

                {unlocked ? (
                  <button
                    type="button"
                    onClick={() => onApply(tpl)}
                    className="cs-btn-primary shrink-0 px-2 py-1 rounded-lg text-[9px] font-black text-white cursor-pointer"
                    style={{ background: 'var(--accent, #1d8b94)' }}
                  >
                    {isAr ? 'تطبيق' : 'Use'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onRequestPro}
                    className="shrink-0 p-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 cursor-pointer"
                    title={isAr ? 'يتطلب باقة برو' : 'Requires Pro'}
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {nicheFilter !== 'mine' && templates.length === 0 && (
        <div className="py-8 text-center text-xs text-muted">
          {isAr ? 'لا توجد قوالب مطابقة' : 'No matching templates'}
        </div>
      )}
    </div>
  );
};
