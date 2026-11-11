import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  FolderSearch,
  X,
  ExternalLink,
  Film,
  Sparkles,
  Check,
  Sliders,
  Crop,
  Search
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useTenant } from '../../context/TenantContext';
import { useToast } from './ToastProvider';
import { GlobalModal } from './GlobalModal';
import { MediaPickerModal } from './MediaPickerModal';
import type { MediaAsset, MediaType } from '../../types/media';

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
}) => {
  const { locale } = usePrefs();
  const { addMediaAsset, activeStore } = useTenant();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempAlt, setTempAlt] = useState(altText || '');
  const [brightness, setBrightness] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectMedia = (selected: MediaAsset | MediaAsset[]) => {
    const asset = Array.isArray(selected) ? selected[0] : selected;
    if (asset) {
      const urlToUse = asset.optimizedUrl || asset.webpUrl || asset.originalUrl;
      onChange(urlToUse, asset);
      if (asset.altText && onAltTextChange) {
        onAltTextChange(asset.altText);
      }
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

    const keepLocalPreview = () => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (!dataUrl) return;
        const asset = addMediaAsset({
          fileName: file.name,
          title: file.name.replace(/\.[^/.]+$/, ''),
          fileType: 'image',
          mimeType: file.type || 'image/jpeg',
          fileSize: file.size,
          originalUrl: dataUrl,
          optimizedUrl: dataUrl,
          webpUrl: dataUrl,
          thumbnailUrl: dataUrl,
          altText: tempAlt || file.name.replace(/\.[^/.]+$/, ''),
          caption: file.name,
          folder: initialFolder || 'uploads',
          tags: ['upload', 'direct'],
          processingStatus: 'ready',
          optimizationStatus: 'optimized',
          source: 'upload',
        });
        onChange(dataUrl, asset);
        toast(isAr ? 'تم رفع الصورة بنجاح وإضافتها للمكتبة' : 'Image uploaded & saved to media library', 'success');
      };
      reader.readAsDataURL(file);
    };

    void (async () => {
      try {
        const { isApiEnabled } = await import('../../api/client');
        if (isApiEnabled() && activeStore?.id) {
          const { uploadMediaFile } = await import('../../api/tenantApi');
          const asset = await uploadMediaFile(activeStore.id, file, {
            alt: tempAlt || file.name.replace(/\.[^/.]+$/, ''),
            folder: initialFolder || 'uploads',
          });
          const url = asset.optimizedUrl || asset.originalUrl;
          if (url) {
            onChange(url, asset);
            toast(isAr ? 'تم رفع الصورة وتحديث المعاينة.' : 'Image uploaded and the preview updated.', 'success');
            return;
          }
        }
      } catch {
        /* keep a local preview when the store upload fails */
      }
      keepLocalPreview();
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
                src={value}
                alt={altText || 'Selected preview'}
                className="w-full h-full object-cover transition-all"
                style={{ filter: `brightness(${brightness}%)` }}
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
            >
              <FolderSearch className="w-3.5 h-3.5" />
              <span>{isAr ? 'المكتبة' : 'Media Library'}</span>
            </button>

            {/* SEO & Image Optimization Tool */}
            {value && (
              <button
                type="button"
                onClick={() => {
                  setTempAlt(altText || '');
                  setIsEditModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1 transition-colors cursor-pointer hover:opacity-90"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                  background: 'var(--surface)',
                }}
                title={isAr ? 'تحسين الصورة والوصف' : 'Edit image and description'}
              >
                <Sparkles className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                <span>{isAr ? 'تحسين الصورة' : 'Edit image'}</span>
              </button>
            )}

            {value && (
              <a
                href={value}
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
                onClick={() => onChange('')}
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
        initialFolder={initialFolder}
        title={label ? `${label} - ${isAr ? 'مكتبة الوسائط' : 'Media Library'}` : undefined}
      />

      {/* Quick Image SEO & Optimization Modal */}
      {isEditModalOpen && (
        <GlobalModal
          onClose={() => setIsEditModalOpen(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'تحسين الصورة لمحركات البحث' : 'Image description and filters'}
        >
          <div
            className="rounded-3xl max-w-md w-full shadow-2xl border overflow-hidden space-y-0"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <div
              className="unity-modal-header px-5 py-3.5 flex items-center justify-between"
              style={{ backgroundImage: 'var(--portal-cta)', backgroundColor: 'var(--portal-600)' }}
            >
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="w-4 h-4 unity-modal-icon" />
                <h3 className="font-bold text-sm">
                  {isAr ? 'تحسين الصورة لمحركات البحث' : 'Image description and filters'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-xl text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 custom-scrollbar">
              <div className="space-y-3">
                <div
                  className="h-40 rounded-2xl overflow-hidden border flex items-center justify-center"
                  style={{ borderColor: 'var(--border)', background: 'var(--input-bg)' }}
                >
                  <img
                    src={value}
                    alt={tempAlt}
                    className="w-full h-full object-cover"
                    style={{ filter: `brightness(${brightness}%)` }}
                  />
                </div>

                <div>
                  <label className="unity-modal-label block text-xs font-bold mb-1">
                    {isAr ? 'النص البديل للصورة' : 'Image description'}
                  </label>
                  <input
                    type="text"
                    value={tempAlt}
                    onChange={(e) => setTempAlt(e.target.value)}
                    placeholder={isAr ? 'وصف قصير للصورة' : 'Short image description'}
                    className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--input-bg)',
                      color: 'var(--input-fg)',
                    }}
                  />
                  <p className="unity-modal-hint text-[10px] mt-1">
                    {isAr
                      ? 'يساعد محركات البحث على فهرسة الصورة وزيادة عدد الزوار.'
                      : 'Helps search engines rank this image in Image Search for organic traffic.'}
                  </p>
                </div>

                <div>
                  <label className="unity-modal-label block text-xs font-bold mb-1 flex items-center justify-between">
                    <span>{isAr ? 'السطوع' : 'Brightness'}</span>
                    <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
                      {brightness}%
                    </span>
                  </label>
                  <input
                    type="range"
                    min="70"
                    max="130"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                </div>
              </div>

              <div
                className="pt-3 flex justify-end gap-2"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:opacity-80"
                  style={{ color: 'var(--muted)' }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onAltTextChange) onAltTextChange(tempAlt);
                    setIsEditModalOpen(false);
                    toast(isAr ? 'تم تحديث وصف الصورة' : 'Image description updated', 'success');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer unity-btn-primary"
                  style={{ backgroundImage: 'var(--portal-cta)', backgroundColor: 'var(--portal-600)' }}
                >
                  {isAr ? 'تطبيق وحفظ' : 'Apply & Save'}
                </button>
              </div>
            </div>
          </div>
        </GlobalModal>
      )}
    </div>
  );
};
