import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  Search,
  Eye,
  Plus,
  FileText,
  MessageCircle,
  Clock,
  ChevronDown,
  Edit2,
  Trash2,
  Check,
  Star,
  Settings,
  Sparkles,
  ArrowUpRight,
  LayoutGrid,
  List,
  Save,
  Tag,
  Calendar,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import {
  fetchBlogDataApi,
  createBlogArticleApi,
  updateBlogArticleApi,
  deleteBlogArticleApi,
  bulkBlogArticlesActionApi,
  updateBlogSettingsApi,
} from '../../../api/tenantApi';
import type {
  BlogArticleItem,
  BlogPostSettings,
  BlogSeoSettings,
  BlogMetrics,
} from '../../../types/blog';
import { ArticleEditorModal } from './ArticleEditorModal';
import { ArticlePreviewModal } from './ArticlePreviewModal';
import { AdminPageShell } from '../../common/AdminPageHeader';

interface StoreBlogManagementProps {
  onNavigateTab?: (tab: string) => void;
  onOpenCommerceTools?: (articleId?: string) => void;
}

export const StoreBlogManagement: React.FC<StoreBlogManagementProps> = ({
  onNavigateTab,
  onOpenCommerceTools,
}) => {
  const { activeStore } = useTenant();
  const storeId = activeStore?.id || 'store-1';
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<BlogArticleItem[]>([]);
  const [metrics, setMetrics] = useState<BlogMetrics>({
    total_articles: 0,
    total_views: 0,
    total_comments: 0,
    published: 0,
    drafts: 0,
    weekly_articles_growth: '0 this week',
    weekly_views_growth: '0% this week',
    weekly_comments_growth: '0% this week',
  });
  const [featuredArticle, setFeaturedArticle] = useState<BlogArticleItem | null>(null);

  // Post Settings
  const [postSettings, setPostSettings] = useState<BlogPostSettings>({
    layout: 'Large Image + Excerpt',
    articles_per_page: 10,
    order_by: 'Latest',
    sort_order: 'Descending',
  });

  // SEO Settings
  const [seoSettings, setSeoSettings] = useState<BlogSeoSettings>({
    enabled: true,
    meta_title: 'Blog | Official Store Articles',
    meta_description:
      'Discover tips, product reviews, and lifestyle guides directly from our official store.',
    focus_keyword: 'store articles',
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedDateRange, setSelectedDateRange] = useState('Last 30 Days');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'bulk' | 'publish' | 'draft' | 'delete'>('bulk');
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BlogArticleItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<BlogArticleItem | null>(null);
  const [previewMode, setPreviewMode] = useState<'article' | 'blog_list'>('article');
  const [savingSettings, setSavingSettings] = useState(false);

  // Load data from Real API (Hostinger MySQL backend)
  const loadBlogData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchBlogDataApi(storeId);
      if (res && res.data) {
        setArticles(res.data);
        if (res.metrics) setMetrics(res.metrics);
        if (res.featured_article) setFeaturedArticle(res.featured_article);
        if (res.post_settings && Object.keys(res.post_settings).length > 0) {
          setPostSettings(res.post_settings);
        }
        if (res.seo_settings && Object.keys(res.seo_settings).length > 0) {
          setSeoSettings(res.seo_settings);
        }
      }
    } catch (err: any) {
      console.error('Failed to load blog data:', err);
      toast(isAr ? 'فشل تحميل بيانات المدونة من الخادم' : 'Failed to load blog data from backend', 'error');
    } finally {
      setLoading(false);
    }
  }, [storeId, isAr, toast]);

  useEffect(() => {
    loadBlogData();
  }, [loadBlogData]);

  // Unique categories list
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [articles]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (art.title || '').toLowerCase().includes(q);
        const excerptMatch = (art.excerpt || '').toLowerCase().includes(q);
        const catMatch = (art.category || '').toLowerCase().includes(q);
        if (!titleMatch && !excerptMatch && !catMatch) return false;
      }

      // Category
      if (selectedCategory !== 'All Categories') {
        if (art.category !== selectedCategory) return false;
      }

      // Status
      if (selectedStatus !== 'All Statuses') {
        if (art.status !== selectedStatus.toLowerCase()) return false;
      }

      return true;
    });
  }, [articles, searchQuery, selectedCategory, selectedStatus]);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredArticles.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Apply
  const handleApplyBulk = async () => {
    if (bulkAction === 'bulk') {
      toast(isAr ? 'يرجى اختيار إجراء مجمع' : 'Please select a bulk action.', 'info');
      return;
    }
    if (selectedIds.length === 0) {
      toast(isAr ? 'لم يتم تحديد أي مقال' : 'No articles selected.', 'warning');
      return;
    }

    if (bulkAction === 'delete') {
      const confirmed = window.confirm(
        isAr
          ? `هل أنت متأكد من حذف ${selectedIds.length} مقالات نهائياً؟`
          : `Are you sure you want to delete ${selectedIds.length} articles?`
      );
      if (!confirmed) return;
    }

    try {
      setIsApplyingBulk(true);
      await bulkBlogArticlesActionApi(storeId, bulkAction, selectedIds);
      toast(
        isAr
          ? `تم تطبيق الإجراء المجمع على ${selectedIds.length} مقال بنجاح.`
          : `Bulk action applied to ${selectedIds.length} articles successfully.`,
        'success'
      );
      setSelectedIds([]);
      await loadBlogData();
    } catch (err: any) {
      toast(err.message || (isAr ? 'فشل تطبيق الإجراء' : 'Failed to apply bulk action.'), 'error');
    } finally {
      setIsApplyingBulk(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await updateBlogSettingsApi(storeId, {
        post_settings: postSettings,
        seo_settings: seoSettings,
        featured_article_id: featuredArticle?.id,
      });
      toast(
        isAr
          ? 'تم حفظ إعدادات المدونة والسيو بنجاح في قاعدة البيانات!'
          : 'Blog post and SEO settings saved successfully to Hostinger MySQL!',
        'success'
      );
    } catch (err: any) {
      toast(err.message || (isAr ? 'فشل حفظ الإعدادات' : 'Failed to save settings.'), 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Delete Single Article
  const handleDeleteArticle = async (art: BlogArticleItem) => {
    const confirmed = window.confirm(
      isAr
        ? `هل تريد بالتأكيد حذف المقال "${art.title}"؟`
        : `Are you sure you want to delete "${art.title}"?`
    );
    if (!confirmed) return;

    try {
      await deleteBlogArticleApi(storeId, art.id);
      toast(isAr ? 'تم حذف المقال بنجاح.' : 'Article deleted successfully.', 'success');
      await loadBlogData();
    } catch (err: any) {
      toast(err.message || (isAr ? 'فشل حذف المقال' : 'Failed to delete article.'), 'error');
    }
  };

  // Open Editor
  const handleOpenCreate = () => {
    setEditingArticle(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (art: BlogArticleItem) => {
    setEditingArticle(art);
    setIsEditorOpen(true);
  };

  const handleSaveArticle = async (data: Partial<BlogArticleItem>) => {
    if (editingArticle) {
      await updateBlogArticleApi(storeId, editingArticle.id, data);
      toast(isAr ? 'تم تحديث المقال بنجاح!' : 'Article updated successfully!', 'success');
    } else {
      await createBlogArticleApi(storeId, data);
      toast(isAr ? 'تم نشر المقال بنجاح!' : 'Article created successfully!', 'success');
    }
    await loadBlogData();
  };

  // Open Preview
  const handleOpenArticlePreview = (art: BlogArticleItem) => {
    setPreviewArticle(art);
    setPreviewMode('article');
    setIsPreviewOpen(true);
  };

  const handleOpenBlogPreview = () => {
    setPreviewMode('blog_list');
    setPreviewArticle(null);
    setIsPreviewOpen(true);
  };

  // Category Color mapping matching image 1
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Home Decor':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-900';
      case 'Fragrances':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-900';
      case 'Lifestyle':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900';
      case 'Guides':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-900';
      case 'Wellness':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-900';
      case 'Science':
        return 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200/80 dark:border-violet-900';
      case 'Products':
        return 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200/80 dark:border-sky-900';
      default:
        return 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/80 dark:border-teal-900';
    }
  };

  return (
    <AdminPageShell className="pb-16 max-w-[1600px] mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
        {/* 1. Header and Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isAr ? 'المدونة (المقالات)' : 'Blog (Articles)'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? 'إنشاء وإدارة مقالات المدونة لجذب جمهورك وتعزيز نتائج محركات البحث (SEO).'
              : 'Create and manage your blog posts to engage your audience and boost your SEO.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Search Articles input */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث في المقالات...' : 'Search articles...'}
              className="w-full ps-9 pe-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Preview Blog button */}
            <button
              type="button"
              onClick={handleOpenBlogPreview}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Eye className="w-4 h-4" />
              <span>{isAr ? 'معاينة المدونة' : 'Preview Blog'}</span>
            </button>

            {/* Add New Article button */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة مقال جديد' : 'Add New Article'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Summary Metric Cards (Exact 4 Cards in Image 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Articles */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/60 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isAr ? 'إجمالي المقالات' : 'Total Articles'}
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {metrics.total_articles}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <span>↑</span>
              <span>{metrics.weekly_articles_growth || '+2 this week'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Views */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-100 dark:border-teal-900/60 shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isAr ? 'إجمالي المشاهدات' : 'Total Views'}
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {metrics.total_views.toLocaleString()}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <span>↑</span>
              <span>{metrics.weekly_views_growth || '18% this week'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Comments */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60 shrink-0">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isAr ? 'إجمالي التعليقات' : 'Total Comments'}
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {metrics.total_comments}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <span>↑</span>
              <span>{metrics.weekly_comments_growth || '12% this week'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Published & Drafts */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1 flex items-center justify-between pe-2">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isAr ? 'المنشورة' : 'Published'}
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {metrics.published}
              </div>
            </div>
            <div className="border-s border-slate-200 dark:border-slate-800 ps-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isAr ? 'المسودات' : 'Drafts'}
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {metrics.drafts}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Table & Filters) + Right Column (Featured, Settings, SEO) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols in 12-grid on xl+, full width on mobile/tablet/laptop) */}
        <div className="xl:col-span-8 space-y-4 min-w-0">
          {/* Search and Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'بحث في المقالات بالعنوان، الوسوم أو المحتوى...'
                    : 'Search articles by title, tags or content...'
                }
                className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
              {/* Category Filter */}
              <div className="relative w-full">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none ps-3 pe-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-2xs truncate"
                >
                  <option value="All Categories">{isAr ? 'جميع التصنيفات' : 'All Categories'}</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative w-full">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full appearance-none ps-3 pe-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-2xs truncate"
                >
                  <option value="All Statuses">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
                  <option value="Published">{isAr ? 'منشور (Published)' : 'Published'}</option>
                  <option value="Draft">{isAr ? 'مسودة (Draft)' : 'Draft'}</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Date Range Filter */}
              <div className="relative w-full">
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="w-full appearance-none ps-3 pe-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-2xs truncate"
                >
                  <option value="Last 30 Days">{isAr ? 'آخر 30 يوماً' : 'Last 30 Days'}</option>
                  <option value="Last 7 Days">{isAr ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
                  <option value="This Month">{isAr ? 'هذا الشهر' : 'This Month'}</option>
                  <option value="All Time">{isAr ? 'كل الفترات' : 'All Time'}</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar & View Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value as any)}
                  className="w-full sm:w-auto appearance-none ps-3 pe-8 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="bulk">{isAr ? 'إجراءات جماعية' : 'Bulk Actions'}</option>
                  <option value="publish">{isAr ? 'نشر المحدد' : 'Publish'}</option>
                  <option value="draft">{isAr ? 'تحويل لمسودة' : 'Move to Draft'}</option>
                  <option value="delete">{isAr ? 'حذف المحدد' : 'Delete'}</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={handleApplyBulk}
                disabled={isApplyingBulk || selectedIds.length === 0}
                className="px-3.5 py-1.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap"
              >
                {isApplyingBulk ? (isAr ? 'تطبيق...' : 'Applying...') : isAr ? 'تطبيق' : 'Apply'}
              </button>

              {selectedIds.length > 0 && (
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold ps-1">
                  ({selectedIds.length} {isAr ? 'محدد' : 'selected'})
                </span>
              )}
            </div>

            {/* View Switcher */}
            <div className="flex items-center self-end sm:self-auto bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Article List / Table */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 space-y-3 shadow-2xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600" />
              <p className="text-xs">{isAr ? 'جاري تحميل المقالات من الخادم...' : 'Loading articles from database...'}</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 space-y-3 shadow-2xs">
              <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {isAr ? 'لم يتم العثور على أي مقالات تطابق البحث' : 'No records found matching your filters.'}
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إضافة مقال جديد الآن' : 'Add First Article'}</span>
              </button>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto custom-scroll">
                <table className="w-full text-left rtl:text-right border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={
                            filteredArticles.length > 0 &&
                            selectedIds.length === filteredArticles.length
                          }
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                        />
                      </th>
                      <th className="py-3 px-3">{isAr ? 'العنوان' : 'Title'}</th>
                      <th className="py-3 px-3">{isAr ? 'التصنيف' : 'Category'}</th>
                      <th className="py-3 px-3">{isAr ? 'الكاتب' : 'Author'}</th>
                      <th className="py-3 px-3">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="py-3 px-3 text-center">{isAr ? 'المشاهدات' : 'Views'}</th>
                      <th className="py-3 px-3 text-center">{isAr ? 'التعليقات' : 'Comments'}</th>
                      <th className="py-3 px-3">{isAr ? 'التاريخ' : 'Date'}</th>
                      <th className="py-3 px-3 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {filteredArticles.map((art) => {
                      const isSelected = selectedIds.includes(art.id);
                      return (
                        <tr
                          key={art.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            isSelected ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(art.id)}
                              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                            />
                          </td>
                          {/* Title & Thumbnail */}
                          <td className="py-3 px-3 max-w-[280px]">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                                <img
                                  src={art.thumbnail}
                                  alt={art.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 dark:text-white leading-tight truncate">
                                  {art.title}
                                </h4>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                  {art.excerpt}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getCategoryBadgeClass(
                                art.category
                              )}`}
                            >
                              {art.category}
                            </span>
                          </td>

                          {/* Author */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <img
                                src={art.author?.avatar}
                                alt={art.author?.name}
                                className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                              />
                              <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                                {art.author?.name}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                art.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {art.status === 'published'
                                ? isAr
                                  ? 'منشور'
                                  : 'Published'
                                : isAr
                                ? 'مسودة'
                                : 'Draft'}
                            </span>
                          </td>

                          {/* Views */}
                          <td className="py-3 px-3 text-center whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                            {art.views.toLocaleString()}
                          </td>

                          {/* Comments */}
                          <td className="py-3 px-3 text-center whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                            {art.comments}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400">
                            {art.published_at}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(art)}
                                className="p-1.5 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title={isAr ? 'تعديل المقال' : 'Edit Article'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Commerce Tools */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (onOpenCommerceTools) {
                                    onOpenCommerceTools(art.id);
                                  } else if (onNavigateTab) {
                                    onNavigateTab('commerce-tools');
                                  }
                                }}
                                className="p-1.5 text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-lg transition-colors cursor-pointer"
                                title={isAr ? 'أدوات التجارة التفاعلية' : 'Article Commerce Tools'}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>

                              {/* Preview */}
                              <button
                                type="button"
                                onClick={() => handleOpenArticlePreview(art)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title={isAr ? 'معاينة المقال' : 'Preview Article'}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteArticle(art)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                title={isAr ? 'حذف المقال' : 'Delete Article'}
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

              {/* Pagination matching Image 1 */}
              <div className="px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <div>
                  {isAr
                    ? `عرض 1 إلى ${filteredArticles.length} من ${filteredArticles.length} مقالات`
                    : `Showing 1 to ${filteredArticles.length} of ${filteredArticles.length} articles`}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 opacity-60 cursor-not-allowed"
                  >
                    &lt;
                  </button>
                  <button
                    type="button"
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-teal-600 text-white font-bold"
                  >
                    1
                  </button>
                  <button
                    type="button"
                    disabled
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 opacity-60 cursor-not-allowed"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.map((art) => (
                <div
                  key={art.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col justify-between"
                >
                  <div className="aspect-16/9 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                    <img src={art.thumbnail} alt={art.title} className="w-full h-full object-cover" />
                    <span
                      className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-xs ${getCategoryBadgeClass(
                        art.category
                      )}`}
                    >
                      {art.category}
                    </span>
                  </div>
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                        {art.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{art.excerpt}</p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={art.author?.avatar}
                          alt={art.author?.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span>{art.author?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(art)}
                          className="text-slate-500 hover:text-teal-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenArticlePreview(art)}
                          className="text-slate-500 hover:text-blue-600"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(art)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: 3 Panels matching Image 1 (Featured Article, Post Settings, SEO Settings) */}
        <div className="xl:col-span-4 space-y-4 min-w-0">
          {/* Panel 1: Featured Article Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Star className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'المقال المميز' : 'Featured Article'}</span>
            </div>

            {featuredArticle ? (
              <div className="space-y-3">
                <div className="aspect-16/10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                  <img
                    src={featuredArticle.thumbnail}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                    {featuredArticle.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {featuredArticle.excerpt}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(featuredArticle)}
                  className="w-full py-2 px-3 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تعديل المقال' : 'Edit Article'}</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                {isAr ? 'لم يتم تعيين مقال مميز حالياً' : 'No featured article selected.'}
              </p>
            )}
          </div>

          {/* Panel 2: Post Settings Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Settings className="w-4 h-4 text-slate-500" />
              <span>{isAr ? 'إعدادات المنشورات' : 'Post Settings'}</span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Blog Layout */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'تنسيق المدونة' : 'Blog Layout'}
                </label>
                <div className="relative">
                  <select
                    value={postSettings.layout}
                    onChange={(e) =>
                      setPostSettings((prev) => ({ ...prev, layout: e.target.value as any }))
                    }
                    className="w-full appearance-none ps-3 pe-7 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="Large Image + Excerpt">Large Image + Excerpt</option>
                    <option value="Grid 2-Column">Grid 2-Column</option>
                    <option value="Grid 3-Column">Grid 3-Column</option>
                    <option value="Compact List">Compact List</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Articles per page */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'عدد المقالات في الصفحة' : 'Articles per page'}
                </label>
                <div className="relative">
                  <select
                    value={postSettings.articles_per_page}
                    onChange={(e) =>
                      setPostSettings((prev) => ({
                        ...prev,
                        articles_per_page: Number(e.target.value),
                      }))
                    }
                    className="w-full appearance-none ps-3 pe-7 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Order by */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'الترتيب حسب' : 'Order by'}
                </label>
                <div className="relative">
                  <select
                    value={postSettings.order_by}
                    onChange={(e) =>
                      setPostSettings((prev) => ({ ...prev, order_by: e.target.value as any }))
                    }
                    className="w-full appearance-none ps-3 pe-7 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="Latest">Latest</option>
                    <option value="Most Viewed">Most Viewed</option>
                    <option value="Most Commented">Most Commented</option>
                    <option value="Title A-Z">Title A-Z</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Sort order */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'اتجاه الترتيب' : 'Sort order'}
                </label>
                <div className="relative">
                  <select
                    value={postSettings.sort_order}
                    onChange={(e) =>
                      setPostSettings((prev) => ({ ...prev, sort_order: e.target.value as any }))
                    }
                    className="w-full appearance-none ps-3 pe-7 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="Descending">Descending</option>
                    <option value="Ascending">Ascending</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3: SEO Settings Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between text-slate-900 dark:text-white font-bold text-sm">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-500" />
                <span>{isAr ? 'إعدادات السيو' : 'SEO Settings'}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Enable SEO toggle */}
              <div className="flex items-center justify-between py-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'تفعيل السيو' : 'Enable SEO'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seoSettings.enabled}
                    onChange={(e) =>
                      setSeoSettings((prev) => ({ ...prev, enabled: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {/* Meta Title */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'عنوان السيو (Meta Title)' : 'Meta Title'}
                </label>
                <input
                  type="text"
                  value={seoSettings.meta_title}
                  onChange={(e) =>
                    setSeoSettings((prev) => ({ ...prev, meta_title: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Meta Description */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'وصف السيو (Meta Description)' : 'Meta Description'}
                </label>
                <textarea
                  rows={3}
                  value={seoSettings.meta_description}
                  onChange={(e) =>
                    setSeoSettings((prev) => ({ ...prev, meta_description: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed"
                />
              </div>

              {/* Focus Keyword */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'الكلمة المفتاحية المستهدفة' : 'Focus Keyword'}
                </label>
                <input
                  type="text"
                  value={seoSettings.focus_keyword}
                  onChange={(e) =>
                    setSeoSettings((prev) => ({ ...prev, focus_keyword: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Save Settings Button */}
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full py-2.5 px-3 bg-teal-100 hover:bg-teal-200 dark:bg-teal-950/70 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-teal-300/80 dark:border-teal-800 shadow-2xs mt-2"
              >
                <Save className="w-4 h-4" />
                <span>
                  {savingSettings
                    ? isAr
                      ? 'جاري الحفظ...'
                      : 'Saving...'
                    : isAr
                    ? 'حفظ الإعدادات'
                    : 'Save Settings'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Article Creation / Editing Modal */}
      <ArticleEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        article={editingArticle}
        onSave={handleSaveArticle}
        categories={categoriesList}
        onOpenCommerceTools={(artId) => {
          if (onOpenCommerceTools) {
            onOpenCommerceTools(artId);
          } else if (onNavigateTab) {
            onNavigateTab('commerce-tools');
          }
        }}
      />

      {/* Customer-Facing Live Article Preview Modal */}
      <ArticlePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        article={previewArticle}
        allArticles={articles}
        postSettings={postSettings}
        seoSettings={seoSettings}
        mode={previewMode}
      />
      </div>
    </AdminPageShell>
  );
};
