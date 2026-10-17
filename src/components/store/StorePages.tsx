import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  HelpCircle,
  Compass,
  Sparkles,
  Layers,
  Lock,
  Globe,
  X,
  Save,
  Check
} from 'lucide-react';
import {
  StoreCustomPage,
  getStorePages,
  saveStorePage,
  createStorePage,
  deleteStorePage,
  resetStorePagesToDefault,
} from '../../services/storePagesService';

export const StorePages: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const [pages, setPages] = useState<StoreCustomPage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'legal' | 'information' | 'support' | 'custom'>('all');
  const [editingPage, setEditingPage] = useState<StoreCustomPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewPage, setPreviewPage] = useState<StoreCustomPage | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for editing / creating
  const [formData, setFormData] = useState<{
    slug: string;
    titleEn: string;
    titleAr: string;
    category: 'legal' | 'information' | 'support' | 'custom';
    isPublished: boolean;
    contentEn: string;
    contentAr: string;
    metaDescriptionEn: string;
    metaDescriptionAr: string;
  }>({
    slug: '',
    titleEn: '',
    titleAr: '',
    category: 'legal',
    isPublished: true,
    contentEn: '',
    contentAr: '',
    metaDescriptionEn: '',
    metaDescriptionAr: '',
  });

  const loadPages = () => {
    const list = getStorePages(activeStore.id, activeStore);
    setPages(list);
  };

  useEffect(() => {
    loadPages();
    const handleSync = () => loadPages();
    window.addEventListener('unityteck-pages-changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('unityteck-pages-changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [activeStore.id]);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = pages.length;
    const published = pages.filter((p) => p.isPublished).length;
    const legal = pages.filter((p) => p.category === 'legal').length;
    const custom = pages.filter((p) => !p.isSystemDefault).length;
    return { total, published, legal, custom };
  }, [pages]);

  // Filtered pages
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const matchCat = activeCategory === 'all' || page.category === activeCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        page.titleAr.toLowerCase().includes(query) ||
        page.titleEn.toLowerCase().includes(query) ||
        page.slug.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  }, [pages, activeCategory, searchQuery]);

  // Open edit modal
  const handleStartEdit = (page: StoreCustomPage) => {
    setEditingPage(page);
    setIsCreating(false);
    setFormData({
      slug: page.slug,
      titleEn: page.titleEn,
      titleAr: page.titleAr,
      category: page.category,
      isPublished: page.isPublished,
      contentEn: page.contentEn,
      contentAr: page.contentAr,
      metaDescriptionEn: page.metaDescriptionEn || '',
      metaDescriptionAr: page.metaDescriptionAr || '',
    });
  };

  // Open create modal
  const handleStartCreate = () => {
    setEditingPage(null);
    setIsCreating(true);
    setFormData({
      slug: '',
      titleEn: '',
      titleAr: '',
      category: 'custom',
      isPublished: true,
      contentEn: `### Page Heading\nWrite your content here in English.\n\n- Point 1\n- Point 2`,
      contentAr: `### عنوان الصفحة\nاكتب تفاصيل ومحتوى الصفحة هنا باللغة العربية.\n\n- البند الأول\n- البند الثاني`,
      metaDescriptionEn: '',
      metaDescriptionAr: '',
    });
  };

  // Save changes
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleAr.trim() || !formData.titleEn.trim() || !formData.slug.trim()) {
      showNotification(isAr ? 'يرجى تعبئة العنوان والاسم اللطيف (Slug)' : 'Please fill title and URL slug');
      return;
    }

    if (editingPage) {
      saveStorePage(activeStore.id, {
        ...editingPage,
        ...formData,
      });
      showNotification(isAr ? 'تم حفظ تعديلات الصفحة بنجاح ✓' : 'Page changes saved successfully ✓');
    } else {
      createStorePage(activeStore.id, {
        ...formData,
      });
      showNotification(isAr ? 'تم إنشاء الصفحة الجديدة بنجاح ✓' : 'New page created successfully ✓');
    }

    setEditingPage(null);
    setIsCreating(false);
    loadPages();
  };

  // Toggle publish
  const handleTogglePublish = (page: StoreCustomPage) => {
    saveStorePage(activeStore.id, {
      ...page,
      isPublished: !page.isPublished,
    });
    showNotification(
      !page.isPublished
        ? isAr
          ? 'تم نشر الصفحة في المتجر ✓'
          : 'Page published ✓'
        : isAr
        ? 'تم تحويل الصفحة إلى مسودة'
        : 'Page set to draft'
    );
    loadPages();
  };

  // Delete page
  const handleDelete = (page: StoreCustomPage) => {
    if (page.isSystemDefault) {
      showNotification(isAr ? 'صفحات النظام الافتراضية لا يمكن حذفها، يمكنك إخفاؤها' : 'System pages cannot be deleted');
      return;
    }
    const ok = window.confirm(
      isAr
        ? `هل أنت متأكد من حذف الصفحة "${page.titleAr}"؟`
        : `Are you sure you want to delete "${page.titleEn}"?`
    );
    if (!ok) return;

    deleteStorePage(activeStore.id, page.id);
    showNotification(isAr ? 'تم حذف الصفحة بنجاح' : 'Page deleted successfully');
    loadPages();
  };

  // Reset to default
  const handleResetDefaults = () => {
    const ok = window.confirm(
      isAr
        ? 'هل ترغب بإعادة تعيين كافة الصفحات والسياسات الرسمية إلى القوالب المعتمدة؟ (سيتم استرجاع نصوص وزارة التجارة السعودية الافتراضية)'
        : 'Reset all pages and policies back to master Saudi defaults?'
    );
    if (!ok) return;

    resetStorePagesToDefault(activeStore.id);
    showNotification(isAr ? 'تمت استعادة القوالب الافتراضية المعتمدة ✓' : 'Master default policies restored ✓');
    loadPages();
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 end-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <Shield className="w-4 h-4" />
            <span>{isAr ? 'منظومة حوكمة المتاجر والامتثال السعودي' : 'Saudi Legal Compliance & Store Governance'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {isAr ? 'إدارة الصفحات والسياسات الرسمية' : 'Store Pages & Policies Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {isAr
              ? 'تخصيص سياسات المتجر (الخصوصية، الاسترجاع، الشروط والأحكام، تتبع الشحنات، الفروع)، مع إمكانية بناء صفحات جديدة تتكامل مع ثيم متجرك.'
              : 'Customize store policies (Privacy, Return, Terms, Order Tracking, Store Locator), or build custom pages adapting to your active theme.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title={isAr ? 'استعادة قوالب النظام' : 'Restore defaults'}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>{isAr ? 'استعادة القوالب الافتراضية' : 'Reset Defaults'}</span>
          </button>

          <button
            type="button"
            onClick={handleStartCreate}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إنشاء صفحة جديدة +' : 'Create New Page +'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{isAr ? 'إجمالي الصفحات' : 'Total Pages'}</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.total}</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{isAr ? 'الصفحات المنشورة' : 'Published'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{metrics.published}</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{isAr ? 'سياسات إلزامية' : 'Legal Policies'}</span>
            <Shield className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.legal}</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{isAr ? 'صفحات مخصصة' : 'Custom Pages'}</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.custom}</div>
        </div>
      </div>

      {/* Control Bar: Category Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', labelAr: 'الكل', labelEn: 'All' },
            { id: 'legal', labelAr: 'السياسات النظامية', labelEn: 'Legal & Policies' },
            { id: 'support', labelAr: 'الدعم والخدمات', labelEn: 'Support & Help' },
            { id: 'information', labelAr: 'معلومات المتجر', labelEn: 'Store Info' },
            { id: 'custom', labelAr: 'صفحات مخصصة', labelEn: 'Custom Pages' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {isAr ? cat.labelAr : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isAr ? 'بحث في الصفحات أو الروابط...' : 'Search pages or slugs...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPages.map((page) => (
          <div
            key={page.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 group"
          >
            {/* Top row */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    page.category === 'legal'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      : page.category === 'support'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                      : page.category === 'information'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                  }`}
                >
                  {page.category === 'legal'
                    ? isAr ? 'سياسة نظامية' : 'Legal Policy'
                    : page.category === 'support'
                    ? isAr ? 'دعم وخدمات' : 'Support'
                    : page.category === 'information'
                    ? isAr ? 'معلومات' : 'Store Info'
                    : isAr ? 'صفحة مخصصة' : 'Custom Page'}
                </span>

                <div className="flex items-center gap-1.5">
                  {page.isSystemDefault && (
                    <span
                      title={isAr ? 'قالب أساسي' : 'System Default'}
                      className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full"
                    >
                      {isAr ? 'نظامي' : 'System'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(page)}
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                      page.isPublished
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {page.isPublished ? (isAr ? 'منشور ✓' : 'Published') : (isAr ? 'مسودة' : 'Draft')}
                  </button>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors">
                {isAr ? page.titleAr : page.titleEn}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5 dir-ltr truncate">
                /page/{page.slug}
              </p>

              {/* Description preview */}
              <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                {(isAr ? page.metaDescriptionAr : page.metaDescriptionEn) || (isAr ? page.contentAr : page.contentEn).substring(0, 110)}
              </p>
            </div>

            {/* Bottom actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                {isAr ? `تحديث: ${page.updatedAt}` : `Updated: ${page.updatedAt}`}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewPage(page)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                  title={isAr ? 'معاينة الصفحة' : 'Preview page'}
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleStartEdit(page)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                  title={isAr ? 'تعديل المحتوى' : 'Edit page'}
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {!page.isSystemDefault && (
                  <button
                    type="button"
                    onClick={() => handleDelete(page)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title={isAr ? 'حذف الصفحة' : 'Delete page'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPages.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">
            {isAr ? 'لم يتم العثور على أي صفحات' : 'No pages found'}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {isAr ? 'جرّب تغيير فئة التصفية أو أنشئ صفحة جديدة.' : 'Try changing filters or create a new page.'}
          </p>
          <button
            type="button"
            onClick={handleStartCreate}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer shadow-sm hover:bg-indigo-700 transition-colors"
          >
            {isAr ? 'إنشاء صفحة جديدة +' : 'Create New Page +'}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT / CREATE MODAL                                                       */}
      {/* ========================================================================= */}
      {(editingPage || isCreating) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-base">
                  {isCreating
                    ? isAr ? 'بناء وإنشاء صفحة جديدة' : 'Build & Create New Page'
                    : isAr ? `تعديل الصفحة: ${editingPage?.titleAr}` : `Edit Page: ${editingPage?.titleEn}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingPage(null);
                  setIsCreating(false);
                }}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'عنوان الصفحة بالعربية *' : 'Arabic Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titleAr}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder={isAr ? 'مثال: سياسة الاستبدال والاسترجاع' : 'Arabic title...'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'عنوان الصفحة بالإنجليزية *' : 'English Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="e.g. Return and Refund Policy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'الاسم اللطيف للرابط (Slug) *' : 'URL Slug *'}
                  </label>
                  <div className="relative">
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-mono">/page/</span>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
                        })
                      }
                      className="w-full ps-16 pe-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-indigo-500 outline-none"
                      placeholder="return-policy"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'تصنيف الصفحة' : 'Category'}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="legal">{isAr ? 'سياسة نظامية وقانونية' : 'Legal Policy'}</option>
                    <option value="support">{isAr ? 'دعم وخدمات عملاء' : 'Support & Help'}</option>
                    <option value="information">{isAr ? 'معلومات المتجر وعلامتنا' : 'Store Information'}</option>
                    <option value="custom">{isAr ? 'صفحة تسويقية / مخصصة' : 'Custom Page'}</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      {isAr ? 'نشر وتفعيل في المتجر فوراً' : 'Publish Immediately'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Meta Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'وصف SEO مختصر بالعربية' : 'Arabic Meta Description'}
                  </label>
                  <input
                    type="text"
                    value={formData.metaDescriptionAr}
                    onChange={(e) => setFormData({ ...formData, metaDescriptionAr: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    placeholder={isAr ? 'وصف لمحركات البحث وجوجل...' : 'SEO description...'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'وصف SEO مختصر بالإنجليزية' : 'English Meta Description'}
                  </label>
                  <input
                    type="text"
                    value={formData.metaDescriptionEn}
                    onChange={(e) => setFormData({ ...formData, metaDescriptionEn: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    placeholder="Short SEO description for search engines..."
                  />
                </div>
              </div>

              {/* Content Editors (Arabic & English) */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>🇸🇦 {isAr ? 'محتوى الصفحة بالعربية (Markdown / نصوص)' : 'Arabic Content (Markdown)'}</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {isAr ? 'يمكنك استخدام عناوين مثل ### ونقاط وقوائم' : 'Supports Markdown headings and lists'}
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    required
                    value={formData.contentAr}
                    onChange={(e) => setFormData({ ...formData, contentAr: e.target.value })}
                    className="w-full p-4 text-xs font-sans leading-relaxed bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none"
                    dir="rtl"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>🌐 {isAr ? 'محتوى الصفحة بالإنجليزية (Markdown)' : 'English Content (Markdown)'}</span>
                    </label>
                  </div>
                  <textarea
                    rows={8}
                    required
                    value={formData.contentEn}
                    onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })}
                    className="w-full p-4 text-xs font-sans leading-relaxed bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPage(null);
                    setIsCreating(false);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{isAr ? 'حفظ ونشر التعديلات' : 'Save & Publish Page'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIVE PREVIEW MODAL                                                        */}
      {/* ========================================================================= */}
      {previewPage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">
                  {isAr ? 'معاينة صفحة المتجر' : 'Storefront Preview'}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {isAr ? previewPage.titleAr : previewPage.titleEn}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPage(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
              {(isAr ? previewPage.contentAr : previewPage.contentEn)
                .split('\n')
                .map((line, idx) => {
                  if (line.startsWith('### ')) {
                    return (
                      <h4 key={idx} className="font-black text-slate-900 text-base pt-3 border-b border-slate-100 pb-1">
                        {line.replace('### ', '')}
                      </h4>
                    );
                  }
                  if (line.startsWith('#### ')) {
                    return (
                      <h5 key={idx} className="font-bold text-slate-900 text-sm pt-2">
                        {line.replace('#### ', '')}
                      </h5>
                    );
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <li key={idx} className="ms-4 list-disc text-slate-700">
                        {line.replace('- ', '')}
                      </li>
                    );
                  }
                  return <p key={idx} className="text-slate-600">{line}</p>;
                })}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">/page/{previewPage.slug}</span>
              <button
                type="button"
                onClick={() => setPreviewPage(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-black transition-colors"
              >
                {isAr ? 'إغلاق المعاينة' : 'Close Preview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
