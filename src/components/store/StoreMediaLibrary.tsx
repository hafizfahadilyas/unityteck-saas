import React, { useState, useMemo, useRef } from 'react';
import {
  Image as ImageIcon,
  Film,
  UploadCloud,
  HardDrive,
  Search,
  Filter,
  Grid,
  List,
  SortAsc,
  Trash2,
  RefreshCw,
  Copy,
  ExternalLink,
  Edit3,
  Check,
  AlertTriangle,
  FileText,
  Tag,
  Folder,
  Layers,
  Sparkles,
  Info,
  ArrowUpDown,
  Plus,
  Eye,
  CheckCircle2,
  X,
  Maximize2,
  Code,
  ShieldAlert,
  Zap,
  Boxes
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import type { MediaAsset, MediaType, MediaUsage } from '../../types/media';
import {
  formatBytes,
  detectMediaType,
  optimizeImageFile,
  extractVideoMetadata,
  parseGoogleDriveUrl,
  getCacheBustedUrl
} from '../../utils/mediaOptimizer';

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'largest' | 'smallest' | 'most_used' | 'name';

export const StoreMediaLibrary: React.FC = () => {
  const {
    activeStore,
    currentMedia,
    addMediaAsset,
    updateMediaAsset,
    deleteMediaAsset,
    replaceMediaAsset,
    getMediaUsages,
  } = useTenant();
  const { locale, t } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  // Layout & Filtering State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showOnlyUnused, setShowOnlyUnused] = useState(false);

  // Active Inspector / Drawer Asset
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Replace Asset State
  const [replaceTargetAsset, setReplaceTargetAsset] = useState<MediaAsset | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Delete Protection Dialog
  const [deleteTargetAsset, setDeleteTargetAsset] = useState<MediaAsset | null>(null);
  const [deleteUsages, setDeleteUsages] = useState<MediaUsage[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Google Drive Modal
  const [isGdriveModalOpen, setIsGdriveModalOpen] = useState(false);
  const [gdriveUrl, setGdriveUrl] = useState('');
  const [gdriveName, setGdriveName] = useState('');
  const [gdriveType, setGdriveType] = useState<MediaType>('image');
  const [gdriveFolder, setGdriveFolder] = useState('general');
  const [gdriveLoading, setGdriveLoading] = useState(false);

  // Upload Dropzone & Queue
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
  const mainFileInputRef = useRef<HTMLInputElement>(null);

  // Copied toast state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Calculate Storage & Usage Statistics
  const stats = useMemo(() => {
    let totalBytes = 0;
    let imagesCount = 0;
    let videosCount = 0;
    let gifsCount = 0;
    let unusedCount = 0;

    currentMedia.forEach((asset) => {
      totalBytes += asset.fileSize || 0;
      if (asset.fileType === 'image' || asset.fileType === 'svg') imagesCount++;
      if (asset.fileType === 'video') videosCount++;
      if (asset.fileType === 'gif') gifsCount++;

      const usages = getMediaUsages(asset.id, activeStore.id);
      if (usages.length === 0) unusedCount++;
    });

    return {
      totalCount: currentMedia.length,
      totalBytes,
      imagesCount,
      videosCount,
      gifsCount,
      unusedCount,
    };
  }, [currentMedia, getMediaUsages, activeStore.id]);

  // Filtered & Sorted media
  const processedMedia = useMemo(() => {
    let list = [...currentMedia];

    // Filter by type
    if (selectedType !== 'all') {
      list = list.filter((item) => item.fileType === selectedType);
    }

    // Filter by folder
    if (selectedFolder !== 'all') {
      list = list.filter((item) => (item.folder || 'general') === selectedFolder);
    }

    // Filter by Unused
    if (showOnlyUnused) {
      list = list.filter((item) => {
        const usages = getMediaUsages(item.id, activeStore.id);
        return usages.length === 0;
      });
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.fileName.toLowerCase().includes(q) ||
          m.title?.toLowerCase().includes(q) ||
          m.altText?.toLowerCase().includes(q) ||
          m.caption?.toLowerCase().includes(q) ||
          m.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      }
      if (sortBy === 'largest') {
        return (b.fileSize || 0) - (a.fileSize || 0);
      }
      if (sortBy === 'smallest') {
        return (a.fileSize || 0) - (b.fileSize || 0);
      }
      if (sortBy === 'most_used') {
        const uA = getMediaUsages(a.id, activeStore.id).length;
        const uB = getMediaUsages(b.id, activeStore.id).length;
        return uB - uA;
      }
      if (sortBy === 'name') {
        return a.fileName.localeCompare(b.fileName);
      }
      return 0;
    });

    return list;
  }, [
    currentMedia,
    selectedType,
    selectedFolder,
    showOnlyUnused,
    searchQuery,
    sortBy,
    getMediaUsages,
    activeStore.id,
  ]);

  // Upload handler with client-side WebP compression & poster generation
  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newQueueItems = fileArray.map((file, idx) => ({
      id: `queue-${Date.now()}-${idx}`,
      name: file.name,
      size: file.size,
      progress: 30,
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
                        : 'WebP',
                    thumb: optimizedResult.thumbnailDataUrl,
                  }
                : item,
            ),
          );

          const newAsset = addMediaAsset({
            fileName: file.name,
            title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            fileType: type,
            mimeType: file.type || 'image/jpeg',
            fileSize: optimizedResult.compressedSize,
            width: optimizedResult.width,
            height: optimizedResult.height,
            originalUrl: optimizedResult.dataUrl,
            optimizedUrl: optimizedResult.webpUrl,
            webpUrl: optimizedResult.webpUrl,
            thumbnailUrl: optimizedResult.thumbnailDataUrl,
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

          setSelectedAsset(newAsset);
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

          setSelectedAsset(newAsset);
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
        ? 'تم رفع وتحسين ملفات الوسائط بنجاح'
        : 'Media files uploaded & optimized successfully',
      'success',
    );
  };

  // Google Drive Import
  const handleGoogleDriveImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdriveUrl.trim()) return;

    setGdriveLoading(true);
    const parsed = parseGoogleDriveUrl(gdriveUrl);

    setTimeout(() => {
      setGdriveLoading(false);
      setIsGdriveModalOpen(false);
      const urlToUse = parsed.directUrl || gdriveUrl.trim();
      const fileName =
        gdriveName.trim() ||
        (parsed.fileId ? `gdrive-file-${parsed.fileId.slice(0, 8)}.jpg` : 'gdrive-media.jpg');

      const newAsset = addMediaAsset({
        fileName,
        title: gdriveName.trim() || 'Imported Google Drive Media',
        fileType: gdriveType,
        mimeType: gdriveType === 'video' ? 'video/mp4' : 'image/jpeg',
        fileSize: 1024 * 380,
        width: 1200,
        height: 1200,
        originalUrl: urlToUse,
        optimizedUrl: urlToUse,
        webpUrl: urlToUse,
        thumbnailUrl: parsed.thumbnailUrl || urlToUse,
        folder: gdriveFolder,
        tags: ['gdrive', 'imported'],
        processingStatus: 'ready',
        optimizationStatus: 'optimized',
        source: 'gdrive',
        metadata: {
          gdriveFileId: parsed.fileId,
        },
      });

      setSelectedAsset(newAsset);
      setIsDetailsOpen(true);
      setGdriveUrl('');
      setGdriveName('');

      toast(
        isAr
          ? 'تم استيراد الملف من Google Drive وحفظه في المكتبة'
          : 'File imported from Google Drive & ready for use across store',
        'success',
      );
    }, 500);
  };

  // Replace Asset Flow
  const handleTriggerReplace = (asset: MediaAsset) => {
    setReplaceTargetAsset(asset);
    replaceInputRef.current?.click();
  };

  const handleExecuteReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replaceTargetAsset) return;

    const type = detectMediaType(file.type, file.name);

    if (type === 'image') {
      const opt = await optimizeImageFile(file);
      replaceMediaAsset(replaceTargetAsset.id, {
        url: opt.dataUrl,
        optimizedUrl: opt.webpUrl,
        webpUrl: opt.webpUrl,
        thumbnailUrl: opt.thumbnailDataUrl,
        fileName: file.name,
        fileSize: opt.compressedSize,
        width: opt.width,
        height: opt.height,
        mimeType: file.type || 'image/jpeg',
        fileType: 'image',
      });
    } else {
      const dataUrl = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = (ev) => res(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
      replaceMediaAsset(replaceTargetAsset.id, {
        url: dataUrl,
        optimizedUrl: dataUrl,
        thumbnailUrl: dataUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'video/mp4',
        fileType: type,
      });
    }

    toast(
      isAr
        ? 'تم استبدال الملف وتحديث جميع مواضع الاستخدام مع تفريغ الكاش القديم فورا!'
        : 'Media replaced successfully! All product/banner references updated with 0ms cache refresh.',
      'success',
    );
    setReplaceTargetAsset(null);
  };

  // Delete with protection check
  const handleRequestDelete = (asset: MediaAsset) => {
    const usages = getMediaUsages(asset.id, activeStore.id);
    setDeleteTargetAsset(asset);
    setDeleteUsages(usages);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetAsset) return;
    deleteMediaAsset(deleteTargetAsset.id);
    setIsDeleteModalOpen(false);
    if (selectedAsset?.id === deleteTargetAsset.id) {
      setSelectedAsset(null);
      setIsDetailsOpen(false);
    }
    toast(
      isAr ? 'تم حذف الملف من مكتبة الوسائط' : 'Media asset deleted from library',
      'info',
    );
    setDeleteTargetAsset(null);
  };

  // Quick Copy Helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast(isAr ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard', 'success');
  };

  return (
    <div
      className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto min-w-0"
      style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
    >
      {/* ── Hidden file input for Replace ── */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*,video/mp4,video/webm,.gif,.svg"
        className="hidden"
        onChange={handleExecuteReplace}
      />
      <input
        ref={mainFileInputRef}
        type="file"
        multiple
        accept="image/*,video/mp4,video/webm,.gif,.svg"
        className="hidden"
        onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
      />

      {/* ── Page Header ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl unity-icon-box text-white flex items-center justify-center shadow-xs">
              <ImageIcon className="w-4 h-4" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isAr ? 'مكتبة الوسائط' : 'Media Library'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
            {isAr
              ? `إدارة مركزية لجميع صور، بانرات، شعار، وفيديوهات متجر ${activeStore.nameAr || activeStore.name} مع تحسين تلقائي للسرعة وحماية من الحذف.`
              : `Centralized media management for ${activeStore.nameEn || activeStore.name} — WebP optimization, Google Drive import, used-by tracking, and zero-stale cache.`}
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsGdriveModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          >
            <HardDrive className="w-4 h-4 text-emerald-500" />
            <span>Google Drive</span>
          </button>

          <button
            type="button"
            onClick={() => mainFileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 cursor-pointer transition-all hover:opacity-90 unity-btn-primary"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isAr ? 'رفع وسائط جديدة' : 'Upload Media'}</span>
          </button>
        </div>
      </div>

      {/* ── Storage & Insights Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div
          className="p-4 rounded-2xl border shadow-xs space-y-1"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between text-muted text-[11px] font-bold">
            <span>{isAr ? 'إجمالي الملفات' : 'Total Assets'}</span>
            <Layers className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-black">{stats.totalCount}</div>
        </div>

        <div
          className="p-4 rounded-2xl border shadow-xs space-y-1"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between text-muted text-[11px] font-bold">
            <span>{isAr ? 'المساحة المستخدمة' : 'Storage Used'}</span>
            <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-black font-mono">{formatBytes(stats.totalBytes)}</div>
        </div>

        <div
          className="p-4 rounded-2xl border shadow-xs space-y-1"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between text-muted text-[11px] font-bold">
            <span>{isAr ? 'الصور العادية' : 'Optimized Images'}</span>
            <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black">{stats.imagesCount}</div>
        </div>

        <div
          className="p-4 rounded-2xl border shadow-xs space-y-1"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between text-muted text-[11px] font-bold">
            <span>{isAr ? 'فيديوهات' : 'Videos'}</span>
            <Film className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black">{stats.videosCount}</div>
        </div>

        <div
          className="p-4 rounded-2xl border shadow-xs space-y-1"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between text-muted text-[11px] font-bold">
            <span>{isAr ? 'صور متحركة' : 'GIFs'}</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-xl font-black">{stats.gifsCount}</div>
        </div>

        <div
          onClick={() => setShowOnlyUnused((v) => !v)}
          className={`p-4 rounded-2xl border shadow-xs space-y-1 cursor-pointer transition-all ${
            showOnlyUnused ? 'ring-2 ring-amber-500 bg-amber-500/10' : ''
          }`}
          style={{
            background: showOnlyUnused ? undefined : 'var(--surface)',
            borderColor: showOnlyUnused ? 'var(--accent)' : 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between text-muted text-[11px] font-bold">
            <span>{isAr ? 'غير مستخدمة' : 'Unused Assets'}</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-500">{stats.unusedCount}</div>
        </div>
      </div>

      {/* ── Drag & Drop Fast Upload Banner ── */}
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
            handleUploadFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => mainFileInputRef.current?.click()}
        className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-[1.005]'
            : 'border-slate-300 dark:border-slate-800 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900/30'
        }`}
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="text-center sm:text-start">
            <div className="font-extrabold text-sm" style={{ color: 'var(--text)' }}>
              {isAr ? 'اسحب الصور والفيديوهات هنا للرفع الفوري والتحسين التلقائي' : 'Drag & drop images, GIFs or videos here to upload and optimize'}
            </div>
            <p className="text-[11px] text-muted mt-0.5">
              {isAr
                ? 'تحويل فوري إلى WebP عالي الكفاءة، تقليل الحجم حتى 60% بدون فقدان الجودة، واستخراج صور الغلاف للفيديو.'
                : 'Auto WebP generation, loss-free compression, video thumbnail extraction, and instant CDN caching.'}
            </p>
          </div>
          <button
            type="button"
            className="sm:ms-auto px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white shrink-0 shadow-xs"
          >
            {isAr ? 'تصفح الملفات' : 'Browse Files'}
          </button>
        </div>
      </div>

      {/* ── Filters, Search & Sort Control Strip ── */}
      <div
        className="p-4 rounded-2xl border shadow-xs flex flex-wrap items-center justify-between gap-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search
            className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--muted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? 'بحث بالاسم، الوسم، النص البديل...'
                : 'Search by file name, tag, alt text...'
            }
            className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border focus:outline-none"
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--input-fg)',
            }}
          />
        </div>

        {/* Media Type Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
          {(['all', 'image', 'video', 'gif'] as const).map((tId) => (
            <button
              key={tId}
              type="button"
              onClick={() => setSelectedType(tId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === tId
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-muted hover:text-white'
              }`}
            >
              {tId === 'all'
                ? isAr
                  ? 'الكل'
                  : 'All'
                : tId === 'image'
                  ? isAr
                    ? 'صور'
                    : 'Images'
                  : tId === 'video'
                    ? isAr
                      ? 'فيديو'
                      : 'Videos'
                    : 'GIFs'}
            </button>
          ))}
        </div>

        {/* Folder Selector */}
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="px-3 py-2 text-xs font-bold rounded-xl border focus:outline-none cursor-pointer"
          style={{
            background: 'var(--input-bg)',
            borderColor: 'var(--border)',
            color: 'var(--input-fg)',
          }}
        >
          <option value="all">{isAr ? 'جميع الأقسام' : 'All Folders'}</option>
          <option value="products">{isAr ? 'المنتجات' : 'Products'}</option>
          <option value="banners">{isAr ? 'البانرات والعروض' : 'Banners'}</option>
          <option value="categories">{isAr ? 'التصنيفات' : 'Categories'}</option>
          <option value="branding">{isAr ? 'الهوية والشعار' : 'Branding'}</option>
          <option value="marketing">{isAr ? 'التسويق والفيديو' : 'Marketing'}</option>
          <option value="general">{isAr ? 'ملفات عامة' : 'General'}</option>
        </select>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 text-xs font-bold rounded-xl border focus:outline-none cursor-pointer"
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--input-fg)',
            }}
          >
            <option value="newest">{isAr ? 'الأحدث أولاً' : 'Newest'}</option>
            <option value="oldest">{isAr ? 'الأقدم أولاً' : 'Oldest'}</option>
            <option value="largest">{isAr ? 'الأكبر حجماً' : 'Largest size'}</option>
            <option value="smallest">{isAr ? 'الأصغر حجماً' : 'Smallest size'}</option>
            <option value="most_used">{isAr ? 'الأكثر استخداماً' : 'Most used'}</option>
            <option value="name">{isAr ? 'أبجدياً' : 'Alphabetical'}</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg cursor-pointer ${
                viewMode === 'grid' ? 'bg-slate-200 dark:bg-slate-700' : 'opacity-60 hover:opacity-100'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg cursor-pointer ${
                viewMode === 'list' ? 'bg-slate-200 dark:bg-slate-700' : 'opacity-60 hover:opacity-100'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Media Content Area ── */}
      {processedMedia.length === 0 ? (
        <div
          className="p-12 rounded-3xl border text-center space-y-3"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="font-black text-base" style={{ color: 'var(--text)' }}>
            {isAr ? 'لم يتم العثور على أي وسائط مطابقة' : 'No matching media assets found'}
          </h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            {isAr
              ? 'جرّب تغيير خيارات البحث أو الفلتر، أو قم برفع وسائط جديدة بالضغط على زر الرفع.'
              : 'Try clearing your search terms or filters, or upload new files to your store library.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {processedMedia.map((asset) => {
            const usages = getMediaUsages(asset.id, activeStore.id);
            const isSelected = selectedAsset?.id === asset.id;

            return (
              <div
                key={asset.id}
                onClick={() => {
                  setSelectedAsset(asset);
                  setIsDetailsOpen(true);
                }}
                className={`group rounded-2xl border overflow-hidden transition-all duration-200 cursor-pointer flex flex-col shadow-2xs hover:shadow-md ${
                  isSelected
                    ? 'ring-2 ring-blue-500 border-blue-500 scale-[0.99]'
                    : 'hover:border-slate-400 dark:hover:border-slate-600'
                }`}
                style={{
                  background: 'var(--surface)',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {/* Thumbnail */}
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
                        <div className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg">
                          <Film className="w-5 h-5 text-blue-600" />
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

                  {/* Badges */}
                  <span className="absolute top-2.5 start-2.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-black/70 backdrop-blur-xs text-white">
                    {asset.fileType}
                  </span>

                  {/* Usage Badge */}
                  {usages.length > 0 ? (
                    <span className="absolute top-2.5 end-2.5 px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-600/90 text-white shadow-xs">
                      {usages.length} {isAr ? 'موضع' : 'used'}
                    </span>
                  ) : (
                    <span className="absolute top-2.5 end-2.5 px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/90 text-slate-950 shadow-xs">
                      {isAr ? 'غير مستخدم' : 'Unused'}
                    </span>
                  )}

                  {/* Quick Action Overlay Buttons */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTriggerReplace(asset);
                      }}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white text-white hover:text-slate-900 transition-colors shadow-xs"
                      title={isAr ? 'استبدال الملف' : 'Replace Media'}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(asset.originalUrl, `url-${asset.id}`);
                      }}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white text-white hover:text-slate-900 transition-colors shadow-xs"
                      title={isAr ? 'نسخ الرابط' : 'Copy URL'}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestDelete(asset);
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white transition-colors shadow-xs"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Meta details */}
                <div className="p-3 space-y-1">
                  <h4 className="text-xs font-bold truncate leading-tight" title={asset.fileName}>
                    {asset.title || asset.fileName}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-muted">
                    <span>{formatBytes(asset.fileSize)}</span>
                    {asset.width && asset.height && (
                      <span className="font-mono">
                        {asset.width}×{asset.height}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div
          className="rounded-2xl border overflow-hidden shadow-xs"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-b text-muted font-bold" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <th className="py-3 px-4 text-start">{isAr ? 'الملف' : 'Asset'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'النوع' : 'Type'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'الأبعاد والحجم' : 'Dimensions & Size'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'المواضع المستخدمة' : 'Used In'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'تاريخ الرفع' : 'Uploaded'}</th>
                  <th className="py-3 px-4 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {processedMedia.map((asset) => {
                  const usages = getMediaUsages(asset.id, activeStore.id);

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => {
                        setSelectedAsset(asset);
                        setIsDetailsOpen(true);
                      }}
                      className="border-b transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl border overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
                            {asset.fileType === 'video' ? (
                              <Film className="w-5 h-5 text-blue-500" />
                            ) : (
                              <img
                                src={asset.thumbnailUrl || asset.originalUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-bold truncate text-xs">{asset.title || asset.fileName}</p>
                            <p className="text-[10px] text-muted font-mono truncate">{asset.fileName}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800">
                          {asset.fileType}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] font-semibold">
                          {asset.width && asset.height ? `${asset.width} × ${asset.height} px` : '—'}
                        </div>
                        <div className="text-[10px] text-muted">{formatBytes(asset.fileSize)}</div>
                      </td>

                      <td className="py-3 px-4">
                        {usages.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                            {usages.length} {isAr ? 'عنصر' : 'items'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-muted">
                            {isAr ? 'غير مستخدم' : 'Unused'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-muted text-[11px]">
                        {new Date(asset.uploadDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                      </td>

                      <td className="py-3 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleTriggerReplace(asset)}
                            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            style={{ borderColor: 'var(--border)' }}
                            title="Replace"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(asset.originalUrl, `url-${asset.id}`)}
                            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            style={{ borderColor: 'var(--border)' }}
                            title="Copy URL"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestDelete(asset)}
                            className="p-1.5 rounded-lg border text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            style={{ borderColor: 'var(--border)' }}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Slide-Over Asset Details & SEO Inspector Drawer ── */}
      {isDetailsOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg h-full bg-white dark:bg-slate-900 border-s shadow-2xl p-6 overflow-y-auto custom-scroll space-y-6 flex flex-col justify-between"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="space-y-6">
              {/* Drawer Top Bar */}
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  <h3 className="font-black text-base">
                    {isAr ? 'تفاصيل ومعلومات الوسائط' : 'Media Asset Details'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(false)}
                  className="p-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Media Preview Box */}
              <div
                className="relative rounded-2xl border overflow-hidden aspect-video bg-slate-950 flex items-center justify-center shadow-inner"
                style={{ borderColor: 'var(--border)' }}
              >
                {selectedAsset.fileType === 'video' ? (
                  <video
                    src={selectedAsset.originalUrl}
                    poster={selectedAsset.posterUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={selectedAsset.originalUrl}
                    alt={selectedAsset.altText || selectedAsset.fileName}
                    className="w-full h-full object-contain p-2"
                  />
                )}
              </div>

              {/* Technical Metadata Strip */}
              <div
                className="p-4 rounded-2xl border space-y-2 text-xs"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-muted">{isAr ? 'اسم الملف' : 'File Name'}</span>
                  <span className="font-bold truncate max-w-[200px]" title={selectedAsset.fileName}>
                    {selectedAsset.fileName}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-muted">{isAr ? 'نوع الملف' : 'MIME Type'}</span>
                  <span className="font-mono">{selectedAsset.mimeType}</span>
                </div>

                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-muted">{isAr ? 'الحجم' : 'File Size'}</span>
                  <span className="font-mono font-bold">{formatBytes(selectedAsset.fileSize)}</span>
                </div>

                {selectedAsset.width && selectedAsset.height && (
                  <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-muted">{isAr ? 'الأبعاد' : 'Dimensions'}</span>
                    <span className="font-mono font-bold">
                      {selectedAsset.width} × {selectedAsset.height} px
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-muted">{isAr ? 'حالة التحسين' : 'Optimization'}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-500 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>WebP Ready (v{selectedAsset.version || 1})</span>
                  </span>
                </div>

                <div className="flex justify-between py-1" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-muted">{isAr ? 'تاريخ الإضافة' : 'Uploaded At'}</span>
                  <span>{new Date(selectedAsset.uploadDate).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}</span>
                </div>
              </div>

              {/* Copy Links & Code Snippets */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-muted block">
                  {isAr ? 'نسخ الروابط والأكواد' : 'Quick Copy & Embed Snippets'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedAsset.originalUrl, 'orig-url')}
                    className="p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors truncate"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                    <span>{copiedKey === 'orig-url' ? (isAr ? 'تم!' : 'Copied!') : isAr ? 'رابط الملف' : 'Copy URL'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `![${selectedAsset.altText || selectedAsset.fileName}](${selectedAsset.originalUrl})`,
                        'md-snippet',
                      )
                    }
                    className="p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors truncate"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <Code className="w-3.5 h-3.5 shrink-0" />
                    <span>{copiedKey === 'md-snippet' ? (isAr ? 'تم!' : 'Copied!') : 'Markdown'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        selectedAsset.fileType === 'video'
                          ? `<video src="${selectedAsset.originalUrl}" ${selectedAsset.posterUrl ? `poster="${selectedAsset.posterUrl}" ` : ''}controls preload="metadata"></video>`
                          : `<img src="${selectedAsset.optimizedUrl || selectedAsset.webpUrl || selectedAsset.originalUrl}" alt="${selectedAsset.altText || selectedAsset.fileName}" loading="lazy" />`,
                        'html-snippet',
                      )
                    }
                    className="p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors truncate"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <Code className="w-3.5 h-3.5 shrink-0" />
                    <span>{copiedKey === 'html-snippet' ? (isAr ? 'تم!' : 'Copied!') : 'HTML'}</span>
                  </button>
                </div>
              </div>

              {/* Editable SEO Fields */}
              <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[10px] font-bold uppercase text-muted block">
                  {isAr ? 'تحسين محركات البحث SEO والنص البديل' : 'SEO Metadata & Alt Text'}
                </span>

                <div className="space-y-1">
                  <label className="text-xs font-bold block">{isAr ? 'عنوان الملف' : 'Title'}</label>
                  <input
                    type="text"
                    value={selectedAsset.title || ''}
                    onChange={(e) => updateMediaAsset(selectedAsset.id, { title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold block">{isAr ? 'النص البديل (Alt Text للـ SEO)' : 'Alt Text (SEO)'}</label>
                  <input
                    type="text"
                    value={selectedAsset.altText || ''}
                    onChange={(e) => updateMediaAsset(selectedAsset.id, { altText: e.target.value })}
                    placeholder="Describes the image for Google & screen readers"
                    className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold block">{isAr ? 'الوصف / التسمية التوضيحية' : 'Caption'}</label>
                  <textarea
                    rows={2}
                    value={selectedAsset.caption || ''}
                    onChange={(e) => updateMediaAsset(selectedAsset.id, { caption: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none resize-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>
              </div>

              {/* "Used By" Tracking List */}
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[10px] font-bold uppercase text-muted block">
                  {isAr ? 'مواضع الاستخدام في المتجر (Used By)' : 'Active Store References (Used By)'}
                </span>

                {(() => {
                  const usages = getMediaUsages(selectedAsset.id, activeStore.id);
                  if (usages.length === 0) {
                    return (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold">
                        {isAr
                          ? 'هذا الملف غير مستخدم حالياً في أي منتج أو قسم. يمكنك حذفه بأمان.'
                          : 'This media is not currently linked to any product or banner. Safe to delete.'}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1.5">
                      {usages.map((u) => (
                        <div
                          key={u.id}
                          className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                        >
                          <div className="flex items-center gap-2">
                            <Boxes className="w-4 h-4 text-blue-500" />
                            <span className="font-bold">{u.label}</span>
                          </div>
                          <span className="text-[10px] text-muted">{u.referenceName}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t flex items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => handleTriggerReplace(selectedAsset)}
                className="px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                <span>{isAr ? 'استبدال الملف' : 'Replace Media'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRequestDelete(selectedAsset)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'حذف' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Google Drive Import Modal ── */}
      {isGdriveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-2xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-3xl border shadow-2xl p-6 space-y-5"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shadow-xs">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    {isAr ? 'استيراد وسائط من Google Drive' : 'Google Drive Media Import'}
                  </h3>
                  <p className="text-[11px] text-muted">
                    {isAr ? 'الصق رابط المشاركة المباشر لحفظه وتحسينه' : 'Paste share link to optimize and store in library'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGdriveModalOpen(false)}
                className="p-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGoogleDriveImport} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold block">
                  {isAr ? 'رابط ملف Google Drive' : 'Google Drive Share Link'} *
                </label>
                <input
                  type="url"
                  required
                  value={gdriveUrl}
                  onChange={(e) => setGdriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold block">{isAr ? 'عنوان الملف' : 'Asset Title'}</label>
                  <input
                    type="text"
                    value={gdriveName}
                    onChange={(e) => setGdriveName(e.target.value)}
                    placeholder="e.g. Campaign Banner"
                    className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold block">{isAr ? 'المجلد' : 'Folder'}</label>
                  <select
                    value={gdriveFolder}
                    onChange={(e) => setGdriveFolder(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none cursor-pointer"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  >
                    <option value="general">{isAr ? 'عام' : 'General'}</option>
                    <option value="products">{isAr ? 'المنتجات' : 'Products'}</option>
                    <option value="banners">{isAr ? 'البانرات' : 'Banners'}</option>
                    <option value="marketing">{isAr ? 'التسويق' : 'Marketing'}</option>
                  </select>
                </div>
              </div>

              {/* Quick Sample Links */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-muted uppercase block">
                  {isAr ? 'أمثلة تجريبية سريعة:' : 'Quick Demo Samples:'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGdriveUrl('https://drive.google.com/file/d/1Flower_Rose_Luxury_Box_2026/view');
                      setGdriveName('Rose Luxury Box Hero');
                    }}
                    className="px-2 py-1 rounded-lg text-[10px] font-semibold border hover:bg-slate-100 dark:hover:bg-slate-800"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    Luxury Rose Box
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGdriveUrl('https://drive.google.com/file/d/1Promo_Video_Reel_4k/view');
                      setGdriveName('Store Reel 4K');
                      setGdriveType('video');
                    }}
                    className="px-2 py-1 rounded-lg text-[10px] font-semibold border hover:bg-slate-100 dark:hover:bg-slate-800"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    Video Reel Sample
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setIsGdriveModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={gdriveLoading || !gdriveUrl.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
                >
                  {gdriveLoading ? (
                    <span>{isAr ? 'جارٍ الاستيراد…' : 'Importing…'}</span>
                  ) : (
                    <>
                      <HardDrive className="w-4 h-4" />
                      <span>{isAr ? 'استيراد وحفظ' : 'Import Asset'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Protection Warning Modal ── */}
      {isDeleteModalOpen && deleteTargetAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-2xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-base text-rose-600">
                  {isAr ? 'تأكيد حذف ملف الوسائط' : 'Delete Media Confirmation'}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {isAr
                    ? `هل أنت متأكد من حذف "${deleteTargetAsset.fileName}"؟`
                    : `Are you sure you want to permanently delete "${deleteTargetAsset.fileName}"?`}
                </p>
              </div>
            </div>

            {/* If the media is currently used in products/categories/banners */}
            {deleteUsages.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-rose-600">
                  <ShieldAlert className="w-4 h-4" />
                  <span>
                    {isAr
                      ? `تنبيه: هذا الملف مستخدم حالياً في ${deleteUsages.length} موضع في متجرك!`
                      : `Warning: This media is currently in use by ${deleteUsages.length} item(s)!`}
                  </span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto custom-scroll text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                  {deleteUsages.map((u) => (
                    <div key={u.id} className="flex items-center gap-1.5">
                      <span>•</span>
                      <span>{u.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted">
                  {isAr
                    ? 'حذفه سيؤدي إلى ظهور صورة مفقودة في هذه الأقسام ما لم تقم باستبدالها أولاً.'
                    : 'Deleting it will cause broken image links in these sections unless replaced.'}
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md cursor-pointer"
              >
                {isAr ? 'نعم، حذف نهائي' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
