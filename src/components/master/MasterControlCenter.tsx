import React, { useState, useMemo, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { MasterAdvanceFeaturesCard } from './MasterAdvanceFeaturesCard';
import {
  CONTROL_DEFINITIONS,
  type ControlCategory,
  type ControlItemDefinition,
  getGlobalControls,
  getStoreControls,
  updateSingleStoreControl,
  setAllControlsState,
  setCategoryControlsState,
  resetStoreControlsToDefaults,
  applyControlsToAllStores,
  copyStoreControls,
  exportControlsAsJson,
  importControlsFromJson,
} from '../../services/storeControlService';
import {
  getStudioQuota,
  masterApproveStudioPro,
  saveStudioQuota,
  getStoreAdWallet,
  masterApproveAdWalletTopUp,
  saveStoreAdWallet,
  getStoreSocialSchedule,
  saveStoreSocialSchedule,
  getStoreWhatsAppQuota,
  saveStoreWhatsAppQuota,
  resetStoreWhatsAppCooldowns,
  getStoreSeoDeepAudit,
  saveStoreSeoDeepAudit,
} from '../../services/ksaAutomationEngine';
import { getStoreDisplayName } from '../../utils/storeLocalization';
import {
  Sliders,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Store,
  Globe,
  Search,
  Filter,
  Layers,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Megaphone,
  ReceiptText,
  Truck,
  CreditCard,
  MessageCircle,
  BarChart3,
  FileText,
  Palette,
  Files,
  BookOpen,
  Sparkles,
  Server,
  Archive,
  ShoppingBag,
  Settings,
  FolderTree,
  Tag,
  Image as ImageIcon,
  Coins,
  Award,
  RefreshCw,
  RotateCcw as RotateCcwIcon,
  Headphones,
  Clock,
  Zap,
  AlertCircle,
  Star,
  Mail,
  ShieldCheck,
  Share2,
  ArrowUp,
  Download,
  Upload,
  Copy,
  ChevronDown,
  Info,
  Check,
  X,
  Lock,
} from 'lucide-react';

// Icon resolver helper
const renderIcon = (name: string, className = 'w-5 h-5') => {
  switch (name) {
    case 'LayoutDashboard': return <LayoutDashboard className={className} />;
    case 'ShoppingCart': return <ShoppingCart className={className} />;
    case 'Package': return <Package className={className} />;
    case 'Users': return <Users className={className} />;
    case 'Megaphone': return <Megaphone className={className} />;
    case 'ReceiptText': return <ReceiptText className={className} />;
    case 'Truck': return <Truck className={className} />;
    case 'CreditCard': return <CreditCard className={className} />;
    case 'MessageCircle': return <MessageCircle className={className} />;
    case 'BarChart3': return <BarChart3 className={className} />;
    case 'FileText': return <FileText className={className} />;
    case 'Search': return <Search className={className} />;
    case 'Palette': return <Palette className={className} />;
    case 'Files': return <Files className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Server': return <Server className={className} />;
    case 'Archive': return <Archive className={className} />;
    case 'ShoppingBag': return <ShoppingBag className={className} />;
    case 'Settings': return <Settings className={className} />;
    case 'FolderTree': return <FolderTree className={className} />;
    case 'Tag': return <Tag className={className} />;
    case 'ImageIcon': return <ImageIcon className={className} />;
    case 'Coins': return <Coins className={className} />;
    case 'Award': return <Award className={className} />;
    case 'RefreshCw': return <RefreshCw className={className} />;
    case 'RotateCcw': return <RotateCcwIcon className={className} />;
    case 'Globe': return <Globe className={className} />;
    case 'Headphones': return <Headphones className={className} />;
    case 'Sliders': return <Sliders className={className} />;
    case 'Clock': return <Clock className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'AlertCircle': return <AlertCircle className={className} />;
    case 'Star': return <Star className={className} />;
    case 'Mail': return <Mail className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'Share2': return <Share2 className={className} />;
    case 'ArrowUp': return <ArrowUp className={className} />;
    default: return <SlidersHorizontal className={className} />;
  }
};

type ViewFilterCategory = 'all' | ControlCategory;
type StatusFilter = 'all' | 'active' | 'disabled';

export const MasterControlCenter: React.FC = () => {
  const { stores, seoConfigs, updateStoreSEOConfig } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  // Store selection: 'ALL' represents global synchronized SaaS mode, or specific store id
  const [selectedStoreId, setSelectedStoreId] = useState<string>('ALL');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ViewFilterCategory>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Local control state for selected target
  const [controls, setControls] = useState<Record<string, boolean>>(() => {
    return selectedStoreId === 'ALL' ? getGlobalControls() : getStoreControls(selectedStoreId);
  });

  // Modal / Confirm States
  const [showApplyAllModal, setShowApplyAllModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [quotaRefreshTick, setQuotaRefreshTick] = useState(0);
  const [copySourceStoreId, setCopySourceStoreId] = useState<string>(stores[0]?.id || '');
  const [showCopyModal, setShowCopyModal] = useState(false);

  // Sync state whenever selectedStoreId changes
  useEffect(() => {
    const current = selectedStoreId === 'ALL' ? getGlobalControls() : getStoreControls(selectedStoreId);
    setControls(current);
  }, [selectedStoreId]);

  // Listen to cross-component or cross-tab control update events
  useEffect(() => {
    const handleControlsChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ storeId: string; controls: Record<string, boolean> }>;
      if (customEvent.detail) {
        if (customEvent.detail.storeId === selectedStoreId || (selectedStoreId === 'ALL' && customEvent.detail.storeId === 'ALL')) {
          setControls({ ...customEvent.detail.controls });
        }
      }
    };
    window.addEventListener('unityteck-store-controls-changed', handleControlsChanged);
    return () => {
      window.removeEventListener('unityteck-store-controls-changed', handleControlsChanged);
    };
  }, [selectedStoreId]);

  // Current Target Display Information
  const currentTargetName = useMemo(() => {
    if (selectedStoreId === 'ALL') {
      return isAr ? 'كافة المتاجر (الوضع العام الموحد)' : 'All Stores (Global Synchronized SaaS Mode)';
    }
    const st = stores.find((s) => s.id === selectedStoreId);
    return st ? getStoreDisplayName(st, locale) : selectedStoreId;
  }, [selectedStoreId, stores, isAr, locale]);

  // Handle single toggle toggle
  const handleToggle = (item: ControlItemDefinition) => {
    const nextVal = !controls[item.id];
    const updated = { ...controls, [item.id]: nextVal };
    setControls(updated);
    updateSingleStoreControl(selectedStoreId, item.id, nextVal);

    toast(
      isAr
        ? `تم ${nextVal ? 'تفعيل' : 'تعطيل'} "${item.nameAr}" لـ ${currentTargetName}`
        : `${nextVal ? 'Enabled' : 'Disabled'} "${item.nameEn}" for ${currentTargetName}`,
      nextVal ? 'success' : 'info'
    );
  };

  // Turn all ON
  const handleEnableAll = () => {
    setAllControlsState(selectedStoreId, true);
    const updated: Record<string, boolean> = {};
    for (const def of CONTROL_DEFINITIONS) {
      updated[def.id] = true;
    }
    setControls(updated);
    toast(
      isAr
        ? `تم تفعيل كافة الصفحات والمكونات (${CONTROL_DEFINITIONS.length}) بنجاح`
        : `All ${CONTROL_DEFINITIONS.length} pages & components enabled successfully`,
      'success'
    );
  };

  // Turn all OFF
  const handleDisableAll = () => {
    setAllControlsState(selectedStoreId, false);
    const updated: Record<string, boolean> = {};
    for (const def of CONTROL_DEFINITIONS) {
      updated[def.id] = false;
    }
    setControls(updated);
    toast(
      isAr
        ? `تم تعطيل كافة الصفحات والمكونات لـ ${currentTargetName}`
        : `All pages & components disabled for ${currentTargetName}`,
      'warning'
    );
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    resetStoreControlsToDefaults(selectedStoreId);
    const defaults = selectedStoreId === 'ALL' ? getGlobalControls() : getStoreControls(selectedStoreId);
    setControls(defaults);
    toast(
      isAr
        ? 'تمت استعادة الإعدادات الافتراضية الموصى بها بنجاح'
        : 'Recommended SaaS presets restored successfully',
      'success'
    );
  };

  // Apply to all stores
  const handleApplyToAllStoresConfirm = () => {
    applyControlsToAllStores(controls, stores);
    setShowApplyAllModal(false);
    toast(
      isAr
        ? `تم تعميم ونشر هذه الإعدادات بنجاح على جميع المتاجر (${stores.length})`
        : `Settings successfully synchronized across all ${stores.length} active stores`,
      'success'
    );
  };

  // Bulk category toggle
  const handleCategoryToggle = (category: ControlCategory, enable: boolean) => {
    setCategoryControlsState(selectedStoreId, category, enable);
    const updated = { ...controls };
    const catItems = CONTROL_DEFINITIONS.filter((item) => item.category === category);
    for (const item of catItems) {
      updated[item.id] = enable;
    }
    setControls(updated);
    toast(
      isAr
        ? `تم ${enable ? 'تفعيل' : 'تعطيل'} جميع عناصر هذه الفئة`
        : `Category items ${enable ? 'enabled' : 'disabled'}`,
      'success'
    );
  };

  // Copy from store
  const handleCopyFromStore = () => {
    if (!copySourceStoreId || copySourceStoreId === selectedStoreId) return;
    copyStoreControls(copySourceStoreId, selectedStoreId);
    const copied = getStoreControls(selectedStoreId);
    setControls(copied);
    setShowCopyModal(false);
    toast(
      isAr
        ? 'تم نسخ الإعدادات بنجاح من المتجر المختار'
        : 'Settings copied successfully from source store',
      'success'
    );
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = exportControlsAsJson(selectedStoreId);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unityteck-controls-${selectedStoreId}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast(
      isAr ? 'تم تحميل ملف التكوين JSON' : 'Configuration exported as JSON',
      'info'
    );
  };

  // Import JSON
  const handleImportJson = () => {
    if (!importJsonText.trim()) return;
    const ok = importControlsFromJson(selectedStoreId, importJsonText);
    if (ok) {
      const refreshed = selectedStoreId === 'ALL' ? getGlobalControls() : getStoreControls(selectedStoreId);
      setControls(refreshed);
      setShowImportModal(false);
      setImportJsonText('');
      toast(
        isAr ? 'تم استيراد وتطبيق التكوين بنجاح' : 'Configuration imported successfully',
        'success'
      );
    } else {
      toast(
        isAr ? 'خطأ في تنسيق ملف JSON' : 'Invalid JSON configuration format',
        'error'
      );
    }
  };

  // Filtered Items Calculation
  const filteredItems = useMemo(() => {
    return CONTROL_DEFINITIONS.filter((item) => {
      // Category filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }

      // Status filter
      const isEnabled = Boolean(controls[item.id]);
      if (statusFilter === 'active' && !isEnabled) return false;
      if (statusFilter === 'disabled' && isEnabled) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchEn = item.nameEn.toLowerCase().includes(q) || item.descriptionEn.toLowerCase().includes(q);
        const matchAr = item.nameAr.toLowerCase().includes(q) || item.descriptionAr.toLowerCase().includes(q);
        const matchId = item.id.toLowerCase().includes(q);
        if (!matchEn && !matchAr && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [controls, activeCategory, statusFilter, searchQuery]);

  // Statistics
  const totalCount = CONTROL_DEFINITIONS.length;
  const activeCount = useMemo(() => {
    return CONTROL_DEFINITIONS.filter((item) => Boolean(controls[item.id])).length;
  }, [controls]);
  const disabledCount = totalCount - activeCount;
  const activePercentage = Math.round((activeCount / totalCount) * 100);

  // Grouped by Category for display
  const categoryStats = useMemo(() => {
    const categories: ControlCategory[] = [
      'store_admin_pages',
      'store_admin_subpages',
      'storefront_pages',
      'storefront_elements',
    ];
    return categories.map((cat) => {
      const items = CONTROL_DEFINITIONS.filter((it) => it.category === cat);
      const active = items.filter((it) => Boolean(controls[it.id])).length;
      return {
        category: cat,
        total: items.length,
        active,
        disabled: items.length - active,
      };
    });
  }, [controls]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1560px] mx-auto min-w-0" style={{ color: 'var(--text)' }}>
      {/* ── Top Executive Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6" style={{ borderColor: 'var(--border)' }}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-cyan-600 via-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-500/20">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                  {isAr ? 'مركز التحكم الشامل بالصفحات والعناصر' : 'Central Pages & Elements Control Center'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {isAr ? 'لوحة الماستر الرئيسية' : 'Master Admin Exclusive'}
                </span>
              </div>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'التحكم الفوري بتشغيل أو إيقاف صفحات لوحة التحكم، الصفحات الفرعية، وجميع عناصر واجهة المتجر للمتسوقين (لكل متجر بشكل منفصل أو لكافة المتاجر معاً)'
                  : 'Granular toggles to enable or disable store admin pages, sub-pages, storefront views, and micro-components per individual store or across all stores at once.'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Apply to All */}
          <button
            type="button"
            onClick={() => setShowApplyAllModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title={isAr ? 'تطبيق هذا التكوين على جميع المتاجر' : 'Apply current settings across all stores'}
          >
            <Globe className="w-4 h-4" />
            <span>{isAr ? 'نشر على كافة المتاجر' : 'Apply to All Stores'}</span>
          </button>

          {/* Quick Presets Dropdown */}
          <button
            type="button"
            onClick={handleEnableAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            title={isAr ? 'تفعيل جميع الصفحات والمكونات' : 'Enable all pages & elements'}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{isAr ? 'تفعيل الكل' : 'Enable All'}</span>
          </button>

          <button
            type="button"
            onClick={handleDisableAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
            title={isAr ? 'تعطيل جميع الصفحات والمكونات' : 'Disable all pages & elements'}
          >
            <XCircle className="w-4 h-4" />
            <span>{isAr ? 'تعطيل الكل' : 'Disable All'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            title={isAr ? 'استعادة ضبط المصنع الافتراضي' : 'Reset to default SaaS presets'}
          >
            <RotateCcw className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
          </button>

          {/* Export / Import */}
          <button
            type="button"
            onClick={handleExportJson}
            className="p-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--muted)',
            }}
            title={isAr ? 'تصدير التكوين JSON' : 'Export JSON config'}
            aria-label="Export JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="p-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--muted)',
            }}
            title={isAr ? 'استيراد تكوين JSON' : 'Import JSON config'}
            aria-label="Import JSON"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Controllable Items */}
        <div
          className="p-4 sm:p-5 rounded-2xl border flex items-center justify-between"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
              {isAr ? 'إجمالي العناصر والصفحات' : 'Total Controls'}
            </p>
            <p className="text-2xl sm:text-3xl font-black mt-1" style={{ color: 'var(--text)' }}>
              {totalCount}
            </p>
            <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 mt-0.5 block">
              {isAr ? '4 فئات تشغيلية كاملة' : 'Across 4 Core Tiers'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Active Items */}
        <div
          className="p-4 sm:p-5 rounded-2xl border flex items-center justify-between"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
              {isAr ? 'العناصر المفعلة حالياً' : 'Active Items'}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {activeCount}
              </span>
              <span className="text-xs font-bold text-emerald-600/80 dark:text-emerald-400/80">
                ({activePercentage}%)
              </span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {isAr ? 'متاحة للتشغيل والاستخدام' : 'Enabled & Accessible'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Disabled Items */}
        <div
          className="p-4 sm:p-5 rounded-2xl border flex items-center justify-between"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
              {isAr ? 'المعطلة أو المحجوبة' : 'Disabled Items'}
            </p>
            <p className="text-2xl sm:text-3xl font-black text-rose-500 dark:text-rose-400 mt-1">
              {disabledCount}
            </p>
            <span className="text-[11px] font-semibold text-rose-500/80 dark:text-rose-400/80 mt-0.5 block">
              {isAr ? 'محجوبة عن العرض مؤقتاً' : 'Temporarily Hidden'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-500 dark:text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Current Scope Card */}
        <div
          className="p-4 sm:p-5 rounded-2xl border flex items-center justify-between"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="min-w-0 pr-2">
            <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
              {isAr ? 'نطاق التطبيق الفعّال' : 'Target Scope'}
            </p>
            <p className="text-sm sm:text-base font-black truncate mt-1" style={{ color: 'var(--text)' }}>
              {selectedStoreId === 'ALL'
                ? isAr ? 'جميع المتاجر (مزامنة)' : 'All Stores (Global)'
                : currentTargetName}
            </p>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
              {selectedStoreId === 'ALL'
                ? `${stores.length} ${isAr ? 'متاجر نشطة' : 'Active Stores'}`
                : isAr ? 'تخصيص متجر فردي' : 'Single Store Override'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            {selectedStoreId === 'ALL' ? <Globe className="w-5 h-5" /> : <Store className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* ── STORE SELECTOR & SCOPE CONTROLLER (FILTERS BOTH SERVICE LIMITS & PAGE TOGGLES) ── */}
      <div
        className="p-5 sm:p-6 rounded-3xl border shadow-sm space-y-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight" style={{ color: 'var(--text)' }}>
              {isAr ? 'فلتر المتجر المستهدف للتحكم بالحـدود والسرعة والصفحات' : 'Store Filter: Select Target Store for Limits, Speed & Page Controls'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'اختر "كافة المتاجر" لعرض وضبط جميع المتاجر، أو اختر متجراً محدداً للتحكم الكامل بحدود الذكاء الاصطناعي، واتساب، الإعلانات، الجدولة، و SEO الخاصة به.'
                : 'Select "All Stores" to view all stores, or click a specific store to control its isolated AI Image, WhatsApp, Ads Wallet, Social Scheduling, and SEO limits.'}
            </p>
          </div>

          {selectedStoreId !== 'ALL' && (
            <button
              type="button"
              onClick={() => setShowCopyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              <Copy className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{isAr ? 'نسخ الإعدادات من متجر آخر' : 'Copy From Another Store'}</span>
            </button>
          )}
        </div>

        {/* Segmented Store Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-sidebar-scroll">
          <button
            type="button"
            onClick={() => setSelectedStoreId('ALL')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer border ${
              selectedStoreId === 'ALL'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-md shadow-emerald-600/20'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            style={{
              borderColor: selectedStoreId === 'ALL' ? undefined : 'var(--border)',
              background: selectedStoreId === 'ALL' ? undefined : 'var(--surface-raised, var(--surface))',
            }}
          >
            <Globe className="w-4 h-4" />
            <span>{isAr ? 'كافة المتاجر (عرض شامل)' : 'All Stores (Show All)'}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                selectedStoreId === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {stores.length}
            </span>
          </button>

          {stores.map((st) => {
            const isSelected = selectedStoreId === st.id;
            const displayName = getStoreDisplayName(st, locale);
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStoreId(st.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-600/20'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                style={{
                  borderColor: isSelected ? undefined : 'var(--border)',
                  background: isSelected ? undefined : 'var(--surface-raised, var(--surface))',
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                  style={{ backgroundColor: st.accentColor || '#059669' }}
                >
                  {displayName.charAt(0)}
                </div>
                <span className="truncate max-w-[160px]">{displayName}</span>
                <span className="text-[10px] font-mono opacity-70">({st.slug})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MASTER ADMIN PER-STORE 5-SERVICE LIMITS, TIMERS, SPEED & WALLET GOVERNANCE HUB ── */}
      {/* Advance Functions & Coming Soon Feature Governance */}
      <MasterAdvanceFeaturesCard />

      <div
        className="p-5 sm:p-6 rounded-3xl border shadow-sm space-y-5"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        data-tick={quotaRefreshTick}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">
                {isAr
                  ? 'التحكم الشامل بالحدود اليومية، المؤقتات، السرعة ومحفظة الإعلانات (5 خدمات لكل متجر)'
                  : 'Master Service Limits, Speed, Cooldown Timers & Ad Wallet Control (Per Store)'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'زيادة الحدود اليومية وتصفير المؤقتات فوراً عند الدفع: (1) توليد الصور Canva AI (2) رسائل واتساب 24h (3) إعلانات السعودية (4) جدولة السوشيال ميديا (5) SEO و GTM4.'
                  : 'Increase daily limits, boost speed & reset timers per store: (1) AI Image Studio (2) WhatsApp 24h Msg (3) KSA Ads Wallet (4) Social Auto-Scheduler (5) SEO & GTM4.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setQuotaRefreshTick((t) => t + 1)}
            className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            style={{ borderColor: 'var(--border)' }}
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isAr ? 'تحديث البيانات' : 'Refresh Live Quotas'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {stores
            .filter((st) => selectedStoreId === 'ALL' || st.id === selectedStoreId)
            .map((st) => {
              const displayName = getStoreDisplayName(st, locale);
              const stQuota = getStudioQuota(st.id);
              const stWallet = getStoreAdWallet(st.id);
              const stSocial = getStoreSocialSchedule(st.id, st.slug);
              const stWa = getStoreWhatsAppQuota(st.id);
              const stSeoItems = getStoreSeoDeepAudit(st.id, displayName, st.slug, 12);
              const stSeoHealthyCount = stSeoItems.filter((it) => it.status === 'healthy' || it.status === 'fixed').length;
              const stSeoScore = Math.min(100, Math.round((stSeoHealthyCount / Math.max(1, stSeoItems.length)) * 100));
              const stSeoCfg = seoConfigs[st.id];
              const autoGtmId = `GTM-KSA${st.slug.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}`;
              const autoGa4Id = `G-KSA${st.slug.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase()}`;

              return (
                <div
                  key={st.id}
                  className="p-4 sm:p-5 rounded-3xl border space-y-4"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                >
                  {/* Store Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white"
                        style={{ backgroundColor: st.accentColor || '#059669' }}
                      >
                        {displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-black text-sm sm:text-base">{displayName}</div>
                        <div className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
                          ID: {st.id} · Slug: {st.slug}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          stQuota.isPro
                            ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                            : 'bg-slate-500/15 text-slate-400'
                        }`}
                      >
                        {stQuota.isPro
                          ? isAr ? 'باقة PRO مفعلة' : 'PRO UNLOCKED'
                          : isAr ? 'الباقة المجانية' : 'FREE TIER'}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          masterApproveStudioPro(st.id, Math.max(stQuota.dailyLimit + 30, 50));
                          masterApproveAdWalletTopUp(st.id, stWallet.pendingTopUpSar > 0 ? stWallet.pendingTopUpSar : 1000, 200);
                          saveStoreSocialSchedule(st.id, {
                            ...stSocial,
                            dailyPostLimit: Math.max(stSocial.dailyPostLimit + 20, 25),
                            cooldownHours: 1,
                            postsUsedToday: 0,
                            nextAllowedPostAt: null,
                          });
                          saveStoreWhatsAppQuota(st.id, {
                            ...stWa,
                            dailyMessageLimit: Math.max(stWa.dailyMessageLimit + 50, 100),
                            clientCooldownHours: 12,
                            isProWa: true,
                          });
                          resetStoreWhatsAppCooldowns(st.id);
                          setQuotaRefreshTick((t) => t + 1);
                          toast(
                            isAr
                              ? `تم ترقية كافة الخدمات الـ 5 وزيادة الحدود والسرعة لمتجر ${displayName}!`
                              : `All 5 services upgraded, limits boosted & timers unlocked for ${displayName}!`,
                            'success',
                          );
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 cursor-pointer shadow-sm"
                      >
                        {isAr ? 'ترقية شاملة للخدمات الـ 5 + تصفير المؤقتات' : '1-Click Upgrade All 5 Services & Reset Timers'}
                      </button>
                    </div>
                  </div>

                  {/* 5 Service Controllers Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 text-xs">
                    {/* 1. AI IMAGE STUDIO & BG REMOVER */}
                    <div className="p-3.5 rounded-2xl border space-y-2.5 flex flex-col justify-between" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-amber-500 flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" />
                            {isAr ? '1. توليد الصور Canva AI' : '1. AI Image & BG Studio'}
                          </span>
                          <span className="font-mono font-bold text-[11px]">
                            {stQuota.usedToday}/{stQuota.dailyLimit}
                          </span>
                        </div>
                        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          {isAr ? 'الحد اليومي لإزالة الخلفية وتوليد الصور:' : 'Daily Image & BG Removal Limit:'}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              saveStudioQuota(st.id, { ...stQuota, dailyLimit: Math.max(1, stQuota.dailyLimit - 5) });
                              setQuotaRefreshTick((t) => t + 1);
                            }}
                            className="px-2 py-1 rounded-lg border font-black cursor-pointer"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            -5
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={stQuota.dailyLimit}
                            onChange={(e) => {
                              saveStudioQuota(st.id, { ...stQuota, dailyLimit: Math.max(1, Number(e.target.value) || 3) });
                              setQuotaRefreshTick((t) => t + 1);
                            }}
                            className="w-full px-2 py-1 rounded-lg border text-center font-mono font-black text-xs"
                            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              masterApproveStudioPro(st.id, stQuota.dailyLimit + 10);
                              setQuotaRefreshTick((t) => t + 1);
                              toast(isAr ? 'تم زيادة حد الصور +10' : 'Increased AI Image limit +10', 'success');
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-500 font-black cursor-pointer"
                          >
                            +10
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            masterApproveStudioPro(st.id, Math.max(stQuota.dailyLimit, 50));
                            setQuotaRefreshTick((t) => t + 1);
                            toast(isAr ? 'تم تفعيل Pro وتصفير المؤقت' : 'Unlocked AI Pro & Reset 24h Timer', 'success');
                          }}
                          className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black text-white bg-amber-600 hover:bg-amber-700 cursor-pointer"
                        >
                          {isAr ? 'تفعيل Pro (50/يوم)' : 'Unlock Pro (50/Day)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            saveStudioQuota(st.id, { ...stQuota, usedToday: 0, cooldownUntil: null });
                            setQuotaRefreshTick((t) => t + 1);
                            toast(isAr ? 'تم تصفير مؤقت الصور' : 'AI Studio 24h Timer Reset', 'info');
                          }}
                          className="py-1.5 px-2 rounded-xl text-[11px] font-bold border cursor-pointer"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          {isAr ? 'تصفير' : 'Reset 0s'}
                        </button>
                      </div>
                    </div>

                    {/* 2. WHATSAPP AUTO-MESSAGE & 24H CLIENT COOLDOWN */}
                    <div className="p-3.5 rounded-2xl border space-y-2.5 flex flex-col justify-between" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-emerald-500 flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {isAr ? '2. رسائل واتساب والمؤقت' : '2. WhatsApp & 24h Timer'}
                          </span>
                          <span className="font-mono font-bold text-[11px]">
                            {stWa.messagesSentToday}/{stWa.dailyMessageLimit}
                          </span>
                        </div>
                        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          {isAr ? 'الحد اليومي للرسائل ومؤقت العميل:' : 'Daily Msg Limit & Client Cooldown:'}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            value={stWa.dailyMessageLimit}
                            onChange={(e) => {
                              saveStoreWhatsAppQuota(st.id, {
                                ...stWa,
                                dailyMessageLimit: Math.max(1, Number(e.target.value) || 15),
                              });
                              setQuotaRefreshTick((t) => t + 1);
                            }}
                            className="w-1/2 px-2 py-1 rounded-lg border text-center font-mono font-black text-xs"
                            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          />
                          <select
                            value={stWa.clientCooldownHours}
                            onChange={(e) => {
                              saveStoreWhatsAppQuota(st.id, {
                                ...stWa,
                                clientCooldownHours: Number(e.target.value),
                              });
                              setQuotaRefreshTick((t) => t + 1);
                            }}
                            className="w-1/2 px-1.5 py-1 rounded-lg border font-bold text-[11px]"
                            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          >
                            <option value={24}>{isAr ? 'مؤقت 24 ساعة' : '24h Timer'}</option>
                            <option value={12}>{isAr ? 'مؤقت 12 ساعة' : '12h Timer'}</option>
                            <option value={1}>{isAr ? 'مؤقت 1 ساعة' : '1h Timer'}</option>
                            <option value={0}>{isAr ? 'فوري (بدون مؤقت)' : '0h (Instant)'}</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            saveStoreWhatsAppQuota(st.id, {
                              ...stWa,
                              dailyMessageLimit: stWa.dailyMessageLimit + 50,
                              isProWa: true,
                            });
                            setQuotaRefreshTick((t) => t + 1);
                            toast(isAr ? 'تم زيادة حد واتساب +50 رسالة/يوم' : 'Boosted WhatsApp limit +50/day', 'success');
                          }}
                          className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                        >
                          {isAr ? '+50 رسالة/يوم' : '+50 Msg/Day'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            resetStoreWhatsAppCooldowns(st.id);
                            setQuotaRefreshTick((t) => t + 1);
                            toast(isAr ? 'تم تصفير مؤقت 24h لجميع العملاء' : 'All Client 24h WA Timers Reset', 'info');
                          }}
                          className="py-1.5 px-2 rounded-xl text-[11px] font-bold border cursor-pointer"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          {isAr ? 'تصفير 24h' : 'Reset 24h'}
                        </button>
                      </div>
                    </div>

                    {/* 3. KSA ADS MANAGER & WALLET (GOOGLE / SNAP / TIKTOK / INSTA) */}
                    <div className="p-3.5 rounded-2xl border space-y-2.5 flex flex-col justify-between" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-cyan-500 flex items-center gap-1">
                            <Megaphone className="w-3.5 h-3.5" />
                            {isAr ? '3. محفظة إعلانات السعودية' : '3. KSA Ads & Wallet'}
                          </span>
                          <span className="font-mono font-black text-emerald-500">
                            {stWallet.balanceSar} SAR
                          </span>
                        </div>
                        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          {isAr ? 'الحد اليومي للإنفاق الإعلاني (ر.س/يوم):' : 'Daily Ad Spend Limit (SAR/Day):'}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={10}
                            value={stWallet.dailySpendCapSar}
                            onChange={(e) => {
                              saveStoreAdWallet(st.id, {
                                ...stWallet,
                                dailySpendCapSar: Math.max(10, Number(e.target.value) || 100),
                              });
                              setQuotaRefreshTick((t) => t + 1);
                            }}
                            className="w-1/2 px-2 py-1 rounded-lg border text-center font-mono font-black text-xs"
                            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              saveStoreAdWallet(st.id, {
                                ...stWallet,
                                lastPacingTimerAt: stWallet.lastPacingTimerAt ? null : Date.now(),
                              });
                              setQuotaRefreshTick((t) => t + 1);
                            }}
                            className={`w-1/2 py-1 px-2 rounded-lg text-[10px] font-black cursor-pointer ${
                              stWallet.lastPacingTimerAt
                                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                : 'bg-slate-500/15 text-slate-400'
                            }`}
                          >
                            {stWallet.lastPacingTimerAt
                              ? isAr ? 'المؤقت: يعمل' : 'Timer: ON'
                              : isAr ? 'المؤقت: متوقف' : 'Timer: OFF'}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            masterApproveAdWalletTopUp(
                              st.id,
                              stWallet.pendingTopUpSar > 0 ? stWallet.pendingTopUpSar : 1000,
                              Math.max(stWallet.dailySpendCapSar, 200),
                            );
                            setQuotaRefreshTick((t) => t + 1);
                            toast(
                              isAr ? 'تم اعتماد وإضافة +1,000 ر.س لمحفظة الإعلانات' : 'Credited +1,000 SAR to Store Ad Wallet',
                              'success',
                            );
                          }}
                          className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black text-white bg-cyan-600 hover:bg-cyan-700 cursor-pointer"
                        >
                          {stWallet.pendingTopUpSar > 0
                            ? isAr ? `اعتماد +${stWallet.pendingTopUpSar} ر.س` : `Approve +${stWallet.pendingTopUpSar} SAR`
                            : isAr ? '+1,000 ر.س للمحفظة' : '+1,000 SAR Wallet'}
                        </button>
                      </div>
                    </div>

                    {/* 4. SOCIAL MEDIA AUTO-SCHEDULER SPEED & LIMIT */}
                    <div className="p-3.5 rounded-2xl border space-y-2.5 flex flex-col justify-between" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-purple-500 flex items-center gap-1">
                            <Share2 className="w-3.5 h-3.5" />
                            {isAr ? '4. جدولة السوشيال ميديا' : '4. Social Auto-Scheduler'}
                          </span>
                          <span className="font-mono font-bold text-[11px]">
                            {stSocial.postsUsedToday}/{stSocial.dailyPostLimit}
                          </span>
                        </div>
                        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          {isAr ? 'الحد اليومي للنشر ومؤقت الفاصل:' : 'Daily Posts & Cooldown Speed:'}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            value={stSocial.dailyPostLimit}
                            onChange={(e) => {
                              saveStoreSocialSchedule(st.id, {
                                ...stSocial,
                                dailyPostLimit: Math.max(1, Number(e.target.value) || 2),
                              });
                              setQuotaRefreshTick((t) => t + 1);
                            }}
                            className="w-1/2 px-2 py-1 rounded-lg border text-center font-mono font-black text-xs"
                            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          />
                          <select
                            value={stSocial.cooldownHours}
                            onChange={(e) => {
                              saveStoreSocialSchedule(st.id, {
                                ...stSocial,
                                cooldownHours: Number(e.target.value),
                              });
                              setQuotaRefreshTick((t) => t + 1);
                            }}
                            className="w-1/2 px-1.5 py-1 rounded-lg border font-bold text-[11px]"
                            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          >
                            <option value={3}>{isAr ? 'كل 3 ساعات' : 'Every 3h'}</option>
                            <option value={1}>{isAr ? 'كل 1 ساعة (سريع)' : 'Every 1h (Fast)'}</option>
                            <option value={0.5}>{isAr ? 'كل 30 دقيقة' : 'Every 30m'}</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            saveStoreSocialSchedule(st.id, {
                              ...stSocial,
                              dailyPostLimit: stSocial.dailyPostLimit + 15,
                              cooldownHours: 1,
                              nextAllowedPostAt: null,
                            });
                            setQuotaRefreshTick((t) => t + 1);
                            toast(isAr ? 'تم زيادة حد النشر +15 وتسريع الجدولة' : 'Boosted Social limit +15/day & speed to 1h', 'success');
                          }}
                          className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black text-white bg-purple-600 hover:bg-purple-700 cursor-pointer"
                        >
                          {isAr ? '+15 منشور + تسريع' : '+15 Posts & Fast 1h'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            saveStoreSocialSchedule(st.id, {
                              ...stSocial,
                              postsUsedToday: 0,
                              nextAllowedPostAt: null,
                            });
                            setQuotaRefreshTick((t) => t + 1);
                            toast(isAr ? 'تم تصفير مؤقت الجدولة' : 'Social Scheduler Timer Reset', 'info');
                          }}
                          className="py-1.5 px-2 rounded-xl text-[11px] font-bold border cursor-pointer"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          {isAr ? 'تصفير' : 'Reset'}
                        </button>
                      </div>
                    </div>

                    {/* 5. SEO, GTM4, GA4 & BROKEN LINKS AUTO-FIXER */}
                    <div className="p-3.5 rounded-2xl border space-y-2.5 flex flex-col justify-between" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-teal-500 flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" />
                            {isAr ? '5. الأرشفة و GTM4 و SEO' : '5. SEO, GTM4 & Indexing'}
                          </span>
                          <span className="font-mono font-black text-emerald-500">
                            {stSeoScore}/100
                          </span>
                        </div>
                        <div className="text-[11px] space-y-0.5" style={{ color: 'var(--muted)' }}>
                          <div className="truncate font-mono">
                            GTM: <strong style={{ color: 'var(--text)' }}>{stSeoCfg?.gtmContainerId || autoGtmId}</strong>
                          </div>
                          <div className="truncate font-mono">
                            GA4: <strong style={{ color: 'var(--text)' }}>{stSeoCfg?.ga4MeasurementId || autoGa4Id}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const fixedItems = stSeoItems.map((it) => ({
                              ...it,
                              status: 'fixed' as const,
                              fixedAt: new Date().toISOString(),
                            }));
                            saveStoreSeoDeepAudit(st.id, fixedItems);
                            updateStoreSEOConfig(st.id, {
                              googleConnected: true,
                              gtmContainerId: stSeoCfg?.gtmContainerId || autoGtmId,
                              ga4MeasurementId: stSeoCfg?.ga4MeasurementId || autoGa4Id,
                              searchConsoleConnected: true,
                              indexingApiEnabled: true,
                            });
                            setQuotaRefreshTick((t) => t + 1);
                            toast(
                              isAr
                                ? `تم ربط GTM4 و GA4 وإصلاح كافة الروابط المعطلة والباك لينك لمتجر ${displayName}!`
                                : `Auto-connected GTM4/GA4 & fixed all Broken Links, Backlinks & Meta for ${displayName}!`,
                              'success',
                            );
                          }}
                          className="w-full py-1.5 px-2 rounded-xl text-[11px] font-black text-white bg-teal-600 hover:bg-teal-700 cursor-pointer"
                        >
                          {isAr ? 'ربط GTM4 + إصلاح شامل لـ SEO' : 'Auto-Connect GTM4 & Fix All SEO'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ── SEARCH, FILTER & CATEGORY TOOLBAR ── */}
      <div className="space-y-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {isAr ? 'كافة العناصر والصفحات' : 'All Controls'} ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('store_admin_pages')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeCategory === 'store_admin_pages'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{isAr ? 'صفحات لوحة التحكم الرئيسية' : 'Store Admin Pages'}</span>
            <span className="text-[10px] opacity-75">
              ({categoryStats.find((s) => s.category === 'store_admin_pages')?.total})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('store_admin_subpages')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeCategory === 'store_admin_subpages'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>{isAr ? 'الصفحات الفرعية والوحدات' : 'Sub-Pages & Modules'}</span>
            <span className="text-[10px] opacity-75">
              ({categoryStats.find((s) => s.category === 'store_admin_subpages')?.total})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('storefront_pages')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeCategory === 'storefront_pages'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isAr ? 'صفحات المتجر للمتسوقين' : 'Storefront Customer Pages'}</span>
            <span className="text-[10px] opacity-75">
              ({categoryStats.find((s) => s.category === 'storefront_pages')?.total})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('storefront_elements')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeCategory === 'storefront_elements'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'العناصر والمكونات المباشرة' : 'Micro-Components & Elements'}</span>
            <span className="text-[10px] opacity-75">
              ({categoryStats.find((s) => s.category === 'storefront_elements')?.total})
            </span>
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Instant Search Box */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'ابحث باسم الصفحة، العنصر، أو الكود البرمجي...'
                  : 'Search by page name, element, or key...'
              }
              className="w-full ps-9 pe-8 py-2 rounded-xl text-xs font-medium border outline-hidden transition-all focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 -translate-y-1/2 end-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Segmented Buttons */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-xs font-medium text-slate-400 me-1">
              {isAr ? 'الحالة:' : 'Filter:'}
            </span>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                statusFilter === 'active'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isAr ? 'المفعل فقط' : 'Active Only'}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('disabled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                statusFilter === 'disabled'
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isAr ? 'المعطل فقط' : 'Disabled Only'}
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTROLS GRID ── */}
      {filteredItems.length === 0 ? (
        <div
          className="p-12 text-center rounded-3xl border space-y-3"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
            {isAr ? 'لم يتم العثور على عناصر مطابقة' : 'No matching controls found'}
          </h3>
          <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'جرّب البحث بكلمة أخرى أو تغيير تصنيف الفلترة الحالي.'
              : 'Try clearing the search query or adjusting your status/category filter.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
              setStatusFilter('all');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Category Action Bar if looking at a specific category */}
          {activeCategory !== 'all' && (
            <div
              className="flex items-center justify-between p-3.5 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/40 text-xs font-medium"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-500" />
                <span>
                  {isAr
                    ? `إجراءات جماعية لكافة عناصر "${
                        activeCategory === 'store_admin_pages'
                          ? 'صفحات لوحة التحكم'
                          : activeCategory === 'store_admin_subpages'
                          ? 'الصفحات الفرعية'
                          : activeCategory === 'storefront_pages'
                          ? 'صفحات المتجر'
                          : 'المكونات المباشرة'
                      }"`
                    : `Bulk actions for this category (${filteredItems.length} items)`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCategoryToggle(activeCategory, true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                >
                  {isAr ? 'تفعيل فئة الكل' : 'Enable Category'}
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => handleCategoryToggle(activeCategory, false)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                >
                  {isAr ? 'تعطيل فئة الكل' : 'Disable Category'}
                </button>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isEnabled = Boolean(controls[item.id]);

              // Category Badge Labels
              const categoryBadge = {
                store_admin_pages: {
                  label: isAr ? 'صفحة رئيسية' : 'Admin Page',
                  color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                },
                store_admin_subpages: {
                  label: isAr ? 'صفحة فرعية' : 'Sub-Page',
                  color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
                },
                storefront_pages: {
                  label: isAr ? 'واجهة المتجر' : 'Storefront',
                  color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                },
                storefront_elements: {
                  label: isAr ? 'مكون مباشر' : 'Live Element',
                  color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
                },
              }[item.category];

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group ${
                    isEnabled
                      ? 'hover:border-emerald-500/50 hover:shadow-md hover:shadow-emerald-500/5'
                      : 'opacity-85 hover:opacity-100 hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                  style={{
                    background: 'var(--surface)',
                    borderColor: isEnabled ? 'var(--border)' : 'var(--border)',
                  }}
                >
                  <div className="space-y-3">
                    {/* Header Row: Icon + Badges + Toggle Switch */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isEnabled
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {renderIcon(item.iconName)}
                        </div>
                        <div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${categoryBadge.color}`}
                          >
                            {categoryBadge.label}
                          </span>
                        </div>
                      </div>

                      {/* iOS-Style Tactile Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isEnabled}
                        onClick={() => handleToggle(item)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        title={
                          isEnabled
                            ? isAr ? 'انقر للتعطيل' : 'Click to disable'
                            : isAr ? 'انقر للتفعيل' : 'Click to enable'
                        }
                      >
                        <span className="sr-only">Toggle {item.nameEn}</span>
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? (isAr ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="text-sm font-extrabold tracking-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" style={{ color: 'var(--text)' }}>
                        {isAr ? item.nameAr : item.nameEn}
                      </h4>
                      <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--muted)' }}>
                        {isAr ? item.descriptionAr : item.descriptionEn}
                      </p>
                    </div>
                  </div>

                  {/* Footer Row: Code Key + Status Indicator */}
                  <div className="pt-4 mt-3 border-t flex items-center justify-between text-[11px]" style={{ borderColor: 'var(--border)' }}>
                    <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[170px]">
                      {item.id}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                          isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      <span
                        className={`font-bold ${
                          isEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {isEnabled ? (isAr ? 'مفعل (نشط)' : 'Active') : isAr ? 'معطل (محجوب)' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL: APPLY CURRENT CONFIG TO ALL STORES ── */}
      {showApplyAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Globe className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--text)' }}>
                {isAr ? 'تأكيد نشر التكوين على كافة المتاجر' : 'Confirm Global Synchronization'}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? `أنت على وشك تعميم هذه الإعدادات الحالية (${activeCount} مفعل / ${disabledCount} معطل) على جميع المتاجر النشطة (${stores.length} متاجر). سيتم تحديث صلاحيات وظهور الصفحات لكافة العملاء فوراً.`
                  : `You are about to publish the current control settings (${activeCount} active / ${disabledCount} disabled) across all ${stores.length} active merchant stores immediately.`}
              </p>
            </div>

            <div
              className="p-3.5 rounded-2xl border text-xs space-y-1 bg-slate-50 dark:bg-slate-900/50 font-mono"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex justify-between">
                <span>{isAr ? 'المتاجر المتأثرة:' : 'Affected Stores:'}</span>
                <span className="font-bold">{stores.length} stores</span>
              </div>
              <div className="flex justify-between">
                <span>{isAr ? 'المكونات المحدثة:' : 'Total Controls:'}</span>
                <span className="font-bold">{totalCount} items</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApplyAllModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleApplyToAllStoresConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer shadow-md transition-all"
              >
                {isAr ? 'تأكيد النشر الشامل' : 'Confirm & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: COPY SETTINGS FROM ANOTHER STORE ── */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Copy className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--text)' }}>
                {isAr ? 'نسخ إعدادات متجر آخر' : 'Copy Controls From Another Store'}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? `اختر المتجر المصدر لنسخ كافة إعدادات صفحاته وعناصره وتطبيقها على "${currentTargetName}".`
                  : `Select the source store whose toggles and component settings you want to clone into "${currentTargetName}".`}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                {isAr ? 'المتجر المصدر:' : 'Source Store:'}
              </label>
              <select
                value={copySourceStoreId}
                onChange={(e) => setCopySourceStoreId(e.target.value)}
                className="w-full p-2.5 rounded-xl text-xs font-medium border outline-hidden"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                {stores
                  .filter((s) => s.id !== selectedStoreId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {getStoreDisplayName(s, locale)} ({s.slug})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCopyModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleCopyFromStore}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 cursor-pointer shadow-md transition-all"
              >
                {isAr ? 'نسخ وتطبيق' : 'Copy Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: IMPORT JSON CONFIG ── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Upload className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--text)' }}>
                {isAr ? 'استيراد تكوين JSON' : 'Import JSON Configuration'}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'الصق محتوى ملف JSON المصدر لتطبيق إعدادات التشغيل فوراً.'
                  : 'Paste your exported JSON settings payload below to restore controls.'}
              </p>
            </div>

            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='{ "controls": { "dashboard": true, ... } }'
              className="w-full p-3 font-mono text-[11px] rounded-2xl border outline-hidden focus:border-cyan-500"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleImportJson}
                disabled={!importJsonText.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-md transition-all"
              >
                {isAr ? 'استيراد الآن' : 'Import Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
