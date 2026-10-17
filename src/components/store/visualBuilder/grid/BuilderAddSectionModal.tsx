import React, { useState, useMemo } from 'react';
import {
  X,
  Layout,
  Columns,
  Grid,
  Sparkles,
  Layers,
  Image as ImageIcon,
  ShoppingBag,
  Clock,
  Star,
  ShieldCheck,
  BarChart2,
  Video,
  HelpCircle,
  Plus,
  Flame,
} from 'lucide-react';
import type { ThemeSectionDefinition } from '../../../../themes/types';

export interface NewSectionPayload {
  layoutColumns: '1' | '2' | '3' | '4' | '5' | '8' | '2-asym-left' | '2-asym-right' | 'bento' | '25-25-50' | '50-25-25' | '25-50-25' | '16-66-16';
  blockType: string;
  titleEn: string;
  titleAr: string;
  templateStyle: string;
}

interface BuilderAddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSection: (section: NewSectionPayload) => void;
  isAr: boolean;
  supportedSections?: ThemeSectionDefinition[];
  storeCategory?: string;
  themeName?: string;
}

export const BuilderAddSectionModal: React.FC<BuilderAddSectionModalProps> = ({
  isOpen,
  onClose,
  onAddSection,
  isAr,
  supportedSections,
  storeCategory,
  themeName,
}) => {
  const [selectedColumns, setSelectedColumns] = useState<NewSectionPayload['layoutColumns']>('1');
  const [selectedType, setSelectedType] = useState<string>('hero_slider');

  if (!isOpen) return null;

  const columnLayouts = [
    {
      id: '1' as const,
      labelAr: 'عمود واحد (١٠٠٪)',
      labelEn: '1 Column (100%)',
      preview: <div className="h-6 w-full rounded bg-indigo-500/20 border border-indigo-500/40" />,
    },
    {
      id: '2' as const,
      labelAr: 'عمودان متساويان (٥٠٪ / ٥٠٪)',
      labelEn: '2 Columns (50% / 50%)',
      preview: (
        <div className="flex gap-1 h-6 w-full">
          <div className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
        </div>
      ),
    },
    {
      id: '3' as const,
      labelAr: '٣ أعمدة متساوية (٣٣٪ / ٣٣٪ / ٣٣٪)',
      labelEn: '3 Columns (33% each)',
      preview: (
        <div className="flex gap-1 h-6 w-full">
          <div className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
        </div>
      ),
    },
    {
      id: '25-25-50' as const,
      labelAr: '٣ أعمدة (٢٥٪ / ٢٥٪ / ٥٠٪) - Elementor Featured',
      labelEn: '3 Columns (25%, 25%, 50%)',
      preview: (
        <div className="flex gap-1 h-6 w-full">
          <div className="h-full w-1/4 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full w-1/4 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full w-1/2 rounded bg-indigo-500/20 border border-indigo-500/40" />
        </div>
      ),
    },
    {
      id: '50-25-25' as const,
      labelAr: '٣ أعمدة (٥٠٪ / ٢٥٪ / ٢٥٪)',
      labelEn: '3 Columns (50%, 25%, 25%)',
      preview: (
        <div className="flex gap-1 h-6 w-full">
          <div className="h-full w-1/2 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full w-1/4 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full w-1/4 rounded bg-indigo-500/20 border border-indigo-500/40" />
        </div>
      ),
    },
    {
      id: '25-50-25' as const,
      labelAr: '٣ أعمدة (٢٥٪ / ٥٠٪ / ٢٥٪)',
      labelEn: '3 Columns (25%, 50%, 25%)',
      preview: (
        <div className="flex gap-1 h-6 w-full">
          <div className="h-full w-1/4 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full w-1/2 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full w-1/4 rounded bg-indigo-500/20 border border-indigo-500/40" />
        </div>
      ),
    },
    {
      id: '16-66-16' as const,
      labelAr: '٣ أعمدة (١٦٪ / ٦٦٪ / ١٦٪)',
      labelEn: '3 Columns (16%, 66%, 16%)',
      preview: (
        <div className="flex gap-1 h-6 w-full">
          <div className="h-full w-[16%] rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full w-[68%] rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full w-[16%] rounded bg-indigo-500/20 border border-indigo-500/40" />
        </div>
      ),
    },
    {
      id: '4' as const,
      labelAr: '٤ أعمدة متساوية',
      labelEn: '4 Columns (25% each)',
      preview: (
        <div className="flex gap-1 h-6 w-full">
          <div className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
        </div>
      ),
    },
    {
      id: '5' as const,
      labelAr: '٥ أعمدة متساوية',
      labelEn: '5 Columns (20% each)',
      preview: (
        <div className="flex gap-1 h-6 w-full">
          <div className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
        </div>
      ),
    },
    {
      id: '8' as const,
      labelAr: '٨ أعمدة متساوية',
      labelEn: '8 Columns (12.5% each)',
      preview: (
        <div className="flex gap-0.5 h-6 w-full">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
          ))}
        </div>
      ),
    },
    {
      id: '2-asym-left' as const,
      labelAr: 'عمود عريض + جانبي (٦٦٪ / ٣٣٪)',
      labelEn: 'Asymmetric Left (66% / 33%)',
      preview: (
        <div className="flex gap-1 h-6 w-full">
          <div className="h-full flex-2 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
        </div>
      ),
    },
    {
      id: '2-asym-right' as const,
      labelAr: 'عمود جانبي + عريض (٣٣٪ / ٦٦٪)',
      labelEn: 'Asymmetric Right (33% / 66%)',
      preview: (
        <div className="flex gap-1 h-6 w-full">
          <div className="h-full flex-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="h-full flex-2 rounded bg-indigo-500/20 border border-indigo-500/40" />
        </div>
      ),
    },
    {
      id: 'bento' as const,
      labelAr: 'شبكة بينتو العصرية (Bento Grid)',
      labelEn: 'Modern Bento Grid Layout',
      preview: (
        <div className="grid grid-cols-3 gap-1 h-6 w-full">
          <div className="col-span-2 rounded bg-indigo-500/20 border border-indigo-500/40" />
          <div className="col-span-1 rounded bg-indigo-500/20 border border-indigo-500/40" />
        </div>
      ),
    },
  ];

  const defaultFlowerWidgets = [
    {
      id: 'hero_slider',
      titleAr: 'سلايدر بانر الواجهة التفاعلي (3D Motion Hero)',
      titleEn: 'Hero Visual Slider & 3D Banner',
      icon: Sparkles,
      descAr: 'عرض الباقات الرئيسية والعروض مع خلفيات وفيديو وبطاقات عائمة',
      descEn: 'Full-bleed banner with 3D tilt, CTA buttons and video option',
      defaultStyle: 'slider_modern',
    },
    {
      id: 'marquee_banner',
      titleAr: 'شريط الإعلانات المتحرك الفاخر (Marquee Banner)',
      titleEn: 'Running Luxury Marquee Banner',
      icon: Flame,
      descAr: 'شريط نصوص ترويجي متحرك بلمسات ذهبية (توصيل ساعتين، ورد طازج، دفع آمن)',
      descEn: 'Infinite scrolling luxury promotional marquee ticker with gold accents',
      defaultStyle: 'marquee_luxury',
    },
    {
      id: 'circle_categories',
      titleAr: 'المجموعات والتصنيفات الدائرية (3D Dedicated Circulars)',
      titleEn: 'Dedicated Circular Collections',
      icon: Grid,
      descAr: '٣ مجموعات حصرية غير مكررة (المتجر، المناسبات، العروض) مع تصفح دائري ثلاثي الأبعاد',
      descEn: 'Three dedicated non-duplicate circular collections with 3D hover effects',
      defaultStyle: 'circular',
    },
    {
      id: 'discounted_bouquets_3d',
      titleAr: 'معرض باقات الورود المخفضة ثلاثي الأبعاد',
      titleEn: 'Discounted Bouquets 3D Gallery',
      icon: ShoppingBag,
      descAr: 'معرض بطاقات ثلاثية الأبعاد تفاعلية للباقات المخفضة مع طلب فوري وخصومات حية',
      descEn: 'Interactive 3D card stack gallery for discounted bouquets with instant buy',
      defaultStyle: '3d_gallery',
    },
    {
      id: 'product_tabs',
      titleAr: 'سلايدر أقسام وباقات الورود (Product Sliders)',
      titleEn: 'Product Section Sliders',
      icon: ShoppingBag,
      descAr: 'عرض أقسام الورود الطبيعية، الشوكولاتة، الكيك، والقهوة مع بطاقات فاخرة وأزرار سريعة',
      descEn: 'Filterable product sliders showcasing natural roses, chocolates & luxury gifts',
      defaultStyle: 'slider',
    },
    {
      id: 'promo_banners_pair',
      titleAr: 'زوج البنرات الترويجية الملكية (Dual Promo Banners)',
      titleEn: 'Royal Dual Promotional Banners',
      icon: ImageIcon,
      descAr: 'زوج بنرات متناسقة لهدايا الحرم وعروض المواسم مع تأثيرات زووم تفاعلية',
      descEn: 'Pair of luxury promotional banners highlighting Haram gifts and seasonal offers',
      defaultStyle: 'pair_banners',
    },
    {
      id: 'social_reels',
      titleAr: 'ريلز تيك توك وسناب شات التفاعلية (Video Reels)',
      titleEn: 'TikTok & Snapchat Social Reels',
      icon: Video,
      descAr: '٤ مقاطع فيديو ريلز قصيرة لتنسيقات الزهور مع تشغيل فوري وتفاعل مباشر',
      descEn: 'Four vertical video reels showcasing fresh flower arrangements with play controls',
      defaultStyle: 'reels_grid',
    },
    {
      id: 'video_section',
      titleAr: 'فيديو تراث مكة: هدايا فريدة بروح الحجاز',
      titleEn: 'Hijazi Heritage Brand Video Section',
      icon: Video,
      descAr: 'فيديو احترافي يروي قصة هدايا مكة وروح الضيافة الحجازية الأصيلة',
      descEn: 'Cinematic brand video highlighting Mecca hospitality and floral craft',
      defaultStyle: 'cinematic_video',
    },
    {
      id: 'magazine_section',
      titleAr: 'مجلة ومقالات هدايا مكة (Magazine & Journal)',
      titleEn: 'Mecca Gifts Magazine & Articles',
      icon: Sparkles,
      descAr: 'مقالات نصائح اختيار الزهور ودليل العناية بالباقات في أجواء مكة المكرمة',
      descEn: 'Curated editorial journal articles on floral care and gifting etiquette in Makkah',
      defaultStyle: 'magazine_grid',
    },
    {
      id: 'newsletter',
      titleAr: 'النشرة البريدية الملكية لكوبونات الخصم',
      titleEn: 'VIP Newsletter Subscription',
      icon: Flame,
      descAr: 'صندوق اشتراك للنشرة البريدية للحصول على كود خصم فوري ١٠٪',
      descEn: 'Subscription card providing instant 10% coupon code on registration',
      defaultStyle: 'vip_newsletter',
    },
  ];

  const universalWidgets = [
    {
      id: 'dynamic_product_row',
      titleAr: 'صف منتجات مخصص (Dynamic Product Row / Category)',
      titleEn: 'Dynamic Product Row & Category Filter',
      icon: ShoppingBag,
      descAr: 'تحكم مستقل بصف المنتجات: اختر التصنيف، البراند، عدد المنتجات (4، 6، 8) وتخطيط العرض',
      descEn: 'Elementor-style row: filter by category, brand, set custom limit (4, 6, 8, etc.) and grid/slider layout',
      defaultStyle: 'slider',
    },
    {
      id: 'shortcode_widget',
      titleAr: 'عنصر الكود القصير (Shortcode Widget)',
      titleEn: 'Custom Shortcode Block',
      icon: Layers,
      descAr: 'الصق أي كود قصير [products category="..." limit="6"] لعرض المنتجات في أي مكان تلقائياً',
      descEn: 'Embed any dynamic shortcode to fetch and render products anywhere on page',
      defaultStyle: 'shortcode',
    },
    {
      id: 'columns_container',
      titleAr: 'حاوية أعمدة شبكية / قسم داخلي (Inner Section)',
      titleEn: 'Inner Section / Multi-Column Grid',
      icon: Layout,
      descAr: 'قسم مرن متعدد الأعمدة مثل Elementor Pro (تقسيم 25/25/50، تباعد عريض، وإدراج عناصر داخل كل عمود)',
      descEn: 'Elementor Pro inner section with column structures (25, 25, 50), wide gaps, and per-column widgets',
      defaultStyle: 'inner-cols-25-25-50',
    },
    {
      id: 'promo_countdown_banner',
      titleAr: 'بنر العرض الحصري مع العداد التنازلي الحي',
      titleEn: 'Flash Offer Live Countdown Banner',
      icon: Clock,
      descAr: 'بنر ترويجي عريض مع عداد تنازلي للساعات والدقائق وزر خصم مباشر',
      descEn: 'Full-width countdown promotional banner driving urgency and quick conversion',
      defaultStyle: 'modern_countdown',
    },
    {
      id: 'features',
      titleAr: 'شارات الثقة ومزايا المتجر الفاخرة',
      titleEn: 'Store Features & Trust Badges',
      icon: ShieldCheck,
      descAr: 'توصيل مبرد سريع، منتجات أصلية مضمونة، ودفع آمن عبر مدى وآبل باي',
      descEn: 'Luxury trust badges highlighting fast delivery, genuine products & secure pay',
      defaultStyle: 'modern_cards',
    },
    {
      id: 'statistics',
      titleAr: 'إحصائيات وأرقام المتجر الموثقة',
      titleEn: 'Store Milestones & Counters',
      icon: BarChart2,
      descAr: 'أرقام وإحصائيات موثقة عن المبيعات والعملاء الراضين وتقييمات المتجر',
      descEn: 'Animated counters highlighting verified sales, happy customers and ratings',
      defaultStyle: 'counter_cards',
    },
    {
      id: 'reviews',
      titleAr: 'تقييمات وآراء العملاء الموثقة',
      titleEn: 'Verified Customer Reviews & Testimonials',
      icon: Star,
      descAr: 'تجارب حقيقية موثقة من العملاء ونزلاء الفنادق مع تقييم النجوم',
      descEn: 'Verified customer testimonials with star ratings',
      defaultStyle: 'star_cards',
    },
    {
      id: 'faq',
      titleAr: 'الأسئلة الشائعة حول التوصيل والدفع',
      titleEn: 'Delivery & Payment FAQ',
      icon: HelpCircle,
      descAr: 'أكورديون تفاعلي يوضح آلية التوصيل وطرق الدفع والضمان',
      descEn: 'Expandable accordion answering delivery, packaging, warranty, and payment',
      defaultStyle: 'accordion',
    },
  ];

  const widgetTemplates = useMemo(() => {
    if (supportedSections && supportedSections.length > 0) {
      const themeSpecificWidgets = supportedSections.map((sec) => {
        let icon = Layout;
        if (sec.category === 'hero') icon = Sparkles;
        else if (sec.category === 'header') icon = Layout;
        else if (sec.category === 'categories') icon = Grid;
        else if (sec.category === 'products') icon = ShoppingBag;
        else if (sec.category === 'promotions') icon = ImageIcon;
        else if (sec.category === 'features') icon = ShieldCheck;
        else if (sec.category === 'media') icon = Video;
        else if (sec.category === 'reviews') icon = Star;
        else if (sec.category === 'faq') icon = HelpCircle;
        else if (sec.category === 'footer') icon = Layout;

        return {
          id: sec.id,
          titleAr: sec.nameAr,
          titleEn: sec.name,
          icon,
          descAr: sec.descriptionAr || `قسم ${sec.nameAr} المخصص لهذا القالب`,
          descEn: sec.description || `Specialized ${sec.name} section for this theme`,
          defaultStyle: `${sec.id}_modern`,
        };
      });

      const existingIds = new Set(themeSpecificWidgets.map((w) => w.id));
      const filteredUniversal = universalWidgets.filter((w) => !existingIds.has(w.id));
      return [...themeSpecificWidgets, ...filteredUniversal];
    }

    return [...defaultFlowerWidgets, ...universalWidgets];
  }, [supportedSections]);

  const handleConfirm = () => {
    const selectedWidget = widgetTemplates.find((w) => w.id === selectedType);
    if (!selectedWidget) return;

    onAddSection({
      layoutColumns: selectedColumns,
      blockType: selectedType,
      titleAr: selectedWidget.titleAr,
      titleEn: selectedWidget.titleEn,
      templateStyle: selectedWidget.defaultStyle,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md">
              <Plus className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-900">
                  {isAr ? 'إضافة قسم جديد وتخطيط الشبكة (Row & Grid System)' : 'Add New Section & Grid Layout'}
                </h3>
                {themeName && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {themeName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {isAr
                  ? 'اختر بنية الأعمدة ثم حدد العنصر المخصص لقالب متجرك'
                  : 'Select column layout structure then pick the widget tailored to your active theme'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Step 1: Select Column Grid (Elementor Row Structure) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-black text-slate-900">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center">
                1
              </span>
              <span>{isAr ? 'اختر بنية وتقسيم الأعمدة (Grid Structure):' : 'Choose Column Structure:'}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {columnLayouts.map((col) => {
                const isSelected = selectedColumns === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedColumns(col.id)}
                    className={`p-3 rounded-2xl border text-start space-y-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {col.preview}
                    <span className="text-[11px] block truncate font-bold">{isAr ? col.labelAr : col.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Section Widget */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-black text-slate-900">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center">
                2
              </span>
              <span>{isAr ? 'اختر نوع القسم أو العنصر البرمجي (Widget):' : 'Choose Section Widget:'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {widgetTemplates.map((widget) => {
                const IconComp = widget.icon;
                const isSelected = selectedType === widget.id;

                return (
                  <button
                    key={widget.id}
                    type="button"
                    onClick={() => setSelectedType(widget.id)}
                    className={`p-3.5 rounded-2xl border text-start flex items-start gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-black block truncate">{isAr ? widget.titleAr : widget.titleEn}</span>
                      <span className="text-[10px] text-slate-500 block line-clamp-2 mt-0.5">
                        {isAr ? widget.descAr : widget.descEn}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إدراج القسم في الصفحة' : 'Insert Section into Canvas'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
