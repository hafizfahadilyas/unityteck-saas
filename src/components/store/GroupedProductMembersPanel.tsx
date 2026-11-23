import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GripVertical,
  Plus,
  Trash2,
  Save,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type { Product } from '../../types';
import {
  fetchProductGroupMembers,
  syncProductGroupMembers,
  type ProductGroupMemberRow,
} from '../../api/tenantApi';
import { isApiEnabled } from '../../api/client';
import { useToast } from '../common/ToastProvider';
import { getProductDisplayName } from '../../utils/storeLocalization';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../utils/imageFallback';

const MIN = 3;
const MAX = 4;

type Props = {
  storeId: string;
  parentProduct: Product;
  catalogProducts: Product[];
  isAr: boolean;
  locale: string;
  /** Parent must already be persisted (not draft-*) before sync. */
  canSync: boolean;
  onEditChild: (childId: string) => void;
  onMembersChanged?: (children: Product[]) => void;
};

type LocalMember = {
  childId: string;
  selectorImageUrl: string | null;
  label: string;
  image: string;
  sku: string;
};

export const GroupedProductMembersPanel: React.FC<Props> = ({
  storeId,
  parentProduct,
  catalogProducts,
  isAr,
  locale,
  canSync,
  onEditChild,
  onMembersChanged,
}) => {
  const { toast } = useToast();
  const [members, setMembers] = useState<LocalMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerId, setPickerId] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const parentId = parentProduct.id;
  const usedIds = useMemo(() => new Set(members.map((m) => m.childId)), [members]);

  const eligibleChildren = useMemo(() => {
    return catalogProducts.filter((p) => {
      if (!p?.id || p.id === parentId) return false;
      if (p.id.startsWith('draft-')) return false;
      if (p.status === 'archived') return false;
      if (p.productType === 'grouped' || p.isGrouped) return false;
      if (usedIds.has(p.id)) return false;
      return true;
    });
  }, [catalogProducts, parentId, usedIds]);

  const hydrateFromApi = useCallback(async () => {
    if (!isApiEnabled() || !canSync || parentId.startsWith('draft-')) {
      const existing = (parentProduct.groupChildren || []).map((c, i) => ({
        childId: c.id,
        selectorImageUrl: c.selectorImageUrl || null,
        label: getProductDisplayName(c, locale) || c.name,
        image: c.image || c.imageUrl || FALLBACK_PRODUCT_IMAGE,
        sku: c.sku || '',
      }));
      setMembers(existing);
      return;
    }
    setLoading(true);
    try {
      const rows: ProductGroupMemberRow[] = await fetchProductGroupMembers(storeId, parentId);
      const next = rows.map((row) => {
        const child =
          row.child ||
          catalogProducts.find((p) => p.id === row.child_product_id) ||
          null;
        return {
          childId: row.child_product_id,
          selectorImageUrl: row.selector_image_url || null,
          label: child
            ? getProductDisplayName(child, locale) || child.name
            : row.child_product_id,
          image:
            row.selector_image_url ||
            child?.image ||
            child?.imageUrl ||
            FALLBACK_PRODUCT_IMAGE,
          sku: child?.sku || '',
        };
      });
      setMembers(next);
      onMembersChanged?.(
        next
          .map((m) => catalogProducts.find((p) => p.id === m.childId) || rowChild(rows, m.childId))
          .filter(Boolean) as Product[],
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast(msg || (isAr ? 'تعذر تحميل أعضاء المجموعة' : 'Failed to load group members'), 'error');
    } finally {
      setLoading(false);
    }
  }, [
    canSync,
    catalogProducts,
    isAr,
    locale,
    onMembersChanged,
    parentId,
    parentProduct.groupChildren,
    storeId,
    toast,
  ]);

  useEffect(() => {
    void hydrateFromApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when parent id changes
  }, [parentId, canSync]);

  const addMember = () => {
    if (!pickerId) return;
    if (members.length >= MAX) {
      toast(
        isAr ? 'الحد الأقصى 4 منتجات فرعية' : 'Maximum 4 child products',
        'error',
      );
      return;
    }
    const prod = catalogProducts.find((p) => p.id === pickerId);
    if (!prod) return;
    setMembers((prev) => [
      ...prev,
      {
        childId: prod.id,
        selectorImageUrl: null,
        label: getProductDisplayName(prod, locale) || prod.name,
        image: prod.image || prod.imageUrl || FALLBACK_PRODUCT_IMAGE,
        sku: prod.sku || '',
      },
    ]);
    setPickerId('');
  };

  const removeMember = (childId: string) => {
    setMembers((prev) => prev.filter((m) => m.childId !== childId));
  };

  const onDragStart = (index: number) => setDragIndex(index);
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setMembers((prev) => {
      const next = [...prev];
      const [item] = next.splice(dragIndex, 1);
      next.splice(index, 0, item);
      return next;
    });
    setDragIndex(index);
  };
  const onDragEnd = () => setDragIndex(null);

  const handleSave = async () => {
    if (!canSync || parentId.startsWith('draft-')) {
      toast(
        isAr
          ? 'احفظ منتج المجموعة أولاً ثم أضف المنتجات الفرعية'
          : 'Save the parent group product first, then add children',
        'error',
      );
      return;
    }
    if (members.length < MIN || members.length > MAX) {
      toast(
        isAr
          ? `يجب أن تحتوي المجموعة على ${MIN} إلى ${MAX} منتجات فرعية`
          : `Group must contain ${MIN}–${MAX} child products`,
        'error',
      );
      return;
    }
    if (!isApiEnabled()) {
      toast(isAr ? 'واجهة البرمجة غير متاحة' : 'API is not available', 'error');
      return;
    }
    setSaving(true);
    try {
      const rows = await syncProductGroupMembers(
        storeId,
        parentId,
        members.map((m, i) => ({
          child_product_id: m.childId,
          selector_image_url: m.selectorImageUrl,
          sort_order: i,
        })),
      );
      toast(isAr ? 'تم حفظ أعضاء المجموعة' : 'Group members saved', 'success');
      const children = rows
        .map((r) => r.child)
        .filter(Boolean) as Product[];
      onMembersChanged?.(children);
      await hydrateFromApi();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast(msg || (isAr ? 'تعذر حفظ أعضاء المجموعة' : 'Failed to save group members'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="rounded-2xl border p-4 sm:p-5 space-y-4"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            {isAr ? 'المنتجات الفرعية للمجموعة' : 'Group child products'}
          </h3>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'أضف 3–4 منتجات مستقلة. كل منتج يحتفظ باسمه وسعره ومخزونه وتحسين محركات البحث.'
              : 'Add 3–4 independent products. Each keeps its own name, price, stock, and SEO.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !canSync}
          className="unity-btn-primary inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isAr ? 'حفظ الأعضاء' : 'Save members'}
        </button>
      </div>

      {!canSync && (
        <div
          className="flex items-start gap-2 rounded-xl border px-3 py-2 text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
          <span>
            {isAr
              ? 'احفظ منتج المجموعة الأب أولاً، ثم اربط المنتجات الفرعية.'
              : 'Save the parent group product first, then link child products.'}
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          {isAr ? 'جاري التحميل…' : 'Loading…'}
        </div>
      ) : (
        <ul className="space-y-2">
          {members.map((m, index) => (
            <li
              key={m.childId}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={onDragEnd}
              className="flex items-center gap-2 rounded-xl border px-2 py-2"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <span className="cursor-grab p-1" style={{ color: 'var(--muted)' }} title={isAr ? 'إعادة ترتيب' : 'Reorder'}>
                <GripVertical className="w-4 h-4" />
              </span>
              <img
                src={m.image}
                alt=""
                className="w-10 h-10 rounded-lg object-cover border"
                style={{ borderColor: 'var(--border)' }}
                onError={handleImageError}
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                  {m.label}
                </div>
                <div className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>
                  {m.sku || m.childId}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditChild(m.childId)}
                className="p-2 rounded-lg border"
                style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
                title={isAr ? 'تعديل المنتج الفرعي' : 'Edit child product'}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeMember(m.childId)}
                className="p-2 rounded-lg border text-rose-600"
                style={{ borderColor: 'var(--border)' }}
                title={isAr ? 'إزالة' : 'Remove'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {members.length < MAX && (
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={pickerId}
            onChange={(e) => setPickerId(e.target.value)}
            className="flex-1 text-xs rounded-xl border px-3 py-2"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            <option value="">
              {isAr ? 'اختر منتجاً موجوداً…' : 'Select an existing product…'}
            </option>
            {eligibleChildren.map((p) => (
              <option key={p.id} value={p.id}>
                {getProductDisplayName(p, locale) || p.name} ({p.sku || p.id})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addMember}
            disabled={!pickerId}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border disabled:opacity-50"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text)',
              background: 'var(--surface)',
            }}
          >
            <Plus className="w-4 h-4" />
            {isAr ? 'إضافة' : 'Add'}
          </button>
        </div>
      )}

      <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
        {isAr
          ? `الأعضاء: ${members.length} / ${MAX} (الحد الأدنى ${MIN})`
          : `Members: ${members.length} / ${MAX} (minimum ${MIN})`}
      </p>
    </section>
  );
};

function rowChild(rows: ProductGroupMemberRow[], childId: string): Product | null {
  return rows.find((r) => r.child_product_id === childId)?.child || null;
}
