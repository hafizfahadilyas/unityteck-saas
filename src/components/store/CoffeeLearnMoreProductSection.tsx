import React, { useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Layers,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { MediaPickerModal } from '../common/MediaPickerModal';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../utils/imageFallback';
import { optimizeImageFile } from '../../utils/mediaOptimizer';
import { autoBilingualPair } from '../../i18n/autoBilingual';
import type { CustomFieldItem } from './StoreProductEditorView';
import {
  isLearnMoreSectionField,
  isLearnMoreSpecField,
  newLearnMoreSectionId,
  newLearnMoreSpecId,
} from '../../utils/coffeeLearnMoreFields';

type Props = {
  isAr: boolean;
  /** Kept for API compat — video block removed from this editor (text + images only). */
  videoUrl?: string;
  onVideoUrlChange?: (url: string) => void;
  customFields: CustomFieldItem[];
  onCustomFieldsChange: (next: CustomFieldItem[]) => void;
};

function assetUrl(selected: unknown): string {
  const assets = Array.isArray(selected) ? selected : [selected];
  const first = assets[0] as Record<string, unknown> | string | undefined;
  if (!first) return '';
  if (typeof first === 'string') return first;
  return String(
    first.optimizedUrl || first.webpUrl || first.originalUrl || first.thumbnailUrl || first.url || '',
  );
}

const cardCls = 'rounded-2xl border p-4 sm:p-5 space-y-4';
const inputCls =
  'w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]';
const inputStyle: React.CSSProperties = {
  borderColor: 'var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
};

/**
 * Coffee theme only — per-SKU Learn More (product-detail) text + images.
 * Feature sections → Learn More “Features” banners.
 * Tech specs → Learn More “Tech Specs”.
 * Persist via Content custom_fields (learn-more-* / catalog-spec-*).
 * Product Save button on the editor page persists everything.
 */
export const CoffeeLearnMoreProductSection: React.FC<Props> = ({
  isAr,
  customFields,
  onCustomFieldsChange,
}) => {
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [mediaTargetId, setMediaTargetId] = useState<string | null>(null);
  const [uploadBusyId, setUploadBusyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  const sections = useMemo(
    () => customFields.filter((f) => isLearnMoreSectionField(f)),
    [customFields],
  );
  const specs = useMemo(
    () => customFields.filter((f) => isLearnMoreSpecField(f)),
    [customFields],
  );

  const patchField = (id: string, patch: Partial<CustomFieldItem>) => {
    onCustomFieldsChange(customFields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const moveSection = (id: string, dir: -1 | 1) => {
    const sectionIds = sections.map((f) => f.id);
    const sIdx = sectionIds.indexOf(id);
    const swapWith = sectionIds[sIdx + dir];
    if (sIdx < 0 || !swapWith) return;
    const a = customFields.findIndex((f) => f.id === id);
    const b = customFields.findIndex((f) => f.id === swapWith);
    if (a < 0 || b < 0) return;
    const next = customFields.slice();
    const tmp = next[a];
    next[a] = next[b];
    next[b] = tmp;
    onCustomFieldsChange(next);
  };

  const removeField = (id: string) => {
    onCustomFieldsChange(customFields.filter((f) => f.id !== id));
    if (openSectionId === id) setOpenSectionId(null);
  };

  const addSection = () => {
    const id = newLearnMoreSectionId();
    const row: CustomFieldItem = {
      id,
      name: isAr ? 'ميزة جديدة' : 'New feature',
      nameAr: isAr ? 'ميزة جديدة' : '',
      type: 'Content',
      required: false,
      conditionalRule: '—',
      extraPrice: 0,
      options: [],
      contentEn: '',
      contentAr: '',
      imageUrl: '',
      videoUrl: '',
      hidden: false,
    };
    onCustomFieldsChange([...customFields, row]);
    setOpenSectionId(id);
  };

  const addSpec = () => {
    const id = newLearnMoreSpecId();
    const row: CustomFieldItem = {
      id,
      name: '',
      nameAr: '',
      type: 'Content',
      required: false,
      conditionalRule: '—',
      extraPrice: 0,
      options: [],
      contentEn: '',
      contentAr: '',
      hidden: false,
    };
    onCustomFieldsChange([...customFields, row]);
  };

  const openDeviceUpload = (sectionId: string) => {
    uploadTargetRef.current = sectionId;
    fileInputRef.current?.click();
  };

  const handleDeviceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = uploadTargetRef.current;
    e.target.value = '';
    if (!file || !targetId) return;
    setUploadBusyId(targetId);
    try {
      const opt = await optimizeImageFile(file, 1600, 280 * 1024);
      const url = opt.webpUrl || URL.createObjectURL(opt.file);
      if (url) patchField(targetId, { imageUrl: url });
    } catch {
      /* keep previous image */
    } finally {
      setUploadBusyId(null);
      uploadTargetRef.current = null;
    }
  };

  return (
    <div
      id="pe-sec-learn-more"
      className={`${cardCls} product-create-section shadow-xs`}
      style={{
        borderColor: 'var(--border)',
        background: 'var(--surface)',
        color: 'var(--text)',
        animationDelay: '250ms',
      }}
      data-coffee-learn-more-editor
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.gif,.webp,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleDeviceFile}
        data-learn-more-file-input
      />

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'color-mix(in srgb, var(--portal-cta) 12%, var(--surface))',
              color: 'var(--portal-cta)',
            }}
          >
            <Layers className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className="font-bold text-base leading-tight" style={{ color: 'var(--text)' }}>
              {isAr ? 'صفحة اعرف المزيد' : 'Learn More Page'}
            </h3>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'حقل واحد للنص والصورة. يظهر تحت تبويب الميزات. احفظ من زر حفظ المنتج أعلى الصفحة.'
                : 'One text field + image per section. Shows under Features. Save with the product Save button at the top.'}
            </p>
          </div>
        </div>
      </div>

      {/* Feature sections = Learn More → Features */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'أقسام الميزات (نص + صورة)' : 'Feature sections (text + image)'}
            </h4>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'تظهر في تبويب «المميزات» أسفل نظرة عامة على صفحة اعرف المزيد.'
                : 'Shows on Learn More → Features tab (below Overview hero).'}
            </p>
          </div>
          <button
            type="button"
            onClick={addSection}
            className="unity-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer shrink-0"
            data-learn-more-add-section
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة قسم' : 'Add section'}</span>
          </button>
        </div>

        {sections.length === 0 ? (
          <p
            className="text-xs text-center py-6 rounded-xl border border-dashed"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            data-learn-more-empty
          >
            {isAr
              ? 'لا توجد سجلات — أضف قسماً بنص وصورة.'
              : 'No records found — add a section with text and an image.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {sections.map((sec, idx) => {
              const open = openSectionId === sec.id;
              const title = isAr ? sec.nameAr || sec.name : sec.name;
              const uploading = uploadBusyId === sec.id;
              return (
                <li
                  key={sec.id}
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: 'var(--border)' }}
                  data-learn-more-section={sec.id}
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: 'color-mix(in srgb, var(--muted) 6%, var(--surface))' }}
                  >
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-start cursor-pointer"
                      onClick={() => setOpenSectionId(open ? null : sec.id)}
                    >
                      <span className="block text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                        {title || (isAr ? `قسم ${idx + 1}` : `Section ${idx + 1}`)}
                      </span>
                      <span className="block text-[10px]" style={{ color: 'var(--muted)' }}>
                        {isAr ? `الميزة 0${idx + 1}` : `FEATURE 0${idx + 1}`}
                        {sec.imageUrl ? (isAr ? ' · صورة' : ' · image') : ''}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg cursor-pointer"
                      style={{ color: 'var(--muted)' }}
                      onClick={() => moveSection(sec.id, -1)}
                      title={isAr ? 'أعلى' : 'Move up'}
                      disabled={idx === 0}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg cursor-pointer"
                      style={{ color: 'var(--muted)' }}
                      onClick={() => moveSection(sec.id, 1)}
                      title={isAr ? 'أسفل' : 'Move down'}
                      disabled={idx === sections.length - 1}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg cursor-pointer text-rose-500"
                      onClick={() => removeField(sec.id)}
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {open ? (
                    <div className="p-3 space-y-3 border-t" style={{ borderColor: 'var(--border)' }}>
                      {/* One title + one text — auto EN/AR via bilingual rule (no dual boxes). */}
                      <label className="block space-y-1">
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                          {isAr ? 'العنوان' : 'Title'}
                        </span>
                        <input
                          className={inputCls}
                          style={inputStyle}
                          dir={isAr ? 'rtl' : 'ltr'}
                          value={isAr ? sec.nameAr || sec.name || '' : sec.name || sec.nameAr || ''}
                          placeholder={isAr ? 'اكتب العنوان — الترجمة تلقائية' : 'Type title — auto-translates'}
                          onChange={(e) => {
                            const pair = autoBilingualPair(e.target.value);
                            patchField(sec.id, { name: pair.en, nameAr: pair.ar });
                          }}
                          data-learn-more-title
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                          {isAr ? 'النص' : 'Text'}
                        </span>
                        <textarea
                          className={`${inputCls} min-h-[72px]`}
                          style={inputStyle}
                          dir={isAr ? 'rtl' : 'ltr'}
                          value={
                            isAr
                              ? sec.contentAr || sec.contentEn || ''
                              : sec.contentEn || sec.contentAr || ''
                          }
                          placeholder={isAr ? 'اكتب النص — الترجمة تلقائية' : 'Type text — auto-translates'}
                          onChange={(e) => {
                            const pair = autoBilingualPair(e.target.value);
                            patchField(sec.id, { contentEn: pair.en, contentAr: pair.ar });
                          }}
                          data-learn-more-text
                        />
                      </label>

                      <div
                        className="rounded-xl border p-3 space-y-3"
                        style={{ borderColor: 'var(--border)' }}
                        data-learn-more-image-block
                      >
                        <span className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>
                          {isAr ? 'صورة القسم' : 'Section image'}
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                          <div
                            className="w-28 h-20 rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-900 shrink-0"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            {sec.imageUrl ? (
                              <img
                                src={sec.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{ color: 'var(--muted)' }}
                              >
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className="unity-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-60"
                              onClick={() => openDeviceUpload(sec.id)}
                              disabled={uploading}
                              data-learn-more-upload
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>
                                {uploading
                                  ? isAr
                                    ? 'جاري الرفع…'
                                    : 'Uploading…'
                                  : isAr
                                    ? 'رفع صورة'
                                    : 'Upload image'}
                              </span>
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer"
                              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                              onClick={() => setMediaTargetId(sec.id)}
                              data-learn-more-library
                            >
                              {isAr ? 'من المكتبة' : 'From library'}
                            </button>
                            {sec.imageUrl ? (
                              <button
                                type="button"
                                className="text-xs font-bold text-rose-500 cursor-pointer"
                                onClick={() => patchField(sec.id, { imageUrl: '' })}
                              >
                                {isAr ? 'إزالة' : 'Remove'}
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                          {isAr
                            ? 'بعد الرفع اضغط حفظ المنتج أعلى الصفحة ليظهر على المتجر.'
                            : 'After upload, click Save on the product page so it appears on the storefront.'}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Tech specs = Learn More → Tech Specs */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'المواصفات الفنية' : 'Tech specs'}
            </h4>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'تظهر في تبويب «المواصفات الفنية» في صفحة اعرف المزيد.'
                : 'Shows on Learn More → Tech Specs tab.'}
            </p>
          </div>
          <button
            type="button"
            onClick={addSpec}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer shrink-0"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            data-learn-more-add-spec
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة مواصفة' : 'Add spec'}</span>
          </button>
        </div>

        {specs.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {isAr ? 'لا توجد سجلات' : 'No records found'}
          </p>
        ) : (
          <div className="space-y-2">
            {specs.map((spec) => (
              <div
                key={spec.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end"
                data-learn-more-spec={spec.id}
              >
                <label className="block space-y-1">
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'التسمية' : 'Label'}
                  </span>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    dir={isAr ? 'rtl' : 'ltr'}
                    value={isAr ? spec.nameAr || spec.name || '' : spec.name || spec.nameAr || ''}
                    placeholder={isAr ? 'التسمية' : 'Label'}
                    onChange={(e) => {
                      const pair = autoBilingualPair(e.target.value);
                      patchField(spec.id, { name: pair.en, nameAr: pair.ar });
                    }}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'القيمة' : 'Value'}
                  </span>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    dir={isAr ? 'rtl' : 'ltr'}
                    value={
                      isAr
                        ? spec.contentAr || spec.contentEn || ''
                        : spec.contentEn || spec.contentAr || ''
                    }
                    placeholder={isAr ? 'القيمة' : 'Value'}
                    onChange={(e) => {
                      const pair = autoBilingualPair(e.target.value);
                      patchField(spec.id, { contentEn: pair.en, contentAr: pair.ar });
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="p-2 rounded-xl text-rose-500 cursor-pointer"
                  onClick={() => removeField(spec.id)}
                  title={isAr ? 'حذف' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {mediaTargetId ? (
        <MediaPickerModal
          isOpen
          onClose={() => setMediaTargetId(null)}
          onSelect={(selected) => {
            const url = assetUrl(selected) || FALLBACK_PRODUCT_IMAGE;
            if (mediaTargetId && url) {
              patchField(mediaTargetId, { imageUrl: url });
            }
            setMediaTargetId(null);
          }}
          multiple={false}
          allowedTypes={['image', 'gif']}
          initialFolder="products"
          title={isAr ? 'صورة قسم اعرف المزيد' : 'Learn More section image'}
        />
      ) : null}
    </div>
  );
};
