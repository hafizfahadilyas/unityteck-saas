import React, { useMemo, useState } from 'react';
import { Plus, Search, ShoppingBag, X } from 'lucide-react';
import { useCoffeeDraft } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps } from './CoffeeWordSettingsShell';
import type { ProductDetailApplyScope, ProductDetailPageSettings } from '../../../../themes/settings/coffeeModularSettings';
import { useTenant } from '../../../../context/TenantContext';

const cardCls = 'rounded-2xl border p-4 shadow-sm space-y-3';
const cardStyle: React.CSSProperties = {
  borderColor: 'var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
};

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs font-semibold" style={{ color: 'var(--text)' }}>
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className="w-11 h-6 rounded-full p-0.5"
        style={{ background: on ? 'var(--portal-cta)' : 'var(--border)' }}
        aria-pressed={on}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
            on ? 'translate-x-5 rtl:-translate-x-5' : ''
          }`}
        />
      </button>
    </label>
  );
}

/**
 * C-PDP — shared product detail chrome.
 * Content (images/titles/specs) = Products admin. This panel = All vs Specific section flags.
 */
export const CoffeeProductDetailPageForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('productDetail');
  const { currentProducts, allProducts, activeStore } = useTenant();
  const [pickOpen, setPickOpen] = useState(false);
  const [search, setSearch] = useState('');

  const settings = (draft || {}) as ProductDetailPageSettings;
  const patch = (p: Partial<ProductDetailPageSettings>) =>
    setDraft({ ...settings, enabled: settings.enabled !== false, ...p });

  const catalog = useMemo(() => {
    const rows =
      (allProducts?.[activeStore.id]?.length ? allProducts[activeStore.id] : currentProducts) || [];
    return rows.map((p) => ({
      id: p.id,
      name: p.name || '',
      nameAr: p.nameAr || '',
      image: p.colors?.[0]?.image || p.images?.[0] || (p as { image?: string }).image || '',
    }));
  }, [allProducts, activeStore.id, currentProducts]);

  const selectedIds = settings.productIds || [];
  const scope: ProductDetailApplyScope = settings.applyScope === 'selected' ? 'selected' : 'all';

  const preview = () => (
    <div className="p-4 space-y-2 text-[11px]" style={{ color: 'var(--muted)' }} data-pdp-preview-note>
      <p className="font-bold" style={{ color: 'var(--text)' }}>
        {isAr ? 'قالب صفحة منتج واحد' : 'One shared product page template'}
      </p>
      <p>
        {scope === 'all'
          ? isAr
            ? 'الأعلام الحالية تُطبَّق على كل المنتجات.'
            : 'Current section flags apply to every product.'
          : isAr
            ? `محدّد: ${selectedIds.length} منتج — الباقي يبقى بالعرض الكامل.`
            : `Selected: ${selectedIds.length} product(s) — others keep full layout.`}
      </p>
      <p>
        {isAr
          ? 'الصور والفيديو والمواصفات من صفحة المنتجات لكل SKU.'
          : 'Images, video, and specs come from Products for each SKU.'}
      </p>
    </div>
  );

  return (
    <CoffeeWordSettingsShell
      isAr={isAr}
      onBack={onBack}
      embedded={embedded}
      titleEn="Product Page Layout"
      titleAr="تخطيط صفحة المنتج"
      subtitleEn="Apply section visibility to all products or only specific ones."
      subtitleAr="طبّق إظهار الأقسام على كل المنتجات أو على منتجات محددة فقط."
      onSave={() => save()}
      saving={saving}
      savedFlash={savedFlash}
      preview={preview}
      settings={
        <div className="space-y-3" data-pdp-form="chrome">
          <section className={cardCls} style={cardStyle} data-pdp-panel="scope">
            <Toggle
              on={settings.enabled !== false}
              onChange={(v) => patch({ enabled: v })}
              label={isAr ? 'تفعيل تخصيص أقسام صفحة المنتج' : 'Enable product page section customize'}
            />
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'مثال: أخفِ الفيديو لكل المنتجات، أو فقط لـ H10A.'
                : 'Example: hide Video for all products, or only for H10A.'}
            </p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={isAr ? 'نطاق التطبيق' : 'Apply scope'}>
              {(
                [
                  { id: 'all' as const, en: 'All products', ar: 'كل المنتجات' },
                  { id: 'selected' as const, en: 'Specific products', ar: 'منتجات محددة' },
                ] as const
              ).map((opt) => {
                const active = scope === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    data-pdp-scope={opt.id}
                    onClick={() => patch({ applyScope: opt.id, enabled: true })}
                    className="rounded-xl border px-3 py-2 text-[11px] font-bold text-start cursor-pointer"
                    style={
                      active
                        ? {
                            borderColor: 'var(--portal-cta)',
                            background: 'color-mix(in srgb, var(--portal-cta) 12%, var(--surface))',
                            color: 'var(--portal-cta)',
                          }
                        : { borderColor: 'var(--border)', color: 'var(--text)' }
                    }
                  >
                    {isAr ? opt.ar : opt.en}
                  </button>
                );
              })}
            </div>

            {scope === 'selected' ? (
              <div className="space-y-2 rounded-xl border p-3" style={{ borderColor: 'var(--border)' }} data-pdp-picker>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold">
                    {isAr ? `المحدد (${selectedIds.length})` : `Selected (${selectedIds.length})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPickOpen((v) => !v)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    style={{
                      background: 'color-mix(in srgb, var(--portal-cta) 12%, var(--surface))',
                      color: 'var(--portal-cta)',
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isAr ? 'اختيار منتجات' : 'Pick products'}
                  </button>
                </div>
                {selectedIds.length === 0 ? (
                  <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'لم يُختر أي منتج — التخصيص لن يُطبَّق حتى تختار.'
                      : 'No products picked — customize will not apply until you select some.'}
                  </p>
                ) : (
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {selectedIds.map((id) => {
                      const row = catalog.find((p) => p.id === id);
                      return (
                        <li
                          key={id}
                          className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-[11px]"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <span className="flex-1 truncate font-bold">
                            {isAr ? row?.nameAr || row?.name || id : row?.name || id}
                          </span>
                          <button
                            type="button"
                            className="p-1 text-rose-500 cursor-pointer"
                            onClick={() =>
                              patch({ productIds: selectedIds.filter((x) => x !== id) })
                            }
                            aria-label={isAr ? 'إزالة' : 'Remove'}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {pickOpen ? (
                  <div className="rounded-xl border p-2 space-y-2" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted)' }} />
                      <input
                        className="flex-1 px-2 py-1.5 rounded-lg border text-xs"
                        style={{ borderColor: 'var(--border)' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={isAr ? 'بحث…' : 'Search…'}
                        dir={isAr ? 'rtl' : 'ltr'}
                      />
                    </div>
                    <div className="max-h-44 overflow-y-auto space-y-1">
                      {!catalog.length ? (
                        <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                          {isAr ? 'لا منتجات في الكتالوج' : 'No products in catalog'}
                        </p>
                      ) : (
                        catalog
                          .filter((p) => {
                            const q = search.trim().toLowerCase();
                            if (!q) return true;
                            return `${p.name} ${p.nameAr} ${p.id}`.toLowerCase().includes(q);
                          })
                          .map((p) => {
                            const on = selectedIds.includes(p.id);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                className="w-full text-start rounded-lg border px-2 py-1.5 text-[11px] flex items-center gap-2 cursor-pointer"
                                style={{
                                  borderColor: on ? 'var(--portal-cta)' : 'var(--border)',
                                  opacity: on ? 0.7 : 1,
                                }}
                                onClick={() => {
                                  if (on) {
                                    patch({ productIds: selectedIds.filter((x) => x !== p.id) });
                                  } else {
                                    patch({ productIds: [...selectedIds, p.id] });
                                  }
                                }}
                              >
                                <span className="w-8 h-8 rounded-md bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                  {p.image ? (
                                    <img src={p.image} alt="" className="max-w-full max-h-full object-contain" />
                                  ) : (
                                    <ShoppingBag className="w-3.5 h-3.5 text-slate-300" />
                                  )}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="font-bold block truncate">
                                    {isAr ? p.nameAr || p.name : p.name}
                                  </span>
                                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                                    {on ? (isAr ? 'محدد' : 'Selected') : p.id}
                                  </span>
                                </span>
                              </button>
                            );
                          })
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className={cardCls} style={cardStyle} data-pdp-panel="sections">
            <h4 className="text-xs font-bold">{isAr ? 'أقسام الصفحة' : 'Page sections'}</h4>
            <Toggle
              on={settings.showFeatures !== false}
              onChange={(v) => patch({ showFeatures: v })}
              label={isAr ? 'المميزات / البانرات' : 'Features / banners'}
            />
            <Toggle
              on={settings.showVideo !== false}
              onChange={(v) => patch({ showVideo: v })}
              label={isAr ? 'فيديو العرض' : 'Demo video'}
            />
            <Toggle
              on={settings.showSpecs !== false}
              onChange={(v) => patch({ showSpecs: v })}
              label={isAr ? 'المواصفات الفنية' : 'Tech specs'}
            />
            <Toggle
              on={settings.showWarranty !== false}
              onChange={(v) => patch({ showWarranty: v })}
              label={isAr ? 'الضمان والوكيل' : 'Warranty'}
            />
            <Toggle
              on={settings.showFloatingBuy !== false}
              onChange={(v) => patch({ showFloatingBuy: v })}
              label={isAr ? 'بطاقة الشراء العائمة' : 'Floating buy card'}
            />
          </section>

          <section className={cardCls} style={cardStyle} data-pdp-panel="preview-sku">
            <label className="block space-y-1 text-[11px] font-semibold">
              <span>{isAr ? 'منتج المعاينة' : 'Preview product'}</span>
              <select
                className="w-full px-2 py-1.5 rounded-lg border text-xs"
                style={{ borderColor: 'var(--border)' }}
                value={settings.previewProductId || ''}
                onChange={(e) => patch({ previewProductId: e.target.value })}
                data-pdp-preview-product
              >
                <option value="">{isAr ? '— الافتراضي / الأول —' : '— Default / first —'}</option>
                {catalog.map((p) => (
                  <option key={p.id} value={p.id}>
                    {isAr ? p.nameAr || p.name : p.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'هذا يغيّر معاينة الثيم فقط — لا ينشئ صفحة جديدة لكل منتج.'
                : 'This only changes theme preview — it does not create a new page per product.'}
            </p>
          </section>
        </div>
      }
    />
  );
};
