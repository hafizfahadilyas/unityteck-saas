import React, { useState } from 'react';
import {
  Sparkles,
  Globe,
  Palette,
  Share2,
  Megaphone,
  CheckCircle2,
  Clock,
  EyeOff,
  Edit3,
  Plus,
  RotateCcw,
  Save,
  X,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  useAdvanceFeatures,
  type AdvanceFeatureConfig,
  type FeatureDisplayMode,
} from '../../services/advanceFeaturesService';

export const MasterAdvanceFeaturesCard: React.FC = () => {
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const {
    features,
    updateFeature,
    setFeatureMode,
    addFeature,
    deleteFeature,
    resetToDefaults,
  } = useAdvanceFeatures();

  // Modal / Editing State
  const [editingFeature, setEditingFeature] = useState<AdvanceFeatureConfig | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<Partial<AdvanceFeatureConfig>>({
    id: '',
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    category: 'marketing',
    iconName: 'Sparkles',
    mode: 'coming_soon',
    comingSoonTagEn: 'Coming Soon',
    comingSoonTagAr: 'قريباً',
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Globe':
        return <Globe className="w-5 h-5 text-blue-500" />;
      case 'Palette':
        return <Palette className="w-5 h-5 text-emerald-500" />;
      case 'Share2':
        return <Share2 className="w-5 h-5 text-amber-500" />;
      case 'Megaphone':
        return <Megaphone className="w-5 h-5 text-teal-500" />;
      case 'Sparkles':
      default:
        return <Sparkles className="w-5 h-5 text-purple-500" />;
    }
  };

  const handleModeChange = (id: string, mode: FeatureDisplayMode) => {
    setFeatureMode(id, mode);
    const target = features.find((f) => f.id === id);
    const name = target ? (isAr ? target.nameAr : target.nameEn) : id;
    const modeLabel =
      mode === 'active'
        ? isAr ? 'مفعل بالكامل' : 'Fully Active'
        : mode === 'coming_soon'
        ? isAr ? 'قريباً (Coming Soon)' : 'Coming Soon'
        : isAr ? 'مخفي عن المتاجر' : 'Hidden from Stores';

    toast(
      isAr
        ? `تم تحديث حالة "${name}" إلى: ${modeLabel}`
        : `Updated status for "${name}" to: ${modeLabel}`,
      'success'
    );
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeature) return;

    updateFeature(editingFeature.id, {
      nameEn: editingFeature.nameEn.trim(),
      nameAr: editingFeature.nameAr.trim(),
      descriptionEn: editingFeature.descriptionEn.trim(),
      descriptionAr: editingFeature.descriptionAr.trim(),
      comingSoonTagEn: editingFeature.comingSoonTagEn.trim() || 'Coming Soon',
      comingSoonTagAr: editingFeature.comingSoonTagAr.trim() || 'قريباً',
      mode: editingFeature.mode,
      iconName: editingFeature.iconName,
    });

    toast(
      isAr ? 'تم حفظ تعديلات الوظيفة المتقدمة بنجاح!' : 'Advance function updated successfully!',
      'success'
    );
    setEditingFeature(null);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.nameEn || !newForm.nameAr) {
      toast(isAr ? 'يرجى إدخال اسم الوظيفة بالعربية والإنجليزية' : 'Please provide feature name in EN & AR', 'error');
      return;
    }

    const generatedId =
      newForm.id?.trim() ||
      newForm.nameEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    const newFeature: AdvanceFeatureConfig = {
      id: generatedId,
      nameEn: newForm.nameEn.trim(),
      nameAr: newForm.nameAr.trim(),
      descriptionEn: newForm.descriptionEn?.trim() || '',
      descriptionAr: newForm.descriptionAr?.trim() || '',
      category: newForm.category || 'marketing',
      iconName: newForm.iconName || 'Sparkles',
      mode: newForm.mode || 'coming_soon',
      comingSoonTagEn: newForm.comingSoonTagEn?.trim() || 'Coming Soon',
      comingSoonTagAr: newForm.comingSoonTagAr?.trim() || 'قريباً',
    };

    addFeature(newFeature);
    toast(
      isAr ? `تمت إضافة الوظيفة المتقدمة "${newFeature.nameAr}" بنجاح!` : `Added new advance function "${newFeature.nameEn}" successfully!`,
      'success'
    );
    setIsAddingNew(false);
    setNewForm({
      id: '',
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      category: 'marketing',
      iconName: 'Sparkles',
      mode: 'coming_soon',
      comingSoonTagEn: 'Coming Soon',
      comingSoonTagAr: 'قريباً',
    });
  };

  const handleReset = () => {
    if (
      window.confirm(
        isAr
          ? 'هل أنت متأكد من استعادة الوظائف المتقدمة إلى الإعدادات الافتراضية؟'
          : 'Are you sure you want to reset advance functions to factory defaults?'
      )
    ) {
      resetToDefaults();
      toast(isAr ? 'تمت استعادة الإعدادات الافتراضية' : 'Reset to default features', 'info');
    }
  };

  return (
    <div
      className="u-panel p-5 sm:p-6 rounded-2xl shadow-sm border space-y-6"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
      }}
      data-panel="master-advance-features"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <span>{isAr ? 'الوظائف المتقدمة وحالات (قريباً / Coming Soon)' : 'Advance Functions & Coming Soon Governance'}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                {features.length} {isAr ? 'وظائف' : 'Modules'}
              </span>
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'التحكم في إعلانات جوجل، تيك توك، محرر كانفا، النشر التلقائي وغيرها وتحديد إظهارها كـ (قريباً) مع تخصيص العنوان أو إخفائها.'
                : 'Configure Google Ads, TikTok Ads, Canva Studio, Auto-Posting & set Coming Soon badges, custom tags, or hide them per store.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:opacity-95"
            style={{ background: 'var(--portal-cta, #0d9488)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة وظيفة متقدمة' : 'Add Advance Function'}</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl border text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isAr ? 'استعادة الافتراضي' : 'Reset to Defaults'}
            aria-label={isAr ? 'استعادة الافتراضي' : 'Reset to Defaults'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of Advance Functions */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {features.map((item) => {
          const title = isAr ? item.nameAr : item.nameEn;
          const description = isAr ? item.descriptionAr : item.descriptionEn;
          const tag = isAr ? item.comingSoonTagAr : item.comingSoonTagEn;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
                item.mode === 'coming_soon'
                  ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent'
                  : item.mode === 'active'
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'opacity-65 border-dashed border-slate-300 dark:border-slate-700 bg-slate-500/5'
              }`}
              style={{ background: 'var(--bg)' }}
            >
              {/* Top Accent Strip */}
              <div
                className={`absolute top-0 inset-x-0 h-1 ${
                  item.mode === 'coming_soon'
                    ? 'bg-amber-500'
                    : item.mode === 'active'
                    ? 'bg-emerald-500'
                    : 'bg-slate-400'
                }`}
              />

              <div className="space-y-3">
                {/* Header: Icon + Name + Edit Button */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs shrink-0"
                      style={{
                        background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
                        borderColor: 'var(--border)',
                      }}
                    >
                      {getIcon(item.iconName)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm truncate leading-snug" title={title}>
                        {title}
                      </h3>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        #{item.id}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingFeature({ ...item })}
                    className="p-1.5 rounded-lg border text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    title={isAr ? 'تعديل الاسم والوسم' : 'Edit name & tag'}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {description}
                </p>

                {/* Live Merchant Badge Preview */}
                <div
                  className="p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {isAr ? 'المظهر في المتجر:' : 'Store View:'}
                  </span>
                  {item.mode === 'coming_soon' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                      <Sparkles className="w-3 h-3" />
                      <span>{tag || (isAr ? 'قريباً' : 'Coming Soon')}</span>
                    </span>
                  )}
                  {item.mode === 'active' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isAr ? 'مفعل وشغال' : 'Active & Live'}</span>
                    </span>
                  )}
                  {item.mode === 'hidden' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-400/20">
                      <EyeOff className="w-3 h-3" />
                      <span>{isAr ? 'مخفي عن اللوحة' : 'Hidden / Disabled'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 3-Way Mode Switcher Buttons */}
              <div
                className="grid grid-cols-3 gap-1 p-1 rounded-xl border text-[11px] font-bold"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                {/* Active Toggle */}
                <button
                  type="button"
                  onClick={() => handleModeChange(item.id, 'active')}
                  className={`py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    item.mode === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isAr ? 'تفعيل' : 'Active'}</span>
                </button>

                {/* Coming Soon Toggle */}
                <button
                  type="button"
                  onClick={() => handleModeChange(item.id, 'coming_soon')}
                  className={`py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    item.mode === 'coming_soon'
                      ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>{isAr ? 'قريباً' : 'Soon'}</span>
                </button>

                {/* Hide / Off Toggle */}
                <button
                  type="button"
                  onClick={() => handleModeChange(item.id, 'hidden')}
                  className={`py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    item.mode === 'hidden'
                      ? 'bg-slate-700 text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <EyeOff className="w-3 h-3" />
                  <span>{isAr ? 'إخفاء' : 'Hide'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: EDIT ADVANCE FEATURE MODAL */}
      {editingFeature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in"
          onClick={() => setEditingFeature(null)}
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <div
            className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden p-6 space-y-5"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">
                    {isAr ? 'تعديل الوظيفة المتقدمة ووسم قريباً' : 'Edit Advance Function & Coming Soon Tag'}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">ID: {editingFeature.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingFeature(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Name EN */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-200">
                  {isAr ? 'اسم الوظيفة (English)' : 'Function Name (English)'}
                </label>
                <input
                  type="text"
                  required
                  value={editingFeature.nameEn}
                  onChange={(e) => setEditingFeature({ ...editingFeature, nameEn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--input-fg)',
                  }}
                />
              </div>

              {/* Name AR */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-200">
                  {isAr ? 'اسم الوظيفة (بالعربية)' : 'Function Name (Arabic)'}
                </label>
                <input
                  type="text"
                  required
                  value={editingFeature.nameAr}
                  onChange={(e) => setEditingFeature({ ...editingFeature, nameAr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--input-fg)',
                  }}
                />
              </div>

              {/* Coming Soon Tag Title EN & AR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAr ? 'عنوان وسم قريباً (EN)' : 'Coming Soon Tag (EN)'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingFeature.comingSoonTagEn}
                    onChange={(e) => setEditingFeature({ ...editingFeature, comingSoonTagEn: e.target.value })}
                    placeholder="Coming Soon / Beta / Q2 2026"
                    className="w-full px-3 py-2 rounded-xl border"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAr ? 'عنوان وسم قريباً (AR)' : 'Coming Soon Tag (AR)'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingFeature.comingSoonTagAr}
                    onChange={(e) => setEditingFeature({ ...editingFeature, comingSoonTagAr: e.target.value })}
                    placeholder="قريباً / في التحديث القادم"
                    className="w-full px-3 py-2 rounded-xl border"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  />
                </div>
              </div>

              {/* Description EN */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-200">
                  {isAr ? 'الوصف التوضيحي (English)' : 'Description (English)'}
                </label>
                <textarea
                  rows={2}
                  value={editingFeature.descriptionEn}
                  onChange={(e) => setEditingFeature({ ...editingFeature, descriptionEn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--input-fg)',
                  }}
                />
              </div>

              {/* Description AR */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-200">
                  {isAr ? 'الوصف التوضيحي (بالعربية)' : 'Description (Arabic)'}
                </label>
                <textarea
                  rows={2}
                  value={editingFeature.descriptionAr}
                  onChange={(e) => setEditingFeature({ ...editingFeature, descriptionAr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--input-fg)',
                  }}
                />
              </div>

              {/* Status Mode Select */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-200">
                  {isAr ? 'الحالة الحالية' : 'Current Mode'}
                </label>
                <select
                  value={editingFeature.mode}
                  onChange={(e) => setEditingFeature({ ...editingFeature, mode: e.target.value as FeatureDisplayMode })}
                  className="w-full px-3 py-2 rounded-xl border font-bold"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--input-fg)',
                  }}
                >
                  <option value="coming_soon">{isAr ? 'قريباً (Coming Soon Tag)' : 'Coming Soon Tag'}</option>
                  <option value="active">{isAr ? 'مفعل بالكامل (Active)' : 'Active (Live)'}</option>
                  <option value="hidden">{isAr ? 'مخفي تماماً (Hidden)' : 'Hidden (Disabled)'}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setEditingFeature(null)}
                  className="px-4 py-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW CUSTOM ADVANCE FEATURE */}
      {isAddingNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsAddingNew(false)}
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <div
            className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden p-6 space-y-5"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">
                    {isAr ? 'إضافة وظيفة متقدمة جديدة' : 'Add New Advance Function'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isAr ? 'حدد الاسم والوسم وخيار الإظهار/الإخفاء' : 'Define name, tag title, and default display mode'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNew} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'اسم الوظيفة (EN)' : 'Name (EN)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newForm.nameEn}
                    onChange={(e) => setNewForm({ ...newForm, nameEn: e.target.value })}
                    placeholder="e.g. AI Copywriter"
                    className="w-full px-3 py-2 rounded-xl border"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'اسم الوظيفة (AR)' : 'Name (AR)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newForm.nameAr}
                    onChange={(e) => setNewForm({ ...newForm, nameAr: e.target.value })}
                    placeholder="مثال: كاتب المحتوى الذكي"
                    className="w-full px-3 py-2 rounded-xl border"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAr ? 'وسم قريباً (EN)' : 'Coming Soon Tag (EN)'}</span>
                  </label>
                  <input
                    type="text"
                    value={newForm.comingSoonTagEn}
                    onChange={(e) => setNewForm({ ...newForm, comingSoonTagEn: e.target.value })}
                    placeholder="Coming Soon"
                    className="w-full px-3 py-2 rounded-xl border"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAr ? 'وسم قريباً (AR)' : 'Coming Soon Tag (AR)'}</span>
                  </label>
                  <input
                    type="text"
                    value={newForm.comingSoonTagAr}
                    onChange={(e) => setNewForm({ ...newForm, comingSoonTagAr: e.target.value })}
                    placeholder="قريباً"
                    className="w-full px-3 py-2 rounded-xl border"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'القسم' : 'Category'}
                  </label>
                  <select
                    value={newForm.category}
                    onChange={(e) => setNewForm({ ...newForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  >
                    <option value="marketing">{isAr ? 'التسويق والإعلانات' : 'Marketing & Ads'}</option>
                    <option value="media">{isAr ? 'الوسائط والتصميم' : 'Media & Design'}</option>
                    <option value="social">{isAr ? 'منصات التواصل' : 'Social Platforms'}</option>
                    <option value="analytics">{isAr ? 'التحليلات' : 'Analytics'}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'حالة الظهور الأولية' : 'Initial Display Mode'}
                  </label>
                  <select
                    value={newForm.mode}
                    onChange={(e) => setNewForm({ ...newForm, mode: e.target.value as FeatureDisplayMode })}
                    className="w-full px-3 py-2 rounded-xl border font-bold"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  >
                    <option value="coming_soon">{isAr ? 'قريباً (Coming Soon)' : 'Coming Soon'}</option>
                    <option value="active">{isAr ? 'مفعل شغال (Active)' : 'Active (Live)'}</option>
                    <option value="hidden">{isAr ? 'مخفي (Hidden)' : 'Hidden'}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إنشاء الوظيفة' : 'Create Function'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
