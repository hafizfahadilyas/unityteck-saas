import React, { useState, useRef } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Check,
  Link,
  User,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import {
  ARAB_MALE_AVATARS,
  ARAB_FEMALE_AVATARS,
  getCustomerSeoAlt,
} from '../../utils/customerAvatars';
import { handleImageError } from '../../utils/imageFallback';

interface CustomerAvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  customerGender?: string;
  currentAvatar?: string;
  onAvatarUpdated: (newAvatarUrl: string) => void;
}

type TabMode = 'upload' | 'media' | 'presets' | 'url';

export const CustomerAvatarUploadModal: React.FC<CustomerAvatarUploadModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  customerGender = 'Male',
  currentAvatar,
  onAvatarUpdated,
}) => {
  const { activeStore, currentMedia, addMediaAsset, updateCustomer } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const [activeTab, setActiveTab] = useState<TabMode>('upload');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || '');
  const [previewError, setPreviewError] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(isAr ? 'يرجى اختيار ملف صورة صالح' : 'Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSelectedAvatar(dataUrl);
        setPreviewError(false);
        // Also save to store media assets for future reuse
        try {
          addMediaAsset({
            title: `${customerName} Profile Avatar`,
            fileName: file.name,
            fileType: 'image' as any,
            fileSize: file.size,
            dimensions: { width: 400, height: 400 },
            url: dataUrl,
            category: 'general',
            tags: ['customer', 'avatar', 'profile', customerName],
            uploadedBy: 'Store Admin',
          } as any);
        } catch (err) {
          console.warn('Could not register media asset:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (customUrl.trim()) {
      setSelectedAvatar(customUrl.trim());
      setPreviewError(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateCustomer(customerId, { avatar: selectedAvatar });
      onAvatarUpdated(selectedAvatar);
      onClose();
    } catch (err) {
      console.error('Failed to update customer avatar:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedAvatar('');
    setPreviewError(false);
  };

  const seoAlt = getCustomerSeoAlt({ name: customerName }, activeStore?.name, isAr);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto transition-all"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'تغيير صورة العميل' : 'Change Customer Photo'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {customerName} • {isAr ? 'تحديث وتخصيص صورة الحساب' : 'Update & optimize profile photo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Avatar Live Preview Card */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-gradient-to-tr from-slate-50 via-teal-50/20 to-slate-50 dark:from-slate-800/40 dark:via-teal-950/10 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full border-3 border-teal-500/30 dark:border-teal-500/40 p-1 shadow-md bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {selectedAvatar && !previewError ? (
                  <img
                    src={selectedAvatar}
                    alt={seoAlt}
                    loading="lazy"
                    decoding="async"
                    onError={() => setPreviewError(true)}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-extrabold text-xl flex items-center justify-center">
                    {customerName.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>

            <div className="space-y-1 text-center sm:text-start flex-1 min-w-0">
              <h4 className="font-bold text-slate-900 dark:text-white truncate text-base">
                {customerName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'صورة بحجم 1:1 دائرية، محسّنة لمحركات البحث وسريعة التحميل بدون روابط تالفة.'
                  : '1:1 circular photo, SEO-optimized with alt tags & resilient zero-broken image fallback.'}
              </p>
              {selectedAvatar && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline pt-1 cursor-pointer font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إزالة الصورة الحالية' : 'Remove current photo'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'upload'
                  ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isAr ? 'رفع من الجهاز' : 'Upload File'}</span>
            </button>

            <button
              onClick={() => setActiveTab('presets')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'presets'
                  ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? 'نماذج عربية جاهزة' : 'Arab Presets'}</span>
            </button>

            <button
              onClick={() => setActiveTab('media')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'media'
                  ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{isAr ? 'مكتبة وسائط المتجر' : 'Media Library'}</span>
            </button>

            <button
              onClick={() => setActiveTab('url')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'url'
                  ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>{isAr ? 'رابط مباشر' : 'Image URL'}</span>
            </button>
          </div>

          {/* Tab 1: Direct File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer ${
                  dragActive
                    ? 'border-teal-500 bg-teal-500/10'
                    : 'border-slate-300 dark:border-slate-700 hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  {isAr ? 'اضغط لاختيار صورة من جهازك أو اسحبها هنا' : 'Click to select or drag & drop image'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  PNG, JPG, WEBP (Max 5MB) • {isAr ? 'حجم مربع موصى به 400x400' : 'Recommended 400x400'}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Arab Region Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {isAr ? 'صور شخصية رجالية (السعودية والخليج):' : 'Male Portraits (Saudi & Gulf):'}
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                  {ARAB_MALE_AVATARS.map((url, idx) => (
                    <button
                      key={`male-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(url);
                        setPreviewError(false);
                      }}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedAvatar === url
                          ? 'border-teal-600 ring-2 ring-teal-500/40 scale-95'
                          : 'border-slate-200 dark:border-slate-700 hover:border-teal-400'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Arab male avatar ${idx + 1}`}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e)}
                        className="w-full h-full object-cover"
                      />
                      {selectedAvatar === url && (
                        <div className="absolute inset-0 bg-teal-600/30 flex items-center justify-center text-white">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {isAr ? 'صور شخصية نسائية (السعودية والخليج):' : 'Female Portraits (Saudi & Gulf):'}
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                  {ARAB_FEMALE_AVATARS.map((url, idx) => (
                    <button
                      key={`female-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(url);
                        setPreviewError(false);
                      }}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedAvatar === url
                          ? 'border-teal-600 ring-2 ring-teal-500/40 scale-95'
                          : 'border-slate-200 dark:border-slate-700 hover:border-teal-400'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Arab female avatar ${idx + 1}`}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e)}
                        className="w-full h-full object-cover"
                      />
                      {selectedAvatar === url && (
                        <div className="absolute inset-0 bg-teal-600/30 flex items-center justify-center text-white">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Store Media Library */}
          {activeTab === 'media' && (
            <div className="space-y-3">
              {currentMedia && currentMedia.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {currentMedia.map((asset: any) => {
                    const mediaUrl = asset.url || asset.originalUrl || asset.path || '';
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(mediaUrl);
                          setPreviewError(false);
                        }}
                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                          selectedAvatar === mediaUrl
                            ? 'border-teal-600 ring-2 ring-teal-500/40 scale-95'
                            : 'border-slate-200 dark:border-slate-700 hover:border-teal-400'
                        }`}
                        title={asset.title || asset.fileName}
                      >
                        <img
                          src={mediaUrl}
                          alt={asset.title || 'Store media'}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => handleImageError(e)}
                          className="w-full h-full object-cover"
                        />
                        {selectedAvatar === mediaUrl && (
                          <div className="absolute inset-0 bg-teal-600/30 flex items-center justify-center text-white">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {isAr ? 'لا توجد وسائط مسبقة في مكتبة هذا المتجر.' : 'No media assets found in this store.'}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Direct URL */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'أدخل رابط الصورة المباشر (HTTPS)' : 'Enter Direct Image URL (HTTPS)'}
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/customer-photo.jpg"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {isAr ? 'معاينة' : 'Apply'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 transition-all shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ الصورة' : 'Save Photo')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
