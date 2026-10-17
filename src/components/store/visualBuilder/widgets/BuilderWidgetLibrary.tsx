import React, { useState } from 'react';
import {
  Type,
  Heading,
  Image as ImageIcon,
  Square,
  Columns,
  ShoppingBag,
  Sliders,
  Star,
  Layers,
  MessageSquare,
  Video,
  Play,
  Flame,
  Search,
  Sparkles,
  Phone,
  Grid,
  CreditCard,
  Package,
  Plus,
  BookOpen,
  Layout,
  GripVertical,
} from 'lucide-react';

export interface WidgetDefinition {
  id: string;
  type: string;
  titleAr: string;
  titleEn: string;
  category: 'general' | 'ecommerce' | 'sections';
  icon: React.ComponentType<{ className?: string }>;
  defaultSettings: Record<string, any>;
  templateStyle: string;
}

export const BUILDER_WIDGETS: WidgetDefinition[] = [
  // General
  {
    id: 'w_heading',
    type: 'heading',
    titleAr: 'عنوان رئيسي',
    titleEn: 'Heading',
    category: 'general',
    icon: Heading,
    defaultSettings: { textAr: 'عنوان القسم الفاخر', textEn: 'Signature Section Heading', level: 'h2' },
    templateStyle: 'heading-luxury',
  },
  {
    id: 'w_text',
    type: 'text_editor',
    titleAr: 'محرر نصوص',
    titleEn: 'Text Editor',
    category: 'general',
    icon: Type,
    defaultSettings: { textAr: 'تفاصيل ومحتوى مخصص للقسم بتنسيق متقدم...', textEn: 'Custom formatted paragraph text...' },
    templateStyle: 'text-standard',
  },
  {
    id: 'w_image',
    type: 'image_grid',
    titleAr: 'صورة ومعرض',
    titleEn: 'Image & Gallery',
    category: 'general',
    icon: ImageIcon,
    defaultSettings: { layout: 'bento' },
    templateStyle: 'image-bento-grid',
  },
  {
    id: 'w_button',
    type: 'button_cta',
    titleAr: 'زر شراء / إجراء',
    titleEn: 'Action Button',
    category: 'general',
    icon: Square,
    defaultSettings: { buttonTextAr: 'تسوّق الآن', buttonTextEn: 'Shop Now', buttonUrl: '#catalog' },
    templateStyle: 'btn-emerald-pill',
  },
  {
    id: 'w_columns',
    type: 'columns_container',
    titleAr: 'أعمدة شبكية (Elementor Grid)',
    titleEn: 'Columns Container',
    category: 'general',
    icon: Columns,
    defaultSettings: { layoutColumns: '3', columnGap: 16 },
    templateStyle: 'cols-3-grid',
  },
  {
    id: 'w_inner_section',
    type: 'columns_container',
    titleAr: 'قسم داخلي (Inner Section 25, 25, 50)',
    titleEn: 'Inner Section (25, 25, 50)',
    category: 'general',
    icon: Layout,
    defaultSettings: {
      layoutColumns: '25-25-50',
      columnGap: 32, // wide gap
      rowGap: 16,
      gridOutline: true,
      contentWidth: 'full',
    },
    templateStyle: 'inner-cols-25-25-50',
  },
  {
    id: 'w_featured_posts',
    type: 'featured_posts',
    titleAr: 'مقالات مميزة (Typer Articles)',
    titleEn: 'Featured Posts / Typer Articles',
    category: 'general',
    icon: BookOpen,
    defaultSettings: {
      postSource: 'latest', // 'latest' | 'most_liked'
      category: 'Travel Stories',
      showImage: true,
      showCategory: true,
      showTag: true,
      maxPosts: 3,
      showMeta: true,
      columnLabel: '1',
      labelFontSize: 82,
      headingLevel: 'h3',
      headingText: 'Travel Stories',
      bgType: 'classic',
    },
    templateStyle: 'posts-typer-featured',
  },
  {
    id: 'w_video',
    type: 'video_section',
    titleAr: 'فيديو تفاعلي',
    titleEn: 'Video Showcase',
    category: 'general',
    icon: Video,
    defaultSettings: { videoUrl: 'https://www.youtube.com/watch?v=sample' },
    templateStyle: 'video-cinema',
  },

  // E-commerce
  {
    id: 'w_product_grid',
    type: 'product_section_natural',
    titleAr: 'شبكة المنتجات',
    titleEn: 'Product Grid',
    category: 'ecommerce',
    icon: Grid,
    defaultSettings: { limit: 6, columns: 3 },
    templateStyle: 'grid-modern-slider',
  },
  {
    id: 'w_dynamic_row',
    type: 'dynamic_product_row',
    titleAr: 'صف المنتجات المخصص',
    titleEn: 'Dynamic Product Row',
    category: 'ecommerce',
    icon: ShoppingBag,
    defaultSettings: { limit: 6, columns: 4, layout: 'slider' },
    templateStyle: 'row-slider-dynamic',
  },
  {
    id: 'w_product_tabs',
    type: 'product_tabs',
    titleAr: 'تبويبات المنتجات',
    titleEn: 'Product Tabs',
    category: 'ecommerce',
    icon: Layers,
    defaultSettings: { mainTitleAr: 'الباقات المميزة', mainTitleEn: 'Featured Bouquets' },
    templateStyle: 'tabs-luxury-slider',
  },
  {
    id: 'w_circle_categories',
    type: 'circle_categories',
    titleAr: 'تصنيفات دائرية',
    titleEn: 'Circular Categories',
    category: 'ecommerce',
    icon: Sliders,
    defaultSettings: { style: 'circular-glow' },
    templateStyle: 'circle-gold-glow',
  },
  {
    id: 'w_discount_3d',
    type: 'discounted_bouquets_3d',
    titleAr: 'معرض العروض 3D',
    titleEn: '3D Discount Gallery',
    category: 'ecommerce',
    icon: Sparkles,
    defaultSettings: { layout: '3d-perspective' },
    templateStyle: '3d-gallery-slider',
  },

  // Sections
  {
    id: 'w_hero_slider',
    type: 'hero_slider',
    titleAr: 'سلايدر هيرو متحرك',
    titleEn: 'Motion Hero Slider',
    category: 'sections',
    icon: Sparkles,
    defaultSettings: { autoplay: true },
    templateStyle: 'hero-luxury-gold',
  },
  {
    id: 'w_promo_pair',
    type: 'promo_banners_pair',
    titleAr: 'بانرات دعائية ثنائية',
    titleEn: 'Promo Banners Pair',
    category: 'sections',
    icon: Flame,
    defaultSettings: { discount: '20%' },
    templateStyle: 'banners-asymmetric',
  },
  {
    id: 'w_promo_countdown',
    type: 'promo_countdown_banner',
    titleAr: 'عداد العرض التنازلي',
    titleEn: 'Countdown Offer Bar',
    category: 'sections',
    icon: Flame,
    defaultSettings: { hoursLeft: 24 },
    templateStyle: 'countdown-timer-banner',
  },
  {
    id: 'w_testimonials',
    type: 'reviews',
    titleAr: 'آراء وشهادات العملاء',
    titleEn: 'Customer Reviews',
    category: 'sections',
    icon: Star,
    defaultSettings: { rating: 4.9 },
    templateStyle: 'reviews-cards-carousel',
  },
  {
    id: 'w_faq',
    type: 'faq',
    titleAr: 'الأسئلة الشائعة FAQ',
    titleEn: 'FAQ Accordion',
    category: 'sections',
    icon: MessageSquare,
    defaultSettings: { category: 'shipping' },
    templateStyle: 'faq-accordion-clean',
  },
  {
    id: 'w_category_grid',
    type: 'category_grid',
    titleAr: 'شبكة التصنيفات 8 (Category Grid)',
    titleEn: '8-Categories Grid Showcase',
    category: 'ecommerce',
    icon: Grid,
    defaultSettings: {},
    templateStyle: 'grid-8cats',
  },
  {
    id: 'w_best_sellers',
    type: 'best_sellers',
    titleAr: 'الأكثر مبيعاً (Best Sellers)',
    titleEn: 'Best Sellers Showcase',
    category: 'ecommerce',
    icon: ShoppingBag,
    defaultSettings: {},
    templateStyle: 'bestsellers-4cards',
  },
  {
    id: 'w_shop_by_category',
    type: 'shop_by_category',
    titleAr: 'تسوق حسب التصنيف (Shop by Category)',
    titleEn: 'Shop by Category Cards',
    category: 'ecommerce',
    icon: Layers,
    defaultSettings: {},
    templateStyle: 'category-cards-4',
  },
  {
    id: 'w_featured_collections',
    type: 'featured_collections',
    titleAr: 'تشكيلات مميزة وإحصائيات (Featured Collections)',
    titleEn: 'Featured Collections & Stats',
    category: 'sections',
    icon: Sparkles,
    defaultSettings: {},
    templateStyle: 'stats-image-counters',
  },
  {
    id: 'w_occasion_why_us',
    type: 'occasion_why_us',
    titleAr: 'المناسبات ولماذا تختارنا (Occasion & Why Us)',
    titleEn: 'Shop by Occasion & Why Choose Us',
    category: 'sections',
    icon: CreditCard,
    defaultSettings: {},
    templateStyle: 'occasion-whyus-split',
  },
  {
    id: 'w_custom_gift',
    type: 'custom_gift_banner',
    titleAr: 'بانر هدية خاصة (Looking for unique)',
    titleEn: 'Looking for Unique Banner',
    category: 'sections',
    icon: Flame,
    defaultSettings: {},
    templateStyle: 'banner-custom-botanical',
  },
  {
    id: 'w_trending_this_week',
    type: 'trending_this_week',
    titleAr: 'الأكثر رواجاً هذا الأسبوع (Trending)',
    titleEn: 'Trending This Week Carousel',
    category: 'ecommerce',
    icon: ShoppingBag,
    defaultSettings: {},
    templateStyle: 'trending-carousel',
  },
  {
    id: 'w_features',
    type: 'store_features_bar',
    titleAr: 'مميزات وضمانات المتجر',
    titleEn: 'Store Features Bar',
    category: 'sections',
    icon: CreditCard,
    defaultSettings: { vatCompliant: true },
    templateStyle: 'features-icons-bar',
  },
];

