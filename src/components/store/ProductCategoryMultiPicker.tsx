import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, FolderPlus, Plus, Search, X } from 'lucide-react';
import { FloatingPopover } from '../common/FloatingPopover';
import { GlobalModal } from '../common/GlobalModal';
import { createCategory, type CategoryPayload } from '../../api/tenantApi';
import { isApiEnabled } from '../../api/client';
import { parentPickerOptions } from '../../utils/categoryHierarchy';
import { getProductDisplayCategory } from '../../utils/storeLocalization';
import type { StoreCategory } from '../../types';

export type CategoryPickerOption = {
  value: string;
  label: string;
  depth?: number;
  id?: string;
};

type Props = {
  selected: string[];
  options: CategoryPickerOption[];
  storeCategories?: StoreCategory[];
  storeId: string;
  isAr: boolean;
  locale: string;
  compact?: boolean;
  /** Show a visible Add New button beside the trigger (not only inside the menu). */
  showAddButton?: boolean;
  className?: string;
  onChange: (next: string[], primary: string) => void;
  onCategoriesCreated?: () => void;
};

function uniqueSelected(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  values.forEach((v) => {
    const t = String(v || '').trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  });
  return out;
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const ProductCategoryMultiPicker: React.FC<Props> = ({
  selected,
  options,
  storeCategories = [],
  storeId,
  isAr,
  locale,
  compact = false,
  showAddButton = true,
  className = '',
  onChange,
  onCategoriesCreated,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newNameEn, setNewNameEn] = useState('');
  const [newNameAr, setNewNameAr] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [newActive, setNewActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const selectedClean = useMemo(() => uniqueSelected(selected), [selected]);

  const dedupedOptions = useMemo(() => {
    const seenIds = new Set<string>();
    const seenValues = new Set<string>();
    const out: CategoryPickerOption[] = [];
    options.forEach((o) => {
      const idKey = o.id ? `id:${o.id}` : '';
      const valKey = `v:${String(o.value || '').trim().toLowerCase()}`;
      if (idKey && seenIds.has(idKey)) return;
      if (seenValues.has(valKey)) return;
      if (idKey) seenIds.add(idKey);
      seenValues.add(valKey);
      out.push(o);
    });
    return out;
  }, [options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dedupedOptions;
    return dedupedOptions.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [dedupedOptions, query]);

  const parentOptions = useMemo(
    () => parentPickerOptions(storeCategories, null, isAr),
    [storeCategories, isAr],
  );

  const triggerLabel = useMemo(() => {
    if (selectedClean.length === 0) return isAr ? 'اختر التصنيفات' : 'Select categories';
    if (selectedClean.length === 1) return getProductDisplayCategory(selectedClean[0], locale);
    return isAr ? `${selectedClean.length} تصنيفات` : `${selectedClean.length} categories`;
  }, [selectedClean, isAr, locale]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const emit = (next: string[]) => {
    const clean = uniqueSelected(next);
    onChange(clean, clean[0] || '');
  };

  const toggleValue = (value: string) => {
    if (selectedClean.includes(value)) emit(selectedClean.filter((c) => c !== value));
    else emit([...selectedClean, value]);
  };

  const resetNewForm = () => {
    setNewNameEn('');
    setNewNameAr('');
    setNewSlug('');
    setNewParentId('');
    setNewActive(true);
    setError(null);
  };

  const openAddNew = () => {
    setOpen(false);
    resetNewForm();
    setShowNewModal(true);
  };

  const handleCreate = async () => {
    const en = newNameEn.trim();
    const ar = newNameAr.trim();
    if (!en && !ar) {
      setError(isAr ? 'أدخل اسم التصنيف بالإنجليزية أو العربية' : 'Enter an English or Arabic category name');
      return;
    }
    if (!storeId || !isApiEnabled()) {
      setError(isAr ? 'يتطلب اتصال الواجهة البرمجية' : 'Live API connection required');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload: CategoryPayload = {
        name: en || ar,
        name_ar: ar || null,
        slug: newSlug.trim() || slugify(en || ar) || undefined,
        parent_id: newParentId || null,
        is_active: newActive,
      };
      const created = await createCategory(storeId, payload);
      const value = isAr ? created.nameAr || created.name : created.name || created.nameAr || '';
      if (value) emit([...selectedClean, value]);
      window.dispatchEvent(new CustomEvent('unityteck-categories-updated', { detail: { storeId } }));
      onCategoriesCreated?.();
      setShowNewModal(false);
      resetNewForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : isAr ? 'تعذر إنشاء التصنيف' : 'Could not create category');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`relative ${className}`} dir={isAr ? 'rtl' : 'ltr'}>
      {!compact && selectedClean.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border min-h-[42px] mb-2" style={{ borderColor: 'var(--border)' }}>
          {selectedClean.map((cat) => (
            <span key={cat} className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 text-xs font-semibold flex items-center gap-1">
              <span>{getProductDisplayCategory(cat, locale)}</span>
              {selectedClean.length > 1 ? (
                <button type="button" onClick={() => emit(selectedClean.filter((c) => c !== cat))} className="hover:text-rose-600 cursor-pointer" aria-label={isAr ? 'إزالة التصنيف' : 'Remove category'}>
                  <X className="w-3 h-3" />
                </button>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex items-stretch gap-1.5 w-full min-w-0">
        <button
          ref={anchorRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 min-w-0 flex items-center justify-between gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg border bg-white dark:bg-slate-900 focus:outline-none cursor-pointer"
          style={{ borderColor: 'var(--border)', color: 'var(--text)', minHeight: compact ? '2rem' : undefined }}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="truncate text-start">{triggerLabel}</span>
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {showAddButton ? (
          <button
            type="button"
            onClick={openAddNew}
            className={
              compact
                ? 'inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 cursor-pointer text-white'
                : 'inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold unity-btn-primary text-white shrink-0 cursor-pointer'
            }
            style={
              compact
                ? {
                    background: 'var(--portal-cta, #0f172a)',
                    color: '#ffffff',
                    minHeight: '2rem',
                    minWidth: '2rem',
                    padding: 0,
                  }
                : undefined
            }
            title={isAr ? 'تصنيف جديد' : 'Add New Category'}
            aria-label={isAr ? 'تصنيف جديد' : 'Add New Category'}
          >
            <Plus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            {!compact ? <span className="text-white">{isAr ? 'جديد' : 'New'}</span> : null}
          </button>
        ) : null}
      </div>

      {compact && selectedClean.length > 1 ? (
        <div className="mt-1 flex flex-wrap gap-0.5 max-w-full">
          {selectedClean.slice(0, 3).map((cat) => (
            <span key={cat} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 truncate max-w-full" title={getProductDisplayCategory(cat, locale)}>
              {getProductDisplayCategory(cat, locale)}
            </span>
          ))}
          {selectedClean.length > 3 ? <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-500">+{selectedClean.length - 3}</span> : null}
        </div>
      ) : null}

      <FloatingPopover
        open={open}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        width={compact ? 280 : 320}
        align={isAr ? 'end' : 'start'}
        estimatedHeight={360}
        preferBelow
        className="rounded-xl border shadow-lg overflow-hidden z-[10050]"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
      >
        <div className="flex flex-col max-h-[min(70vh,380px)]">
          <div className="p-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <Search className="absolute start-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-50 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isAr ? 'بحث في التصنيفات...' : 'Search categories...'}
                className="w-full ps-7 pe-2 py-1.5 text-xs rounded-lg border focus:outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5" role="listbox" aria-multiselectable="true">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-xs text-center" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد تصنيفات' : 'No categories found'}
              </p>
            ) : (
              filtered.map((opt) => {
                const on = selectedClean.includes(opt.value);
                return (
                  <button
                    key={opt.id || opt.value}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => toggleValue(opt.value)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-start hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <span
                      role="switch"
                      aria-checked={on}
                      className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${on ? 'bg-[var(--portal-cta,#0d9488)]' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
                        style={{ insetInlineStart: on ? 'calc(100% - 1.125rem)' : '0.125rem' }}
                      />
                    </span>
                    <span className="flex-1 truncate" title={opt.label}>{opt.label}</span>
                    {on ? <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" /> : null}
                  </button>
                );
              })
            )}
          </div>

          <div className="p-2 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <button type="button" onClick={openAddNew} className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold unity-btn-primary cursor-pointer">
              <FolderPlus className="w-3.5 h-3.5" />
              {isAr ? 'تصنيف جديد' : 'Add New'}
            </button>
            {selectedClean.length > 0 ? (
              <button type="button" onClick={() => emit([])} className="px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                {isAr ? 'مسح' : 'Clear'}
              </button>
            ) : null}
          </div>
        </div>
      </FloatingPopover>

      {showNewModal ? (
        <GlobalModal
          onClose={() => {
            if (busy) return;
            setShowNewModal(false);
            resetNewForm();
          }}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'إضافة تصنيف جديد' : 'Add New Category'}
        >
          <div className="space-y-4 min-w-[min(100vw-2rem,26rem)] p-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-teal-50 dark:bg-teal-950/50 text-teal-600">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{isAr ? 'إضافة تصنيف جديد' : 'Add New Category'}</h3>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'اسم إنجليزي وعربي، تصنيف أب، الرابط المختصر، والحالة' : 'English and Arabic name, parent, slug, and active status'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</span>
                <input
                  value={newNameEn}
                  onChange={(e) => {
                    setNewNameEn(e.target.value);
                    if (!newSlug.trim()) setNewSlug(slugify(e.target.value));
                  }}
                  className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  placeholder={isAr ? 'اكتب الاسم بالإنجليزية' : 'e.g. Coffee Machines'}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}</span>
                <input
                  value={newNameAr}
                  onChange={(e) => setNewNameAr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  placeholder={isAr ? 'مثال: آلات القهوة' : 'Enter Arabic name'}
                  dir="rtl"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{isAr ? 'التصنيف الأب (اختياري)' : 'Parent category (optional)'}</span>
                <select
                  value={newParentId}
                  onChange={(e) => setNewParentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                >
                  <option value="">{isAr ? 'غير تابعة لأي تصنيف' : 'Not belonging to any category'}</option>
                  {parentOptions.map((p) => (
                    <option key={p.id} value={p.id}>{`${'— '.repeat(p.depth)}${p.label}`}</option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{isAr ? 'الرابط المختصر' : 'Slug'}</span>
                <input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  placeholder={isAr ? 'رابط-مختصر' : 'coffee-machines'}
                />
              </label>

              <div className="flex items-center justify-between gap-3 p-3 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{isAr ? 'نشط' : 'Active'}</p>
                  <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{isAr ? 'يظهر في المتجر والقوائم' : 'Visible in storefront and pickers'}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={newActive}
                  onClick={() => setNewActive((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${newActive ? 'bg-[var(--portal-cta,#0d9488)]' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow" style={{ insetInlineStart: newActive ? 'calc(100% - 1.375rem)' : '0.125rem' }} />
                </button>
              </div>
            </div>

            {error ? <p className="text-xs font-medium text-rose-600" role="alert">{error}</p> : null}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={busy}
                onClick={() => { setShowNewModal(false); resetNewForm(); }}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={busy}
                aria-busy={busy}
                onClick={() => void handleCreate()}
                className="px-3 py-1.5 rounded-xl text-xs font-bold unity-btn-primary cursor-pointer disabled:opacity-60"
              >
                {busy ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'إنشاء وإضافة' : 'Create & Add'}
              </button>
            </div>
          </div>
        </GlobalModal>
      ) : null}
    </div>
  );
};