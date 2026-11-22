import React, { useEffect, useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  FolderSearch,
  X,
  ExternalLink,
  Film,
  Search,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useTenant } from '../../context/TenantContext';
import { useToast } from './ToastProvider';
import { MediaPickerModal } from './MediaPickerModal';
import type { MediaAsset, MediaType } from '../../types/media';
import { resolveMediaAssetUrl } from '../../utils/mediaUrl';
import { resolveChromeImageUrlSync } from '../../i18n/storeChromeImageStore';
import type { ChromeImageField } from '../../i18n/storeChromeImageStore';
import { absolutePaintUrl } from '../../i18n/storeChrome';

export interface MediaUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string, asset?: MediaAsset) => void;
  altText?: string;
  onAltTextChange?: (alt: string) => void;
  recommendedSize?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'banner' | 'video' | 'auto';
  allowedTypes?: MediaType[];
  initialFolder?: string;
  disabled?: boolean;
  className?: string;
  /** Raw address box. Theme images use upload and the media library. */
  showUrlInput?: boolean;
  /**
   * Dashboard chrome wallpaper / sidebar bg — durable IndexedDB fallback
   * so local blob previews are not lost after revoke / reload.
   */
  chromeImageField?: ChromeImageField;
}

export const MediaUploadField: React.FC<MediaUploadFieldProps> = ({
  label,
  value,
  onChange,
  altText,
  onAltTextChange,
  recommendedSize,
  placeholder = 'https://...',
  aspectRatio = 'square',
  allowedTypes,
  initialFolder,
  disabled = false,
  className = '',
  showUrlInput = false,
  chromeImageField,
}) => {
  const { locale } = usePrefs();
  const { activeStore } = useTenant();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [hydratedPreview, setHydratedPreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rawPreview = resolveChromeImageUrlSync(value) || hydratedPreview || value;
  // Relative /images/... must paint from the store media host (not Vite localhost)
  const previewSrc = rawPreview
    ? absolutePaintUrl(rawPreview, activeStore?.id) || rawPreview
    : '';

  useEffect(() => {
    let stop = false;
    setHydratedPreview('');
    if (!chromeImageField || !activeStore?.id || !value?.startsWith('chrome-idb://')) return;
    void import('../../i18n/storeChromeImageStore').then(async ({ hydrateChromeImageUrl, resolveChromeImageUrlSync: resolveSync }) => {
      await hydrateChromeImageUrl(activeStore.id, chromeImageField, value);
      if (stop) return;
      setHydratedPreview(resolveSync(value) || '');
    });
    return () => {
      stop = true;
    };
  }, [value, chromeImageField, activeStore?.id]);

  const handleSelectMedia = (selected: MediaAsset | MediaAsset[]) => {
    const asset = Array.isArray(selected) ? selected[0] : selected;
    if (!asset) return;
    const urlToUse = resolveMediaAssetUrl(asset);
    if (!urlToUse) {
      toast(
        isAr
          ? 'هذا الملف بلا رابط صالح. ارفع الصورة من جديد أو اختر ملفاً آخر من المكتبة.'
          : 'This media file has no usable URL. Re-upload the image or pick another library file.',
        'error',
      );
      return;
    }
    onChange(urlToUse, asset);
    if (asset.altText && onAltTextChange) {
      onAltTextChange(asset.altText);
    }
  };

  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast(isAr ? 'يرجى اختيار ملف صورة صالح' : 'Please select a valid image file', 'error');
      return;
    }

    const storeId = activeStore?.id || '';
    // Instant wallpaper/bg paint — do not wait for Hostinger / local API
    const objectUrl = URL.createObjectURL(file);
    onChange(objectUrl);

    void (async () => {
      const revokePreview = () => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          /* ignore */
        }
      };

      /** Dashboard chrome: IndexedDB first — never blocked by /api media timeout. */
      if (chromeImageField && storeId) {
        let durableUrl = '';
        const { putChromeImage } = await import('../../i18n/storeChromeImageStore');
        try {
          durableUrl = await putChromeImage(storeId, chromeImageField, file);
        } catch {
          durableUrl = '';
        }

        // Large camera files can fail IDB — compress then retry once
        let uploadFile: File = file;
        if (!durableUrl) {
          try {
            const { optimizeImageFile } = await import('../../utils/mediaOptimizer');
            const optimized = await optimizeImageFile(file, 1600, 280 * 1024);
            uploadFile = optimized.file || file;
            durableUrl = await putChromeImage(storeId, chromeImageField, uploadFile);
          } catch {
            uploadFile = file;
          }
        }

        if (durableUrl) {
          onChange(durableUrl);
          // Revoke blob only after chrome-idb object URL is live (else center/sidebar BG vanishes)
          const tryRevoke = () => {
            if (resolveChromeImageUrlSync(durableUrl)) {
              revokePreview();
              return true;
            }
            return false;
          };
          if (!tryRevoke()) {
            window.setTimeout(() => {
              if (!tryRevoke()) window.setTimeout(revokePreview, 4000);
            }, 1200);
          }
        } else {
          toast(
            isAr
              ? 'المعاينة ظاهرة. أبقِ هذه الصفحة مفتوحة أو اختر صورة أصغر.'
              : 'Preview is visible. Keep this page open or pick a smaller image.',
            'info',
          );
        }

        /*
         * Chrome wallpaper/sidebar: durable IndexedDB only on pick.
         * Do NOT auto-POST /api/media from localhost (CORS to mieraf) or auto-refresh.
         * Merchant clicks Save appearance → saveStoreChrome syncs when API allows.
         */
        void (async () => {
          let readyUrl = durableUrl;
          try {
            if (uploadFile === file) {
              const { optimizeImageFile } = await import('../../utils/mediaOptimizer');
              const optimized = await optimizeImageFile(file, 1920, 400 * 1024);
              uploadFile = optimized.file || file;
              const nextIdb = await putChromeImage(storeId, chromeImageField, uploadFile);
              if (nextIdb) {
                readyUrl = nextIdb;
                onChange(nextIdb);
              }
            }
          } catch {
            /* keep current durable / blob */
          }
          if (readyUrl) {
            toast(
              isAr
                ? 'الخلفية جاهزة محلياً — اضغط حفظ المظهر للتثبيت.'
                : 'Wallpaper ready on this device — click Save appearance to lock it in.',
              'success',
            );
          }
        })();
        return;
      }

      // Non-chrome media: optimize → API upload (existing path)
      let uploadFile = file;
      try {
        const { optimizeImageFile } = await import('../../utils/mediaOptimizer');
        const optimized = await optimizeImageFile(file, 1600, 400 * 1024);
        uploadFile = optimized.file || file;
      } catch {
        uploadFile = file;
      }

      try {
        const { isApiEnabled } = await import('../../api/client');
        if (isApiEnabled() && storeId) {
          const { uploadMediaFile } = await import('../../api/tenantApi');
          const asset = await uploadMediaFile(storeId, uploadFile, {
            alt: altText || file.name.replace(/\.[^/.]+$/, ''),
            folder: initialFolder || 'uploads',
          });
          const url = asset.optimizedUrl || asset.originalUrl;
          if (url) {
            onChange(url, asset);
            revokePreview();
            toast(
              isAr ? 'تم رفع الصورة وتحديث المعاينة.' : 'Image uploaded and the preview updated.',
              'success',
            );
            return;
          }
        }
        toast(
          isAr
            ? 'المعاينة محلية — ارفع عند توفر الاتصال لحفظ الصورة.'
            : 'Local preview only — reconnect to persist the image.',
          'info',
        );
      } catch {
        toast(
          isAr
            ? 'تعذر الرفع للخادم. المعاينة ما زالت ظاهرة — أعد المحاولة أو الصق رابط صورة.'
            : 'Upload timed out. Preview stays — retry or paste an image URL.',
          'error',
        );
      }
    })();
  };

  const isVideo = value?.endsWith('.mp4') || value?.endsWith('.webm') || value?.includes('video');

  return (
    <div className={`space-y-2 min-w-0 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>
            {label}
          </label>
          {recommendedSize && (
            <span className="text-[10px] opacity-70 font-mono" style={{ color: 'var(--muted)' }}>
              {recommendedSize}
            </span>
          )}
        </div>
      )}

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleDirectFileUpload}
      />

      <div
        className="p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-3 transition-colors"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Preview Thumbnail Box */}
        <div
          className={`relative rounded-xl border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs group bg-slate-100 dark:bg-slate-900 ${
            aspectRatio === 'banner'
              ? 'w-full sm:w-28 h-16'
              : aspectRatio === 'video'
                ? 'w-full sm:w-24 h-16'
                : 'w-16 h-16'
          }`}
          style={{ borderColor: 'var(--border)' }}
        >
          {value ? (
            isVideo ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-950 text-white">
                <Film className="w-6 h-6 text-blue-400" />
              </div>
            ) : (
              <img
                key={previewSrc || value}
                src={previewSrc || value}
                alt={altText || 'Selected preview'}
                className="w-full h-full object-cover transition-all"
                onLoad={(e) => {
                  (e.target as HTMLImageElement).style.display = '';
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )
          ) : (
            <div className="text-slate-400 flex flex-col items-center justify-center p-1">
              <ImageIcon className="w-6 h-6 opacity-40" />
            </div>
          )}

          {/* Quick Hover Action to Change */}
          {value && !disabled && (
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-[10px] font-bold"
            >
              {isAr ? 'تغيير' : 'Change'}
            </button>
          )}
        </div>

        {/* Upload, library, and optional address box */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          {showUrlInput ? (
            <input
              type="text"
              value={value || ''}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 text-xs rounded-xl border font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              style={{
                background: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--input-fg)',
              }}
            />
          ) : null}

          {/* Action Buttons: Direct Upload + Media Library + SEO Edit */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct Upload Button */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-2xs cursor-pointer transition-opacity hover:opacity-90 unity-btn-primary"
              style={{ backgroundImage: 'var(--portal-cta)', backgroundColor: 'var(--portal-600)' }}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isAr ? 'رفع صورة' : 'Upload Image'}</span>
            </button>

            {/* Choose from Media Library Button — same global CTA as Upload */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsPickerOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-2xs cursor-pointer transition-opacity hover:opacity-90 unity-btn-primary"
              style={{ backgroundImage: 'var(--portal-cta)', backgroundColor: 'var(--portal-600)' }}
              data-media-library-open="1"
            >
              <FolderSearch className="w-3.5 h-3.5" />
              <span>{isAr ? 'المكتبة' : 'Media Library'}</span>
            </button>

            {value && previewSrc && (
              <a
                href={previewSrc}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border flex items-center gap-1 hover:opacity-90 transition-opacity"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <ExternalLink className="w-3 h-3" />
                <span>{isAr ? 'معاينة' : 'Preview'}</span>
              </a>
            )}

            {value && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (chromeImageField && activeStore?.id) {
                    void import('../../i18n/storeChromeImageStore').then(({ deleteChromeImage }) =>
                      deleteChromeImage(activeStore.id, chromeImageField),
                    );
                  }
                  onChange('');
                }}
                className="p-2 rounded-xl border text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer shrink-0"
                style={{ borderColor: 'var(--border)' }}
                title={isAr ? 'حذف الصورة' : 'Remove image'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick SEO Alt Text Field */}
      {onAltTextChange && (
        <div className="flex items-center gap-2 pt-1 ps-1">
          <span
            className="text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1"
            style={{ color: 'var(--muted)' }}
          >
            <Search className="w-2.5 h-2.5" style={{ color: 'var(--accent)' }} />
            <span>{isAr ? 'النص البديل للصورة' : 'Image description'}</span>
          </span>
          <input
            type="text"
            value={altText || ''}
            onChange={(e) => onAltTextChange(e.target.value)}
            placeholder={isAr ? 'وصف الصورة لمحركات البحث' : 'Image description for search engines'}
            className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      )}

      {/* Central Media Picker Modal */}
      <MediaPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectMedia}
        multiple={false}
        allowedTypes={allowedTypes}
        // Open on all folders so library picks are not stuck on an empty banners filter
        initialFolder="all"
        title={label ? `${label} - ${isAr ? 'مكتبة الوسائط' : 'Media Library'}` : undefined}
      />
    </div>
  );
};
