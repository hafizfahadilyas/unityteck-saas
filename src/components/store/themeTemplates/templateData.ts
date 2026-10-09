/**
 * Ready Homepage & Page Templates for Multi-Store Theme Builder
 * Strictly dynamic data compatible, bilingual Arabic/English, RTL/LTR, Light/Dark.
 */

export interface HomepageTemplateItem {
  id: string;
  name: string;
  nameAr: string;
  styleKey: string;
  tagline: string;
  taglineAr: string;
  accentColor: string;
  badge: string;
  badgeAr: string;
  category: 'Default' | 'Eid' | 'Ramadan' | 'Valentine';
  features: string[];
  featuresAr: string[];
  bannerGradient: string;
}

export const HOMEPAGE_TEMPLATES: HomepageTemplateItem[] = [
  {
    id: 'hp-default',
    name: 'Default / Modern Commerce',
    nameAr: 'المتجر العصري الافتراضي',
    styleKey: 'Default Commerce',
    tagline: 'Clean, high-speed conversion layout with dynamic hero banner, featured categories and live product grid.',
    taglineAr: 'تصميم عصري سريع وعالي التحويل مع سلايدر تفاعلي وتصنيفات دائرية وشبكة منتجات مباشرة.',
    accentColor: '#059669',
    badge: 'Universal Best Seller',
    badgeAr: 'الأكثر استخداماً',
    category: 'Default',
    features: [
      'Interactive Hero Slider with CTA buttons',
      'Dynamic Circular Category quick-scroll',
      'Trending & Bestsellers product showcase',
      'Value proposition trust badges bar',
      'Integrated newsletter & social footer',
    ],
    featuresAr: [
      'سلايدر ترويجي تفاعلي مع أزرار طلب سريع',
      'تصنيفات دائرية ديناميكية سريعة التصفح',
      'شبكة المنتجات الأكثر مبيعاً وعروض خاصة',
      'شريط مميزات وثقة المتجر (توصيل، ضمان، دفع)',
      'تذييل متكامل مع النشرة البريدية وروابط التواصل',
    ],
    bannerGradient: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)',
  },
  {
    id: 'hp-eid',
    name: 'Eid Mubarak Festive',
    nameAr: 'العيد المبارك الفاخر',
    styleKey: 'Eid Home',
    tagline: 'Celebratory emerald & gold theme designed for Eid festivities, gift hampers, luxury arrangements & express delivery.',
    taglineAr: 'تصميم احتفالي باللون الزمردي والذهبي مصمم لهدايا العيد وباقات الورد الفاخرة والتوصيل السريع.',
    accentColor: '#0d9488',
    badge: 'Seasonal Festive',
    badgeAr: 'موسم العيد',
    category: 'Eid',
    features: [
      'Festive crescent motif & greetings banner',
      'Dedicated Eid Gift Bundles & Hampers section',
      'Express holiday delivery scheduler widget',
      'Arabic calligraphy header typography',
      'WhatsApp 1-click festive order button',
    ],
    featuresAr: [
      'شعار وبنر تهنئة العيد بالخط العربي الأصيل',
      'قسم مخصص لهدايا وتوزيعات وباقات العيد',
      'أداة جدولة مواعيد التوصيل خلال أيام العيد',
      'خطوط عربية احتفالية وتنسيقات ملكية',
      'زر طلب سريع عبر واتساب للباقات المخصصة',
    ],
    bannerGradient: 'linear-gradient(135deg, #0d9488 0%, #134e4a 100%)',
  },
  {
    id: 'hp-ramadan',
    name: 'Ramadan Kareem Spiritual',
    nameAr: 'رمضان كريم الروحاني',
    styleKey: 'Ramadan Home',
    tagline: 'Enchanting indigo & warm amber glow theme for holy month gifts, Iftar floral arrangements & Haram packages.',
    taglineAr: 'تصميم أنيق بلمسات رمضانية إسلامية هادئة وفوانيس لباقات إفطار الصائم وهدايا الحرم المكي الشريف.',
    accentColor: '#d97706',
    badge: 'Holy Month Edition',
    badgeAr: 'إصدار الشهر الفضيل',
    category: 'Ramadan',
    features: [
      'Lantern & Fanoos luminous aesthetic accents',
      'Pre-Iftar & Suhoor delivery timing countdown',
      'Makkah Haram & Hotel direct gift service spotlight',
      'Special spiritual coupon codes banner',
      'Curated white roses & Oud fragrance showcase',
    ],
    featuresAr: [
      'لمسات فوانيس وإضاءات رمضانية روحانية هادئة',
      'عداد تنازلي لمواعيد توصيل وجبات وتوزيعات الإفطار',
      'تسليط الضوء على خدمة التوصيل المباشر لفنادق الحرم',
      'شريط كوبونات وعروض خيرية خاصة برمضان',
      'باقة الورد الأبيض مع العود والبخور الفاخر',
    ],
    bannerGradient: 'linear-gradient(135deg, #b45309 0%, #1e1b4b 100%)',
  },
  {
    id: 'hp-valentine',
    name: 'Valentine / Romantic Luxury',
    nameAr: 'الفالنتين والورود الرومانسية',
    styleKey: 'Valentine Home',
    tagline: 'Passionate crimson & rose gold design with romance ribbons, couple specials, midnight delivery countdown & teddy add-ons.',
    taglineAr: 'تصميم رومانسي فاخر بدرجات الأحمر والياقوتي لباقات الورد الأحمر وهدايا الحب والمفاجآت.',
    accentColor: '#e11d48',
    badge: 'Romance & Roses',
    badgeAr: 'باقات الحب والرومانسية',
    category: 'Valentine',
    features: [
      'Romantic crimson gradient & heart particle accents',
      'Handcrafted Dutch Red Roses premium carousel',
      'Add-on chocolates, perfumes & card customizer',
      'Midnight & Secret Admirer anonymous delivery mode',
      'Live customer romance reviews & unboxing proofs',
    ],
    featuresAr: [
      'تدرجات لونية حمراء ملكية مع تفاصيل قلوب ناعمة',
      'معرض خاص بالورد الهولندي الأحمر الفاخر',
      'خيارات إضافية سهلة للشكولاتة والبطاقات والعطور',
      'خدمة التوصيل منتصف الليل والتوصيل السري كمفاجأة',
      'تقييمات وصور تجارب العملاء في المناسبات السعيدة',
    ],
    bannerGradient: 'linear-gradient(135deg, #e11d48 0%, #881337 100%)',
  },
];

