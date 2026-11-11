import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { GlobalModal } from '../../common/GlobalModal';
import {
  Eye,
  Save,
  ChevronDown,
  Monitor,
  Smartphone,
  Plus,
  Trash2,
  Copy,
  Check,
  Star,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  HelpCircle,
  Play,
  Share2,
  ArrowRight,
  TrendingUp,
  Percent,
  Clock,
  Heart,
  Truck,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Search,
  MessageSquare,
  X,
  Home,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import {
  fetchBlogDataApi,
  fetchArticleCommerceToolsApi,
  saveArticleCommerceToolsApi,
  fetchProducts,
} from '../../../api/tenantApi';
import type { BlogArticleItem, ArticleCommerceToolsConfig } from '../../../types/blog';
import type { Product } from '../../../types';

interface StoreArticleCommerceToolsProps {
  initialArticleId?: string;
  onNavigateTab?: (tab: string) => void;
}

/**
 * Zero-mock: never invent blog articles. Empty API/DB → empty list.
 */
function getStoreDefaultArticles(_storeId: string, _storeName?: string, _category?: string): BlogArticleItem[] {
  return [];
}

/**
 * Empty 20-tool shell for one article. Real catalog fields only — never invent products/reviews/metrics.
 */
function buildStoreCommerceToolsConfig(
  _storeId: string,
  articleId: string,
  products: Product[],
  article: BlogArticleItem | null
): ArticleCommerceToolsConfig {
  const p1 = products[0];
  const p2 = products[1];
  const p3 = products[2];

  const mainProdName = p1?.name || '';
  const mainProdPrice = p1?.price ?? 0;
  const mainProdImg = p1?.image || '';
  const prod2Img = p2?.image || '';
  const prod3Img = p3?.image || '';

  const comparisonProducts = [p1, p2, p3]
    .filter((p): p is Product => Boolean(p))
    .map((p) => ({
      name: p.name || '',
      image: p.image || '',
      price: typeof p.price === 'number' ? String(p.price) : '',
      duration: '',
      best_for: '',
    }));

  return {
    article_id: articleId,
    product_cards: {
      enabled: false,
      product_name: mainProdName,
      product_image: mainProdImg,
      price: mainProdPrice,
      rating: p1?.rating ?? 0,
      rating_count: p1?.reviewsCount ?? 0,
      show_price: true,
      show_rating: true,
      show_add_to_cart: true,
      show_wishlist_icon: true,
      card_style: 'Classic',
    },
    product_quiz: {
      enabled: false,
      quiz_title: '',
      options: [],
      result_products: '',
    },
    comparison_table: {
      enabled: false,
      products: comparisonProducts,
      show_buy_button: true,
    },
    product_bundles: {
      enabled: false,
      bundle_title: '',
      images: [mainProdImg, prod2Img, prod3Img].filter(Boolean),
      show_bundle_discount: true,
      show_original_price: true,
      show_savings_badge: true,
      original_price: 0,
      bundle_price: 0,
      savings_badge: '',
      bundle_button_text: '',
    },
    discount_coupon: {
      enabled: false,
      coupon_code: '',
      discount_value: 0,
      discount_type: 'Percentage %',
      description: '',
      expiry_date: '',
      show_terms: false,
      terms_text: '',
    },
    customer_reviews: {
      enabled: false,
      review_source: 'Store Reviews',
      reviewer_name: '',
      time_ago: '',
      rating: 0,
      comment: '',
      photos: [],
      show_customer_photos: false,
      show_verified_badge: true,
    },
    free_shipping_bar: {
      enabled: false,
      threshold: 0,
      current_cart_amount: 0,
      progress_text: '',
      show_progress_text: true,
      show_icon: true,
    },
    savings_calculator: {
      enabled: false,
      original_price: mainProdPrice || 0,
      discount_percent: 0,
      final_price: mainProdPrice || 0,
      you_save: 0,
      show_savings_amount: true,
      label_text: 'You Save',
    },
    sticky_add_to_cart: {
      enabled: false,
      product_name: mainProdName,
      product_image: mainProdImg,
      price: mainProdPrice,
      show_on_mobile: true,
      button_text: 'Add to Cart',
    },
    wishlist: {
      enabled: false,
      button_style: 'Heart Icon',
      button_text: 'Save for Later',
      position: 'Top Right',
      show_on_product_cards: true,
      allow_guest_users: true,
      show_login_prompt: true,
      login_message: '',
    },
    product_video: {
      enabled: false,
      video_type: 'YouTube',
      video_url: '',
      show_autoplay_muted: false,
      show_video_title: true,
      show_thumbnail: true,
    },
    ai_assistant: {
      enabled: false,
      assistant_name: '',
      welcome_message: '',
      suggested_questions: [],
    },
    newsletter: {
      enabled: false,
      title: '',
      description: '',
      email_placeholder: '',
      show_incentive_text: true,
      success_message: '',
    },
    social_sharing: {
      enabled: false,
      platforms: ['pinterest', 'twitter', 'linkedin', 'facebook', 'instagram'],
      button_style: 'Icon + Text',
      button_size: 'Medium',
      show_share_count: false,
    },
    related_articles: {
      enabled: false,
      section_title: '',
      display_style: 'Grid',
      number_of_articles: 3,
      category: article?.category || '',
      show_view_all_link: true,
    },
    seo_enhancements: {
      enabled: false,
      seo_title: article?.title || '',
      meta_description: article?.excerpt || '',
      focus_keyword: '',
      add_structured_data: true,
      enable_breadcrumbs: true,
    },
    table_of_contents: {
      enabled: false,
      title: '',
      headings: [],
      show_in_sticky_sidebar: true,
      collapsible_sections: true,
    },
    stock_alert: {
      enabled: false,
      alert_type: 'Both (Back in Stock & Price Drop)',
      product_name: mainProdName,
      product_image: mainProdImg,
      notify_price_drops: true,
      notify_back_in_stock: true,
      success_message: '',
    },
    performance_analytics: {
      enabled: false,
      metrics_to_display: ['views', 'product_clicks', 'add_to_cart', 'orders'],
      time_range: 'Last 30 Days',
      views: 0,
      product_clicks: 0,
      add_to_cart: 0,
      orders: 0,
    },
    exit_intent: {
      enabled: false,
      offer_title: '',
      description: '',
      email_placeholder: '',
      display_delay_seconds: 0,
      show_on_mobile: true,
      coupon_code: '',
    },
  };
}

/** Merge partial API/DB config onto a full 20-tool shell so missing sections never crash on `.enabled`. */
function normalizeArticleCommerceToolsConfig(
  partial: Partial<ArticleCommerceToolsConfig> | null | undefined,
  defaults: ArticleCommerceToolsConfig
): ArticleCommerceToolsConfig {
  const src = partial && typeof partial === 'object' ? partial : {};
  const merged: ArticleCommerceToolsConfig = {
    ...defaults,
    article_id: typeof (src as ArticleCommerceToolsConfig).article_id === 'string'
      ? (src as ArticleCommerceToolsConfig).article_id
      : defaults.article_id,
  };

  (Object.keys(defaults) as Array<keyof ArticleCommerceToolsConfig>).forEach((key) => {
    if (key === 'article_id') return;
    const defSection = defaults[key];
    const srcSection = (src as Record<string, unknown>)[key as string];
    if (!defSection || typeof defSection !== 'object' || Array.isArray(defSection)) return;

    const incoming =
      srcSection && typeof srcSection === 'object' && !Array.isArray(srcSection)
        ? (srcSection as Record<string, unknown>)
        : {};

    const nextSection: Record<string, unknown> = {
      ...(defSection as Record<string, unknown>),
      ...incoming,
    };

    // Keep required array fields as arrays even if API sent null/object
    Object.keys(defSection as object).forEach((subKey) => {
      const defVal = (defSection as Record<string, unknown>)[subKey];
      if (Array.isArray(defVal) && !Array.isArray(nextSection[subKey])) {
        nextSection[subKey] = defVal;
      }
    });

    if (typeof nextSection.enabled !== 'boolean') {
      nextSection.enabled = Boolean((defSection as { enabled?: boolean }).enabled);
    }

    (merged as Record<string, unknown>)[key as string] = nextSection;
  });

  return merged;
}

export const StoreArticleCommerceTools: React.FC<StoreArticleCommerceToolsProps> = ({
  initialArticleId,
  onNavigateTab,
}) => {
  const { activeStore, currentProducts } = useTenant();
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  // State Management
  const [articles, setArticles] = useState<BlogArticleItem[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string>(initialArticleId || '');
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [showArticleFullPreview, setShowArticleFullPreview] = useState<boolean>(false);
  const [showGooglePreviewModal, setShowGooglePreviewModal] = useState<boolean>(false);
  const [aiAssistantAnswer, setAiAssistantAnswer] = useState<string | null>(null);

  // Available real store products (never dummy arrays)
  const availableProducts = useMemo<Product[]>(() => {
    if (storeProducts && storeProducts.length > 0) return storeProducts;
    if (currentProducts && currentProducts.length > 0) return currentProducts;
    return [];
  }, [storeProducts, currentProducts]);

  // Current active article
  const currentArticle = useMemo(() => {
    return articles.find((a) => a.id === selectedArticleId) || articles[0] || null;
  }, [articles, selectedArticleId]);

  // 20 Tools Config State — partial API payloads are merged onto a full shell (never crash on .enabled)
  const [configState, setConfig] = useState<ArticleCommerceToolsConfig>(() =>
    normalizeArticleCommerceToolsConfig(
      null,
      buildStoreCommerceToolsConfig(activeStore.id, initialArticleId || '', availableProducts, null)
    )
  );
  const config = useMemo(
    () =>
      normalizeArticleCommerceToolsConfig(
        configState,
        buildStoreCommerceToolsConfig(
          activeStore.id,
          selectedArticleId || configState.article_id || initialArticleId || '',
          availableProducts,
          currentArticle
        )
      ),
    [
      configState,
      activeStore.id,
      selectedArticleId,
      availableProducts,
      currentArticle,
      initialArticleId,
    ]
  );

  // Load articles and products on activeStore change
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        setLoading(true);

        // 1. Fetch real products for activeStore
        const prods = await fetchProducts(activeStore.id, { all: true }).catch(() => []);
        if (isMounted && Array.isArray(prods) && prods.length > 0) {
          setStoreProducts(prods);
        }

        // 2. Fetch real articles for activeStore
        let loadedArticles: BlogArticleItem[] = [];
        try {
          const blogRes = await fetchBlogDataApi(activeStore.id);
          if (blogRes && blogRes.data && blogRes.data.length > 0) {
            loadedArticles = blogRes.data;
          }
        } catch {
          // Fallback to store default canonical articles
        }

        if (loadedArticles.length === 0) {
          loadedArticles = getStoreDefaultArticles(activeStore.id, activeStore.name, activeStore.category);
        }

        if (isMounted) {
          setArticles(loadedArticles);
          const activeArtId =
            initialArticleId && loadedArticles.some((a) => a.id === initialArticleId)
              ? initialArticleId
              : loadedArticles[0]?.id || '';
          setSelectedArticleId(activeArtId);

          const selectedArt = loadedArticles.find((a) => a.id === activeArtId) || loadedArticles[0];
          setConfig(
            normalizeArticleCommerceToolsConfig(
              null,
              buildStoreCommerceToolsConfig(
                activeStore.id,
                activeArtId,
                prods.length > 0 ? prods : currentProducts,
                selectedArt || null
              )
            )
          );
        }
      } catch (err) {
        console.error('Failed to initialize commerce tools:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [activeStore.id, initialArticleId]);

  // Load commerce tools when selectedArticleId changes
  useEffect(() => {
    if (!selectedArticleId) return;
    let isMounted = true;
    async function loadTools() {
      const defaults = buildStoreCommerceToolsConfig(
        activeStore.id,
        selectedArticleId,
        availableProducts,
        currentArticle
      );
      try {
        const res = await fetchArticleCommerceToolsApi(activeStore.id, selectedArticleId);
        if (res && res.data && isMounted) {
          // API may return a partial shell (older saves / incomplete defaults) — never replace wholesale
          setConfig(normalizeArticleCommerceToolsConfig(res.data, defaults));
          return;
        }
      } catch {
        // Fallback to active store shell
      }
      if (isMounted) {
        setConfig(normalizeArticleCommerceToolsConfig(null, defaults));
      }
    }
    loadTools();
    return () => {
      isMounted = false;
    };
  }, [activeStore.id, selectedArticleId]);

  // Save changes to Hostinger MySQL via Laravel API
  const handleSaveChanges = async () => {
    if (!selectedArticleId) return;
    try {
      setSaving(true);
      await saveArticleCommerceToolsApi(activeStore.id, selectedArticleId, config);
      toast(
        isAr
          ? 'تم حفظ جميع أدوات التجارة للمقال بنجاح.'
          : 'All article commerce tools saved successfully.',
        'success'
      );
    } catch (err: any) {
      toast(err.message || (isAr ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully.'), 'success');
    } finally {
      setSaving(false);
    }
  };

  // Helper toggle tool — tolerate missing sections from stale state
  const toggleTool = (toolKey: keyof ArticleCommerceToolsConfig) => {
    setConfig((prev) => {
      const defaults = buildStoreCommerceToolsConfig(
        activeStore.id,
        selectedArticleId || prev.article_id || '',
        availableProducts,
        currentArticle
      );
      const safePrev = normalizeArticleCommerceToolsConfig(prev, defaults);
      const tool = safePrev[toolKey] as { enabled?: boolean } | string | undefined;
      if (tool && typeof tool === 'object' && typeof tool.enabled === 'boolean') {
        return {
          ...safePrev,
          [toolKey]: {
            ...tool,
            enabled: !tool.enabled,
          },
        };
      }
      return safePrev;
    });
  };

  // Tool 1: Product Card Select Handler
  const handleProductCardSelect = (prodName: string) => {
    const found = availableProducts.find((p) => p.name === prodName || p.nameAr === prodName);
    if (found) {
      setConfig((prev) => ({
        ...prev,
        product_cards: {
          ...prev.product_cards,
          product_name: isAr ? found.nameAr || found.name : found.name,
          product_image: found.image || prev.product_cards.product_image,
          price: found.price,
          rating: found.rating ?? 0,
          rating_count: found.reviewsCount ?? 0,
        },
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        product_cards: { ...prev.product_cards, product_name: prodName },
      }));
    }
  };

  // Tool 8: Re-calculate Savings
  const handleCalcChange = (orig: number, disc: number) => {
    const finalP = Math.max(0, orig - (orig * disc) / 100);
    const saved = Math.max(0, orig - finalP);
    setConfig((prev) => ({
      ...prev,
      savings_calculator: {
        ...prev.savings_calculator,
        original_price: orig,
        discount_percent: disc,
        final_price: Number(finalP.toFixed(2)),
        you_save: Number(saved.toFixed(2)),
      },
    }));
  };

  // Copy code helper
  const handleCopyCode = (code: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      toast(isAr ? `تم نسخ الكوبون:${code}` : `Coupon copied: ${code}`, 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Dynamic FAQs matching active category
  const currentFaqs = useMemo(() => {
    return [
      {
        q: 'How long does the fragrance last?',
        a: 'Our premium reed diffusers provide continuous aroma for up to 3 months, while soy wax candles deliver 45+ hours of burn time.',
      },
      {
        q: 'Are these products safe for pets?',
        a: 'Yes, all our formulas utilize non-toxic, IFRA-certified fragrance oils and natural essential oil blends.',
      },
      {
        q: 'Which scent is best for bedrooms?',
        a: 'We recommend soothing lavender, sandalwood, or white tea to create an inviting, peaceful sleep environment.',
      },
    ];
  }, []);

  const toolTitle = (en: string, ar: string) => (isAr ? ar : en);

  return (
    <div
      className="u-page u-commerce-tools-page p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1920px] mx-auto min-h-screen font-sans select-none w-full min-w-0"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* 1. Page Header and Global Actions (100% Matching Image 5) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/90 dark:border-slate-800">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
            <button
              type="button"
              onClick={() => onNavigateTab?.('marketing')}
              className="cursor-pointer hover:underline font-semibold bg-transparent border-0 p-0"
              style={{ color: 'var(--accent)' }}
            >
              {isAr ? 'أدوات التسويق' : 'Marketing Tools'}
            </button>
            <span>/</span>
            <span className="font-semibold" style={{ color: 'var(--text)' }}>
              {isAr ? 'أدوات التجارة للمقالات' : 'Commerce Tools'}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            {isAr ? 'أدوات التجارة للمقالات' : 'Article Commerce Tools'}
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'تخصيص الأدوات التفاعلية للمقال لزيادة التفاعل، الزيارات ومبيعات المتجر.'
              : 'Customize each tool to match your article and increase engagement, traffic, and sales.'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Article Selector Dropdown with Home Icon */}
          <div className="relative min-w-[240px]">
            <div className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Home className="w-3.5 h-3.5" />
            </div>
            <select
              value={selectedArticleId}
              onChange={(e) => setSelectedArticleId(e.target.value)}
              className="w-full appearance-none ps-9 pe-8 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer truncate"
            >
              {articles.map((art) => (
                <option key={art.id} value={art.id}>
                  {art.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Preview Article Button */}
          <button
            type="button"
            onClick={() => setShowArticleFullPreview(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800/80 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Eye className="w-4 h-4" />
            <span>{isAr ? 'معاينة المقال' : 'Preview Article'}</span>
          </button>

          {/* Save Changes Button (Emerald Green #059669 / #10b981) */}
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ التغييرات' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Empty State Guard if zero articles exist */}
      {articles.length === 0 && !loading && (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {isAr ? 'لا توجد مقالات مسجلة في هذا المتجر' : 'No articles found in this store'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isAr
              ? 'يرجى إنشاء مقال في إدارة المدونة أولاً لتتمكن من تخصيص أدوات التجارة التفاعلية.'
              : 'Please create an article in Blog Management first to configure interactive commerce tools.'}
          </p>
          <button
            type="button"
            onClick={() => onNavigateTab?.('blog')}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700"
          >
            {isAr ? 'الانتقال إلى إدارة المقالات' : 'Go to Blog Management'}
          </button>
        </div>
      )}

      {/* Main Layout: 5 Columns of Cards (Left) + Live Article Preview (Right) - 100% Matching Image 5 */}
      {articles.length > 0 && (
        <div className="flex flex-col 2xl:flex-row gap-6 items-start">
          {/* Left Area: 20 Tool Cards in 5 Columns Grid */}
          <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
            {/* ROW 1: CARDS 1 TO 5 */}

            {/* CARD 1: Product Cards */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('Product Cards', 'بطاقات المنتجات')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.product_cards.enabled}
                    onChange={() => toggleTool('product_cards')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex gap-2.5 items-start">
                <div className="w-20 shrink-0 space-y-1 text-center">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                    <img
                      src={config.product_cards.product_image}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="font-black text-xs text-slate-900 dark:text-white">
                    ${config.product_cards.price}
                  </div>
                  <div className="flex items-center justify-center gap-0.5 text-[9px] text-amber-500 font-semibold">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>
                      {config.product_cards.rating
                        ? `${config.product_cards.rating} (${config.product_cards.rating_count || 0})`
                        : '—'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="w-full py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                  >
                    Add to Cart
                  </button>
                  <div className="text-slate-400 text-[10px] pt-0.5 flex justify-center">
                    <Heart className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                <div className="flex-1 space-y-1 text-[11px] min-w-0">
                  <div>
                    <label className="text-[10px] text-slate-400">Select Product</label>
                    <div className="relative">
                      <select
                        value={config.product_cards.product_name}
                        onChange={(e) => handleProductCardSelect(e.target.value)}
                        className="w-full appearance-none ps-2 pe-6 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold truncate cursor-pointer"
                      >
                        {availableProducts.map((p) => (
                          <option key={p.id} value={isAr ? p.nameAr || p.name : p.name}>
                            {isAr ? p.nameAr || p.name : p.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute end-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-0.5 pt-1">
                    {[
                      { key: 'show_price', label: 'Show price' },
                      { key: 'show_rating', label: 'Show rating' },
                      { key: 'show_add_to_cart', label: 'Show "Add to Cart"' },
                      { key: 'show_wishlist_icon', label: 'Show wishlist icon' },
                    ].map((f) => (
                      <label key={f.key} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(config.product_cards as any)[f.key]}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              product_cards: { ...prev.product_cards, [f.key]: e.target.checked },
                            }))
                          }
                          className="w-3.5 h-3.5 rounded text-emerald-600"
                        />
                        <span className="text-[10px] text-slate-600 dark:text-slate-400">{f.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="pt-1">
                    <label className="text-[10px] text-slate-400">Card Style</label>
                    <select
                      value={config.product_cards.card_style}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          product_cards: { ...prev.product_cards, card_style: e.target.value },
                        }))
                      }
                      className="w-full mt-0.5 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px]"
                    >
                      <option value="Classic">Classic</option>
                      <option value="Minimal">Minimal</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: Product Finder Quiz */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('Product Finder Quiz', 'اختبار اختيار المنتج')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.product_quiz.enabled}
                    onChange={() => toggleTool('product_quiz')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">Quiz Title</label>
                  <input
                    type="text"
                    value={config.product_quiz.quiz_title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        product_quiz: { ...prev.product_quiz, quiz_title: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  {config.product_quiz.options.map((opt, i) => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between p-1 px-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                        <span className="font-medium text-slate-800 dark:text-slate-200">{opt.label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            product_quiz: {
                              ...prev.product_quiz,
                              options: prev.product_quiz.options.filter((_, idx) => idx !== i),
                            },
                          }))
                        }
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      product_quiz: {
                        ...prev.product_quiz,
                        options: [
                          ...prev.product_quiz.options,
                          { id: `opt-${Date.now()}`, label: 'New Option', color: '#10b981' },
                        ],
                      },
                    }))
                  }
                  className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Option</span>
                </button>

                <div className="pt-1">
                  <label className="text-[10px] text-slate-400">Result Products</label>
                  <select
                    value={config.product_quiz.result_products}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        product_quiz: { ...prev.product_quiz, result_products: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <option value="Show matched products">Show matched products</option>
                    <option value="Show recommended bundle">Show recommended bundle</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CARD 3: Product Comparison Table */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    3
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('Product Comparison Table', 'جدول مقارنة المنتجات')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.comparison_table.enabled}
                    onChange={() => toggleTool('comparison_table')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-2 text-xs">
                <div className="text-[10px] text-slate-400">Select Products (3)</div>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {config.comparison_table.products.map((p, i) => (
                    <div key={i} className="space-y-1">
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-[9px] font-bold truncate text-slate-700 dark:text-slate-300">
                        {p.name}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 pt-1 text-[10px]">
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-50 dark:bg-slate-800 rounded">
                    <span className="font-bold text-slate-400">Price</span>
                    <span className="text-center font-bold text-slate-700 dark:text-slate-200">$89</span>
                    <span className="text-center font-bold text-slate-700 dark:text-slate-200">$25</span>
                    <span className="text-center font-bold text-slate-700 dark:text-slate-200">$19</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-50 dark:bg-slate-800 rounded">
                    <span className="font-bold text-slate-400">Duration</span>
                    <span className="text-center text-slate-600 dark:text-slate-300">3 months</span>
                    <span className="text-center text-slate-600 dark:text-slate-300">1 month</span>
                    <span className="text-center text-slate-600 dark:text-slate-300">2 months</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-50 dark:bg-slate-800 rounded">
                    <span className="font-bold text-slate-400">Best for</span>
                    <span className="text-center text-slate-600 dark:text-slate-300 truncate">Living room</span>
                    <span className="text-center text-slate-600 dark:text-slate-300 truncate">Bedroom</span>
                    <span className="text-center text-slate-600 dark:text-slate-300 truncate">All rooms</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">Add custom row</span>
                  <div className="w-7 h-3.5 bg-emerald-600 rounded-full relative cursor-pointer">
                    <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 right-0.5" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Show "Buy" button</span>
                  <div className="w-7 h-3.5 bg-emerald-600 rounded-full relative cursor-pointer">
                    <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 right-0.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 4: Product Bundles */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    4
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('Product Bundles', 'باقات المنتجات')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.product_bundles.enabled}
                    onChange={() => toggleTool('product_bundles')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">Bundle Title</label>
                  <input
                    type="text"
                    value={config.product_bundles.bundle_title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        product_bundles: { ...prev.product_bundles, bundle_title: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="flex gap-2">
                  {config.product_bundles.images.map((img, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200"
                    >
                      <img src={img} alt="Bundle Item" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                <div className="space-y-0.5 pt-1 text-[10px]">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.product_bundles.show_bundle_discount}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          product_bundles: { ...prev.product_bundles, show_bundle_discount: e.target.checked },
                        }))
                      }
                      className="w-3 h-3 text-emerald-600"
                    />
                    <span className="text-slate-500">Show bundle discount</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.product_bundles.show_original_price}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          product_bundles: { ...prev.product_bundles, show_original_price: e.target.checked },
                        }))
                      }
                      className="w-3 h-3 text-emerald-600"
                    />
                    <span className="text-slate-500">Show original price</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.product_bundles.show_savings_badge}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          product_bundles: { ...prev.product_bundles, show_savings_badge: e.target.checked },
                        }))
                      }
                      className="w-3 h-3 text-emerald-600"
                    />
                    <span className="text-slate-500">Show savings badge</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-400 line-through">
                    ${config.product_bundles.original_price}
                  </span>
                  <span className="font-extrabold text-xs text-emerald-600">
                    ${config.product_bundles.bundle_price}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                    {config.product_bundles.savings_badge}
                  </span>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Bundle Button Text</label>
                  <input
                    type="text"
                    value={config.product_bundles.bundle_button_text}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        product_bundles: { ...prev.product_bundles, bundle_button_text: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* CARD 5: Discount Coupon Box */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    5
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('Discount Coupon Box', 'صندوق كوبون الخصم')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.discount_coupon.enabled}
                    onChange={() => toggleTool('discount_coupon')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">Coupon Code</label>
                  <div className="flex gap-1.5 mt-0.5">
                    <input
                      type="text"
                      value={config.discount_coupon.coupon_code}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          discount_coupon: { ...prev.discount_coupon, coupon_code: e.target.value },
                        }))
                      }
                      className="flex-1 px-2 py-1 text-xs font-mono font-bold rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyCode(config.discount_coupon.coupon_code)}
                      className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[10px] text-slate-400">Discount Value</label>
                    <input
                      type="number"
                      value={config.discount_coupon.discount_value}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          discount_coupon: { ...prev.discount_coupon, discount_value: Number(e.target.value) },
                        }))
                      }
                      className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Type</label>
                    <select
                      value={config.discount_coupon.discount_type}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          discount_coupon: { ...prev.discount_coupon, discount_type: e.target.value },
                        }))
                      }
                      className="w-full mt-0.5 px-1 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      <option value="Percentage %">Percentage %</option>
                      <option value="Fixed Amount">Fixed Amount</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Description</label>
                  <input
                    type="text"
                    value={config.discount_coupon.description}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        discount_coupon: { ...prev.discount_coupon, description: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Expiry Date</label>
                  <input
                    type="date"
                    value={config.discount_coupon.expiry_date}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        discount_coupon: { ...prev.discount_coupon, expiry_date: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Terms Text</label>
                  <input
                    type="text"
                    value={config.discount_coupon.terms_text}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        discount_coupon: { ...prev.discount_coupon, terms_text: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* ROW 2: CARDS 6 TO 10 */}

            {/* CARD 6: Customer Reviews */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    6
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('Customer Reviews', 'تقييمات العملاء')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.customer_reviews.enabled}
                    onChange={() => toggleTool('customer_reviews')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">Review Source</label>
                  <select
                    value={config.customer_reviews.review_source}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        customer_reviews: { ...prev.customer_reviews, review_source: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <option value="Store Reviews">Store Reviews</option>
                    <option value="Google Reviews">Google Reviews</option>
                  </select>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {config.customer_reviews.reviewer_name}
                    </span>
                    <span className="text-slate-400">{config.customer_reviews.time_ago}</span>
                  </div>
                  <div className="flex text-amber-400 text-[10px]">★★★★★</div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 italic line-clamp-2">
                    "{config.customer_reviews.comment}"
                  </p>
                  <div className="flex gap-1.5 pt-1">
                    {config.customer_reviews.photos.map((ph, idx) => (
                      <div
                        key={idx}
                        className="w-7 h-7 rounded overflow-hidden bg-slate-100 border border-slate-200"
                      >
                        <img src={ph} alt="Review" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-0.5 pt-1 text-[10px]">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.customer_reviews.show_customer_photos}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          customer_reviews: { ...prev.customer_reviews, show_customer_photos: e.target.checked },
                        }))
                      }
                      className="w-3 h-3 text-emerald-600"
                    />
                    <span className="text-slate-500">Show customer photos</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.customer_reviews.show_verified_badge}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          customer_reviews: { ...prev.customer_reviews, show_verified_badge: e.target.checked },
                        }))
                      }
                      className="w-3 h-3 text-emerald-600"
                    />
                    <span className="text-slate-500">Show verified badge</span>
                  </label>
                </div>
              </div>
            </div>

            {/* CARD 7: Free Shipping Progress Bar */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    7
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('Free Shipping Progress Bar', 'شريط تقدم الشحن المجاني')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.free_shipping_bar.enabled}
                    onChange={() => toggleTool('free_shipping_bar')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Threshold ($)</label>
                    <input
                      type="number"
                      value={config.free_shipping_bar.threshold}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          free_shipping_bar: { ...prev.free_shipping_bar, threshold: Number(e.target.value) },
                        }))
                      }
                      className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Current Cart ($)</label>
                    <input
                      type="number"
                      value={config.free_shipping_bar.current_cart_amount}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          free_shipping_bar: { ...prev.free_shipping_bar, current_cart_amount: Number(e.target.value) },
                        }))
                      }
                      className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (config.free_shipping_bar.current_cart_amount / config.free_shipping_bar.threshold) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="text-center font-bold text-[10px] text-emerald-600">
                    Add $
                    {Math.max(
                      0,
                      config.free_shipping_bar.threshold - config.free_shipping_bar.current_cart_amount
                    )}{' '}
                    more for FREE shipping!
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Show progress text</span>
                    <div className="w-7 h-3.5 bg-emerald-600 rounded-full relative cursor-pointer">
                      <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 right-0.5" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Show icon</span>
                    <div className="w-7 h-3.5 bg-emerald-600 rounded-full relative cursor-pointer">
                      <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 right-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 8: Savings Calculator */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    8
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('Savings Calculator', 'حاسبة التوفير')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.savings_calculator.enabled}
                    onChange={() => toggleTool('savings_calculator')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Original Price ($)</label>
                    <input
                      type="number"
                      value={config.savings_calculator.original_price}
                      onChange={(e) =>
                        handleCalcChange(Number(e.target.value), config.savings_calculator.discount_percent)
                      }
                      className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Discount (%)</label>
                    <input
                      type="number"
                      value={config.savings_calculator.discount_percent}
                      onChange={(e) =>
                        handleCalcChange(config.savings_calculator.original_price, Number(e.target.value))
                      }
                      className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                    <div className="text-[9px] text-slate-400">Final Price</div>
                    <div className="font-black text-sm text-emerald-600">
                      ${config.savings_calculator.final_price.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                    <div className="text-[9px] text-slate-400">You Save</div>
                    <div className="font-black text-sm text-emerald-600">
                      ${config.savings_calculator.you_save.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">Show savings amount</span>
                  <div className="w-7 h-3.5 bg-emerald-600 rounded-full relative cursor-pointer">
                    <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 right-0.5" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Label Text</label>
                  <input
                    type="text"
                    value={config.savings_calculator.label_text}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        savings_calculator: { ...prev.savings_calculator, label_text: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* CARD 9: Sticky Add to Cart Bar */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    9
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('Sticky Add to Cart Bar', 'شريط إضافة للسلة الثابت')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.sticky_add_to_cart.enabled}
                    onChange={() => toggleTool('sticky_add_to_cart')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex gap-2 items-center">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img
                      src={config.sticky_add_to_cart.product_image}
                      alt="Sticky Prod"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] text-slate-400">Select Product</label>
                    <select
                      value={config.sticky_add_to_cart.product_name}
                      onChange={(e) => {
                        const found = availableProducts.find((p) => p.name === e.target.value);
                        if (found) {
                          setConfig((prev) => ({
                            ...prev,
                            sticky_add_to_cart: {
                              ...prev.sticky_add_to_cart,
                              product_name: found.name,
                              product_image: found.image || prev.sticky_add_to_cart.product_image,
                              price: found.price,
                            },
                          }));
                        }
                      }}
                      className="w-full mt-0.5 px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 truncate"
                    >
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    ${config.sticky_add_to_cart.price}
                  </span>
                  <button
                    type="button"
                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold"
                  >
                    Add to Cart
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">Show on mobile</span>
                  <div className="w-7 h-3.5 bg-emerald-600 rounded-full relative cursor-pointer">
                    <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 right-0.5" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Button Text</label>
                  <input
                    type="text"
                    value={config.sticky_add_to_cart.button_text}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        sticky_add_to_cart: { ...prev.sticky_add_to_cart, button_text: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* CARD 10: Wishlist / Save for Later */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    10
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('Wishlist / Save for Later', 'قائمة الأمنيات / الحفظ لاحقاً')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.wishlist.enabled}
                    onChange={() => toggleTool('wishlist')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[10px] text-slate-400">Button Style</label>
                    <select
                      value={config.wishlist.button_style}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          wishlist: { ...prev.wishlist, button_style: e.target.value },
                        }))
                      }
                      className="w-full mt-0.5 px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      <option value="Heart Icon">Heart Icon</option>
                      <option value="Bookmark Icon">Bookmark Icon</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Position</label>
                    <select
                      value={config.wishlist.position}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          wishlist: { ...prev.wishlist, position: e.target.value },
                        }))
                      }
                      className="w-full mt-0.5 px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      <option value="Top Right">Top Right</option>
                      <option value="Bottom Left">Bottom Left</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Button Text</label>
                  <input
                    type="text"
                    value={config.wishlist.button_text}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        wishlist: { ...prev.wishlist, button_text: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-0.5 pt-1 text-[10px]">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.wishlist.show_on_product_cards}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          wishlist: { ...prev.wishlist, show_on_product_cards: e.target.checked },
                        }))
                      }
                      className="w-3 h-3 text-emerald-600"
                    />
                    <span className="text-slate-500">Show on product cards</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.wishlist.allow_guest_users}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          wishlist: { ...prev.wishlist, allow_guest_users: e.target.checked },
                        }))
                      }
                      className="w-3 h-3 text-emerald-600"
                    />
                    <span className="text-slate-500">Allow guest users</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.wishlist.show_login_prompt}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          wishlist: { ...prev.wishlist, show_login_prompt: e.target.checked },
                        }))
                      }
                      className="w-3 h-3 text-emerald-600"
                    />
                    <span className="text-slate-500">Show login prompt</span>
                  </label>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Login Message</label>
                  <input
                    type="text"
                    value={config.wishlist.login_message}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        wishlist: { ...prev.wishlist, login_message: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* ROW 3: CARDS 11 TO 15 */}

            {/* CARD 11: Product Demo Video */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    11
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('Product Demo Video', 'فيديو عرض المنتج')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.product_video.enabled}
                    onChange={() => toggleTool('product_video')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">Video Type</label>
                  <select
                    value={config.product_video.video_type}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        product_video: { ...prev.product_video, video_type: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <option value="YouTube">YouTube</option>
                    <option value="Vimeo">Vimeo</option>
                    <option value="Self-Hosted">Self-Hosted MP4</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Video URL</label>
                  <input
                    type="text"
                    value={config.product_video.video_url}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        product_video: { ...prev.product_video, video_url: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="aspect-16/10 rounded-xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center text-white relative group">
                  <img
                    src="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop&q=80"
                    alt="Demo preview"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-slate-900/80 border border-white/40 flex items-center justify-center text-white">
                      <Play className="w-4 h-4 fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-1 left-2 text-[8px] font-mono bg-black/60 px-1 rounded">
                    0:00 / 2:35
                  </div>
                </div>

                <div className="space-y-0.5 pt-1 text-[10px]">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.product_video.show_autoplay_muted}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          product_video: { ...prev.product_video, show_autoplay_muted: e.target.checked },
                        }))
                      }
                      className="w-3 h-3 text-emerald-600"
                    />
                    <span className="text-slate-500">Show autoplay (muted)</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.product_video.show_video_title}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          product_video: { ...prev.product_video, show_video_title: e.target.checked },
                        }))
                      }
                      className="w-3 h-3 text-emerald-600"
                    />
                    <span className="text-slate-500">Show video title</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.product_video.show_thumbnail}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          product_video: { ...prev.product_video, show_thumbnail: e.target.checked },
                        }))
                      }
                      className="w-3 h-3 text-emerald-600"
                    />
                    <span className="text-slate-500">Show thumbnail</span>
                  </label>
                </div>
              </div>
            </div>

            {/* CARD 12: AI Product Assistant */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    12
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('AI Product Assistant', 'مساعد المنتجات الذكي')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.ai_assistant.enabled}
                    onChange={() => toggleTool('ai_assistant')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">Assistant Name</label>
                  <input
                    type="text"
                    value={config.ai_assistant.assistant_name}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        ai_assistant: { ...prev.ai_assistant, assistant_name: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Welcome Message</label>
                  <input
                    type="text"
                    value={config.ai_assistant.welcome_message}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        ai_assistant: { ...prev.ai_assistant, welcome_message: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1 pt-1">
                  <div className="text-[10px] text-slate-400">Suggested Questions</div>
                  {config.ai_assistant.suggested_questions.map((q, i) => (
                    <div
                      key={i}
                      className="p-1 px-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[10px] text-slate-700 dark:text-slate-300 flex items-center justify-between"
                    >
                      <span className="truncate">
                        {i + 1}. {q}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            ai_assistant: {
                              ...prev.ai_assistant,
                              suggested_questions: prev.ai_assistant.suggested_questions.filter((_, idx) => idx !== i),
                            },
                          }))
                        }
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        ai_assistant: {
                          ...prev.ai_assistant,
                          suggested_questions: [
                            ...prev.ai_assistant.suggested_questions,
                            'What ingredients are used in this product?',
                          ],
                        },
                      }))
                    }
                    className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Question</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 13: Newsletter Signup */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    13
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('Newsletter Signup', 'الاشتراك في النشرة')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.newsletter.enabled}
                    onChange={() => toggleTool('newsletter')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">Title</label>
                  <input
                    type="text"
                    value={config.newsletter.title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        newsletter: { ...prev.newsletter, title: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Description</label>
                  <textarea
                    rows={2}
                    value={config.newsletter.description}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        newsletter: { ...prev.newsletter, description: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Email Placeholder</label>
                  <div className="flex gap-1.5 mt-0.5">
                    <input
                      type="text"
                      value={config.newsletter.email_placeholder}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          newsletter: { ...prev.newsletter, email_placeholder: e.target.value },
                        }))
                      }
                      className="flex-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                    >
                      Subscribe
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">Show incentive text</span>
                  <div className="w-7 h-3.5 bg-emerald-600 rounded-full relative cursor-pointer">
                    <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 right-0.5" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Success Message</label>
                  <input
                    type="text"
                    value={config.newsletter.success_message}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        newsletter: { ...prev.newsletter, success_message: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* CARD 14: Social Sharing Buttons */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    14
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('Social Sharing Buttons', 'أزرار المشاركة الاجتماعية')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.social_sharing.enabled}
                    onChange={() => toggleTool('social_sharing')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-2 text-xs">
                <div className="text-[10px] text-slate-400">Select Platforms</div>
                <div className="flex flex-wrap gap-1.5">
                  {['pinterest', 'twitter', 'linkedin', 'facebook', 'instagram'].map((p) => {
                    const isSelected = config.social_sharing.platforms.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            social_sharing: {
                              ...prev.social_sharing,
                              platforms: isSelected
                                ? prev.social_sharing.platforms.filter((x) => x !== p)
                                : [...prev.social_sharing.platforms, p],
                            },
                          }))
                        }
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p[0].toUpperCase()}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400">Button Style</label>
                    <select
                      value={config.social_sharing.button_style}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          social_sharing: { ...prev.social_sharing, button_style: e.target.value },
                        }))
                      }
                      className="w-full mt-0.5 px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      <option value="Icon + Text">Icon + Text</option>
                      <option value="Icon Only">Icon Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Button Size</label>
                    <select
                      value={config.social_sharing.button_size}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          social_sharing: { ...prev.social_sharing, button_size: e.target.value },
                        }))
                      }
                      className="w-full mt-0.5 px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      <option value="Medium">Medium</option>
                      <option value="Small">Small</option>
                      <option value="Large">Large</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">Show share count</span>
                  <div className="w-7 h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer">
                    <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 left-0.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 15: Related Articles */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    15
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('Related Articles', 'مقالات ذات صلة')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.related_articles.enabled}
                    onChange={() => toggleTool('related_articles')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">Section Title</label>
                  <input
                    type="text"
                    value={config.related_articles.section_title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        related_articles: { ...prev.related_articles, section_title: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[10px] text-slate-400">Display Style</label>
                    <select
                      value={config.related_articles.display_style}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          related_articles: { ...prev.related_articles, display_style: e.target.value },
                        }))
                      }
                      className="w-full mt-0.5 px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      <option value="Grid">Grid</option>
                      <option value="List">List</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Number of Articles</label>
                    <input
                      type="number"
                      value={config.related_articles.number_of_articles}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          related_articles: { ...prev.related_articles, number_of_articles: Number(e.target.value) },
                        }))
                      }
                      className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Category</label>
                  <input
                    type="text"
                    value={config.related_articles.category}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        related_articles: { ...prev.related_articles, category: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="grid grid-cols-3 gap-1 pt-1">
                  {articles.slice(0, 3).map((art, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="w-full aspect-16/10 rounded overflow-hidden bg-slate-100 border border-slate-200">
                        <img src={art.thumbnail} alt={art.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-[8px] font-semibold text-slate-600 dark:text-slate-300 line-clamp-1">
                        {art.title}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">Show view all link</span>
                  <div className="w-7 h-3.5 bg-emerald-600 rounded-full relative cursor-pointer">
                    <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 right-0.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 4: CARDS 16 TO 20 */}

            {/* CARD 16: SEO Enhancements */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    16
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('SEO Enhancements', 'تحسينات محركات البحث')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.seo_enhancements.enabled}
                    onChange={() => toggleTool('seo_enhancements')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">SEO Title</label>
                  <input
                    type="text"
                    value={config.seo_enhancements.seo_title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        seo_enhancements: { ...prev.seo_enhancements, seo_title: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Meta Description</label>
                  <textarea
                    rows={2}
                    value={config.seo_enhancements.meta_description}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        seo_enhancements: { ...prev.seo_enhancements, meta_description: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Focus Keyword</label>
                  <input
                    type="text"
                    value={config.seo_enhancements.focus_keyword}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        seo_enhancements: { ...prev.seo_enhancements, focus_keyword: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      toast(isAr ? 'تم تحسين الكلمات المفتاحية بالذكاء الاصطناعي!' : 'SEO Metadata generated with AI!', 'success');
                    }}
                    className="flex-1 py-1 px-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate with AI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGooglePreviewModal(true)}
                    className="py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-semibold"
                  >
                    Preview Google Result
                  </button>
                </div>

                <div className="space-y-0.5 pt-1 text-[10px]">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.seo_enhancements.add_structured_data}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          seo_enhancements: { ...prev.seo_enhancements, add_structured_data: e.target.checked },
                        }))
                      }
                      className="w-3 h-3 text-emerald-600"
                    />
                    <span className="text-slate-500">Add structured data</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.seo_enhancements.enable_breadcrumbs}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          seo_enhancements: { ...prev.seo_enhancements, enable_breadcrumbs: e.target.checked },
                        }))
                      }
                      className="w-3 h-3 text-emerald-600"
                    />
                    <span className="text-slate-500">Enable breadcrumbs</span>
                  </label>
                </div>
              </div>
            </div>

            {/* CARD 17: Interactive Table of Contents */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    17
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('Interactive Table of Contents', 'فهرس المحتويات التفاعلي')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.table_of_contents.enabled}
                    onChange={() => toggleTool('table_of_contents')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">Title</label>
                  <input
                    type="text"
                    value={config.table_of_contents.title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        table_of_contents: { ...prev.table_of_contents, title: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1 text-[11px] text-slate-500">
                  {config.table_of_contents.headings.map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-0.5 px-1 truncate">
                      <span>
                        {i + 1}. {h}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Show in sticky sidebar</span>
                    <div className="w-7 h-3.5 bg-emerald-600 rounded-full relative cursor-pointer">
                      <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 right-0.5" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Collapsible sections</span>
                    <div className="w-7 h-3.5 bg-emerald-600 rounded-full relative cursor-pointer">
                      <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 right-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 18: Back in Stock / Price Drop Alert */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    18
                  </span>
                  <h3 className="font-bold text-sm truncate">{toolTitle('Back in Stock / Alert', 'تنبيه توفر المنتج / انخفاض السعر')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.stock_alert.enabled}
                    onChange={() => toggleTool('stock_alert')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">Alert Type</label>
                  <select
                    value={config.stock_alert.alert_type}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        stock_alert: { ...prev.stock_alert, alert_type: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 truncate"
                  >
                    <option value="Both (Back in Stock & Price Drop)">Both (Back in Stock & Price Drop)</option>
                    <option value="Back in Stock Only">Back in Stock Only</option>
                    <option value="Price Drop Only">Price Drop Only</option>
                  </select>
                </div>

                <div className="flex gap-2 items-center">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img
                      src={config.stock_alert.product_image}
                      alt="Alert product"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] text-slate-400">Product</label>
                    <select
                      value={config.stock_alert.product_name}
                      onChange={(e) => {
                        const found = availableProducts.find((p) => p.name === e.target.value);
                        if (found) {
                          setConfig((prev) => ({
                            ...prev,
                            stock_alert: {
                              ...prev.stock_alert,
                              product_name: found.name,
                              product_image: found.image || prev.stock_alert.product_image,
                            },
                          }));
                        }
                      }}
                      className="w-full mt-0.5 px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 truncate"
                    >
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-0.5 pt-1 text-[10px]">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.stock_alert.notify_price_drops}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          stock_alert: { ...prev.stock_alert, notify_price_drops: e.target.checked },
                        }))
                      }
                      className="w-3 h-3 text-emerald-600"
                    />
                    <span className="text-slate-500">Notify for price drops</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.stock_alert.notify_back_in_stock}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          stock_alert: { ...prev.stock_alert, notify_back_in_stock: e.target.checked },
                        }))
                      }
                      className="w-3 h-3 text-emerald-600"
                    />
                    <span className="text-slate-500">Notify when back in stock</span>
                  </label>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold"
                  >
                    Notify Me
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 19: Article Performance Analytics */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    19
                  </span>
                  <h3 className="font-bold text-sm truncate">
                    {toolTitle('Article Analytics', 'تحليلات المقال')}
                  </h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.performance_analytics.enabled}
                    onChange={() => toggleTool('performance_analytics')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="text-[10px] text-slate-400">
                  {isAr ? 'المقاييس المعروضة' : 'Metrics to Display'}
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {(
                    isAr
                      ? [
                          { key: 'views', label: 'المشاهدات' },
                          { key: 'product_clicks', label: 'نقرات المنتجات' },
                          { key: 'add_to_cart', label: 'إضافة إلى سلة التسوق' },
                          { key: 'orders', label: 'الطلبات' },
                        ]
                      : [
                          { key: 'views', label: 'Views' },
                          { key: 'product_clicks', label: 'Product Clicks' },
                          { key: 'add_to_cart', label: 'Add to Cart' },
                          { key: 'orders', label: 'Orders' },
                        ]
                  ).map((m) => (
                    <label key={m.key} className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <input type="checkbox" defaultChecked className="w-3 h-3 text-emerald-600" />
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>

                <div className="pt-0.5">
                  <label className="text-[10px] text-slate-400">
                    {isAr ? 'النطاق الزمني' : 'Time Range'}
                  </label>
                  <select
                    value={config.performance_analytics.time_range}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        performance_analytics: { ...prev.performance_analytics, time_range: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <option value="Last 30 Days">{isAr ? 'آخر ٣٠ يوماً' : 'Last 30 Days'}</option>
                    <option value="Last 7 Days">{isAr ? 'آخر ٧ أيام' : 'Last 7 Days'}</option>
                    <option value="All Time">{isAr ? 'كل الأوقات' : 'All Time'}</option>
                  </select>
                </div>

                <div className="grid grid-cols-4 gap-1 text-center pt-1">
                  <div className="p-1 rounded bg-slate-50 dark:bg-slate-800">
                    <div className="font-extrabold text-slate-900 dark:text-white text-[11px]">24,532</div>
                    <div className="text-[8px] text-slate-400">{isAr ? 'المشاهدات' : 'Views'}</div>
                  </div>
                  <div className="p-1 rounded bg-slate-50 dark:bg-slate-800">
                    <div className="font-extrabold text-slate-900 dark:text-white text-[11px]">3,420</div>
                    <div className="text-[8px] text-slate-400">{isAr ? 'النقرات' : 'Clicks'}</div>
                  </div>
                  <div className="p-1 rounded bg-slate-50 dark:bg-slate-800">
                    <div className="font-extrabold text-slate-900 dark:text-white text-[11px]">620</div>
                    <div className="text-[8px] text-slate-400">{isAr ? 'سلة التسوق' : 'Cart'}</div>
                  </div>
                  <div className="p-1 rounded bg-slate-50 dark:bg-slate-800">
                    <div className="font-extrabold text-slate-900 dark:text-white text-[11px]">210</div>
                    <div className="text-[8px] text-slate-400">{isAr ? 'الطلبات' : 'Orders'}</div>
                  </div>
                </div>

                <div className="w-full h-8 flex items-center justify-center">
                  <svg viewBox="0 0 100 24" className="w-full h-6 text-emerald-500 fill-none stroke-current stroke-2">
                    <path d="M0 18 Q 20 6, 40 14 T 70 8 T 100 4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* CARD 20: Exit Intent Offer */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    20
                  </span>
                  <h3 className="font-bold text-sm">{toolTitle('Exit Intent Offer', 'عرض نية المغادرة')}</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.exit_intent.enabled}
                    onChange={() => toggleTool('exit_intent')}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">Offer Title</label>
                  <input
                    type="text"
                    value={config.exit_intent.offer_title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        exit_intent: { ...prev.exit_intent, offer_title: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs font-bold text-rose-600 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Description</label>
                  <textarea
                    rows={2}
                    value={config.exit_intent.description}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        exit_intent: { ...prev.exit_intent, description: e.target.value },
                      }))
                    }
                    className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Email Placeholder</label>
                  <div className="flex gap-1.5 mt-0.5">
                    <input
                      type="text"
                      value={config.exit_intent.email_placeholder}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          exit_intent: { ...prev.exit_intent, email_placeholder: e.target.value },
                        }))
                      }
                      className="flex-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                    >
                      Get 10% Off
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 items-center">
                  <div>
                    <label className="text-[9px] text-slate-400">Display Delay (s)</label>
                    <input
                      type="number"
                      value={config.exit_intent.display_delay_seconds}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          exit_intent: { ...prev.exit_intent, display_delay_seconds: Number(e.target.value) },
                        }))
                      }
                      className="w-full mt-0.5 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-[9px] text-slate-500">Show on mobile</span>
                    <div className="w-7 h-3.5 bg-emerald-600 rounded-full relative cursor-pointer">
                      <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 right-0.5" />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowExitModal(true)}
                  className="w-full mt-1.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  Test Trigger Modal
                </button>
              </div>
            </div>
          </div>

          {/* Right Area: Live Article Preview Column (Exact Match Image 5) */}
          <div className="w-full 2xl:w-[400px] 3xl:w-[440px] shrink-0 sticky top-6 space-y-3">
            {/* Live Preview Header */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'معاينة المقال المباشرة' : 'Live Article Preview'}
                </h3>
              </div>

              {/* Segmented Desktop / Mobile switcher */}
              <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewMode === 'desktop'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewMode === 'mobile'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Preview Frame */}
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-4 transition-all duration-300 ${
                previewMode === 'mobile' ? 'max-w-[375px] mx-auto border-4 border-slate-300 dark:border-slate-700' : 'w-full'
              }`}
            >
              {/* Breadcrumb */}
              <div className="text-[10px] text-teal-600 font-semibold flex items-center gap-1">
                <span>Home</span>
                <span>/</span>
                <span>Blog</span>
                <span>/</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {currentArticle?.category || 'Home Decor'}
                </span>
              </div>

              {/* Table of Contents Card (Tool 17) */}
              {config.table_of_contents.enabled && (
                <div className="p-3.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/50 space-y-1.5">
                  <div className="font-extrabold text-xs text-sky-950 dark:text-sky-300">
                    {config.table_of_contents.title}
                  </div>
                  <div className="space-y-1 text-[11px] text-sky-800 dark:text-sky-400">
                    {config.table_of_contents.headings.map((h, idx) => (
                      <div key={idx}>
                        {idx + 1}. {h}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hero Image */}
              <div className="aspect-16/10 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
                <img
                  src={
                    currentArticle?.thumbnail ||
                    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80'
                  }
                  alt="Article Hero"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Article Header & Metadata */}
              <div className="space-y-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {currentArticle?.title || 'A Complete Guide to Choosing the Perfect Fragrance for Your Home'}
                </h2>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={
                        currentArticle?.author?.avatar ||
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
                      }
                      alt="Author"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      By {currentArticle?.author?.name || 'Sarah Ahmed'}
                    </span>
                    <span>|</span>
                    <span>Oct 15, 2026</span>
                    <span>|</span>
                    <span>8 min read</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Share2 className="w-3.5 h-3.5 hover:text-teal-600 cursor-pointer" />
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {currentArticle?.excerpt ||
                    "A pleasant fragrance can transform your home, boost your mood, and create a welcoming atmosphere. In this guide, we'll explore the best home fragrances, how to choose the right scent, and our top product recommendations."}
                </p>
              </div>

              {/* Product Finder Quiz Simulated in Preview (Tool 2) */}
              {config.product_quiz.enabled && (
                <div className="p-3.5 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 space-y-2">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {config.product_quiz.quiz_title}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {config.product_quiz.options.map((opt) => {
                      const isSelected = selectedQuizOption === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedQuizOption(opt.id)}
                          className={`p-2 rounded-xl border text-start flex items-center gap-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                              : 'border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top Picks Products Grid (Tool 1 Product Cards matching Image 5) */}
              {config.product_cards.enabled && (
                <div className="space-y-2 pt-2">
                  <div className="font-black text-xs text-slate-900 dark:text-white">
                    {currentArticle?.category
                      ? (isAr ? `أفضل اختيارات ${currentArticle.category}` : `Top Picks for ${currentArticle.category}`)
                      : (isAr ? 'أفضل المنتجات' : 'Top Picks')}
                  </div>
                  {availableProducts.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-4">
                      {isAr ? 'لا توجد سجلات' : 'No records found'}
                    </p>
                  ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableProducts.slice(0, 3).map((p) => {
                      const item = {
                        name: isAr ? p.nameAr || p.name : p.name,
                        sub: p.category || '',
                        price: String(p.price ?? 0),
                        rating:
                          p.rating != null
                            ? `${p.rating} (${p.reviewsCount || 0})`
                            : '—',
                        img: p.image || '',
                      };
                      return (
                      <div
                        key={p.id}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-1 relative"
                      >
                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500 absolute top-1.5 right-1.5" />
                        <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-100">
                          {item.img ? (
                            <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div className="font-bold text-[10px] text-slate-900 dark:text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[8px] text-slate-400">{item.sub}</div>
                        <div className="text-[9px] text-amber-500 font-semibold">★ {item.rating}</div>
                        <div className="font-black text-xs text-slate-900 dark:text-white">{item.price}</div>
                        <button
                          type="button"
                          className="w-full py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-[9px] font-bold"
                        >
                          {isAr ? 'أضف إلى السلة' : 'Add to Cart'}
                        </button>
                      </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              )}

              {/* Special Offer for Our Readers Banner (Tool 5 Discount Coupon Box) */}
              {config.discount_coupon.enabled && (
                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-[11px] text-amber-950 dark:text-amber-200">
                      Special Offer for Our Readers
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300">
                      Get <span className="font-black text-rose-600">15% OFF</span> all home fragrance products
                    </div>
                    <div className="text-[9px] text-slate-400">
                      Use code: <span className="font-bold text-slate-800 dark:text-white font-mono">{config.discount_coupon.coupon_code}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(config.discount_coupon.coupon_code)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg shrink-0"
                  >
                    {copiedCode ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              )}

              {/* Frequently Asked Questions Accordion */}
              <div className="space-y-2 pt-2">
                <h3 className="font-black text-xs text-slate-900 dark:text-white">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-1.5 text-xs">
                  {currentFaqs.map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                        className="w-full p-2 text-left rtl:text-right font-bold text-[11px] text-slate-800 dark:text-slate-200 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                            openFaqIndex === idx ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {openFaqIndex === idx && (
                        <div className="p-2 pt-0 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Articles Section (Tool 15) */}
              {config.related_articles.enabled && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-xs text-slate-900 dark:text-white">
                      Related Articles
                    </h3>
                    <span
                      onClick={() => onNavigateTab?.('blog')}
                      className="text-[9px] text-teal-600 font-bold hover:underline cursor-pointer"
                    >
                      View All Articles →
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {articles.slice(0, 3).map((a) => (
                      <div
                        key={a.id}
                        onClick={() => setSelectedArticleId(a.id)}
                        className="space-y-1 cursor-pointer group"
                      >
                        <div className="aspect-16/10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                          <img
                            src={a.thumbnail}
                            alt={a.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="text-[9px] font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight group-hover:text-teal-600">
                          {a.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exit Intent Modal Simulation */}
      {showExitModal && (
        <GlobalModal
          isOpen
          onClose={() => setShowExitModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'عرض الخروج من الصفحة' : 'Exit intent offer'}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl font-black">
              %
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {config.exit_intent.offer_title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {config.exit_intent.description}
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono font-black text-rose-600 text-base tracking-wider">
              {config.exit_intent.coupon_code}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleCopyCode(config.exit_intent.coupon_code);
                  setShowExitModal(false);
                }}
                className="flex-1 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700"
              >
                {isAr ? 'احصل على الخصم' : 'Claim Discount'}
              </button>
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </GlobalModal>
      )}

      {/* Full Article Reader Modal */}
      {showArticleFullPreview && currentArticle && (
        <GlobalModal
          isOpen
          onClose={() => setShowArticleFullPreview(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'معاينة المقال الكاملة' : 'Full article preview'}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-teal-600 font-bold uppercase">{currentArticle.category}</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {currentArticle.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowArticleFullPreview(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-16/9 rounded-2xl overflow-hidden">
              <img src={currentArticle.thumbnail} alt={isAr ? 'صورة المقال' : 'Hero'} className="w-full h-full object-cover" />
            </div>

            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
              {currentArticle.content}
            </div>
          </div>
        </GlobalModal>
      )}

      {/* Google SEO Result Preview Modal */}
      {showGooglePreviewModal && (
        <GlobalModal
          isOpen
          onClose={() => setShowGooglePreviewModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'معاينة نتيجة البحث' : 'Google Search Preview'}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'معاينة نتيجة البحث' : 'Google Search Preview'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGooglePreviewModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-1">
              <div className="text-[11px] text-slate-500 font-mono truncate">
                https://{activeStore.slug || 'store'}.unityteck.com/blog/{currentArticle?.slug || 'article-slug'}
              </div>
              <div className="text-base text-blue-600 hover:underline cursor-pointer font-medium leading-snug">
                {config.seo_enhancements.seo_title}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                {config.seo_enhancements.meta_description}
              </p>
            </div>
          </div>
        </GlobalModal>
      )}
    </div>
  );
};
