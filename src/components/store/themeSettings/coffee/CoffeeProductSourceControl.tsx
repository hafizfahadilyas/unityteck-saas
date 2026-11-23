/**
 * Shared product source dropdown for Customize Themes + Page Builder inspectors.
 * Modes: all / category / brand / selected / mix / featured / latest / best_selling
 */
import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  COFFEE_PRODUCT_SOURCE_MAX,
  COFFEE_PRODUCT_SOURCE_MODES,
  emptyProductSource,
  sourceModeLabel,
  uniqueCatalogBrands,
  uniqueCatalogCategories,
  type CoffeeProductSourceConfig,
  type CoffeeProductSourceMode,
  type SourceCatalogProduct,
} from '../../../../themes/coffeeRoasters/components/coffeeProductSourceLogic';

const inputCls = 'w-full px-3 py-2 rounded-xl border text-xs font-semibold';
const inputStyle: React.CSSProperties = {
  borderColor: 'var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
};

export type CoffeeProductSourceControlProps = {
  isAr: boolean;
  value: CoffeeProductSourceConfig | null | undefined;
  onChange: (next: CoffeeProductSourceConfig) => void;
  catalog: SourceCatalogProduct[];
  /** Hide modes not needed for a section (default = all). */
  modes?: CoffeeProductSourceMode[];
  maxCount?: number;
  compact?: boolean;
};

function toggleInList(list: string[], id: string, on: boolean): string[] {
  if (on) return list.includes(id) ? list : [...list, id];
  return list.filter((x) => x !== id);
}

