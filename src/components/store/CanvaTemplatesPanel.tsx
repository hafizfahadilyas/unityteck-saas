import React, { useEffect, useMemo, useState } from 'react';
import { Lock, Search, Sparkles, FilePlus2, Upload, Trash2 } from 'lucide-react';
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
}

/** True mini-canvas preview — layers at real xPct/yPct (no crude bottom overlay). */
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

  // Live store/product image only — no cross-tenant sample product photos
  const previewImg = activeImageUrl || '';

  const aspectClass =
    template.width > template.height * 1.5
      ? 'aspect-[16/7]'
      : template.height > template.width * 1.4
        ? 'aspect-[9/16]'
        : 'aspect-square';

  const textLayers = template.elements.filter((e) => e.type !== 'shape' && e.type !== 'icon');
  const shapeLayers = template.elements.filter((e) => e.type === 'shape');

  return (
    <div
      className={`relative w-full ${aspectClass} overflow-hidden select-none rounded-lg ring-1 ring-slate-200`}
      style={{ background: template.previewGradient }}
    >

      {/* Decorative shapes at real positions */}
      {shapeLayers.map((s, i) => (
        <div
          key={`sh-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: `${(s.xPct || 0.5) * 100}%`,
            top: `${(s.yPct || 0.5) * 100}%`,
            width: `${(s.widthPct || 0.2) * 100}%`,
            height: `${(s.heightPct || 0.2) * 100}%`,
            transform: 'translate(-50%, -50%)',
            background: s.bgColor || 'transparent',
            border:
              s.strokeColor && s.strokeWidth
                ? `${Math.max(1, (s.strokeWidth || 1) * 0.4)}px solid ${s.strokeColor}`
                : undefined,
            borderRadius: s.shapeType === 'circle' ? '50%' : s.borderRadius || 8,
            opacity: s.opacity ?? 0.55,
          }}
        />
      ))}

      {/* Product / subject — only in product zone, never covering bottom text band */}
      {!isBlank && !isLogo && template.productPosPct.scale > 0 && previewImg && (
        <div
          className="absolute z-10 flex items-center justify-center pointer-events-none"
          style={{
            left: `${template.productPosPct.x * 100}%`,
            top: `${template.productPosPct.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: `${Math.min(template.productPosPct.scale, 70)}%`,
            height: `${Math.min(template.productPosPct.scale, 70)}%`,
          }}
        >
          <img
            src={previewImg}
            alt=""
            className="max-w-full max-h-full object-contain"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Text / badge layers at real positions — dynamic bind labels */}
      {textLayers.slice(0, 5).map((layer, i) => {
        const label = resolveCanvaLayerLabel(layer, {
          isAr,
          storeName,
          productName,
          priceLabel,
          categoryName,
        });
        if (!label) return null;
        const isBadge = layer.type === 'badge' || layer.type === 'price';
        const align = layer.textAlign || 'center';
        const fs =
          layer.type === 'headline'
            ? 'text-[8px] sm:text-[9px] font-black leading-tight'
            : layer.type === 'subtitle'
              ? 'text-[6px] sm:text-[7px] font-medium leading-tight opacity-90'
              : 'text-[6px] sm:text-[7px] font-bold leading-tight';
        const xform =
          align === 'left'
            ? 'translate(0, -50%)'
            : align === 'right'
              ? 'translate(-100%, -50%)'
              : 'translate(-50%, -50%)';
        return (
          <div
            key={`tx-${i}`}
            className={`absolute z-20 max-w-[78%] px-1.5 py-0.5 truncate ${fs}`}
            style={{
              left: `${(layer.xPct || 0.5) * 100}%`,
              top: `${(layer.yPct || 0.5) * 100}%`,
              transform: xform,
              color: layer.fontColor || '#0f172a',
              background:
                layer.bgColor && layer.bgColor !== 'transparent'
                  ? layer.bgColor
                  : isBadge
                    ? 'rgba(15,23,42,0.75)'
                    : 'transparent',
              borderRadius: layer.borderRadius ? Math.min(layer.borderRadius, 12) : 8,
              textAlign: align,
              whiteSpace: 'pre-line',
            }}
          >
            {label.split('\n')[0]}
          </div>
        );
      })}

      {isBlank && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 text-slate-600">
          <FilePlus2 className="w-5 h-5 opacity-80" />
          <span className="text-[9px] font-bold tracking-wide text-slate-700">
            {isAr ? 'فارغ' : 'BLANK'}
          </span>
        </div>
      )}

      <div className="absolute bottom-1.5 end-1.5 z-30">
        <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-white text-slate-800 border border-slate-200">
          {template.width}×{template.height}
        </span>
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
  const [nicheFilter, setNicheFilter] = useState<'for_you' | 'blank' | 'all' | 'mine'>('for_you');
  const [search, setSearch] = useState('');
  const [dailyIds, setDailyIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const apiCat = toDailyApiCategory(activeCategory);
    if (!apiCat || nicheFilter === 'mine') {
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
      ? `${previewProduct.price} ${isAr ? 'ر.س' : 'SAR'}`
      : '';
  const categoryName = previewProduct
    ? (isAr ? previewProduct.categoryAr || previewProduct.category : previewProduct.category) || ''
    : '';

  const filteredMyTemplates = useMemo(() => {
    let list = myTemplates.filter((t) => t.storeId === store.id);
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

  const canvaExploreCards = [
    {
      id: 'blank',
      labelEn: 'Blank',
      labelAr: 'فارغ',
      size: '1080×1080',
      grad: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
      dark: true,
    },
    {
      id: 'banner',
      labelEn: 'Banner',
      labelAr: 'بنر',
      size: '1600×600',
      grad: 'linear-gradient(135deg, #f59e0b, #d97706)',
    },
    {
      id: 'social',
      labelEn: 'Instagram',
      labelAr: 'إنستغرام',
      size: '1080×1080',
      grad: 'linear-gradient(135deg, #ec4899, #a855f7)',
    },
    {
      id: 'social_story',
      labelEn: 'Story',
      labelAr: 'ستوري',
      size: '1080×1920',
      grad: 'linear-gradient(135deg, #f43f5e, #fb7185)',
    },
    {
      id: 'ads',
      labelEn: 'Ads',
      labelAr: 'إعلان',
      size: '1200×628',
      grad: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    },
    {
      id: 'product',
      labelEn: 'Product',
      labelAr: 'منتج',
      size: '1080×1080',
      grad: 'linear-gradient(135deg, #10b981, #059669)',
    },
  ];

  // Generic chrome only — never surface coffee/flowers pack names in UI
  const nicheLabel = isAr ? 'قوالب متجرك' : 'Your templates';

  const dailyTemplates = useMemo(() => {
    if (dailyIds.length === 0) return [] as CanvaDesignTemplate[];
    return dailyIds
      .map((id) => getCanvaTemplate(id))
      .filter((t): t is CanvaDesignTemplate => Boolean(t));
  }, [dailyIds]);

  const templates = useMemo(() => {
    if (nicheFilter === 'mine') return [];

    let list = listCanvaTemplatesForStore(store, activeCategory);

    if (nicheFilter === 'blank') {
      list = list.filter((t) => t.niche === 'blank');
    } else if (nicheFilter === 'for_you') {
      list = list.filter(
        (t) => t.niche === 'blank' || t.niche === storeNiche || t.niche === 'general',
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

    // Surface today's 5 first when API returned real catalog IDs
    if (dailyIds.length > 0) {
      const dailySet = new Set(dailyIds);
      list = [
        ...list.filter((t) => dailySet.has(t.id)),
        ...list.filter((t) => !dailySet.has(t.id)),
      ];
    }

    return list;
  }, [activeCategory, search, store, nicheFilter, storeNiche, dailyIds]);

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
            {templates.length} {isAr ? 'قالب' : 'templates'}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5">
          {canvaExploreCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                if (card.id === 'blank') {
                  setNicheFilter('blank');
                  setActiveCategory('all');
                  onSelectFormatPreset?.(1080, 1080, 'Blank');
                  const blank = getCanvaTemplate('blank-square');
                  if (blank) onApply(blank);
                  return;
                }
                if (card.id === 'social_story') {
                  setActiveCategory('social');
                  setNicheFilter('for_you');
                  onSelectFormatPreset?.(1080, 1920, 'Story (9:16)');
                } else {
                  setActiveCategory(card.id as CanvaTemplateCategory);
                  setNicheFilter('for_you');
                  const [w, h] = card.size.split('×').map(Number);
                  onSelectFormatPreset?.(w, h, card.labelEn);
                }
              }}
              className={`p-2 rounded-lg text-start cursor-pointer transition-colors flex flex-col justify-between h-14 relative overflow-hidden border ${
                card.dark
                  ? 'cs-format-blank text-slate-800 border-slate-200'
                  : 'text-white border-transparent'
              }`}
              style={{ background: card.grad }}
            >
              <div
                className={`text-[10px] sm:text-[11px] font-black leading-tight ${
                  card.dark ? 'text-slate-800' : 'text-white'
                }`}
              >
                {isAr ? card.labelAr : card.labelEn}
              </div>
              <div
                className={`text-[8px] font-bold font-mono ${
                  card.dark ? 'text-slate-600' : 'text-white/90'
                }`}
              >
                {card.size}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Niche pills */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            { id: 'for_you' as const, en: nicheLabel, ar: nicheLabel },
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
            {p.id === 'mine' && myTemplates.length > 0 ? ` (${myTemplates.length})` : ''}
          </button>
        ))}
      </div>

      {nicheFilter === 'mine' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onOpenUploadTab}
            className="w-full py-2 rounded-lg border border-dashed border-slate-300 text-[10px] font-black text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer bg-white hover:border-emerald-500"
          >
            <Upload className="w-3.5 h-3.5" />
            {isAr ? 'رفع بي إس دي أو صورة' : 'Upload PSD or image'}
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
                    <div
                      className="relative w-full aspect-square overflow-hidden rounded-lg bg-slate-100"
                      style={
                        tpl.previewDataUrl
                          ? {
                              backgroundImage: `url(${tpl.previewDataUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }
                          : undefined
                      }
                    >
                      {!tpl.previewDataUrl && (
                        <div className="absolute inset-0 flex items-center justify-center text-[9px] text-slate-500 font-bold">
                          {tpl.layers.length} {isAr ? 'طبقة' : 'layers'}
                        </div>
                      )}
                      <span className="absolute bottom-1 end-1 px-1.5 py-0.5 rounded text-[7px] font-bold bg-white/90 text-slate-800 border border-slate-200">
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
                    className="shrink-0 px-2 py-1 rounded-lg text-[9px] font-black text-white cursor-pointer"
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