interface BuilderWidgetLibraryProps {
  isAr: boolean;
  onAddWidget: (widget: WidgetDefinition) => void;
}

export const BuilderWidgetLibrary: React.FC<BuilderWidgetLibraryProps> = ({
  isAr,
  onAddWidget,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'general' | 'ecommerce' | 'sections'>('all');

  const filtered = BUILDER_WIDGETS.filter((w) => {
    const matchesCat = activeCategory === 'all' || w.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      w.titleAr.includes(q) ||
      w.titleEn.toLowerCase().includes(q) ||
      w.type.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Search Input */}
      <div className="p-2.5 border-b border-slate-200">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث عن عنصر أو ويدجت...' : 'Search widgets...'}
            className="w-full ps-8 pe-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-slate-50"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1 mt-2 text-[10px] font-bold">
          {[
            { id: 'all' as const, labelAr: 'الكل', labelEn: 'All' },
            { id: 'general' as const, labelAr: 'عام', labelEn: 'General' },
            { id: 'ecommerce' as const, labelAr: 'تجارة', labelEn: 'Commerce' },
            { id: 'sections' as const, labelAr: 'أقسام', labelEn: 'Sections' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr ? cat.labelAr : cat.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="flex-1 overflow-y-auto p-2.5 grid grid-cols-2 gap-2 content-start">
        {filtered.map((w) => {
          const WIcon = w.icon;
          return (
            <button
              key={w.id}
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'builder-widget', widget: w }));
                e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'builder-widget', widget: w }));
                e.dataTransfer.effectAllowed = 'copyMove';
              }}
              onClick={() => onAddWidget(w)}
              className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-xs bg-white hover:bg-indigo-50/30 flex flex-col items-center justify-center text-center gap-1.5 transition-all group cursor-grab active:cursor-grabbing relative"
              title={isAr ? `انقر للإضافة أو اسحب وأفلت في أي قسم (${w.titleAr})` : `Click to add or drag & drop into any section (${w.titleEn})`}
            >
              <span className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-600 text-slate-600 group-hover:text-white flex items-center justify-center transition-colors">
                <WIcon className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-950 truncate max-w-full">
                {isAr ? w.titleAr : w.titleEn}
              </span>
              <div className="flex items-center gap-1 text-[9px] text-slate-400 group-hover:text-indigo-600 font-mono">
                <GripVertical className="w-3 h-3 opacity-60" />
                <span>{isAr ? 'اسحب / أضف' : 'Drag / Add'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