export interface PageTemplateVariation {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  styleTag: string;
  isPopular?: boolean;
  previewBg: string;
  highlights: string[];
}

export interface PageCategoryTemplate {
  key: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  defaultVariationId: string;
  variations: PageTemplateVariation[];
}

export const ALL_PAGE_TEMPLATES: PageCategoryTemplate[] = [
  {
    key: 'product',
    title: '1. Product Page',
    titleAr: '١. صفحة المنتج الفردي',
    description: 'Detailed showcase layout for single items with gallery, variants, price & buy actions.',
    descriptionAr: 'تصميم عرض تفاصيل المنتج مع معرض الصور، الخيارات، السعر وأزرار الشراء الفوري.',
    defaultVariationId: 'prod-split-sticky',
    variations: [
      {
        id: 'prod-split-sticky',
        name: 'Split Modern with Sticky Gallery & WhatsApp CTA',
        nameAr: 'العرض المنقسم مع معرض مثبت وزر واتساب',
        description: 'Two-column layout where image gallery stays sticky while options and reviews scroll cleanly.',
        descriptionAr: 'تصميم من عمودين يثبت صور المنتج أثناء تمرير التفاصيل والمواصفات وزر الطلب السريع.',
        styleTag: 'High Conversion',
        isPopular: true,
        previewBg: 'linear-gradient(135deg, #1e293b, #0f172a)',
        highlights: ['Sticky photo zoom', 'Live stock counter', 'Direct WhatsApp purchase', 'Tabbed specifications'],
      },
      {
        id: 'prod-boutique-luxury',
        name: 'Boutique Editorial & Fullscreen Visuals',
        nameAr: 'ستايل البوتيك الفاخر مع صور ملء الشاشة',
        description: 'Large hero images, serif luxury typography, narrative product story and craft details.',
        descriptionAr: 'صور فائقة الدقة بتنسيق مجلات الموضة، خطوط كلاسيكية وسرد قصة المنتج والمواد الخام.',
        styleTag: 'Luxury Editorial',
        previewBg: 'linear-gradient(135deg, #312e81, #1e1b4b)',
        highlights: ['Cinematic visual cards', 'Material purity badges', 'Gift packaging preview', 'VIP styling tips'],
      },
      {
        id: 'prod-tabbed-reviews',
        name: 'Tabbed Technical & Customer Social Proof',
        nameAr: 'التبويبات المفصلة مع تقييمات المشترين',
        description: 'Structured tabs for Overview, Specifications, Care Instructions, and Verified Photo Reviews.',
        descriptionAr: 'تبويبات أنيقة للمواصفات، إرشادات العناية، ومعرض صور وتقييمات المشترين الموثقة.',
        styleTag: 'Info Rich',
        previewBg: 'linear-gradient(135deg, #065f46, #064e3b)',
        highlights: ['5-star rating matrix', 'Verified buyer tags', 'Care & longevity guide', 'Instant FAQ accordion'],
      },
      {
        id: 'prod-flash-urgency',
        name: 'Urgency & Scarcity Countdown Layout',
        nameAr: 'صفحة العروض الحصرية مع عداد تنازلي',
        description: 'Optimized for high-speed impulse buying with countdown timer, free shipping meter and low-stock badge.',
        descriptionAr: 'مصممة خصيصاً للحملات الإعلانية ومضاعفة التحويل مع عداد عروض ومؤشر الشحن المجاني.',
        styleTag: 'Urgency / Ads',
        previewBg: 'linear-gradient(135deg, #991b1b, #450a0a)',
        highlights: ['Live countdown timer', 'Remaining stock badge', 'Free delivery progress bar', '1-Click Apple Pay'],
      },
    ],
  },
  {
    key: 'shop',
    title: '2. Shop / All Products',
    titleAr: '٢. صفحة المتجر وكل المنتجات',
    description: 'Catalog listing page with sidebar/drawer filters, sorting, and pagination.',
    descriptionAr: 'صفحة دليل المنتجات مع الفلاتر، الترتيب حسب السعر، والتقليب السلس.',
    defaultVariationId: 'shop-grid-sidebar',
    variations: [
      {
        id: 'shop-grid-sidebar',
        name: 'Modern 4-Column Grid with Filter Sidebar',
        nameAr: 'شبكة ٤ أعمدة مع شريط فلاتر جانبي',
        description: 'Classic e-commerce power layout with category filters, price range sliders, and tag checkboxes.',
        descriptionAr: 'تصميم التجارة الكلاسيكي مع فلترة الأسعار والأقسام والعلامات التجارية بكل مرونة.',
        styleTag: 'Desktop Power',
        isPopular: true,
        previewBg: 'linear-gradient(135deg, #1e293b, #334155)',
        highlights: ['Dynamic price range filter', 'Color & size swatches', 'Sort by Popularity / Price', 'Quick add overlay'],
      },
      {
        id: 'shop-masonry-visual',
        name: 'Visual Masonry Lookbook',
        nameAr: 'ستايل اللوك بوك المنسدل (ماسونري)',
        description: 'Pinterest-style fluid layout emphasizing photography, textures, and lifestyle aesthetics.',
        descriptionAr: 'عرض مرن لصور المنتجات بأحجام متنوعة يعزز المظهر الجمالي والفخامة البصرية.',
        styleTag: 'Aesthetic / Visual',
        previewBg: 'linear-gradient(135deg, #4c1d95, #2e1065)',
        highlights: ['Fluid staggered heights', 'Hover quick buy button', 'Badge tags overlay', 'Smooth infinite scroll'],
      },
      {
        id: 'shop-compact-list',
        name: 'Compact List View for B2B & Quick Reorder',
        nameAr: 'العرض المجدول السريع لطلبات الجملة',
        description: 'High-density rows with SKU, stock status, unit pricing, and quantity stepper for rapid checkout.',
        descriptionAr: 'صفوف منظمة بكثافة عالية تظهر رقم المنتج، الكمية المتوفرة وزر الإضافة السريعة للسلة.',
        styleTag: 'High Density',
        previewBg: 'linear-gradient(135deg, #075985, #0c4a6e)',
        highlights: ['Inline quantity picker', 'Instant SKU search', 'Bulk select to cart', 'Export catalog PDF'],
      },
    ],
  },
  {
    key: 'category',
    title: '3. Category Page',
    titleAr: '٣. صفحة تصنيف المنتجات',
    description: 'Landing page dedicated to a specific product category with custom hero and breadcrumbs.',
    descriptionAr: 'واجهة خاصة بكل قسم رئيسي تتضمن بنر تعريفي وتصنيفات فرعية ومنتجات القسم.',
    defaultVariationId: 'cat-hero-cards',
    variations: [
      {
        id: 'cat-hero-cards',
        name: 'Hero Banner with Subcategory Circular Cards',
        nameAr: 'بنر عريض مع أيقونات التصنيفات الفرعية',
        description: 'Visual category header with subcategory pills and auto-filtered curated grid.',
        descriptionAr: 'بنر علوي عريض مع أيقونات دائرية للأقسام الفرعية وفلترة فورية للمنتجات.',
        styleTag: 'Standard Dynamic',
        isPopular: true,
        previewBg: 'linear-gradient(135deg, #0f766e, #115e59)',
        highlights: ['Category SEO description', 'Circular subcategories', 'Active filter breadcrumb', 'Promo banner slot'],
      },
      {
        id: 'cat-minimal-curated',
        name: 'Minimal Clean Editorial Showcase',
        nameAr: 'العرض الأنيق البسيط مع نبذة عن المجموعة',
        description: 'Clean typography header with curated products spotlight and story behind the collection.',
        descriptionAr: 'تصميم بسيط بخطوط راقية يسلط الضوء على فكرة التشكيلة وأبرز قطع المجموعة.',
        styleTag: 'Clean Minimal',
        previewBg: 'linear-gradient(135deg, #374151, #1f2937)',
        highlights: ['Minimalist banner', 'Clean spacing', 'Fast loading', 'Category highlight quote'],
      },
      {
        id: 'cat-split-promotional',
        name: 'Promotional Split with Discount Highlights',
        nameAr: 'العرض الترويجي مع كود الخصم الحصري',
        description: 'Includes a top offer banner with coupon copy button and countdown for category discounts.',
        descriptionAr: 'يتضمن بنر كوبون تخفيض مخصص لهذا القسم مع زر نسخ الكود وعداد العرض الخاص.',
        styleTag: 'Promotional',
        previewBg: 'linear-gradient(135deg, #b45309, #78350f)',
        highlights: ['1-Click Coupon copy', 'Limited time flash banner', 'Featured category bestseller', 'Free gift banner'],
      },
    ],
  },
  {
    key: 'brand',
    title: '4. Brand Page',
    titleAr: '٤. صفحة العلامات التجارية والماركات',
    description: 'Dedicated brand showcase with official logo, authenticity guarantees & brand catalog.',
    descriptionAr: 'صفحة متخصصة للماركة مع الشعار الرسمي، شهادة الأصالة، وتشكيلة منتجاتها الحصرية.',
    defaultVariationId: 'brand-official-verified',
    variations: [
      {
        id: 'brand-official-verified',
        name: 'Official Authorized Partner with Verified Badge',
        nameAr: 'الشريك المعتمد الرسمي مع علامة التوثيق',
        description: 'Displays official brand banner, authorized distributor badge, warranty terms, and full line.',
        descriptionAr: 'يعرض الشعار مع شارة الموزع المعتمد، ضمان الجودة، والكتالوج الكامل لمنتجات الماركة.',
        styleTag: 'Official / Trust',
        isPopular: true,
        previewBg: 'linear-gradient(135deg, #1e1b4b, #312e81)',
        highlights: ['100% Genuine guarantee badge', 'Brand logo hero', 'Warranty coverage notice', 'Brand story narrative'],
      },
      {
        id: 'brand-directory-az',
        name: 'A-Z Alphabetical Brands Directory Hub',
        nameAr: 'دليل الماركات الأبجدي الشامل (A-Z)',
        description: 'Index page allowing customers to jump between brands with quick logo cards.',
        descriptionAr: 'فهرس متكامل يتيح للعميل التبديل بين جميع الماركات بالحروف والبحث السريع.',
        styleTag: 'Directory Grid',
        previewBg: 'linear-gradient(135deg, #334155, #1e293b)',
        highlights: ['A-Z Quick Jump bar', 'Brand search bar', 'Logo hover animations', 'Product count badges'],
      },
      {
        id: 'brand-editorial-story',
        name: 'Editorial Brand Story & Founder Heritage',
        nameAr: 'سرد قصة وتاريخ العلامة التجارية',
        description: 'Magazine-style timeline, craftsmanship highlights, and curated spotlight products.',
        descriptionAr: 'تصميم وثائقي أنيق يروي تاريخ الماركة وجودة الصنع مع أفضل منتجاتها المختارة.',
        styleTag: 'Editorial Story',
        previewBg: 'linear-gradient(135deg, #14532d, #052e16)',
        highlights: ['Heritage timeline', 'Signature artisan techniques', 'Video embed ready', 'Curated collections'],
      },
    ],
  },
  {
    key: 'cart',
    title: '5. Cart Page',
    titleAr: '٥. صفحة سلة المشتريات',
    description: 'Shopping bag with item quantities, price calculations, shipping estimation, and coupons.',
    descriptionAr: 'سلة المشتريات مع تعديل الكميات، حساب الإجمالي، تقدير الشحن، وتطبيق كود الخصم.',
    defaultVariationId: 'cart-slide-drawer',
    variations: [
      {
        id: 'cart-slide-drawer',
        name: 'Slide-Over Drawer with Free Shipping Meter',
        nameAr: 'سلة منزلقة سريعة مع مؤشر الشحن المجاني',
        description: 'Fast sliding cart panel allowing users to edit items without leaving current shopping page.',
        descriptionAr: 'نافذة سلة منزلقة فورية تتيح تعديل الكميات وحساب الشحن المجاني دون مغادرة الصفحة.',
        styleTag: 'Modern Drawer',
        isPopular: true,
        previewBg: 'linear-gradient(135deg, #047857, #065f46)',
        highlights: ['Free shipping threshold progress', 'Quantity +/- stepper', 'Instant coupon apply', 'Express checkout button'],
      },
      {
        id: 'cart-full-breakdown',
        name: 'Full Page Two-Column Detailed Breakdown',
        nameAr: 'صفحة سلة كاملة من عمودين مع تفاصيل الأسعار',
        description: 'Comprehensive view showing line items, gift message options, VAT summary, and trust seals.',
        descriptionAr: 'تصميم عريض من عمودين مع إمكانية كتابة إهداء خاص وتفاصيل الضريبة ورسوم التوصيل.',
        styleTag: 'Two-Column Page',
        previewBg: 'linear-gradient(135deg, #1e293b, #0f172a)',
        highlights: ['Gift card message field', 'Delivery date picker', 'Transparent VAT calculation', 'Save for later option'],
      },
      {
        id: 'cart-minimal-quick',
        name: 'Minimal Express Checkout Direct Link',
        nameAr: 'سلة مختصرة فائقة السرعة مع شراء بنقرة واحدة',
        description: 'Ultra-lightweight cart focused on reducing drop-offs with instant Apple Pay and Mada buttons.',
        descriptionAr: 'تصميم خفيف جداً يقلل خطوات السلة ويوجه العميل للشراء الفوري عبر مدى وأبل باي.',
        styleTag: 'Ultra Fast',
        previewBg: 'linear-gradient(135deg, #6d28d9, #4c1d95)',
        highlights: ['Apple Pay quick button', 'Mada instant pay', 'Zero distraction layout', 'Order summary tooltip'],
      },
    ],
  },
  {
    key: 'checkout',
    title: '6. Checkout Page',
    titleAr: '٦. صفحة إتمام الطلب والدفع',
    description: 'Order placement form with customer info, address picker, delivery method, and payment choice.',
    descriptionAr: 'نموذج إتمام الشراء، تحديد عنوان التوصيل في السعودية والخليج، واختيار وسيلة الدفع.',
    defaultVariationId: 'chk-saudi-rapid',
    variations: [
      {
        id: 'chk-saudi-rapid',
        name: 'Saudi & GCC Rapid Checkout with National Address',
        nameAr: 'إتمام الطلب السريع المخصص للعناوين السعودية والخليج',
        description: 'Optimized for GCC customers with city auto-complete, National Address fields and WhatsApp confirmation.',
        descriptionAr: 'مهيأ خصيصاً للعملاء في السعودية مع إكمال اسم المدينة والعنوان الوطني وتأكيد عبر واتساب.',
        styleTag: 'GCC Optimized',
        isPopular: true,
        previewBg: 'linear-gradient(135deg, #0284c7, #0369a1)',
        highlights: ['Saudi National Address fields', 'City selection dropdown', 'Scheduled delivery time slot', 'WhatsApp tracking opt-in'],
      },
      {
        id: 'chk-accordion-steps',
        name: 'Step-by-Step Modern Accordion Wizard',
        nameAr: 'معالج الخطوات التفاعلي (بيانات - عنوان - دفع)',
        description: 'Smooth 3-step numbered accordion keeping checkout clean, focused, and error-free.',
        descriptionAr: 'ثلاث خطوات واضحة (البيانات، العنوان، طريقة الدفع) تمنع التشتت وتضمن اكتمال الطلب.',
        styleTag: 'Step Wizard',
        previewBg: 'linear-gradient(135deg, #0d9488, #115e59)',
        highlights: ['Numbered progress badges', 'Collapsible completed steps', 'Order summary sticky preview', 'Guest checkout support'],
      },
      {
        id: 'chk-one-page-compact',
        name: 'Single-Page High-Velocity Express',
        nameAr: 'صفحة الدفع الموحدة في شاشة واحدة',
        description: 'All fields visible on one screen for fastest completion rate with zero page jumps.',
        descriptionAr: 'كل الحقول موجودة في صفحة واحدة دون تنقلات لتسريع إتمام الطلب بأعلى معدل تحويل.',
        styleTag: '1-Page Express',
        previewBg: 'linear-gradient(135deg, #4338ca, #312e81)',
        highlights: ['Inline payment fields', 'Auto-save address in CRM', '1-Click Cash on Delivery', 'Secure SSL trust badge'],
      },
    ],
  },
  {
    key: 'payment',
    title: '7. Payment Page',
    titleAr: '٧. صفحة بوابات وطرق الدفع',
    description: 'Payment gateway selector and secure processing interface.',
    descriptionAr: 'واجهة اختيار بوابات الدفع الإلكتروني المعتمدة ومعالجة المعاملة المالية بأمان.',
    defaultVariationId: 'pay-multi-gateways',
    variations: [
      {
        id: 'pay-multi-gateways',
        name: 'Multi-Gateway Tabs (Mada, Apple Pay, Visa, Tamara/Tabby)',
        nameAr: 'تبويبات الدفع المتعددة (مدى، أبل باي، فيزا، تمارا/تابي)',
        description: 'Prominently presents local Saudi payment options including Mada debit cards and BNPL installments.',
        descriptionAr: 'يعرض بوابات الدفع السعودية الشائعة ومدى، وخطط التقسيط بدون فوائد عبر تابي وتمارا.',
        styleTag: 'Local Standard',
        isPopular: true,
        previewBg: 'linear-gradient(135deg, #059669, #047857)',
        highlights: ['Mada & Apple Pay direct badge', 'Tabby & Tamara 4-installment cards', 'Credit card live validation', 'Cash on Delivery toggle'],
      },
      {
        id: 'pay-bank-transfer-slip',
        name: 'Direct Bank Transfer with Receipt Slip Upload',
        nameAr: 'التحويل البنكي المباشر مع رفع إيصال السداد',
        description: 'Shows store bank accounts (Al Rajhi, SNB, Riyad) with copyable IBANs and image attachment upload.',
        descriptionAr: 'يعرض الحسابات البنكية للمتجر (الراجحي، الأهلي، الرياض) مع أزرار نسخ الآيبان ورفع الإيصال.',
        styleTag: 'Bank Wire / B2B',
        previewBg: 'linear-gradient(135deg, #1e293b, #334155)',
        highlights: ['1-Click IBAN copy buttons', 'Bank account logos', 'Instant slip upload field', 'WhatsApp manual confirmation'],
      },
      {
        id: 'pay-crypto-wallet',
        name: 'Digital Wallets & Global Payment Ready',
        nameAr: 'المحافظ الرقمية والبطاقات الدولية',
        description: 'Includes PayPal, STC Pay, and international multi-currency processing for cross-border shoppers.',
        descriptionAr: 'دعم المحافظ الرقمية مثل STC Pay وبايبال للعملاء الدوليين مع تحويل العملات المباشر.',
        styleTag: 'Global Wallets',
        previewBg: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
        highlights: ['STC Pay direct QR', 'PayPal 1-click login', 'Multi-currency auto conversion', 'Fraud protection shield'],
      },
    ],
  },
  {
    key: 'thankyou',
    title: '8. Thank You / Order Confirmation',
    titleAr: '٨. صفحة تأكيد الطلب والشكر',
    description: 'Post-purchase success screen with order reference, invoice download and live tracking.',
    descriptionAr: 'شاشة نجاح الطلب مع رقم المرجع، تحميل الفاتورة الضريبية، وزر التتبع المباشر.',
    defaultVariationId: 'ty-confetti-invoice',
    variations: [
      {
        id: 'ty-confetti-invoice',
        name: 'Celebratory Confetti with ZATCA Invoice Download',
        nameAr: 'احتفال بالطلب مع تحميل الفاتورة الضريبية ZATCA',
        description: 'Displays order celebration animation, QR code verified invoice download, and dispatch timeline.',
        descriptionAr: 'تأكيد احتفالي فوري مع إمكانية طباعة الفاتورة الضريبية المعتمدة برمز QR وتفاصيل التوصيل.',
        styleTag: 'Celebratory / ZATCA',
        isPopular: true,
        previewBg: 'linear-gradient(135deg, #059669, #065f46)',
        highlights: ['ZATCA compliant QR Invoice', 'Download PDF invoice', 'Live SMS & WhatsApp confirmation badge', 'Estimated arrival banner'],
      },
      {
        id: 'ty-minimal-receipt',
        name: 'Minimal Clean Executive Order Summary',
        nameAr: 'الملخص الأنيق المنظم لبيانات الطلب والمنتجات',
        description: 'Clean tabular summary of purchased items, delivery address, payment method and support contact.',
        descriptionAr: 'جدول منظم لبيانات المنتجات المشتراة، العنوان، رقم الشحنة وروابط خدمة العملاء.',
        styleTag: 'Clean Receipt',
        previewBg: 'linear-gradient(135deg, #1e293b, #0f172a)',
        highlights: ['Clean print layout', 'Support helpline card', 'Continue shopping button', 'Save order to account'],
      },
      {
        id: 'ty-social-referral',
        name: 'Social Sharing & Referral Reward Prompt',
        nameAr: 'المشاركة على الشبكات وكوبون الهدية للطلب القادم',
        description: 'Encourages buyers to share their purchase and receive an instant 10% coupon for friends.',
        descriptionAr: 'يحفز المشتري على مشاركة الطلب مع الأصدقاء لكسب كود خصم فوري للطلب التالي.',
        styleTag: 'Viral Referral',
        previewBg: 'linear-gradient(135deg, #be185d, #831843)',
        highlights: ['Share on WhatsApp / X button', 'Referral coupon generator', 'Recommended matching products', 'VIP Club invitation'],
      },
    ],
  },
  {
    key: 'tracking',
    title: '9. Order Tracking',
    titleAr: '٩. صفحة تتبع حالة الطلب والشحنة',
    description: 'Real-time order lookup by order number or mobile phone.',
    descriptionAr: 'تتبع حالة الشحنة بالرقم أو الهاتف مع مراحل التجهيز والتوصيل خطوة بخطوة.',
    defaultVariationId: 'trk-timeline-map',
    variations: [
      {
        id: 'trk-timeline-map',
        name: 'Live 5-Step Progress Timeline with Courier Info',
        nameAr: 'المخطط الزمني التفاعلي من ٥ مراحل مع بيانات المندوب',
        description: 'Shows: Received -> Confirmed -> Preparing -> Out for Delivery -> Delivered with driver details.',
        descriptionAr: 'مخطط تفاعلي: تم الاستلام -> تم التأكيد -> جاري التجهيز -> مع المندوب -> تم التوصيل.',
        styleTag: 'Interactive Timeline',
        isPopular: true,
        previewBg: 'linear-gradient(135deg, #0d9488, #134e4a)',
        highlights: ['Real-time 5-stage progress bar', 'Driver name & call button', 'Live GPS simulation badge', 'Delivery slot countdown'],
      },
      {
        id: 'trk-simple-otp',
        name: 'Instant Lookup with Mobile Phone & OTP',
        nameAr: 'الاستعلام الفوري برقم الجوال ورمز التحقق',
        description: 'Fast customer self-service form requiring only phone number to see all active orders.',
        descriptionAr: 'خدمة ذاتية للعميل يكتب رقم هاتفه ليظهر له فوراً سجل كل طلباته السابقة والحالية.',
        styleTag: 'Fast Self-Service',
        previewBg: 'linear-gradient(135deg, #334155, #1e293b)',
        highlights: ['Single input lookup', 'Multi-order list toggle', 'Re-order 1-click button', 'Report delivery delay'],
      },
      {
        id: 'trk-whatsapp-direct',
        name: 'Direct WhatsApp Concierge Dispatch Link',
        nameAr: 'المتابعة المباشرة مع خدمة عملاء المتجر عبر واتساب',
        description: 'Pre-fills order number into WhatsApp chat for immediate human concierge support.',
        descriptionAr: 'يجهز رسالة برقم الطلب واسم العميل لفتح محادثة واتساب فورية مع فريق التوصيل.',
        styleTag: 'WhatsApp Support',
        previewBg: 'linear-gradient(135deg, #15803d, #166534)',
        highlights: ['1-Click WhatsApp dispatch', 'Pre-filled message template', 'Expected arrival window', 'Driver tips guide'],
      },
    ],
  },
  {
    key: 'account',
    title: '10. Customer Account',
    titleAr: '١٠. صفحة حساب العميل وملفي',
    description: 'Customer profile portal with order history, addresses, and wishlist.',
    descriptionAr: 'بوابة العميل الخاصة التي تحتوي على سجل الطلبات السابقة، العناوين المحفوظة والمفضلة.',
    defaultVariationId: 'acc-app-dashboard',
    variations: [
      {
        id: 'acc-app-dashboard',
        name: 'Modern Mobile-App Grid Dashboard',
        nameAr: 'لوحة تحكم العميل بأسلوب تطبيقات الهواتف',
        description: 'Clean cards for My Orders, Saved Addresses, Wallet Balance, Wishlist & Password.',
        descriptionAr: 'بطاقات أنيقة: طلباتي السابقة، عناويني، رصيد المحفظة، قائمة الأمنيات، وتعديل الحساب.',
        styleTag: 'App-Style Grid',
        isPopular: true,
        previewBg: 'linear-gradient(135deg, #1e293b, #0f172a)',
        highlights: ['Quick re-order button', 'Manage delivery addresses', 'Reward points balance', '1-Click logout'],
      },
      {
        id: 'acc-classic-sidebar',
        name: 'Classic Multi-Tab Account Portal',
        nameAr: 'البوابة الكلاسيكية مع شريط تبويبات جانبي',
        description: 'Desktop navigation sidebar with deep order details, tax invoices, and profile editing.',
        descriptionAr: 'شريط جانبي متكامل لتصفح فواتير المشتريات، تعديل رقم الهاتف، والاشتراك بالرسائل.',
        styleTag: 'Desktop Classic',
        previewBg: 'linear-gradient(135deg, #334155, #1e293b)',
        highlights: ['Download past invoices', 'Default payment method', 'Notification preferences', 'Saved card manager'],
      },
      {
        id: 'acc-vip-loyalty',
        name: 'VIP Loyalty Tier & Cashback Hub',
        nameAr: 'مركز العضوية الذهبية ونقاط المكافآت (VIP)',
        description: 'Highlights customer tier (Silver/Gold/Platinum), perks, cash credit, and exclusive tier discounts.',
        descriptionAr: 'يوضح مستوى عضوية العميل، الرصيد المتاح للاستخدام، والخصومات الحصرية المتاحة لرتبته.',
        styleTag: 'Gamified VIP',
        previewBg: 'linear-gradient(135deg, #d97706, #78350f)',
        highlights: ['Loyalty points progress bar', 'VIP tier badge', 'Exclusive member coupons', 'Personal gift history'],
      },
    ],
  },
  {
    key: 'shipping',
    title: '11. Shipping & Delivery',
    titleAr: '١١. صفحة الشحن والتوصيل',
    description: 'Coverage zones, delivery fees, timeframes, and scheduled delivery options.',
    descriptionAr: 'مناطق التغطية، رسوم التوصيل، المواعيد المتاحة، وخيارات التوصيل المجدول.',
    defaultVariationId: 'shp-zones-table',
    variations: [
      {
        id: 'shp-zones-table',
        name: 'Delivery Zones & Schedule Timing Matrix',
        nameAr: 'جدول مناطق التغطية ومواعيد التوصيل اليومية',
        description: 'Clear pricing table covering same-day delivery, standard courier, and GCC international rates.',
        descriptionAr: 'جدول شفاف يوضح رسوم التوصيل السريع في نفس اليوم، والتوصيل لجميع مدن المملكة والخليج.',
        styleTag: 'Structured Table',
        isPopular: true,
        previewBg: 'linear-gradient(135deg, #0284c7, #0369a1)',
        highlights: ['Makkah & Jeddah 2-Hour delivery rules', 'Free shipping threshold guide', 'Scheduled gift delivery policy', 'Courier partners list'],
      },
      {
        id: 'shp-interactive-checker',
        name: 'City Postcode & Free Delivery Checker',
        nameAr: 'أداة الاستعلام السريع عن التوصيل حسب المدينة',
        description: 'Interactive widget where customer selects their city to see exact cost and delivery time.',
        descriptionAr: 'أداة تفاعلية يختار العميل مدينته ليعرف فوراً تكلفة الشحن وموعد وصول الطلب المتوقع.',
        styleTag: 'Interactive Checker',
        previewBg: 'linear-gradient(135deg, #047857, #065f46)',
        highlights: ['City selector dropdown', 'Live estimated arrival date', 'Packaging protection guarantee', 'Special refrigerated vans note'],
      },
      {
        id: 'shp-hotel-haram',
        name: 'Special Makkah Haram & Hotel Delivery Guide',
        nameAr: 'دليل التوصيل الخاص لفنادق وبرج الساعة بالحرم المكي',
        description: 'Tailored specifically for hotel guests, room delivery protocols, and reception handover.',
        descriptionAr: 'مخصص لضيوف فنادق مكة المكرمة مع توضيح آلية الاستلام عند الاستقبال أو في الغرف.',
        styleTag: 'Hospitality Special',
        previewBg: 'linear-gradient(135deg, #b45309, #78350f)',
        highlights: ['Hotel reception delivery steps', 'Guest name & room number guide', 'Haram boundary timing note', '24/7 Hotline support'],
      },
    ],
  },
  {
    key: 'returns',
    title: '12. Returns & Refunds',
    titleAr: '١٢. صفحة سياسة الاستبدال والاسترجاع',
    description: 'Policy documentation, eligibility checklist, and self-service return request.',
    descriptionAr: 'سياسة الاستبدال والضمان، الشروط المعتمدة، وبوابة طلب الاسترجاع الذاتي.',
    defaultVariationId: 'ret-self-service',
    variations: [
      {
        id: 'ret-self-service',
        name: 'Self-Service 3-Step Return Request Portal',
        nameAr: 'بوابة طلب الاسترجاع الذاتي في ٣ خطوات',
        description: 'Allows buyers to submit an item return with photo proof and choose replacement or refund.',
        descriptionAr: 'يتيح للعميل تقديم طلب استرجاع ورفع صور المنتج التالف واختيار الاستبدال أو استرداد المبلغ.',
        styleTag: 'Interactive Portal',
        isPopular: true,
        previewBg: 'linear-gradient(135deg, #1e293b, #334155)',
        highlights: ['Upload defective item photo', 'Instant refund to wallet or card', 'Courier pickup scheduling', 'Fresh flowers freshness guarantee'],
      },
      {
        id: 'ret-policy-faq',
        name: 'Clear Policy Cards & Ministry of Commerce Compliance',
        nameAr: 'بطاقات الشروط والالتزام بأنظمة وزارة التجارة',
        description: 'Formatted to comply with Saudi Ministry of Commerce consumer protection regulations.',
        descriptionAr: 'متوافقة بالكامل مع اشتراطات وزارة التجارة السعودية لحماية المستهلك وحالات الإرجاع.',
        styleTag: 'Legal / Trust',
        previewBg: 'linear-gradient(135deg, #047857, #064e3b)',
        highlights: ['Ministry of Commerce compliance badge', 'Clear non-returnable items list', 'Refund timelines breakdown', 'Zero hassle exchange'],
      },
      {
        id: 'ret-concierge-chat',
        name: 'WhatsApp Fast Return & Replacement Concierge',
        nameAr: 'خدمة الاستبدال الفوري المباشر عبر واتساب',
        description: 'Routes return inquiries directly to customer care for same-day complimentary replacement.',
        descriptionAr: 'يوجه العميل لموظف خدمة العملاء لاستبدال الباقة أو المنتج في نفس اليوم مجاناً.',
        styleTag: 'VIP Concierge',
        previewBg: 'linear-gradient(135deg, #15803d, #14532d)',
        highlights: ['1-Click WhatsApp complaint', 'Priority response within 15 mins', 'Free replacement guarantee', 'Photo proof evaluation'],
      },
    ],
  },
  {
    key: 'contact',
    title: '13. Contact Us',
    titleAr: '١٣. صفحة اتصل بنا وتواصل معنا',
    description: 'Inquiry forms, branch addresses, WhatsApp hotline, working hours & Google Maps.',
    descriptionAr: 'نموذج التواصل، أرقام الهاتف، واتساب المباشر، ساعات العمل، وموقع الفروع على الخريطة.',
    defaultVariationId: 'cnt-split-map',
    variations: [
      {
        id: 'cnt-split-map',
        name: 'Interactive Map & Branch Information Split',
        nameAr: 'الخريطة التفاعلية مع بطاقات الفروع وساعات العمل',
        description: 'Left side features store contact cards and hours; right side embeds store locations.',
        descriptionAr: 'تصميم عريض يعرض عناوين الفروع وساعات الدوام وهواتف التواصل مع خريطة الوصول.',
        styleTag: 'Interactive Map',
        isPopular: true,
        previewBg: 'linear-gradient(135deg, #0f766e, #115e59)',
        highlights: ['Store location Google Map', 'Branch operating hours', 'Direct call & WhatsApp links', 'Email inquiry form'],
      },
      {
        id: 'cnt-minimal-cards',
        name: 'Minimalist Clean Channels Cards',
        nameAr: 'بطاقات قنوات التواصل السريع الأنيقة',
        description: 'Modern card grid for WhatsApp, Phone, Email, Instagram, and TikTok direct links.',
        descriptionAr: 'بطاقات مباشرة للتواصل الفوري عبر واتساب، الجوال، الإيميل، ومنصات التواصل الاجتماعي.',
        styleTag: 'Clean Channels',
        previewBg: 'linear-gradient(135deg, #1e293b, #0f172a)',
        highlights: ['Instant WhatsApp chat', 'Live support status (Online)', 'Verified social media links', 'Average response time badge'],
      },
      {
        id: 'cnt-b2b-events',
        name: 'B2B Corporate & Event Booking Inquiry Form',
        nameAr: 'نموذج طلب عروض الشركات وحفلات الأعراس',
        description: 'Special form for weddings, corporate floral contracts, hotel flowers, and bulk requests.',
        descriptionAr: 'نموذج مخصص لتنظيم حفلات الزفاف، عقود تزيين الفنادق، وهدايا الشركات والفعاليات.',
        styleTag: 'Corporate & Events',
        previewBg: 'linear-gradient(135deg, #7c2d12, #431407)',
        highlights: ['Event date & venue picker', 'Estimated budget range slider', 'Upload inspiration moodboard', 'Dedicated account manager'],
      },
    ],
  },
  {
    key: 'faq',
    title: '14. FAQ / Help Center',
    titleAr: '١٤. صفحة الأسئلة الشائعة ومركز المساعدة',
    description: 'Categorized accordion questions, instant keyword search, and support links.',
    descriptionAr: 'الأسئلة الأكثر تكراراً مصنفة حسب الأقسام، مع شريط بحث ذكي ورابط للتحدث مع الدعم.',
    defaultVariationId: 'faq-categorized-search',
    variations: [
      {
        id: 'faq-categorized-search',
        name: 'Categorized Accordions with Instant Search Bar',
        nameAr: 'قوائم منسدلة مصنفة مع شريط بحث فوري',
        description: 'Tabs for Ordering, Payment, Delivery, Product Care, and Returns with live search filtering.',
        descriptionAr: 'تبويبات واضحة: الطلب، الدفع، التوصيل، العناية بالورد، والاسترجاع مع بحث سريع في الإجابات.',
        styleTag: 'Categorized & Search',
        isPopular: true,
        previewBg: 'linear-gradient(135deg, #0284c7, #0369a1)',
        highlights: ['Instant live search', 'Smooth animated accordions', 'Helpful? thumbs up/down buttons', 'Direct WhatsApp escalation'],
      },
      {
        id: 'faq-two-col-cards',
        name: 'Two-Column Clean Question Cards Grid',
        nameAr: 'شبكة بطاقات الأسئلة المكشوفة من عمودين',
        description: 'All top questions visible without needing to click, great for fast scanning.',
        descriptionAr: 'عرض الأسئلة الأكثر أهمية في شبكة واضحة تتيح قراءة الإجابات مباشرة دون ضغط إضافي.',
        styleTag: 'Clean Cards Grid',
        previewBg: 'linear-gradient(135deg, #334155, #1e293b)',
        highlights: ['High readability layout', 'Short punchy answers', 'Highlighted top 5 questions', 'Related articles links'],
      },
      {
        id: 'faq-bot-support-hub',
        name: 'Interactive Help Center with Chat Assistant',
        nameAr: 'مركز المساعدة التفاعلي مع المساعد الآلي',
        description: 'Modern knowledge base layout with popular topics cards and floating assistant launcher.',
        descriptionAr: 'قاعدة معرفية شاملة مع بطاقات لأكثر المشاكل شيوعاً وزر بدء المحادثة مع المساعد.',
        styleTag: 'Knowledge Base',
        previewBg: 'linear-gradient(135deg, #6d28d9, #4c1d95)',
        highlights: ['Knowledge base topic icons', 'AI quick answer lookup', 'Download guides PDF', 'Open support ticket'],
      },
    ],
  },
  {
    key: 'about',
    title: '15. About Us',
    titleAr: '١٥. صفحة من نحن وقصة المتجر',
    description: 'Brand story, company mission, team pillars, and certified credentials.',
    descriptionAr: 'قصة المتجر، الرؤية والرسالة، قيم العمل، وفريق العمل والشهادات المعتمدة.',
    defaultVariationId: 'abt-heritage-timeline',
    variations: [
      {
        id: 'abt-heritage-timeline',
        name: 'Heritage Timeline & Craftsmanship Story',
        nameAr: 'المسيرة والتاريخ مع قصة الجودة والصنعة',
        description: 'Showcases founding year, milestone timeline, floristry masters, and quality commitments.',
        descriptionAr: 'يعرض سنة التأسيس، محطات التطور، فريق خبراء التنسيق، والالتزام بأعلى معايير الجودة.',
        styleTag: 'Timeline & Heritage',
        isPopular: true,
        previewBg: 'linear-gradient(135deg, #059669, #064e3b)',
        highlights: ['Founding milestone timeline', 'Artisan team spotlight', 'Import sources map (Holland, Kenya, Ecuador)', 'Satisfaction promise'],
      },
      {
        id: 'abt-mission-pillars',
        name: 'Vision, Mission & 4 Core Values Grid',
        nameAr: 'الرؤية والرسالة وقيم العمل الأربعة',
        description: 'Clean modern layout with bold stat counters, core value pillars, and client testimonials.',
        descriptionAr: 'تصميم مؤسسي أنيق يبرز إحصائيات المتجر، ركائز العمل الأساسية، وتجارب العملاء.',
        styleTag: 'Corporate Pillars',
        previewBg: 'linear-gradient(135deg, #1e293b, #0f172a)',
        highlights: ['Store impact metrics (Orders, Happy Clients)', 'Vision & Mission cards', 'Sustainability & Eco packaging', 'Community involvement'],
      },
      {
        id: 'abt-founder-editorial',
        name: 'Founder Letter & Behind-the-Scenes Photo Mosaic',
        nameAr: 'رسالة المؤسس ومعرض صور خلف الكواليس',
        description: 'Personalized heartfelt message from the store creator with boutique behind-the-scenes photography.',
        descriptionAr: 'رسالة شخصية من صاحب المتجر تلامس مشاعر العميل مع صور حقيقية لورشة التنسيق وتجهيز الباقات.',
        styleTag: 'Warm Editorial',
        previewBg: 'linear-gradient(135deg, #991b1b, #7f1d1d)',
        highlights: ['Personal founder signature', 'Behind-the-scenes photo mosaic', 'Authenticity promise', 'Invite to visit showroom'],
      },
    ],
  },
];

const STORAGE_KEY_PREFIX = 'saas_store_page_templates_';

/**
 * Read the active page templates map for a store.
 */
export function getStoreActivePageTemplates(storeId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${storeId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed reading page templates from storage:', err);
  }

  // Default fallback: assign defaultVariationId for each page
  const defaults: Record<string, string> = {};
  ALL_PAGE_TEMPLATES.forEach((page) => {
    defaults[page.key] = page.defaultVariationId;
  });
  return defaults;
}

/**
 * Persist an active page template selection for a store.
 */
export function setStoreActivePageTemplate(storeId: string, pageKey: string, variationId: string): Record<string, string> {
  const current = getStoreActivePageTemplates(storeId);
  current[pageKey] = variationId;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${storeId}`, JSON.stringify(current));
  } catch (err) {
    console.error('Failed persisting page template to storage:', err);
  }
  return current;
}
