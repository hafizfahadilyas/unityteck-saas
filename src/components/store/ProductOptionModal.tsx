import React, { useState } from 'react';
import { Copy, Eye, EyeOff, GripVertical, ImageIcon, Trash2, X } from 'lucide-react';
import { EditorModal } from './EditorModal';
import { optimizeImageFile } from '../../utils/mediaOptimizer';

export type OptionKind = 'text' | 'select' | 'color' | 'image' | 'video';

export interface OptionValueDraft {
  id: string;
  label: string;
  labelAr?: string;
  colorHex?: string;
  imageUrl?: string;
  videoUrl?: string;
  selected: boolean;
  price: string;
  salePrice: string;
  stock: string;
  sku: string;
  weight: string;
  weightUnit: 'kg' | 'g';
}

export interface OptionModalResult {
  name: string;
  nameAr?: string;
  type: OptionKind;
  values: OptionValueDraft[];
}

const inputCls =
  'w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500';

function blankValue(partial: Partial<OptionValueDraft> = {}): OptionValueDraft {
  return {
    id: `val_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    label: '',
    selected: true,
    price: '',
    salePrice: '',
    stock: '',
    sku: '',
    weight: '',
    weightUnit: 'kg',
    ...partial,
  };
}

/** One option dialog. Local state so typing does not re-render the product editor. */
export function ProductOptionModal({
  isAr,
  mode,
  initialName,
  initialNameAr = '',
  initialType,
  initialValues,
  onClose,
  onSave,
}: {
  isAr: boolean;
  mode: 'add' | 'edit';
  initialName: string;
  initialNameAr?: string;
  initialType: OptionKind;
  initialValues: OptionValueDraft[];
  onClose: () => void;
  onSave: (result: OptionModalResult) => void;
}) {
  const [name, setName] = useState(initialName);
  const [nameAr, setNameAr] = useState(initialNameAr);
  const [type, setType] = useState<OptionKind>(initialType);
  const [values, setValues] = useState<OptionValueDraft[]>(
    initialValues.length ? initialValues : [blankValue()],
  );
  const [dragId, setDragId] = useState<string | null>(null);

  const patch = (id: string, next: Partial<OptionValueDraft>) => {
    setValues((rows) => rows.map((row) => (row.id === id ? { ...row, ...next } : row)));
  };

  const move = (fromId: string, toId: string) => {
    if (!fromId || fromId === toId) return;
    setValues((rows) => {
      const from = rows.findIndex((r) => r.id === fromId);
      const to = rows.findIndex((r) => r.id === toId);
      if (from < 0 || to < 0) return rows;
      const copy = rows.slice();
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  };

  const save = () => {
    const clean = values
      .map((v) => ({ ...v, label: v.label.trim(), labelAr: (v.labelAr || '').trim(), sku: v.sku.trim() }))
      .filter((v) => v.label || v.labelAr);
    const english = name.trim() || nameAr.trim();
    onSave({ name: english, nameAr: nameAr.trim() || undefined, type, values: clean });
  };

  return (
    <EditorModal onClose={onClose}>
      <div className="bg-white dark:bg-[#071E26] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl p-4 sm:p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {mode === 'add'
              ? isAr
                ? 'إضافة خيار منتج'
                : 'Add Product Option'
              : isAr
                ? 'تعديل خيار المنتج'
                : 'Edit Product Option'}
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'اسم الخيار' : 'Option name'}
            </span>
            <input
              className={`${inputCls} mt-1`}
              value={isAr ? nameAr || name : name}
              onChange={(e) => (isAr ? setNameAr(e.target.value) : setName(e.target.value))}
              placeholder={isAr ? 'اللون، المقاس، التغليف' : 'Color, Size, Gift wrap'}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'النوع' : 'Type'}
            </span>
            <select
              className={`${inputCls} mt-1`}
              value={type}
              onChange={(e) => setType(e.target.value as OptionKind)}
            >
              <option value="text">{isAr ? 'نص' : 'Text'}</option>
              <option value="select">{isAr ? 'أزرار' : 'Buttons'}</option>
              <option value="color">{isAr ? 'لون' : 'Color'}</option>
              <option value="image">{isAr ? 'صورة' : 'Image'}</option>
              <option value="video">{isAr ? 'فيديو' : 'Video'}</option>
            </select>
          </label>
        </div>

        <div className="space-y-2">
          {values.map((row) => (
            <div
              key={row.id}
              draggable
              onDragStart={() => setDragId(row.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId) move(dragId, row.id);
                setDragId(null);
              }}
              className={`rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 space-y-2 ${
                row.selected ? 'bg-slate-50/80 dark:bg-slate-900/40' : 'opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-slate-400 shrink-0 cursor-grab" />
                <input
                  className={inputCls}
                  value={isAr ? row.labelAr || row.label : row.label}
                  onChange={(e) => patch(row.id, isAr ? { labelAr: e.target.value } : { label: e.target.value })}
                  placeholder={isAr ? 'اسم القيمة' : 'Value name'}
                />
                {type === 'color' && (
                  <input
                    type="color"
                    value={row.colorHex || '#64748b'}
                    onChange={(e) => patch(row.id, { colorHex: e.target.value })}
                    className="w-9 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                    title={isAr ? 'اللون' : 'Color'}
                  />
                )}
                <button
                  type="button"
                  className="p-1.5 text-slate-500 cursor-pointer"
                  title={isAr ? 'نسخ' : 'Copy'}
                  onClick={() =>
                    setValues((rows) => {
                      const i = rows.findIndex((r) => r.id === row.id);
                      const { id: _ignored, ...rest } = row;
                      const copy = blankValue(rest);
                      const next = rows.slice();
                      next.splice(i + 1, 0, copy);
                      return next;
                    })
                  }
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="p-1.5 text-slate-500 cursor-pointer"
                  title={row.selected ? (isAr ? 'إخفاء' : 'Hide') : isAr ? 'إظهار' : 'Show'}
                  onClick={() => patch(row.id, { selected: !row.selected })}
                >
                  {row.selected ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  className="p-1.5 text-rose-500 cursor-pointer"
                  title={isAr ? 'حذف' : 'Delete'}
                  onClick={() => setValues((rows) => rows.filter((r) => r.id !== row.id))}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {(type === 'image' || type === 'video' || type === 'text') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(type === 'image' || type === 'text') && (
                    <label className="flex items-center gap-2 text-[11px] text-slate-500">
                      {row.imageUrl ? (
                        <img src={row.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="text-[11px]"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          void optimizeImageFile(file, 1200, 200 * 1024)
                            .then((opt) => patch(row.id, { imageUrl: opt.webpUrl || URL.createObjectURL(opt.file) }))
                            .catch(() => patch(row.id, { imageUrl: URL.createObjectURL(file) }));
                        }}
                      />
                    </label>
                  )}
                  {(type === 'video' || type === 'text') && (
                    <input
                      className={inputCls}
                      value={row.videoUrl || ''}
                      onChange={(e) => patch(row.id, { videoUrl: e.target.value })}
                      placeholder={isAr ? 'رابط الفيديو' : 'Video URL'}
                    />
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                <input
                  className={inputCls}
                  inputMode="decimal"
                  value={row.price}
                  onChange={(e) => patch(row.id, { price: e.target.value })}
                  placeholder={isAr ? 'السعر الأصلي' : 'MRP'}
                />
                <input
                  className={inputCls}
                  inputMode="decimal"
                  value={row.salePrice}
                  onChange={(e) => patch(row.id, { salePrice: e.target.value })}
                  placeholder={isAr ? 'سعر البيع' : 'Sale price'}
                />
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={row.stock}
                  onChange={(e) => patch(row.id, { stock: e.target.value })}
                  placeholder={isAr ? 'المخزون' : 'Stock'}
                />
                <input
                  className={inputCls}
                  value={row.sku}
                  onChange={(e) => patch(row.id, { sku: e.target.value })}
                  placeholder={isAr ? 'رمز المنتج' : 'SKU'}
                />
                <input
                  className={inputCls}
                  inputMode="decimal"
                  value={row.weight}
                  onChange={(e) => patch(row.id, { weight: e.target.value })}
                  placeholder={isAr ? 'الوزن' : 'Weight'}
                />
                <select
                  className={inputCls}
                  value={row.weightUnit}
                  onChange={(e) => patch(row.id, { weightUnit: e.target.value as 'kg' | 'g' })}
                >
                  <option value="kg">{isAr ? 'كجم' : 'kg'}</option>
                  <option value="g">{isAr ? 'جم' : 'g'}</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="text-xs font-bold text-blue-600 cursor-pointer"
          onClick={() => setValues((rows) => [...rows, blankValue()])}
        >
          {isAr ? '+ قيمة' : '+ Value'}
        </button>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={save}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
          >
            {isAr ? 'حفظ الخيار' : 'Save option'}
          </button>
        </div>
      </div>
    </EditorModal>
  );
}
