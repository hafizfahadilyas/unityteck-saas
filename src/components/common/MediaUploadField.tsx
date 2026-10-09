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
}) => {
  const { locale } = usePrefs();
  const { addMediaAsset } = useTenant();
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
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast(isAr ? 'يرجى اختيار ملف صورة صالح' : 'Please select a valid image file', 'error');
      return;
    }

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
    e.target.value = '';
  };

  const isVideo = value?.endsWith('.mp4') || value?.endsWith('.webm') || value?.includes('video');

  return (
    <div className={`space-y-2 min-w-0 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold" style={{ color: 'var(--text)' }}>
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

        {/* URL Input & Trigger Buttons */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value || ''}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 text-xs rounded-xl border font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              style={{
                background: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--input-fg)',
              }}
            />

            {value && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange('')}
                className="p-2 rounded-xl border text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer shrink-0"
                style={{ borderColor: 'var(--border)' }}
                title={isAr ? 'حذف الصورة' : 'Remove media'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons: Direct Upload + Media Library + SEO Edit */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct Upload Button */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isAr ? 'رفع صورة' : 'Upload Image'}</span>
            </button>

            {/* Choose from Media Library Button */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsPickerOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <FolderSearch className="w-3.5 h-3.5 text-amber-400" />
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
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                title="SEO Image Optimization & Filters"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>SEO / Edit</span>
              </button>
            )}

            {value && (
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                <ExternalLink className="w-3 h-3" />
                <span>{isAr ? 'معاينة' : 'Preview'}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Quick SEO Alt Text Field */}
      {onAltTextChange && (
        <div className="flex items-center gap-2 pt-1 ps-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Search className="w-2.5 h-2.5 text-emerald-600" />
            <span>SEO Alt Text:</span>
          </span>
          <input
            type="text"
            value={altText || ''}
            onChange={(e) => onAltTextChange(e.target.value)}
            placeholder={isAr ? 'وصف الصورة لمحركات بحث Google...' : 'Image description for Google SEO...'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {isAr ? 'تحسين الصورة لمحركات البحث' : 'Image SEO & Filter Optimizer'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="h-40 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 flex items-center justify-center">
                <img
                  src={value}
                  alt={tempAlt}
                  className="w-full h-full object-cover"
                  style={{ filter: `brightness(${brightness}%)` }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'النص البديل للصورة' : 'Google SEO Alt Tag'}
                </label>
                <input
                  type="text"
                  value={tempAlt}
                  onChange={(e) => setTempAlt(e.target.value)}
                  placeholder={isAr ? 'مثال: باقة ورود جورية حمراء فاخرة' : 'e.g. Royal Red Roses Velvet Box Makkah'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {isAr ? 'يساعد محركات البحث على فهرسة الصورة وزيادة عدد الزوار.' : 'Helps search engines rank this image in Image Search for organic traffic.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>{isAr ? 'مستوى السطوع والإضاءة' : 'Brightness Adjustment'}</span>
                  <span className="font-mono text-[10px] text-slate-500">{brightness}%</span>
                </label>
                <input
                  type="range"
                  min="70"
                  max="130"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onAltTextChange) onAltTextChange(tempAlt);
                  setIsEditModalOpen(false);
                  toast(isAr ? 'تم تحديث بيانات تحسين محركات البحث للصورة' : 'Image SEO metadata updated', 'success');
                }}
                className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors"
              >
                {isAr ? 'تطبيق وحفظ' : 'Apply & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
