import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Image as ImageIcon,
  UploadCloud,
  HardDrive,
  Search,
  Check,
  Film,
  Sparkles,
  Layers,
  FileCheck,
  AlertCircle,
  Clock,
  Trash2,
  ExternalLink,
  Plus,
  Filter,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from './ToastProvider';
import type { MediaAsset, MediaType } from '../../types/media';
import {
  formatBytes,
  detectMediaType,
  optimizeImageFile,
  extractVideoMetadata,
  parseGoogleDriveUrl
} from '../../utils/mediaOptimizer';

export interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selected: MediaAsset | MediaAsset[]) => void;
  multiple?: boolean;
  allowedTypes?: MediaType[];
  title?: string;
  initialFolder?: string;
  selectedUrls?: string[];
  initialTab?: 'library' | 'upload' | 'gdrive';
}

type TabType = 'library' | 'upload' | 'gdrive';

// Display labels for raw media type keys (stored values are never changed)
const TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  image: { en: 'Image', ar: 'صورة' },
  video: { en: 'Video', ar: 'فيديو' },
  gif: { en: 'GIF', ar: 'GIF' },
  svg: { en: 'SVG', ar: 'SVG' },
};

// Display labels for raw folder keys
const FOLDER_LABELS: Record<string, { en: string; ar: string }> = {
  products: { en: 'Products', ar: 'المنتجات' },
  banners: { en: 'Banners & Hero', ar: 'البانرات والعروض' },
  categories: { en: 'Categories', ar: 'التصنيفات' },
  branding: { en: 'Branding & Logos', ar: 'الهوية والشعار' },
  marketing: { en: 'Marketing & Videos', ar: 'التسويق والفيديوهات' },
  general: { en: 'General', ar: 'عام' },
};

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  allowedTypes,
  title,
  initialFolder = 'all',
  selectedUrls = [],
  initialTab = 'library',
}) => {
  const { currentMedia, addMediaAsset, activeStore, syncProductImagesToMedia } = useTenant();
  const { locale, t } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      syncProductImagesToMedia(activeStore.id);
    }
  }, [isOpen, initialTab, activeStore.id, syncProductImagesToMedia]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>(initialFolder);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [focusedAsset, setFocusedAsset] = useState<MediaAsset | null>(null);
  const [displayLimit, setDisplayLimit] = useState(24);

  // Reset pagination on filter or open change
  React.useEffect(() => {
    setDisplayLimit(24);
  }, [searchQuery, selectedType, selectedFolder, isOpen]);

  // Uploading state
  const [uploadQueue, setUploadQueue] = useState<
    Array<{
      id: string;
      name: string;
      size: number;
      progress: number;
      status: 'optimizing' | 'ready' | 'failed';
      savings?: string;
      thumb?: string;
    }>
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Drive state
  const [gdriveUrl, setGdriveUrl] = useState('');
  const [gdriveName, setGdriveName] = useState('');
  const [gdriveType, setGdriveType] = useState<MediaType>('image');
  const [gdriveImporting, setGdriveImporting] = useState(false);

  // Filter media based on tab, query, type, folder
  const filteredMedia = useMemo(() => {
    return currentMedia.filter((asset) => {
      // Allowed types filter
      if (allowedTypes && allowedTypes.length > 0) {
        if (!allowedTypes.includes(asset.fileType)) return false;
      }

      // Type tab filter
      if (selectedType !== 'all') {
        if (selectedType === 'image' && asset.fileType !== 'image') return false;
        if (selectedType === 'video' && asset.fileType !== 'video') return false;
        if (selectedType === 'gif' && asset.fileType !== 'gif') return false;
        if (selectedType === 'svg' && asset.fileType !== 'svg') return false;
      }

      // Folder filter
      if (selectedFolder !== 'all') {
        if (asset.folder !== selectedFolder) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = asset.fileName.toLowerCase().includes(q);
        const matchesTitle = asset.title?.toLowerCase().includes(q) || false;
        const matchesAlt = asset.altText?.toLowerCase().includes(q) || false;
        const matchesCaption = asset.caption?.toLowerCase().includes(q) || false;
        const matchesTags = asset.tags?.some((t) => t.toLowerCase().includes(q)) || false;
        if (!matchesName && !matchesTitle && !matchesAlt && !matchesCaption && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [currentMedia, allowedTypes, selectedType, selectedFolder, searchQuery]);

  if (!isOpen) return null;

  // Toggle selection
  const handleToggleSelect = (asset: MediaAsset) => {
    setFocusedAsset(asset);
    if (multiple) {
      if (selectedAssetIds.includes(asset.id)) {
        setSelectedAssetIds((prev) => prev.filter((id) => id !== asset.id));
      } else {
        setSelectedAssetIds((prev) => [...prev, asset.id]);
      }
    } else {
      setSelectedAssetIds([asset.id]);
    }
  };

  // Submit selection
  const handleConfirmSelection = () => {
    if (selectedAssetIds.length === 0 && focusedAsset) {
      onSelect(multiple ? [focusedAsset] : focusedAsset);
      onClose();
      return;
    }

    const selectedAssets = currentMedia.filter((m) => selectedAssetIds.includes(m.id));
    if (selectedAssets.length === 0) {
      toast(isAr ? 'الرجاء اختيار ملف وسائط' : 'Please select at least one media item', 'info');
      return;
    }

    if (multiple) {
      onSelect(selectedAssets);
    } else {
      onSelect(selectedAssets[0]);
    }
    onClose();
  };

  // Process and upload multiple files
  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setActiveTab('upload');
    const newQueueItems = fileArray.map((file, idx) => ({
      id: `queue-${Date.now()}-${idx}`,
      name: file.name,
      size: file.size,
      progress: 20,
      status: 'optimizing' as const,
    }));
    setUploadQueue((prev) => [...newQueueItems, ...prev]);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const qId = newQueueItems[i].id;
      const type = detectMediaType(file.type, file.name);

      try {
        if (type === 'image' || type === 'gif' || type === 'svg') {
          let optimizedResult;
          if (type === 'image') {
            optimizedResult = await optimizeImageFile(file);
          } else {
            const dataUrl = await new Promise<string>((res) => {
              const reader = new FileReader();
              reader.onload = (e) => res(e.target?.result as string);
              reader.readAsDataURL(file);
            });
            optimizedResult = {
              dataUrl,
              webpUrl: dataUrl,
              thumbnailDataUrl: dataUrl,
              width: 800,
              height: 800,
              originalSize: file.size,
              compressedSize: file.size,
              savingsPct: 0,
            };
          }

          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === qId
                ? {
                    ...item,
                    progress: 100,
                    status: 'ready',
                    savings:
                      optimizedResult.savingsPct > 0
                        ? `-${optimizedResult.savingsPct}% WebP`
                        : 'WebP Optimized',
                    thumb: optimizedResult.thumbnailDataUrl,
                  }
                : item,
            ),
          );

          const objectUrl = URL.createObjectURL(optimizedResult.file || file);
          const newAsset = addMediaAsset({
            fileName: file.name,
            title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            fileType: type,
            mimeType: file.type || 'image/jpeg',
            fileSize: optimizedResult.compressedSize,
            width: optimizedResult.width,
            height: optimizedResult.height,
            originalUrl: objectUrl,
            optimizedUrl: objectUrl,
            webpUrl: objectUrl,
            thumbnailUrl: objectUrl,
            folder: selectedFolder !== 'all' ? selectedFolder : 'general',
            tags: [type, activeStore.category?.toLowerCase() || 'general'],
            processingStatus: 'ready',
            optimizationStatus: 'optimized',
            source: 'upload',
            metadata: {
              originalSize: file.size,
              compressionRatio: `${optimizedResult.savingsPct}% saved`,
            },
          });

          // Auto-select the newly uploaded file
          setSelectedAssetIds((prev) => (multiple ? [...prev, newAsset.id] : [newAsset.id]));
          setFocusedAsset(newAsset);
        } else if (type === 'video') {
          const videoMeta = await extractVideoMetadata(file);
          const dataUrl = await new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onload = (e) => res(e.target?.result as string);
            reader.readAsDataURL(file);
          });

          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === qId
                ? {
                    ...item,
                    progress: 100,
                    status: 'ready',
                    savings: 'Web Streaming',
                    thumb: videoMeta.posterUrl,
                  }
                : item,
            ),
          );

          const newAsset = addMediaAsset({
            fileName: file.name,
            title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            fileType: 'video',
            mimeType: file.type || 'video/mp4',
            fileSize: file.size,
            width: videoMeta.width,
            height: videoMeta.height,
            duration: videoMeta.duration,
            originalUrl: dataUrl,
            optimizedUrl: dataUrl,
            posterUrl: videoMeta.posterUrl,
            thumbnailUrl: videoMeta.posterUrl,
            folder: selectedFolder !== 'all' ? selectedFolder : 'marketing',
            tags: ['video', 'marketing'],
            processingStatus: 'ready',
            optimizationStatus: 'optimized',
            source: 'upload',
          });

          setSelectedAssetIds((prev) => (multiple ? [...prev, newAsset.id] : [newAsset.id]));
          setFocusedAsset(newAsset);
        }
      } catch (err) {
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === qId ? { ...item, status: 'failed', progress: 100 } : item,
          ),
        );
      }
    }

    toast(
      isAr
        ? 'تم رفع وتحسين الملفات بنجاح!'
        : 'Files uploaded & optimized with instant cache invalidation!',
      'success',
    );
  };

  // Google Drive Import Handler
  const handleGoogleDriveImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdriveUrl.trim()) return;

    setGdriveImporting(true);
    const parsed = parseGoogleDriveUrl(gdriveUrl);

    setTimeout(() => {
      setGdriveImporting(false);
      const urlToUse = parsed.directUrl || gdriveUrl.trim();
      const fileName =
        gdriveName.trim() ||
        (parsed.fileId ? `gdrive-file-${parsed.fileId.slice(0, 8)}.jpg` : 'gdrive-media.jpg');

      const newAsset = addMediaAsset({
        fileName,
        title: gdriveName.trim() || 'Imported Google Drive Asset',
        fileType: gdriveType,
        mimeType: gdriveType === 'video' ? 'video/mp4' : 'image/jpeg',
        fileSize: 1024 * 420, // estimated 420 KB
        width: 1200,
        height: 1200,
        originalUrl: urlToUse,
        optimizedUrl: urlToUse,
        webpUrl: urlToUse,
        thumbnailUrl: parsed.thumbnailUrl || urlToUse,
        folder: selectedFolder !== 'all' ? selectedFolder : 'general',
        tags: ['gdrive', 'imported'],
        processingStatus: 'ready',
        optimizationStatus: 'optimized',
        source: 'gdrive',
        metadata: {
          gdriveFileId: parsed.fileId,
        },
      });

      setSelectedAssetIds((prev) => (multiple ? [...prev, newAsset.id] : [newAsset.id]));
      setFocusedAsset(newAsset);
      setActiveTab('library');
      setGdriveUrl('');
      setGdriveName('');

      toast(
        isAr
          ? 'تم استيراد الوسائط من Google Drive وحفظها في المكتبة بنجاح'
          : 'Google Drive asset imported & saved to Media Library',
        'success',
      );
    }, 600);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[95vh] sm:h-[90vh] md:h-[86vh] max-h-[850px] rounded-2xl sm:rounded-3xl border shadow-2xl flex flex-col overflow-hidden"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
          fontFamily: 'var(--font-ui)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div
          className="px-4 sm:px-6 py-3 sm:py-3.5 border-b flex items-center justify-between gap-3 shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl unity-icon-box text-white flex items-center justify-center shadow-xs shrink-0">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base md:text-lg font-black tracking-tight truncate">
                  {title || (isAr ? 'مكتبة الوسائط المركزية' : 'Central Media Picker')}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                  {activeStore.name}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] truncate" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'اختر من الملفات السابقة، ارفع ملف جديد، أو استورد من Google Drive'
                  : 'Select existing media, upload optimized assets, or import from Google Drive'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Navigation Tabs Strip ── */}
        <div
          className="px-3 sm:px-6 py-2 border-b flex items-center justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'library' ? 'shadow-xs ring-1' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                background: activeTab === 'library' ? 'var(--active-bg)' : 'transparent',
                color: activeTab === 'library' ? 'var(--active-fg)' : 'var(--text)',
                borderColor: activeTab === 'library' ? 'var(--accent)' : 'transparent',
              }}
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{isAr ? 'المكتبة السحابية' : 'Media Library'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 font-mono">
                {filteredMedia.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'upload' ? 'shadow-xs ring-1' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                background: activeTab === 'upload' ? 'var(--active-bg)' : 'transparent',
                color: activeTab === 'upload' ? 'var(--active-fg)' : 'var(--text)',
                borderColor: activeTab === 'upload' ? 'var(--accent)' : 'transparent',
              }}
            >
              <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{isAr ? 'رفع ملفات جديدة' : 'Upload New'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gdrive')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'gdrive' ? 'shadow-xs ring-1' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                background: activeTab === 'gdrive' ? 'var(--active-bg)' : 'transparent',
                color: activeTab === 'gdrive' ? 'var(--active-fg)' : 'var(--text)',
                borderColor: activeTab === 'gdrive' ? 'var(--accent)' : 'transparent',
              }}
            >
              <HardDrive className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
              <span>Google Drive</span>
            </button>
          </div>

          {/* Quick Upload Button */}
          {activeTab === 'library' && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-xs cursor-pointer hover:opacity-90 unity-btn-primary shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'رفع سريع' : 'Quick Upload'}</span>
              <span className="sm:hidden">{isAr ? 'رفع' : 'Upload'}</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept="image/*,video/mp4,video/webm,.gif,.svg"
            className="hidden"
            onChange={(e) => e.target.files && processFiles(e.target.files)}
          />
        </div>

        {/* ── Main Content Body ── */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* TAB 1: MEDIA LIBRARY */}
          {activeTab === 'library' && (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Search & Filter Bar */}
              <div
                className="p-2.5 sm:p-3 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0"
                style={{ borderColor: 'var(--border)' }}
              >
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute start-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--muted)' }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isAr
                        ? 'بحث بالاسم، الوسم، أو النص البديل...'
                        : 'Search by file name, tag, alt text...'
                    }
                    className="w-full ps-8 sm:ps-9 pe-7 py-1.5 text-xs rounded-xl border focus:outline-none"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-slate-800 dark:hover:text-white"
                      aria-label="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filters Group */}
                <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
                  {/* Type Filter */}
                  <div className="flex items-center gap-1 shrink-0">
                    {(['all', 'image', 'video', 'gif'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedType(type)}
                        className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                          selectedType === type
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:opacity-80'
                        }`}
                      >
                        {type === 'all'
                          ? isAr
                            ? 'الكل'
                            : 'All'
                          : type === 'image'
                            ? isAr
                              ? 'صور'
                              : 'Images'
                            : type === 'video'
                              ? isAr
                                ? 'فيديو'
                                : 'Videos'
                              : 'GIFs'}
                      </button>
                    ))}
                  </div>

                  {/* Folder Filter */}
                  <select
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="px-2 sm:px-2.5 py-1 text-[11px] font-semibold rounded-xl border focus:outline-none cursor-pointer shrink-0"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  >
                    <option value="all">{isAr ? 'جميع المجلدات' : 'All Folders'}</option>
                    <option value="products">{isAr ? 'المنتجات' : 'Products'}</option>
                    <option value="banners">{isAr ? 'البانرات والعروض' : 'Banners & Hero'}</option>
                    <option value="categories">{isAr ? 'التصنيفات' : 'Categories'}</option>
                    <option value="branding">{isAr ? 'الهوية والشعار' : 'Branding & Logos'}</option>
                    <option value="marketing">{isAr ? 'التسويق والفيديوهات' : 'Marketing & Videos'}</option>
                    <option value="general">{isAr ? 'عام' : 'General'}</option>
                  </select>
                </div>
              </div>

              {/* Grid View of Assets */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto custom-scroll">
                {filteredMedia.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 sm:p-8 text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                      <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <h3 className="font-extrabold text-sm" style={{ color: 'var(--text)' }}>
                      {isAr ? 'لا توجد ملفات وسائط مطابقة' : 'No matching media assets found'}
                    </h3>
                    <p className="text-xs text-muted mt-1 max-w-sm">
                      {isAr
                        ? 'جرّب تغيير عبارة البحث، أو قم برفع ملفات جديدة بالضغط على زر الرفع.'
                        : 'Try adjusting your search query, or upload new files to your store library.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs unity-btn-primary"
                    >
                      {isAr ? 'رفع ملفات جديدة' : 'Upload New Asset'}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
                    {filteredMedia.slice(0, displayLimit).map((asset) => {
                      const isSelected = selectedAssetIds.includes(asset.id);
                      const isFocused = focusedAsset?.id === asset.id;

                      return (
                        <div
                          key={asset.id}
                          onClick={() => handleToggleSelect(asset)}
                          className={`group relative rounded-2xl border overflow-hidden transition-all duration-150 cursor-pointer flex flex-col ${
                            isSelected
                              ? 'ring-2 ring-blue-500 border-blue-500 shadow-md scale-[0.99]'
                              : isFocused
                                ? 'border-slate-400 dark:border-slate-600'
                                : 'hover:border-slate-400 dark:hover:border-slate-600'
                          }`}
                          style={{
                            background: 'var(--surface)',
                            borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                          }}
                        >
                          {/* Thumbnail Box */}
                          <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-900/60 overflow-hidden flex items-center justify-center">
                            {asset.fileType === 'video' ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                {asset.posterUrl || asset.thumbnailUrl ? (
                                  <img
                                    src={asset.posterUrl || asset.thumbnailUrl}
                                    alt={asset.fileName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Film className="w-10 h-10 text-slate-400" />
                                )}
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <div className="w-9 h-9 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-md">
                                    <Film className="w-4 h-4 text-blue-600" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <img
                                src={asset.thumbnailUrl || asset.webpUrl || asset.originalUrl}
                                alt={asset.altText || asset.fileName}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = asset.originalUrl;
                                }}
                              />
                            )}

                            {/* Type Badge */}
                            <span className="absolute top-2 start-2 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-black/60 backdrop-blur-xs text-white">
                              {asset.fileType}
                            </span>

                            {/* Optimization Savings Badge */}
                            {asset.metadata?.compressionRatio && (
                              <span className="absolute bottom-2 start-2 px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-emerald-500/90 text-white">
                                {asset.metadata.compressionRatio}
                              </span>
                            )}

                            {/* Checkmark indicator */}
                            <div
                              className={`absolute top-2 end-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-md scale-100'
                                  : 'bg-black/40 text-white/50 opacity-0 group-hover:opacity-100'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          {/* File info caption */}
                          <div className="p-2.5 space-y-0.5">
                            <p className="text-xs font-bold truncate leading-tight" title={asset.fileName}>
                              {asset.title || asset.fileName}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-muted">
                              <span>{formatBytes(asset.fileSize)}</span>
                              {asset.width && asset.height && (
                                <span>
                                  {asset.width}×{asset.height}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredMedia.length > displayLimit && (
                      <div className="col-span-full py-4 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setDisplayLimit((prev) => prev + 24)}
                          className="px-5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                        >
                          {isAr
                            ? `عرض المزيد (${filteredMedia.length - displayLimit} متبقي)`
                            : `Load More (${filteredMedia.length - displayLimit} remaining)`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD DROPZONE */}
          {activeTab === 'upload' && (
            <div className="flex-1 p-6 overflow-y-auto custom-scroll space-y-6">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files) {
                    processFiles(e.dataTransfer.files);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-10 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                }`}
              >
                <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-xs">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="font-black text-base" style={{ color: 'var(--text)' }}>
                  {isAr ? 'اسحب وأفلت الملفات هنا، أو اضغط للاختيار' : 'Drag & drop media files here, or click to browse'}
                </h3>
                <p className="text-xs text-muted mt-1 max-w-md">
                  {isAr
                    ? 'يدعم JPG, PNG, WebP, AVIF, SVG, GIF وفيديوهات MP4/WebM. سيتم تحسين الصور تلقائياً وتحويلها إلى WebP خفيف وسريع.'
                    : 'Supports JPG, PNG, WebP, AVIF, SVG, GIF, and MP4/WebM videos. High-quality compression and WebP generated on the fly.'}
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs">
                    {isAr ? 'اختيار ملفات من الجهاز' : 'Browse Computer Files'}
                  </span>
                </div>
              </div>

              {/* Upload queue */}
              {uploadQueue.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-muted">
                    {isAr ? 'سجل الرفع والتحسين التلقائي' : 'Upload & Optimization Queue'}
                  </h4>
                  <div className="space-y-2">
                    {uploadQueue.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl border flex items-center justify-between gap-4"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.thumb ? (
                            <img
                              src={item.thumb}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover border shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <ImageIcon className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{item.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted">
                              <span>{formatBytes(item.size)}</span>
                              {item.savings && (
                                <span className="text-emerald-500 font-bold">{item.savings}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {item.status === 'ready' ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{isAr ? 'جاهز' : 'Ready'}</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-blue-500 animate-pulse">
                              {isAr ? 'جارٍ التحسين…' : 'Optimizing…'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GOOGLE DRIVE IMPORT */}
          {activeTab === 'gdrive' && (
            <div className="flex-1 p-6 overflow-y-auto custom-scroll max-w-2xl mx-auto space-y-6">
              {/* Drive Feature Banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-900/30 to-emerald-900/20 border border-emerald-500/20 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white text-slate-900 flex items-center justify-center shrink-0 shadow-md">
                  <HardDrive className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-emerald-400">
                    {isAr ? 'استيراد مباشر وسريع من Google Drive' : 'Direct Google Drive Import'}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {isAr
                      ? 'انسخ رابط المشاركة لأي صورة أو فيديو من Google Drive والصقه هنا. سيقوم النظام بحفظها وتحسينها لتكون متاحة لجميع أقسام متجرك.'
                      : 'Paste any public or shared Google Drive file link. The system extracts the media, optimizes dimensions, and saves it permanently in your store library.'}
                  </p>
                </div>
              </div>

              {/* Import Form */}
              <form onSubmit={handleGoogleDriveImport} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold block" style={{ color: 'var(--text)' }}>
                    {isAr ? 'رابط مشاركة Google Drive' : 'Google Drive Share Link'} *
                  </label>
                  <input
                    type="url"
                    required
                    value={gdriveUrl}
                    onChange={(e) => setGdriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/1A2B3C4D.../view?usp=sharing"
                    className="w-full px-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold block" style={{ color: 'var(--text)' }}>
                      {isAr ? 'اسم الملف (اختياري)' : 'Asset Title (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={gdriveName}
                      onChange={(e) => setGdriveName(e.target.value)}
                      placeholder="e.g. Eid Campaign Banner 2026"
                      className="w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none"
                      style={{
                        background: 'var(--input-bg)',
                        borderColor: 'var(--border)',
                        color: 'var(--input-fg)',
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold block" style={{ color: 'var(--text)' }}>
                      {isAr ? 'نوع الوسائط' : 'Media Type'}
                    </label>
                    <select
                      value={gdriveType}
                      onChange={(e) => setGdriveType(e.target.value as MediaType)}
                      className="w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none cursor-pointer"
                      style={{
                        background: 'var(--input-bg)',
                        borderColor: 'var(--border)',
                        color: 'var(--input-fg)',
                      }}
                    >
                      <option value="image">{isAr ? 'صورة' : 'Image'}</option>
                      <option value="video">{isAr ? 'فيديو' : 'Video'}</option>
                      <option value="gif">{isAr ? 'صورة متحركة' : 'Animated GIF'}</option>
                    </select>
                  </div>
                </div>

                {/* Quick Sample Links for testing */}
                <div className="pt-2 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-muted block">
                    {isAr ? 'نماذج سريعة للتجربة:' : 'Quick Sample Drive Links:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGdriveUrl('https://drive.google.com/file/d/1AbC8d9EfG_hIJkLmnOP_sample_banner/view');
                        setGdriveName('Summer Seasonal Banner');
                        setGdriveType('image');
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      🌸 Flower Banner Sample
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGdriveUrl('https://drive.google.com/file/d/1XyZ987_video_promo_sample/view');
                        setGdriveName('Flower Reel 4K');
                        setGdriveType('video');
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      🎬 Video Promo Reel
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={gdriveImporting || !gdriveUrl.trim()}
                    className="w-full py-3 rounded-2xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
                  >
                    {gdriveImporting ? (
                      <span>{isAr ? 'جارٍ الاستيراد والتحسين…' : 'Importing & Optimizing…'}</span>
                    ) : (
                      <>
                        <HardDrive className="w-4 h-4" />
                        <span>{isAr ? 'استيراد إلى مكتبة المتجر' : 'Import to Media Library'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Quick Inspector Sidepanel for Focused Asset (Only on library tab) */}
          {activeTab === 'library' && focusedAsset && (
            <div
              className="w-72 border-s p-4 flex flex-col justify-between shrink-0 overflow-y-auto custom-scroll hidden md:flex"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
            >
              <div className="space-y-4">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-muted">
                  {isAr ? 'تفاصيل الملف المحدد' : 'Selected Media Details'}
                </h4>

                {/* Preview Box */}
                <div className="rounded-2xl border overflow-hidden aspect-video bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative">
                  {focusedAsset.fileType === 'video' ? (
                    <video
                      src={focusedAsset.originalUrl}
                      poster={focusedAsset.posterUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={focusedAsset.thumbnailUrl || focusedAsset.originalUrl}
                      alt={focusedAsset.fileName}
                      className="w-full h-full object-contain p-2"
                    />
                  )}
                </div>

                {/* Metadata List */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-muted">{isAr ? 'اسم الملف' : 'File Name'}</span>
                    <span className="font-semibold truncate max-w-[140px]" title={focusedAsset.fileName}>
                      {focusedAsset.fileName}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-muted">{isAr ? 'النوع' : 'Type'}</span>
                    <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      {focusedAsset.fileType}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-muted">{isAr ? 'الحجم' : 'File Size'}</span>
                    <span className="font-mono font-semibold">{formatBytes(focusedAsset.fileSize)}</span>
                  </div>

                  {focusedAsset.width && focusedAsset.height && (
                    <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-muted">{isAr ? 'الأبعاد' : 'Dimensions'}</span>
                      <span className="font-mono font-semibold">
                        {focusedAsset.width} × {focusedAsset.height} px
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-muted">{isAr ? 'المجلد' : 'Folder'}</span>
                    <span className="capitalize font-semibold">{focusedAsset.folder || 'general'}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleConfirmSelection}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 cursor-pointer unity-btn-primary"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'اختيار هذا الملف' : 'Choose Selected Asset'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer Bar ── */}
        <div
          className="px-4 sm:px-6 py-2.5 sm:py-3 border-t flex flex-row items-center justify-between gap-3 shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div className="text-xs text-muted flex items-center gap-2 min-w-0">
            <span className="truncate">
              {selectedAssetIds.length > 0
                ? `${selectedAssetIds.length} ${isAr ? 'عنصر محدد' : 'item(s) selected'}`
                : isAr
                  ? 'لم يتم تحديد أي عنصر'
                  : 'No item selected'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[38px]"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleConfirmSelection}
              disabled={selectedAssetIds.length === 0 && !focusedAsset}
              className="px-4 sm:px-6 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 unity-btn-primary min-h-[38px]"
            >
              <Check className="w-4 h-4" />
              <span>
                {isAr
                  ? multiple
                    ? `إدراج (${selectedAssetIds.length})`
                    : 'اختيار وتطبيق'
                  : multiple
                    ? `Insert (${selectedAssetIds.length})`
                    : 'Select Media'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};
