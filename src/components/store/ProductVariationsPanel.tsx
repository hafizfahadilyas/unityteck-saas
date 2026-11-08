import React, { useCallback, useEffect, useState } from 'react';
import { Layers, Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import type { ProductVariation } from '../../types';
import * as tenantApi from '../../api/tenantApi';
import { isApiEnabled } from '../../api/client';
import { useToast } from '../common/ToastProvider';
import { usePrefs } from '../../i18n/PrefsContext';

type Props = {
  storeId: string;
  productId: string;
  canMutate: boolean;
  onDenied: () => void;
};

type Draft = {
  sku: string;
  size: string;
  color: string;
  weight: string;
  material: string;
  custom: string;
  price: string;
  stock: string;
  imageUrl: string;
  isActive: boolean;
};

const emptyDraft = (): Draft => ({
  sku: '',
  size: '',
  color: '',
  weight: '',
  material: '',
  custom: '',
  price: '',
  stock: '0',
  imageUrl: '',
  isActive: true,
});

function draftFrom(v: ProductVariation): Draft {
  return {
    sku: v.sku,
    size: v.options.size ?? '',
    color: v.options.color ?? '',
    weight: v.options.weight ?? '',
    material: v.options.material ?? '',
    custom: v.options.custom ?? '',
    price: v.price != null ? String(v.price) : '',
    stock: String(v.stock),
    imageUrl: v.imageUrl ?? '',
    isActive: v.isActive,
  };
}

function optionsFromDraft(d: Draft): Record<string, string> {
  const o: Record<string, string> = {};
  if (d.size.trim()) o.size = d.size.trim();
  if (d.color.trim()) o.color = d.color.trim();
  if (d.weight.trim()) o.weight = d.weight.trim();
  if (d.material.trim()) o.material = d.material.trim();
  if (d.custom.trim()) o.custom = d.custom.trim();
  return o;
}

function labelOptions(opts: Record<string, string>, isAr: boolean): string {
  const keyLabel = (k: string) => {
    if (!isAr) return k;
    if (k === 'size') return 'المقاس';
    if (k === 'color') return 'اللون';
    if (k === 'weight') return 'الوزن';
    if (k === 'material') return 'المادة';
    if (k === 'custom') return 'مخصص';
    return k;
  };
  const parts = Object.entries(opts).map(([k, v]) => `${keyLabel(k)}: ${v}`);
  return parts.length ? parts.join(' · ') : '—';
}

export const ProductVariationsPanel: React.FC<Props> = ({
  storeId,
  productId,
  canMutate,
  onDenied,
}) => {
  const { toast } = useToast();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const [rows, setRows] = useState<ProductVariation[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isApiEnabled()) {
        const list = await tenantApi.fetchVariations(storeId, productId);
        setRows(list);
      } else {
        setRows((prev) => prev.filter((r) => r.productId === productId));
      }
    } catch (err) {
      toast(
        err instanceof Error
          ? err.message
          : isAr
            ? 'تعذر تحميل التنويعات'
            : 'Failed to load variations',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [storeId, productId, toast, isAr]);

  useEffect(() => {
    void load();
    setDraft(emptyDraft());
    setEditingId(null);
    setConfirmDeleteId(null);
  }, [load]);

  const setField = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const startEdit = (v: ProductVariation) => {
    if (!canMutate) {
      onDenied();
      return;
    }
    setEditingId(v.id);
    setDraft(draftFrom(v));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const save = async () => {
    if (!canMutate) {
      onDenied();
      return;
    }
    if (!draft.sku.trim()) {
      toast(isAr ? 'رمز المنتج للتنويع مطلوب' : 'Variation SKU is required', 'error');
      return;
    }

    const payload: tenantApi.VariationPayload = {
      sku: draft.sku.trim(),
      options: optionsFromDraft(draft),
      price: draft.price.trim() ? parseFloat(draft.price) : null,
      stock: parseInt(draft.stock, 10) || 0,
      image_url: draft.imageUrl.trim() || null,
      is_active: draft.isActive,
    };

    setBusy(true);
    try {
      if (isApiEnabled()) {
        if (editingId) {
          const updated = await tenantApi.updateVariation(
            storeId,
            productId,
            editingId,
            payload,
          );
          setRows((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
          toast(isAr ? 'تم تحديث التنويع' : 'Variation updated', 'success');
        } else {
          const created = await tenantApi.createVariation(storeId, productId, payload);
          setRows((prev) => [...prev, created]);
          toast(isAr ? 'تمت إضافة التنويع' : 'Variation added', 'success');
        }
      } else {
        if (editingId) {
          setRows((prev) =>
            prev.map((r) =>
              r.id === editingId
                ? {
                    ...r,
                    sku: payload.sku,
                    options: payload.options ?? {},
                    price: payload.price ?? null,
                    stock: payload.stock ?? 0,
                    imageUrl: payload.image_url ?? null,
                    isActive: payload.is_active ?? true,
                  }
                : r,
            ),
          );
          toast(isAr ? 'تم تحديث التنويع' : 'Variation updated', 'success');
        } else {
          const created: ProductVariation = {
            id: `var-${Date.now()}`,
            storeId,
            productId,
            sku: payload.sku,
            options: payload.options ?? {},
            price: payload.price ?? null,
            stock: payload.stock ?? 0,
            imageUrl: payload.image_url ?? null,
            isActive: payload.is_active ?? true,
          };
          setRows((prev) => [...prev, created]);
          toast(isAr ? 'تمت إضافة التنويع' : 'Variation added', 'success');
        }
      }
      cancelEdit();
    } catch (err) {
      toast(
        err instanceof Error
          ? err.message
          : isAr
            ? 'فشل حفظ التنويع'
            : 'Save variation failed',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!canMutate) {
      onDenied();
      return;
    }
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      toast(isAr ? 'اضغط حذف مرة أخرى للتأكيد' : 'Click delete again to confirm', 'info');
      return;
    }
    setBusy(true);
    try {
      if (isApiEnabled()) {
        await tenantApi.deleteVariation(storeId, productId, id);
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      setConfirmDeleteId(null);
      if (editingId === id) cancelEdit();
      toast(isAr ? 'تم حذف التنويع' : 'Variation deleted', 'success');
    } catch (err) {
      toast(
        err instanceof Error
          ? err.message
          : isAr
            ? 'فشل حذف التنويع'
            : 'Delete variation failed',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  const applyPreset = (next: Partial<Draft> & { size: string; material: string; custom: string }) => {
    setField('size', next.size);
    setField('material', next.material);
    setField('custom', next.custom);
    if (!draft.sku && next.sku) setField('sku', next.sku);
    if (!draft.price && next.price) setField('price', next.price);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>{isAr ? 'التنويعات' : 'Variations'}</span>
          <span className="text-[10px] font-bold text-slate-400">{rows.length}</span>
        </div>
        <span className="text-[10px] text-slate-400">
          {isAr ? 'مقاس · لون · وزن · مادة · مخصص' : 'size · color · weight · material · custom'}
        </span>
      </div>

      {loading ? (
        <p className="text-[11px] text-slate-400 py-2">
          {isAr ? 'جاري تحميل التنويعات…' : 'Loading variations…'}
        </p>
      ) : rows.length === 0 && !editingId ? (
        <p className="text-[11px] text-slate-400">
          {isAr
            ? 'لا توجد تنويعات بعد. أضف مقاساً أو لوناً أدناه.'
            : 'No variations yet. Add size/color (etc.) below.'}
        </p>
      ) : (
        <ul className="space-y-1.5 max-h-40 overflow-y-auto">
          {rows.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px]"
            >
              <div className="min-w-0">
                <div className="font-mono text-slate-600 dark:text-slate-300 truncate">{v.sku}</div>
                <div className="text-slate-500 truncate">{labelOptions(v.options, isAr)}</div>
                <div className="tabular-nums text-slate-800 dark:text-slate-200">
                  {v.price != null ? money(v.price) : '—'} · {v.stock}{' '}
                  {isAr ? 'وحدة' : 'units'}
                  {!v.isActive ? (isAr ? '· مخفي' : ' · hidden') : ''}
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  disabled={!canMutate || busy}
                  onClick={() => startEdit(v)}
                  className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded disabled:opacity-40 cursor-pointer"
                  title={isAr ? 'تعديل التنويع' : 'Edit variation'}
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  disabled={!canMutate || busy}
                  onClick={() => void remove(v.id)}
                  className={`p-1 rounded disabled:opacity-40 cursor-pointer ${
                    confirmDeleteId === v.id
                      ? 'text-white bg-rose-600'
                      : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                  title={isAr ? 'حذف التنويع' : 'Delete variation'}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-slate-200 dark:border-slate-800 pt-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            {editingId
              ? isAr
                ? 'تعديل التنويع'
                : 'Edit variation'
              : isAr
                ? 'إضافة تنويع'
                : 'Add variation'}
          </span>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {storeId === 'store-bleco' && (
          <div className="p-2 rounded-lg bg-purple-50/80 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-purple-900 dark:text-purple-200">
                {isAr
                  ? 'قوالب أرضيات السيارات السريعة:'
                  : 'Automotive floor-mat quick presets:'}
              </span>
              <span className="text-[10px] text-purple-600 dark:text-purple-300 shrink-0">
                {isAr ? 'نقرة واحدة للتعبئة' : 'One-click fill'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    size: isAr ? '5 مقاعد (صفين)' : '5 seats (2 rows)',
                    material: isAr ? 'جلد صناعي 5D ليزر' : '5D laser PU leather',
                    custom: isAr ? 'شامل كلبسات التثبيت' : 'Includes mounting clips',
                    sku: `MAT-5S-${Date.now().toString().slice(-4)}`,
                    price: '380',
                  })
                }
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-950/40 cursor-pointer font-bold"
              >
                {isAr ? '٥ مقاعد (صفين)' : '5 seats (2 rows)'}
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    size: isAr ? '7 مقاعد (3 صفوف)' : '7 seats (3 rows)',
                    material: isAr ? 'جلد صناعي 5D ليزر' : '5D laser PU leather',
                    custom: isAr ? 'تغطية كاملة مع الصف الثالث' : 'Full coverage with 3rd row',
                    sku: `MAT-7S-${Date.now().toString().slice(-4)}`,
                    price: '440',
                  })
                }
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-950/40 cursor-pointer font-bold"
              >
                {isAr ? '٧ مقاعد (+60 ر.س)' : '7 seats (+SAR 60)'}
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    size: isAr ? '٥ مقاعد + دعاسة الشنطة' : '5 seats + trunk mat',
                    material: isAr
                      ? 'جلد صناعي 5D ليزر مقاوم للماء'
                      : 'Waterproof 5D laser PU leather',
                    custom: isAr
                      ? 'كامل الكابينة مع الصندوق الخلفي'
                      : 'Full cabin with trunk protection',
                    sku: `MAT-5S-TRK-${Date.now().toString().slice(-4)}`,
                    price: '470',
                  })
                }
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-950/40 cursor-pointer font-bold"
              >
                {isAr ? '٥ مقاعد + الشنطة (+90 ر.س)' : '5 seats + trunk (+SAR 90)'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder={isAr ? 'رمز المنتج *' : 'SKU *'}
            value={draft.sku}
            onChange={(e) => setField('sku', e.target.value)}
            disabled={!canMutate}
            className="col-span-2 px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <input
            placeholder={isAr ? 'المقاس' : 'Size'}
            value={draft.size}
            onChange={(e) => setField('size', e.target.value)}
            disabled={!canMutate}
            className="px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 disabled:opacity-50"
          />
          <input
            placeholder={isAr ? 'اللون' : 'Color'}
            value={draft.color}
            onChange={(e) => setField('color', e.target.value)}
            disabled={!canMutate}
            className="px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 disabled:opacity-50"
          />
          <input
            placeholder={isAr ? 'الوزن' : 'Weight'}
            value={draft.weight}
            onChange={(e) => setField('weight', e.target.value)}
            disabled={!canMutate}
            className="px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 disabled:opacity-50"
          />
          <input
            placeholder={isAr ? 'المادة' : 'Material'}
            value={draft.material}
            onChange={(e) => setField('material', e.target.value)}
            disabled={!canMutate}
            className="px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 disabled:opacity-50"
          />
          <input
            placeholder={isAr ? 'مخصص' : 'Custom'}
            value={draft.custom}
            onChange={(e) => setField('custom', e.target.value)}
            disabled={!canMutate}
            className="col-span-2 px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 disabled:opacity-50"
          />
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder={isAr ? 'السعر' : 'Price'}
            value={draft.price}
            onChange={(e) => setField('price', e.target.value)}
            disabled={!canMutate}
            className="px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 disabled:opacity-50"
          />
          <input
            type="number"
            min={0}
            placeholder={isAr ? 'المخزون' : 'Stock'}
            value={draft.stock}
            onChange={(e) => setField('stock', e.target.value)}
            disabled={!canMutate}
            className="px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 disabled:opacity-50"
          />
          <input
            type="url"
            placeholder={isAr ? 'رابط الصورة' : 'Image URL'}
            value={draft.imageUrl}
            onChange={(e) => setField('imageUrl', e.target.value)}
            disabled={!canMutate}
            className="col-span-2 px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-[10px] bg-white dark:bg-slate-900 disabled:opacity-50"
          />
          <label className="col-span-2 inline-flex items-center gap-2 text-[11px] cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setField('isActive', e.target.checked)}
              disabled={!canMutate}
            />
            {isAr ? 'نشط' : 'Active'}
          </label>
        </div>

        <button
          type="button"
          disabled={!canMutate || busy}
          aria-busy={busy}
          onClick={() => void save()}
          className="w-full px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          {editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>
            {editingId
              ? isAr
                ? 'حفظ التنويع'
                : 'Save variation'
              : isAr
                ? 'إضافة تنويع'
                : 'Add variation'}
          </span>
        </button>
      </div>
    </div>
  );
};