export const CoffeeProductSourceControl: React.FC<CoffeeProductSourceControlProps> = ({
  isAr,
  value,
  onChange,
  catalog,
  modes = COFFEE_PRODUCT_SOURCE_MODES,
  maxCount = COFFEE_PRODUCT_SOURCE_MAX,
  compact,
}) => {
  const cfg = value?.mode ? value : emptyProductSource(value || undefined);
  const [q, setQ] = useState('');
  const categories = useMemo(() => uniqueCatalogCategories(catalog), [catalog]);
  const brands = useMemo(() => uniqueCatalogBrands(catalog), [catalog]);

  const patch = (p: Partial<CoffeeProductSourceConfig>) => onChange({ ...cfg, ...p });

  const showCats = cfg.mode === 'category' || cfg.mode === 'mix';
  const showBrands = cfg.mode === 'brand' || cfg.mode === 'mix';
  const showProducts = cfg.mode === 'selected' || cfg.mode === 'mix';
  const showCount = cfg.mode !== 'selected' || (cfg.productIds || []).length === 0;

  const filteredProducts = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return catalog;
    return catalog.filter((p) => {
      const name = `${p.name || ''} ${p.nameEn || ''} ${p.nameAr || ''} ${p.id}`.toLowerCase();
      return name.includes(query);
    });
  }, [catalog, q]);

  return (
    <div
      className={compact ? 'space-y-2' : 'space-y-3'}
      data-coffee-product-source="on"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <label className="block space-y-1">
        <span className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
          {isAr ? 'مصدر المنتجات' : 'Product source'}
        </span>
        <select
          className={inputCls}
          style={inputStyle}
          value={cfg.mode}
          onChange={(e) => patch({ mode: e.target.value as CoffeeProductSourceMode })}
          aria-label={isAr ? 'مصدر المنتجات' : 'Product source'}
        >
          {modes.map((m) => (
            <option key={m} value={m}>
              {sourceModeLabel(m, isAr)}
            </option>
          ))}
        </select>
      </label>

      {showCount ? (
        <label className="block space-y-1">
          <span className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
            {isAr ? 'عدد المنتجات' : 'Product count'}
          </span>
          <input
            type="number"
            min={1}
            max={maxCount}
            className={inputCls}
            style={inputStyle}
            value={cfg.productCount || 8}
            onChange={(e) => patch({ productCount: Math.min(maxCount, Math.max(1, Number(e.target.value) || 1)) })}
          />
        </label>
      ) : null}

      {showCats ? (
        <div className="space-y-1.5" data-source-filter="categories">
          <div className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
            {isAr ? `التصنيفات (${(cfg.categoryIds || []).length})` : `Categories (${(cfg.categoryIds || []).length})`}
          </div>
          {categories.length === 0 ? (
            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
              {isAr ? 'لا تصنيفات في الكتالوج' : 'No categories in catalog'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {categories.map((c) => {
                const on = (cfg.categoryIds || []).includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => patch({ categoryIds: toggleInList(cfg.categoryIds || [], c, !on) })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      on ? 'unity-btn-primary border-transparent text-white' : ''
                    }`}
                    style={on ? undefined : { borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {showBrands ? (
        <div className="space-y-1.5" data-source-filter="brands">
          <div className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
            {isAr ? `العلامات (${(cfg.brandIds || []).length})` : `Brands (${(cfg.brandIds || []).length})`}
          </div>
          {brands.length === 0 ? (
            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
              {isAr ? 'لا علامات في الكتالوج — أضف العلامة في المنتج' : 'No brands in catalog — set brand on products'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {brands.map((b) => {
                const on = (cfg.brandIds || []).includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => patch({ brandIds: toggleInList(cfg.brandIds || [], b, !on) })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      on ? 'unity-btn-primary border-transparent text-white' : ''
                    }`}
                    style={on ? undefined : { borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {showProducts ? (
        <div className="space-y-1.5" data-source-filter="products">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
              {isAr
                ? `اختيار المنتجات (${(cfg.productIds || []).length}/${maxCount})`
                : `Select products (${(cfg.productIds || []).length}/${maxCount})`}
            </span>
            {(cfg.productIds || []).length > 0 ? (
              <button
                type="button"
                className="text-[10px] font-bold"
                style={{ color: 'var(--accent)' }}
                onClick={() => patch({ productIds: [] })}
              >
                {isAr ? 'مسح' : 'Clear'}
              </button>
            ) : null}
          </div>
          {(cfg.productIds || []).length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {(cfg.productIds || []).map((id) => {
                const p = catalog.find((x) => x.id === id);
                const label = isAr
                  ? p?.nameAr || p?.nameEn || p?.name || id
                  : p?.nameEn || p?.name || p?.nameAr || id;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  >
                    <span className="truncate max-w-[120px]">{label}</span>
                    <button
                      type="button"
                      className="p-0.5"
                      aria-label={isAr ? 'إزالة' : 'Remove'}
                      onClick={() => patch({ productIds: (cfg.productIds || []).filter((x) => x !== id) })}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          ) : null}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 start-2.5 pointer-events-none" style={{ color: 'var(--muted)' }} />
            <input
              className={`${inputCls} ps-8`}
              style={inputStyle}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={isAr ? 'بحث عن منتج…' : 'Search products…'}
            />
          </div>
          <ul className="max-h-40 overflow-y-auto space-y-1 rounded-xl border p-1.5" style={{ borderColor: 'var(--border)' }}>
            {filteredProducts.length === 0 ? (
              <li className="text-[11px] px-2 py-3 text-center" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا سجلات' : 'No records found'}
              </li>
            ) : (
              filteredProducts.map((p) => {
                const on = (cfg.productIds || []).includes(p.id);
                const label = isAr ? p.nameAr || p.nameEn || p.name || p.id : p.nameEn || p.name || p.nameAr || p.id;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={!on && (cfg.productIds || []).length >= maxCount}
                      onClick={() =>
                        patch({
                          productIds: toggleInList(cfg.productIds || [], p.id, !on).slice(0, maxCount),
                        })
                      }
                      className={`w-full text-start px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between gap-2 disabled:opacity-40 ${
                        on ? 'bg-[color:var(--accent)]/10' : 'hover:bg-black/5'
                      }`}
                      style={{ color: 'var(--text)' }}
                    >
                      <span className="truncate">{label}</span>
                      <span className="text-[10px] shrink-0" style={{ color: 'var(--muted)' }}>
                        {on ? (isAr ? 'محدد' : 'On') : (isAr ? 'إضافة' : 'Add')}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
