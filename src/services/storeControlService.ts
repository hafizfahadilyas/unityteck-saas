/**
 * Master Admin Central Store Control Service
 * Provides granular toggling of:
 * 1. Store Admin Main Pages (Orders, Products, Invoices, Marketing, Shipping, etc.)
 * 2. Store Admin Sub-Pages (Coupons, Abandoned Carts, Loyalty, Barcodes, etc.)
 * 3. Storefront Customer Pages (Home, Catalog, Product Detail, Cart, Checkout, etc.)
 * 4. Storefront Micro-Components & Live Elements (Sticky Header, Announcement Bar, Live Search, WhatsApp Bubble, Quick Buy, etc.)
 *
 * Supports Individual Store overrides as well as Global SaaS Bulk sync.
 */

export type ControlCategory = 
  | 'store_admin_pages' 
  | 'store_admin_subpages' 
  | 'storefront_pages' 
  | 'storefront_elements';

export interface ControlItemDefinition {
  id: string;
  category: ControlCategory;
  parentPageId?: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  iconName: string;
  defaultEnabled: boolean;
  impactLevel?: 'high' | 'medium' | 'standard';
}

export const CONTROL_DEFINITIONS: ControlItemDefinition[] = [
  // ── 1. STORE ADMIN MAIN PAGES ──────────────────────────────────────────
  {
    id: 'dashboard',
    category: 'store_admin_pages',
    nameEn: 'Dashboard & Live Analytics',
    nameAr: 'لوحة التحكم والمؤشرات المباشرة',
    descriptionEn: 'Core overview dashboard showing live metrics, sales KPIs, and rapid shortcuts.',
    descriptionAr: 'لوحة القيادة الرئيسية الشاملة للمبيعات والمؤشرات الحية والعمليات السريعة.',
    iconName: 'LayoutDashboard',
    defaultEnabled: true,
    impactLevel: 'high',
  },
  {
    id: 'orders',
    category: 'store_admin_pages',
    nameEn: 'Orders & Fulfillment Management',
    nameAr: 'إدارة الطلبات والشحن والتحصيل',
    descriptionEn: 'Customer order tracking, status updates, direct sales, and delivery dispatch.',
    descriptionAr: 'معالجة وتجهيز طلبات العملاء وتحديث حالات الشحن وتأكيد الدفع.',
    iconName: 'ShoppingCart',
    defaultEnabled: true,
    impactLevel: 'high',
  },
  {
    id: 'canva',
    category: 'store_admin_pages',
    nameEn: 'Design Studio',
    nameAr: 'استوديو التصميم',
    descriptionEn: 'Store design workspace for templates, creatives, and social posts.',
    descriptionAr: 'مساحة تصميم المتجر للقوالب والمواد البصرية والمنشورات.',
    iconName: 'Paintbrush',
    defaultEnabled: true,
    impactLevel: 'standard',
  },
  {
    id: 'ai-media',
    category: 'store_admin_pages',
    nameEn: 'AI Image & Video Generator',
    nameAr: 'مولّد الصور والفيديو بالذكاء الاصطناعي',
    descriptionEn: 'Prompt-based AI image and video generation with per-store monthly limits; save to Media Library or post.',
    descriptionAr: 'توليد صور وفيديو بالوصف مع حدود شهرية لكل متجر؛ الحفظ في مكتبة الوسائط أو النشر.',
    iconName: 'Sparkles',
    defaultEnabled: true,
    impactLevel: 'standard',
  },
  {
    id: 'products',
    category: 'store_admin_pages',
    nameEn: 'Products Catalog & Inventory',
    nameAr: 'كتالوج المنتجات والمخزون',
    descriptionEn: 'SKU catalogue, stock management, pricing, categories, and visual media.',
    descriptionAr: 'قائمة المنتجات والتسعير ومستويات المخزون والوسائط والسمات.',
    iconName: 'Package',
    defaultEnabled: true,
    impactLevel: 'high',
  },
  {
    id: 'customers',
    category: 'store_admin_pages',
    nameEn: 'Customers & CRM Database',
    nameAr: 'إدارة العملاء وقاعدة البيانات',
    descriptionEn: 'Customer profiles, purchase records, order frequency, and segmentation.',
    descriptionAr: 'سجلات المتسوقين وتاريخ العمليات والشرائح والملفات الشخصية.',
    iconName: 'Users',
    defaultEnabled: true,
    impactLevel: 'high',
  },
  {
    id: 'marketing',
    category: 'store_admin_pages',
    nameEn: 'Marketing & Growth Suite',
    nameAr: 'مركز التسويق وأدوات النمو',
    descriptionEn: 'Comprehensive marketing tools: coupons, abandoned carts, loyalty, and bank offers.',
    descriptionAr: 'حزمة التسويق المتقدمة: كوبونات، سلات متروكة، كاش باك، ونقاط ولاء.',
    iconName: 'Megaphone',
    defaultEnabled: true,
    impactLevel: 'high',
  },
  {
    id: 'invoices',
    category: 'store_admin_pages',
    nameEn: 'Tax Invoices & ZATCA Portal',
    nameAr: 'الفواتير الضريبية وهيئة الزكاة هيئة الزكاة',
    descriptionEn: 'Standard & simplified tax invoices, ZATCA Phase-2 QR stamps, credit notes, and receipts.',
    descriptionAr: 'إصدار الفواتير الضريبية المتوافقة مع متطلبات هيئة الزكاة والجمارك هيئة الزكاة والإشعارات الدائنة.',
    iconName: 'ReceiptText',
    defaultEnabled: true,
    impactLevel: 'high',
  },
  {
    id: 'shipping',
    category: 'store_admin_pages',
    nameEn: 'Shipping & Courier Logistics',
    nameAr: 'بوليصات الشحن واللوجستيات',
    descriptionEn: 'Courier dispatch (SMSA, Aramex, SPL), barcode labels, rate zones, and reverse logistics.',
    descriptionAr: 'طباعة بوليصات شركات الشحن، تكاملات التوصيل، مناطق التسعير وإدارة المرتجعات.',
    iconName: 'Truck',
    defaultEnabled: true,
    impactLevel: 'high',
  },
  {
    id: 'payments',
    category: 'store_admin_pages',
    nameEn: 'Payment Gateways & Settlement',
    nameAr: 'بوابات الدفع الإلكتروني والتحصيل',
    descriptionEn: 'Mada, Apple Pay, Visa/Mastercard, Tabby, Tamara, and Cash on Delivery settings.',
    descriptionAr: 'إدارة وتفعيل طرق الدفع (مدى، آبل باي، تابي، تمارا، والدفع عند الاستلام).',
    iconName: 'CreditCard',
    defaultEnabled: true,
    impactLevel: 'high',
  },
  {
    id: 'whatsapp',
    category: 'store_admin_pages',
    nameEn: 'WhatsApp Automated Notifications',
    nameAr: 'إدارة واتساب والتنبيهات التلقائية',
    descriptionEn: 'Order confirmation alerts, abandoned cart recovery ping, and direct agent live chat.',
    descriptionAr: 'إرسال إشعارات الطلب التلقائية عبر واتساب واسترجاع السلات وخدمة العملاء المباشرة.',
    iconName: 'MessageCircle',
    defaultEnabled: true,
    impactLevel: 'medium',
  },
  {
    id: 'analytics',
    category: 'store_admin_pages',
    nameEn: 'Analytics & Traffic Insights',
    nameAr: 'التحليلات الذكية ومصادر الزيارات',
    descriptionEn: 'Visitor traffic analytics, conversion funnels, conversion rates, and acquisition channels.',
    descriptionAr: 'متابعة مصادر حركة الزوار، معدلات التحويل، قنوات التسويق والمبيعات.',
    iconName: 'BarChart3',
    defaultEnabled: true,
    impactLevel: 'medium',
  },
  {
    id: 'reports',
    category: 'store_admin_pages',
    nameEn: 'Financial & Inventory Reports',
    nameAr: 'التقارير المالية والمبيعات',
    descriptionEn: 'Exportable revenue reports, tax declarations, top-performing products, and courier stats.',
    descriptionAr: 'تصدير التقارير المالية الدقيقة، بيانات الإقرارات الضريبية، وحركة المنتجات.',
    iconName: 'FileText',
    defaultEnabled: true,
    impactLevel: 'medium',
  },
  {
    id: 'seo',
    category: 'store_admin_pages',
    nameEn: 'SEO & Search Engine Console',
    nameAr: 'تحسين محركات البحث',
    descriptionEn: 'Meta descriptions, OpenGraph tags, XML sitemap generation, and Google Tag Manager.',
    descriptionAr: 'إعدادات الأرشفة والكلمات المفتاحية، خرائط الموقع وربط مدير علامات جوجل.',
    iconName: 'Search',
    defaultEnabled: true,
    impactLevel: 'medium',
  },
  {
    id: 'themes',
    category: 'store_admin_pages',
    nameEn: 'Theme Customizer & Visual Builder',
    nameAr: 'محرر القوالب والمظهر البصري',
    descriptionEn: 'Visual drag & drop store design, branding color palettes, font pairings, and layout presets.',
    descriptionAr: 'تخصيص هوية المتجر البصرية، لوحات الألوان، الخطوط وتصميم الواجهة بالسحب والإفلات.',
    iconName: 'Palette',
    defaultEnabled: true,
    impactLevel: 'high',
  },
  {
    id: 'pages',
    category: 'store_admin_pages',
    nameEn: 'Custom Content Pages & Policies',
    nameAr: 'إدارة الصفحات والشروط والأحكام',
    descriptionEn: 'Rich content pages, privacy policy, return policy, and marketing landing pages.',
    descriptionAr: 'إنشاء وتعديل الصفحات التعريفية، سياسات الاسترجاع والخصوصية وصفحات الهبوط.',
    iconName: 'Files',
    defaultEnabled: true,
    impactLevel: 'standard',
  },
  {
    id: 'blog',
    category: 'store_admin_pages',
    nameEn: 'Store Blog & Content Articles',
    nameAr: 'مقالات المتجر والتدوين التسويقي',
    descriptionEn: 'Publish SEO-optimized articles, shopping guides, product features, and customer stories.',
    descriptionAr: 'نشر المقالات التثقيفية ودليل الشراء المعزز لتصدر نتائج البحث في محركات البحث.',
    iconName: 'BookOpen',
    defaultEnabled: true,
    impactLevel: 'standard',
  },
  {
    id: 'commerce-tools',
    category: 'store_admin_pages',
    nameEn: 'Article Commerce Tools',
    nameAr: 'أدوات التجارة وتضمين المنتجات',
    descriptionEn: 'Embed buyable product cards, dynamic buy-boxes, and affiliate tracking into articles.',
    descriptionAr: 'تضمين بطاقات الشراء المباشر والمنتجات التفاعلية داخل محتوى التدوينات والمقالات.',
    iconName: 'Sparkles',
    defaultEnabled: true,
    impactLevel: 'standard',
  },
  {
    id: 'hosting',
    category: 'store_admin_pages',
    nameEn: 'Custom Domains & SSL Manager',
    nameAr: 'إدارة النطاقات الخاصة وسجلات النطاق',
    descriptionEn: 'Custom brand domain linkage, DNS verification, SSL certificates, and Hostinger records.',
    descriptionAr: 'ربط النطاقات المخصصة، شهادات الأمان والتحقق من سجلات النطاق.',
    iconName: 'Server',
    defaultEnabled: true,
    impactLevel: 'high',
  },
  {
    id: 'appstore',
    category: 'store_admin_pages',
    nameEn: 'App Store & Integrations Hub',
    nameAr: 'متجر التطبيقات والتكاملات',
    descriptionEn: 'Discover, install, and manage official third-party apps, plugins, and webhooks.',
    descriptionAr: 'استكشاف وتثبيت التطبيقات الخارجية، أدوات الأتمتة وربط خطافات الويب.',
    iconName: 'ShoppingBag',
    defaultEnabled: true,
    impactLevel: 'standard',
  },
  {
    id: 'settings',
    category: 'store_admin_pages',
    nameEn: 'Store General Settings',
    nameAr: 'إعدادات المتجر العامة',
    descriptionEn: 'Store business details, currency, tax rates, operating hours, and staff access.',
    descriptionAr: 'بيانات المتجر الرسمية، السجل التجاري، العملات الافتراضية وصلاحيات الموظفين.',
    iconName: 'Settings',
    defaultEnabled: true,
    impactLevel: 'high',
  },
  {
    id: 'notifications',
    category: 'store_admin_pages',
    nameEn: 'Store Notifications Center',
    nameAr: 'مركز إشعارات المتجر',
    descriptionEn: 'In-dashboard alerts for orders, stock, payments, and marketing events.',
    descriptionAr: 'تنبيهات لوحة التحكم للطلبات والمخزون والمدفوعات وأحداث التسويق.',
    iconName: 'Bell',
    defaultEnabled: true,
    impactLevel: 'medium',
  },

  // ── 2. STORE ADMIN SUB-PAGES & MODULES (ids = live sidebar / tab ids) ──
  {
    id: 'categories',
    parentPageId: 'products',
    category: 'store_admin_subpages',
    nameEn: 'Product Categories & Hierarchy',
    nameAr: 'شجرة تصنيفات المنتجات',
    descriptionEn: 'Multi-level category hierarchy, badges, and category display sorting.',
    descriptionAr: 'تنظيم التصنيفات متعددة المستويات والشارات وترتيب الظهور.',
    iconName: 'FolderTree',
    defaultEnabled: true,
  },
  {
    id: 'brands',
    parentPageId: 'products',
    category: 'store_admin_subpages',
    nameEn: 'Brands & Manufacturer Directory',
    nameAr: 'العلامات التجارية والمصنعين',
    descriptionEn: 'Brand logos, manufacturer descriptions, and filterable brand catalog.',
    descriptionAr: 'شعارات الماركات، بيانات المصنّعين وفلاتر البحث حسب العلامة التجارية.',
    iconName: 'Tag',
    defaultEnabled: true,
  },
  {
    id: 'media',
    parentPageId: 'products',
    category: 'store_admin_subpages',
    nameEn: 'Media & Asset Library',
    nameAr: 'مكتبة الوسائط والصور الموحدة',
    descriptionEn: 'Cloud storage image organizer, WebP compression, and product image galleria.',
    descriptionAr: 'إدارة وسائط المتجر، ضغط صور الويب التلقائي وتنظيم ألبومات المنتجات.',
    iconName: 'ImageIcon',
    defaultEnabled: true,
  },
  {
    id: 'coupons',
    parentPageId: 'marketing',
    category: 'store_admin_subpages',
    nameEn: 'Discount Coupons',
    nameAr: 'أكواد وكوبونات الخصم',
    descriptionEn: 'Fixed, percentage, and free shipping coupon codes.',
    descriptionAr: 'إنشاء كوبونات الخصم بنسب مئوية أو مبالغ ثابتة أو شحن مجاني.',
    iconName: 'Tag',
    defaultEnabled: true,
  },
  {
    id: 'abandoned-carts',
    parentPageId: 'marketing',
    category: 'store_admin_subpages',
    nameEn: 'Abandoned Cart Recovery',
    nameAr: 'استرجاع السلات المتروكة الذكي',
    descriptionEn: 'Real-time cart intercept modal and automated WhatsApp recovery triggers.',
    descriptionAr: 'تتبع السلات التي لم تكتمل وإرسال تذكيرات مخصصة عبر واتساب والبريد.',
    iconName: 'ShoppingBag',
    defaultEnabled: true,
  },
  {
    id: 'cart-offers',
    parentPageId: 'marketing',
    category: 'store_admin_subpages',
    nameEn: 'Cart Value Tier Offers',
    nameAr: 'عروض قيمة السلة والشرائح',
    descriptionEn: 'Dynamic incentives based on cart basket value (e.g. Free gift above SAR 300).',
    descriptionAr: 'مكافآت تصاعدية بناء على قيمة سلة المشتريات (شحن مجاني أو هدية فورية).',
    iconName: 'Sparkles',
    defaultEnabled: false,
  },
  {
    id: 'promotions',
    parentPageId: 'marketing',
    category: 'store_admin_subpages',
    nameEn: 'Flash Deals & Seasonal Promotions',
    nameAr: 'عروض الخصم المؤقتة والتخفيضات',
    descriptionEn: 'Time-sensitive flash sales with automatic price strikethroughs.',
    descriptionAr: 'حملات التخفيضات المؤقتة مع شارات الخصم وشطب السعر القديم.',
    iconName: 'Tag',
    defaultEnabled: true,
  },
  {
    id: 'bank-offers',
    parentPageId: 'marketing',
    category: 'store_admin_subpages',
    nameEn: 'Saudi Bank Card Offers',
    nameAr: 'خصومات بطاقات البنوك السعودية',
    descriptionEn: 'BIN-level card discounts for Al Rajhi, SNB, Riyad Bank, and Alinma cards.',
    descriptionAr: 'خصومات فورية لحاملي بطاقات الراجحي، الأهلي، الرياض، والإنماء.',
    iconName: 'CreditCard',
    defaultEnabled: false,
  },
  {
    id: 'cashback',
    parentPageId: 'marketing',
    category: 'store_admin_subpages',
    nameEn: 'Customer Cashback & Store Wallet',
    nameAr: 'برنامج الكاش باك ومحفظة الرصيد',
    descriptionEn: 'Reward buyers with percentage cashback credited directly into their store wallet.',
    descriptionAr: 'إيداع نسبة كاش باك في محفظة المتسوق لاستخدامها في الطلبات القادمة.',
    iconName: 'Coins',
    defaultEnabled: true,
  },
  {
    id: 'gifting',
    parentPageId: 'marketing',
    category: 'store_admin_subpages',
    nameEn: 'Gifting System & Greeting Cards',
    nameAr: 'نظام الإهداء وبطاقات التهنئة',
    descriptionEn: 'Gift wrapping selection, recipient greeting note, and hidden invoice delivery.',
    descriptionAr: 'خدمة إهداء الطلبات، اختيار ورق التغليف الفاخر وإرفاق كرت تهنئة مخصص.',
    iconName: 'Sparkles',
    defaultEnabled: false,
  },
  {
    id: 'loyalty',
    parentPageId: 'marketing',
    category: 'store_admin_subpages',
    nameEn: 'Loyalty Points & VIP Club',
    nameAr: 'برنامج نقاط الولاء ونادي النخبة',
    descriptionEn: 'Tiered loyalty levels (Silver, Gold, Platinum) with point redemption.',
    descriptionAr: 'مستويات ولاء متدرجة ونقاط مكافأة تستبدل بخصومات مباشرة عند الشراء.',
    iconName: 'Award',
    defaultEnabled: true,
  },
  {
    id: 'repurchase-reminders',
    parentPageId: 'marketing',
    category: 'store_admin_subpages',
    nameEn: 'Smart Repurchase Reminders',
    nameAr: 'تذكيرات إعادة الشراء الدورية',
    descriptionEn: 'Predictive reminders for consumable products (coffee, perfumes, care products).',
    descriptionAr: 'تذكير العملاء تلقائياً بإعادة طلب السلع الاستهلاكية قبل نفادها.',
    iconName: 'RefreshCw',
    defaultEnabled: true,
  },
  {
    id: 'campaigns',
    parentPageId: 'marketing',
    category: 'store_admin_subpages',
    nameEn: 'Marketing Campaigns',
    nameAr: 'الحملات التسويقية',
    descriptionEn: 'Multi-channel campaign planning, performance tracking, and channel attribution.',
    descriptionAr: 'تخطيط الحملات متعددة القنوات وتتبع الأداء ونسب التحويل.',
    iconName: 'Megaphone',
    defaultEnabled: true,
  },
  {
    id: 'affiliate',
    parentPageId: 'marketing',
    category: 'store_admin_subpages',
    nameEn: 'Affiliate Marketing & Influencer Links',
    nameAr: 'التسويق بالعمولة وروابط المؤثرين',
    descriptionEn: 'Unique tracking codes, influencer commission payouts, and link performance analytics.',
    descriptionAr: 'روابط تتبع مخصصة للمسوقين وحساب نسب العمولات والأرباح تلقائياً.',
    iconName: 'Users',
    defaultEnabled: false,
  },
  {
    id: 'direct-orders',
    parentPageId: 'marketing',
    category: 'store_admin_subpages',
    nameEn: 'Direct Orders & Rapid POS',
    nameAr: 'الطلب المباشر ونقاط البيع السريعة',
    descriptionEn: 'Manual order creation for phone, WhatsApp, or direct showroom purchases.',
    descriptionAr: 'إصدار الطلبات السريعة هاتفياً أو عبر واتساب أو منافذ البيع المباشرة.',
    iconName: 'ShoppingCart',
    defaultEnabled: true,
  },
  {
    id: 'social',
    parentPageId: 'marketing',
    category: 'store_admin_subpages',
    nameEn: 'Social Publishing',
    nameAr: 'النشر الاجتماعي',
    descriptionEn: 'Schedule and publish store creatives to connected social channels.',
    descriptionAr: 'جدولة ونشر مواد المتجر على قنوات التواصل المتصلة.',
    iconName: 'Share2',
    defaultEnabled: true,
  },
  {
    id: 'zones',
    parentPageId: 'shipping',
    category: 'store_admin_subpages',
    nameEn: 'Saudi Regional Shipping Zones',
    nameAr: 'مناطق الشحن الجغرافية السعودية',
    descriptionEn: 'Customized shipping rates and SLAs per region (Central, Western, Eastern, Southern).',
    descriptionAr: 'تحديد أسعار وفترات التوصيل لكل منطقة (الوسطى، الغربية، الشرقية، والجنوبية).',
    iconName: 'Truck',
    defaultEnabled: true,
  },
  {
    id: 'returns',
    parentPageId: 'shipping',
    category: 'store_admin_subpages',
    nameEn: 'Returns & Exchange Workflow',
    nameAr: 'إدارة طلبات الاسترجاع والاستبدال',
    descriptionEn: 'Customer return approvals, automated return pickup dispatch, and credit refunds.',
    descriptionAr: 'استقبال طلبات الإرجاع، إصدار بوليصات العكسي وتحديث رصيد العميل.',
    iconName: 'RotateCcw',
    defaultEnabled: true,
  },
  {
    id: 'shipments',
    parentPageId: 'shipping',
    category: 'store_admin_subpages',
    nameEn: 'Shipments & Live Tracking',
    nameAr: 'الشحنات والتتبع المباشر',
    descriptionEn: 'Dispatch list, courier status, and live shipment tracking for the store.',
    descriptionAr: 'قائمة الإرسال وحالة شركات الشحن وتتبع الشحنات المباشر للمتجر.',
    iconName: 'Truck',
    defaultEnabled: true,
  },
  {
    id: 'labels',
    parentPageId: 'shipping',
    category: 'store_admin_subpages',
    nameEn: 'Shipping Labels Studio',
    nameAr: 'استوديو بوالص الشحن',
    descriptionEn: 'Print and manage 4×6 shipping labels for supported Saudi couriers.',
    descriptionAr: 'طباعة وإدارة بوالص الشحن لشركات التوصيل المعتمدة.',
    iconName: 'FileText',
    defaultEnabled: true,
  },
  {
    id: 'carriers',
    parentPageId: 'shipping',
    category: 'store_admin_subpages',
    nameEn: 'Courier Integrations',
    nameAr: 'شركات الشحن المعتمدة',
    descriptionEn: 'Connect and manage SMSA, Aramex, SPL, and other courier accounts.',
    descriptionAr: 'ربط وإدارة حسابات سمسا وأرامكس والبريد السعودي وغيرها.',
    iconName: 'Truck',
    defaultEnabled: true,
  },
  {
    id: 'methods',
    parentPageId: 'shipping',
    category: 'store_admin_subpages',
    nameEn: 'Shipping Methods',
    nameAr: 'طرق وخيارات التسليم',
    descriptionEn: 'Delivery options such as standard, express, and same-day where available.',
    descriptionAr: 'خيارات التسليم مثل العادي والسريع وفي نفس اليوم حسب التوفر.',
    iconName: 'Truck',
    defaultEnabled: true,
  },

  // ── 3. STOREFRONT CUSTOMER PAGES ────────────────────────────────────────
  {
    id: 'page_storefront_home',
    category: 'storefront_pages',
    nameEn: 'Storefront Homepage',
    nameAr: 'الصفحة الرئيسية للمتجر',
    descriptionEn: 'Hero banners, top featured categories, best-seller carousels, and value propositions.',
    descriptionAr: 'الواجهة الرئيسية وعارض البنرات وأقسام المنتجات المميزة وقيم المتجر.',
    iconName: 'Globe',
    defaultEnabled: true,
    impactLevel: 'high',
  },
  {
    id: 'page_storefront_catalog',
    category: 'storefront_pages',
    nameEn: 'Products Catalog & Filters Page',
    nameAr: 'صفحة كتالوج المنتجات والفلاتر',
    descriptionEn: 'Comprehensive product listing with dynamic price, category, and brand filters.',
    descriptionAr: 'عرض قائمة المنتجات مع أدوات التصفية المتقدمة حسب السعر والماركة والتقييم.',
    iconName: 'Package',
    defaultEnabled: true,
    impactLevel: 'high',
  },
  {
    id: 'page_storefront_product',
    category: 'storefront_pages',
    nameEn: 'Product Detail Page (PDP)',
    nameAr: 'صفحة تفاصيل المنتج والمواصفات',
    descriptionEn: 'Product image gallery, variants picker, price calculations, and buy button.',
    descriptionAr: 'معرض صور المنتج، الخيارات والمقاسات، تقييمات العملاء وزر الشراء.',
    iconName: 'ShoppingBag',
    defaultEnabled: true,
    impactLevel: 'high',
  },
  {
    id: 'page_storefront_cart',
    category: 'storefront_pages',
    nameEn: 'Shopping Cart Page',
    nameAr: 'صفحة سلة التسوق',
    descriptionEn: 'Full cart review with quantity controls, coupon input, and price breakdown.',
    descriptionAr: 'مراجعة عناصر السلة وتطبيق كوبونات الخصم وحساب إجمالي الفاتورة والضريبة.',
    iconName: 'ShoppingCart',
    defaultEnabled: true,
    impactLevel: 'high',
  },
  {
    id: 'page_storefront_checkout',
    category: 'storefront_pages',
    nameEn: 'Secure Checkout Page',
    nameAr: 'صفحة إتمام الطلب والدفع الآمن',
    descriptionEn: 'Customer shipping address, national address validation, and gateway selection.',
    descriptionAr: 'إدخال العنوان الوطني وبيانات المستلم واختيار طريقة الدفع المناسبة.',
    iconName: 'CreditCard',
    defaultEnabled: true,
    impactLevel: 'high',
  },
  {
    id: 'page_storefront_tracking',
    category: 'storefront_pages',
    nameEn: 'Public Order Tracking Portal',
    nameAr: 'بوابة تتبع حالة الشحنات والطلبات',
    descriptionEn: 'Live parcel tracking by order number and mobile phone with live courier milestones.',
    descriptionAr: 'استعلام المتسوقين عن مسار الشحنة برقم الطلب أو الجوال ومعاينة مراحل التوصيل.',
    iconName: 'Truck',
    defaultEnabled: true,
    impactLevel: 'medium',
  },
  {
    id: 'page_storefront_account',
    category: 'storefront_pages',
    nameEn: 'Customer Account & Login Portal',
    nameAr: 'حساب العميل وسجل الطلبات السابقة',
    descriptionEn: 'Buyer login, saved delivery addresses, order history, and digital invoices.',
    descriptionAr: 'تسجيل دخول المتسوق، العناوين المحفوظة، وتاريخ الفواتير والطلبات.',
    iconName: 'Users',
    defaultEnabled: true,
    impactLevel: 'medium',
  },
  {
    id: 'page_storefront_blog',
    category: 'storefront_pages',
    nameEn: 'Public Blog & Knowledge Articles',
    nameAr: 'المدونة العامة والمقالات التثقيفية',
    descriptionEn: 'Public articles feed, categorization, search, and reading view for shoppers.',
    descriptionAr: 'قائمة المقالات العامة وأدلة الاستخدام والتدوينات الموجهة للمتسوقين.',
    iconName: 'BookOpen',
    defaultEnabled: true,
    impactLevel: 'standard',
  },
  {
    id: 'page_storefront_contact',
    category: 'storefront_pages',
    nameEn: 'Contact Us & FAQ Support Page',
    nameAr: 'صفحة اتصل بنا والأسئلة الشائعة',
    descriptionEn: 'Inquiry contact form, store phone, email, map location, and FAQ accordion.',
    descriptionAr: 'نموذج التواصل، أرقام خدمة العملاء، الموقع الجغرافي والأسئلة الشائعة.',
    iconName: 'Headphones',
    defaultEnabled: true,
    impactLevel: 'standard',
  },

  // ── 4. STOREFRONT MICRO-COMPONENTS & LIVE ELEMENTS ─────────────────────
  {
    id: 'elem_announcement_bar',
    category: 'storefront_elements',
    nameEn: 'Top Announcement Bar & Ticker',
    nameAr: 'شريط الإعلانات الترويجي العلوي',
    descriptionEn: 'High-visibility ticker at the very top for flash announcements and free shipping alerts.',
    descriptionAr: 'الشريط العلوي الملون للإعلان عن كود الخصم الحالي أو حد الشحن المجاني.',
    iconName: 'Megaphone',
    defaultEnabled: true,
  },
  {
    id: 'elem_sticky_header',
    category: 'storefront_elements',
    nameEn: 'Sticky Floating Navigation Bar',
    nameAr: 'القائمة العلوية المثبتة عند التمرير',
    descriptionEn: 'Keeps store logo, search bar, and cart icon fixed at the top during scrolling.',
    descriptionAr: 'تثبيت رأس الصفحة والبحث وأيقونة السلة أثناء النزول لتسهيل التصفح.',
    iconName: 'Sliders',
    defaultEnabled: true,
  },
  {
    id: 'elem_live_search',
    category: 'storefront_elements',
    nameEn: 'Live Instant Search & Autocomplete',
    nameAr: 'البحث الفوري المباشر مع الاقتراحات',
    descriptionEn: 'Instant search dropdown displaying matching products, prices, and thumbnails as user types.',
    descriptionAr: 'إظهار المنتجات المطابقة فور كتابة أول أحرف مع صور مصغرة وأسعار.',
    iconName: 'Search',
    defaultEnabled: true,
  },
  {
    id: 'elem_currency_switcher',
    category: 'storefront_elements',
    nameEn: 'Multi-Currency Live Switcher',
    nameAr: 'محول العملات الخليجية والدولية',
    descriptionEn: 'Enables shoppers to switch live currency between SAR, USD, EUR, AED, KWD, etc.',
    descriptionAr: 'تمكين الزائر من اختيار عملة العرض المفضلة بالريال السعودي أو العملات الأخرى.',
    iconName: 'Coins',
    defaultEnabled: true,
  },
  {
    id: 'elem_language_switcher',
    category: 'storefront_elements',
    nameEn: 'Bilingual Language Switcher (AR/EN)',
    nameAr: 'زر التبديل اللغوي (عربي / إنجليزي)',
    descriptionEn: 'One-click switch between Arabic (RTL) and English (LTR) with instant layout flip.',
    descriptionAr: 'تبديل فوري بين الواجهة العربية والإنجليزية بكفاءة كاملة.',
    iconName: 'Globe',
    defaultEnabled: true,
  },
  {
    id: 'elem_hero_slider',
    category: 'storefront_elements',
    nameEn: 'Hero Slider & 3D Interactive Banner',
    nameAr: 'سلايدر البنرات التفاعلي الرئيسي',
    descriptionEn: 'Main promotional image slider with CTA buttons and smooth slide transitions.',
    descriptionAr: 'عرض البنرات الترويجية المتحركة مع أزرار الإجراء السريع للشراء والتسوق.',
    iconName: 'Sliders',
    defaultEnabled: true,
  },
  {
    id: 'elem_countdown_timer',
    category: 'storefront_elements',
    nameEn: 'Flash Deal Countdown Urgency Timer',
    nameAr: 'عداد العد التنازلي للعروض المؤقتة',
    descriptionEn: 'Animated clock showing hours/minutes left for flash promotions to drive FOMO.',
    descriptionAr: 'ساعة رقمية تفاعلية تحفز العميل على سرعة الطلب قبل انتهاء العرض.',
    iconName: 'Clock',
    defaultEnabled: true,
  },
  {
    id: 'elem_category_pills',
    category: 'storefront_elements',
    nameEn: 'Quick Category Filter Pills',
    nameAr: 'أزرار التصنيفات الأفقية السريعة',
    descriptionEn: 'Horizontally scrollable category pills for instant one-touch navigation.',
    descriptionAr: 'أزرار تصنيفات دائرية سريعة التمرير للتنقل بين الأقسام بلمسة واحدة.',
    iconName: 'FolderTree',
    defaultEnabled: true,
  },
  {
    id: 'elem_quick_view',
    category: 'storefront_elements',
    nameEn: 'Product Quick View Modal',
    nameAr: 'نافذة المعاينة السريعة للمنتج',
    descriptionEn: 'Pop-up window allowing shoppers to inspect product and add to cart without leaving listing.',
    descriptionAr: 'نافذة منبثقة لمعاينة تفاصيل المنتج وإضافته للسلة دون مغادرة الصفحة الحالية.',
    iconName: 'Sparkles',
    defaultEnabled: true,
  },
  {
    id: 'elem_direct_buy',
    category: 'storefront_elements',
    nameEn: 'One-Click "Direct Buy" Express Button',
    nameAr: 'زر "شراء مباشر سريع" بنقرة واحدة',
    descriptionEn: 'Skips the shopping cart and sends shopper straight to express checkout.',
    descriptionAr: 'تخطي مرحلة السلة والتوجه مباشرة لصفحة الدفع لزيادة سرعة التحويل.',
    iconName: 'Zap',
    defaultEnabled: true,
  },
  {
    id: 'elem_stock_urgency',
    category: 'storefront_elements',
    nameEn: 'Low Stock Urgency Badge ("Only X left")',
    nameAr: 'شارة نفاد المخزون ("متبقي قطعتين فقط")',
    descriptionEn: 'Urgency indicator highlighting low inventory count on product page.',
    descriptionAr: 'تنبيه بصري ذكي يوضح قلة الكمية المتبقية لتشجيع العميل على إتمام الطلب.',
    iconName: 'AlertCircle',
    defaultEnabled: true,
  },
  {
    id: 'elem_product_reviews',
    category: 'storefront_elements',
    nameEn: 'Customer Star Ratings & Reviews Widget',
    nameAr: 'تقييمات النجوم وآراء العملاء الموثقة',
    descriptionEn: 'Verified buyer testimonials, 5-star rating averages, and shopper comments.',
    descriptionAr: 'عرض التقييمات الحقيقية وتعليقات المشترين لبناء الثقة والمصداقية.',
    iconName: 'Star',
    defaultEnabled: true,
  },
  {
    id: 'elem_related_products',
    category: 'storefront_elements',
    nameEn: '"You May Also Like" Related Products',
    nameAr: 'قسم "منتجات مقترحة قد تعجبك"',
    descriptionEn: 'Cross-sell carousel displaying complementary items to boost average order value (AOV).',
    descriptionAr: 'اقتراح منتجات تكميلية ذكية لزيادة متوسط قيمة الطلب للمتسوق.',
    iconName: 'Package',
    defaultEnabled: true,
  },
  {
    id: 'elem_cart_drawer',
    category: 'storefront_elements',
    nameEn: 'Sliding Quick-Cart Drawer',
    nameAr: 'درج السلة الجانبي المنزلق',
    descriptionEn: 'Slide-in side drawer appearing when items are added to cart without full reload.',
    descriptionAr: 'قائمة جانبية ناعمة تفتح فور إضافة المنتج للسلة دون مقاطعة التصفح.',
    iconName: 'ShoppingBag',
    defaultEnabled: true,
  },
  {
    id: 'elem_free_shipping_bar',
    category: 'storefront_elements',
    nameEn: 'Free Shipping Goal Progress Meter',
    nameAr: 'شريط تقدم الشحن المجاني الذكي',
    descriptionEn: 'Progress bar inside cart (e.g. "Add SAR 45 more to get FREE express delivery").',
    descriptionAr: 'شريط تحفيزي يوضح المبلغ المتبقي للوصول إلى الشحن المجاني.',
    iconName: 'Truck',
    defaultEnabled: true,
  },
  {
    id: 'elem_newsletter_popup',
    category: 'storefront_elements',
    nameEn: 'Exit-Intent Newsletter & Coupon Popup',
    nameAr: 'نافذة الخصم الترحيبية عند الخروج',
    descriptionEn: 'Captures visitor emails with an instant 10% discount promo code.',
    descriptionAr: 'نافذة منبثقة تمنح الزائر كود خصم ترحيبي مقابل التسجيل في القائمة البريدية.',
    iconName: 'Mail',
    defaultEnabled: false,
  },
  {
    id: 'elem_whatsapp_widget',
    category: 'storefront_elements',
    nameEn: 'Floating WhatsApp Customer Support Bubble',
    nameAr: 'أيقونة محادثة واتساب العائمة للدعم',
    descriptionEn: 'Fixed bottom corner button enabling one-touch WhatsApp conversation with store support.',
    descriptionAr: 'زر ثابت في أسفل الشاشة للتواصل المباشر مع دعم المتجر بنقرة واحدة.',
    iconName: 'MessageCircle',
    defaultEnabled: true,
  },
  {
    id: 'elem_trust_badges',
    category: 'storefront_elements',
    nameEn: 'Saudi Trust & 100% Secure Checkout Badges',
    nameAr: 'شارات التوثيق والدفع الآمن 100%',
    descriptionEn: 'Displays Saudi Ministry of Commerce, Maroof, and 256-bit SSL encrypted checkout badges.',
    descriptionAr: 'أيقونات الاعتماد الرسمي، معروف، والتشفير البنكي المعتمد لطمأنة العميل.',
    iconName: 'ShieldCheck',
    defaultEnabled: true,
  },
  {
    id: 'elem_zatca_tax_badge',
    category: 'storefront_elements',
    nameEn: 'ZATCA 15% VAT Compliant Certification Badge',
    nameAr: 'ختم هيئة الزكاة والضريبة والجمارك 15%',
    descriptionEn: 'Official tax compliance indicator showing prices include 15% Saudi VAT.',
    descriptionAr: 'شارة توضح للمتسوق أن الأسعار تشمل ضريبة القيمة المضافة وموثقة زكاتياً.',
    iconName: 'ReceiptText',
    defaultEnabled: true,
  },
  {
    id: 'elem_social_share',
    category: 'storefront_elements',
    nameEn: 'Social Media Sharing Buttons',
    nameAr: 'أزرار المشاركة الاجتماعية (X، واتساب)',
    descriptionEn: 'Share product buttons for X (Twitter), WhatsApp, Telegram, and link copy.',
    descriptionAr: 'تمكين العميل من نشر رابط المنتج بسهولة في منصات التواصل الاجتماعي.',
    iconName: 'Share2',
    defaultEnabled: true,
  },
  {
    id: 'elem_back_to_top',
    category: 'storefront_elements',
    nameEn: 'Smooth Back-to-Top Floating Button',
    nameAr: 'زر الصعود التلقائي لأعلى الصفحة',
    descriptionEn: 'Appears after scrolling down to smoothly return user to the top with one click.',
    descriptionAr: 'زر عائم مريح يظهر عند التمرير لأسفل ليعيد الزائر لأعلى الصفحة بسلاسة.',
    iconName: 'ArrowUp',
    defaultEnabled: true,
  },
];

const STORAGE_KEY_PREFIX = 'unityteck_store_controls_';
const GLOBAL_STORAGE_KEY = 'unityteck_global_store_controls';
/**
 * Core store admin pages — always visible in sidebar / never lock-gated.
 * "Disable all" and Master toggles cannot hide these (settings was disappearing
 * after bulk-off or stale localStorage).
 */
export const CORE_STORE_CONTROL_IDS = new Set(['dashboard', 'settings', 'notifications']);
const CORE_FORCE_ON_REV_KEY = 'unityteck_core_controls_force_on_rev';
const CURRENT_CORE_FORCE_ON_REV = 1;
/**
 * One-shot hide waves for deferred marketing pages (Master can re-enable after).
 * Bump CURRENT_DEFERRED_PAGE_HIDE_REV + add a new wave when hiding more pages.
 * Wave 1 (bank-offers, gifting) used defaultEnabled:false only — do not re-force those.
 */
const DEFERRED_PAGE_HIDE_REV_KEY = 'unityteck_deferred_page_hide_rev';
const DEFERRED_PAGE_HIDE_WAVES: Array<{ rev: number; ids: string[] }> = [
  { rev: 2, ids: ['cart-offers', 'affiliate'] },
];
const CURRENT_DEFERRED_PAGE_HIDE_REV = 2;

/** Old Master control keys → current sidebar / tab ids (backward compatible reads). */
const LEGACY_CONTROL_ID_MAP: Record<string, string> = {
  sub_products_categories: 'categories',
  sub_products_brands: 'brands',
  sub_products_media: 'media',
  sub_orders_direct: 'direct-orders',
  sub_marketing_coupons: 'coupons',
  sub_marketing_abandoned: 'abandoned-carts',
  sub_marketing_cart_offers: 'cart-offers',
  sub_marketing_promotions: 'promotions',
  sub_marketing_bank: 'bank-offers',
  sub_marketing_cashback: 'cashback',
  sub_marketing_gifting: 'gifting',
  sub_marketing_loyalty: 'loyalty',
  sub_marketing_repurchase: 'repurchase-reminders',
  sub_marketing_affiliate: 'affiliate',
  sub_shipping_zones: 'zones',
  sub_shipping_returns: 'returns',
};

/** Builder page shortcuts in Themes submenu → storefront_pages controls */
const BUILDER_PAGE_CONTROL_ALIASES: Record<string, string> = {
  home: 'page_storefront_home',
  catalog: 'page_storefront_catalog',
  product: 'page_storefront_product',
  cart: 'page_storefront_cart',
  checkout: 'page_storefront_checkout',
  'track-order': 'page_storefront_tracking',
  crm: 'page_storefront_account',
  contact: 'page_storefront_contact',
};

let cachedDefaultControls: Record<string, boolean> | null = null;
let cachedGlobalControls: Record<string, boolean> | null = null;
const cachedStoreControls = new Map<string, Record<string, boolean>>();

function invalidateControlsCache() {
  cachedDefaultControls = null;
  cachedGlobalControls = null;
  cachedStoreControls.clear();
}

function resolveStoreControlId(controlId: string): string {
  if (
    controlId === 'canva-studio' ||
    controlId === 'canva-banner' ||
    controlId === 'canva-logo' ||
    controlId === 'canva-product-card'
  ) {
    return 'canva';
  }
  if (LEGACY_CONTROL_ID_MAP[controlId]) {
    return LEGACY_CONTROL_ID_MAP[controlId];
  }
  if (BUILDER_PAGE_CONTROL_ALIASES[controlId]) {
    return BUILDER_PAGE_CONTROL_ALIASES[controlId];
  }
  return controlId;
}

/** Remap old Master keys onto current sidebar / tab ids. */
function remapLegacyControlKeys(stored: Record<string, boolean>): Record<string, boolean> {
  const next: Record<string, boolean> = { ...stored };
  for (const [legacyId, modernId] of Object.entries(LEGACY_CONTROL_ID_MAP)) {
    if (stored[legacyId] !== undefined && stored[modernId] === undefined) {
      next[modernId] = Boolean(stored[legacyId]);
    }
  }
  return next;
}

/** Merge defaults + stored flags, remapping legacy keys onto current ids. */
function normalizeControlRecord(stored: Record<string, boolean>): Record<string, boolean> {
  return { ...getDefaultControls(), ...remapLegacyControlKeys(stored) };
}

/**
 * Force newly deferred pages OFF once per revision + storage scope
 * (global vs each store) so old "enable all" dumps do not keep them visible.
 * After the wave runs, Master can re-enable and the toggle sticks.
 */
function applyDeferredPageHideWaves(
  controls: Record<string, boolean>,
  scopeKey: string,
): {
  controls: Record<string, boolean>;
  changed: boolean;
} {
  if (typeof window === 'undefined') return { controls, changed: false };
  const revStorageKey = `${DEFERRED_PAGE_HIDE_REV_KEY}:${scopeKey}`;
  let applied = 0;
  try {
    applied = Number(localStorage.getItem(revStorageKey) || '0');
  } catch {
    applied = 0;
  }
  if (applied >= CURRENT_DEFERRED_PAGE_HIDE_REV) {
    return { controls, changed: false };
  }
  const next = { ...controls };
  let changed = false;
  for (const wave of DEFERRED_PAGE_HIDE_WAVES) {
    if (wave.rev <= applied || wave.rev > CURRENT_DEFERRED_PAGE_HIDE_REV) continue;
    for (const id of wave.ids) {
      if (CORE_STORE_CONTROL_IDS.has(id)) continue;
      if (next[id] !== false) {
        next[id] = false;
        changed = true;
      }
    }
  }
  try {
    localStorage.setItem(revStorageKey, String(CURRENT_DEFERRED_PAGE_HIDE_REV));
  } catch {
    /* ignore quota */
  }
  return { controls: next, changed };
}

/** Re-enable core pages if a prior "disable all" left them OFF in localStorage. */
function applyCoreControlsForceOn(
  controls: Record<string, boolean>,
  scopeKey: string,
): {
  controls: Record<string, boolean>;
  changed: boolean;
} {
  const next = { ...controls };
  let changed = false;
  for (const id of CORE_STORE_CONTROL_IDS) {
    if (next[id] !== true) {
      next[id] = true;
      changed = true;
    }
  }
  if (typeof window === 'undefined') return { controls: next, changed };
  const revStorageKey = `${CORE_FORCE_ON_REV_KEY}:${scopeKey}`;
  let applied = 0;
  try {
    applied = Number(localStorage.getItem(revStorageKey) || '0');
  } catch {
    applied = 0;
  }
  if (changed || applied < CURRENT_CORE_FORCE_ON_REV) {
    try {
      localStorage.setItem(revStorageKey, String(CURRENT_CORE_FORCE_ON_REV));
    } catch {
      /* ignore quota */
    }
  }
  return { controls: next, changed };
}

function applyControlPolicyWaves(
  controls: Record<string, boolean>,
  scopeKey: string,
): {
  controls: Record<string, boolean>;
  changed: boolean;
} {
  const hidden = applyDeferredPageHideWaves(controls, scopeKey);
  const forced = applyCoreControlsForceOn(hidden.controls, scopeKey);
  return {
    controls: forced.controls,
    changed: hidden.changed || forced.changed,
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key === GLOBAL_STORAGE_KEY || e.key.startsWith(STORAGE_KEY_PREFIX)) {
      invalidateControlsCache();
    }
  });
}

/**
 * Get default mapping of all control IDs to their default boolean state
 */
export function getDefaultControls(): Record<string, boolean> {
  if (cachedDefaultControls) return cachedDefaultControls;
  const result: Record<string, boolean> = {};
  for (const def of CONTROL_DEFINITIONS) {
    result[def.id] = def.defaultEnabled;
  }
  cachedDefaultControls = result;
  return result;
}

/**
 * Get global SaaS-level master controls
 */
export function getGlobalControls(): Record<string, boolean> {
  if (typeof window === 'undefined') return getDefaultControls();
  if (cachedGlobalControls) return cachedGlobalControls;
  try {
    const raw = localStorage.getItem(GLOBAL_STORAGE_KEY);
    if (!raw) {
      const fresh = { ...getDefaultControls() };
      const { controls: deferredFresh, changed } = applyControlPolicyWaves(fresh, 'global');
      cachedGlobalControls = deferredFresh;
      if (changed) {
        localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(deferredFresh));
      }
      return cachedGlobalControls;
    }
    const next = normalizeControlRecord(JSON.parse(raw) as Record<string, boolean>);
    const { controls: deferred, changed } = applyControlPolicyWaves(next, 'global');
    cachedGlobalControls = deferred;
    if (changed) {
      localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(deferred));
    }
    return deferred;
  } catch {
    return getDefaultControls();
  }
}

/**
 * Save global SaaS-level master controls
 */
export function saveGlobalControls(controls: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(controls));
    invalidateControlsCache();
    window.dispatchEvent(new CustomEvent('unityteck-store-controls-changed', {
      detail: { storeId: 'ALL', controls },
    }));
  } catch (err) {
    console.error('Failed to save global controls:', err);
  }
}

/**
 * Get controls for a specific store.
 * Falls back to global controls if store has no specific override.
 */
export function getStoreControls(storeId?: string): Record<string, boolean> {
  const globalDefaults = getGlobalControls();
  if (!storeId || typeof window === 'undefined') {
    return globalDefaults;
  }
  const hit = cachedStoreControls.get(storeId);
  if (hit) return hit;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${storeId}`);
    if (!raw) {
      cachedStoreControls.set(storeId, globalDefaults);
      return globalDefaults;
    }
    const storeSpecific = remapLegacyControlKeys(JSON.parse(raw) as Record<string, boolean>);
    const merged = { ...globalDefaults, ...storeSpecific };
    const { controls: deferred, changed } = applyControlPolicyWaves(merged, `store:${storeId}`);
    cachedStoreControls.set(storeId, deferred);
    if (changed) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${storeId}`, JSON.stringify(deferred));
    }
    return deferred;
  } catch {
    return globalDefaults;
  }
}

/**
 * Save controls for a specific store
 */
export function saveStoreControls(storeId: string, controls: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${storeId}`, JSON.stringify(controls));
    invalidateControlsCache();
    window.dispatchEvent(new CustomEvent('unityteck-store-controls-changed', {
      detail: { storeId, controls },
    }));
  } catch (err) {
    console.error(`Failed to save controls for store ${storeId}:`, err);
  }
}

/**
 * Check if a specific page or component is enabled for a store
 */
export function isStoreControlEnabled(storeId: string | undefined, controlId: string): boolean {
  const resolvedId = resolveStoreControlId(controlId);
  if (CORE_STORE_CONTROL_IDS.has(resolvedId)) return true;
  const controls = getStoreControls(storeId);
  if (controls[resolvedId] !== undefined) {
    return Boolean(controls[resolvedId]);
  }
  const def = CONTROL_DEFINITIONS.find((item) => item.id === resolvedId);
  return def ? def.defaultEnabled : true;
}

/**
 * Update a single toggle for a store (or globally if storeId === 'ALL')
 */
export function updateSingleStoreControl(storeId: string, controlId: string, enabled: boolean) {
  const resolvedId = resolveStoreControlId(controlId);
  const nextEnabled = CORE_STORE_CONTROL_IDS.has(resolvedId) ? true : enabled;
  if (storeId === 'ALL') {
    const current = getGlobalControls();
    current[resolvedId] = nextEnabled;
    saveGlobalControls(current);
    return;
  }
  const current = getStoreControls(storeId);
  current[resolvedId] = nextEnabled;
  saveStoreControls(storeId, current);
}

/**
 * Bulk set all controls for a store (or globally)
 */
export function setAllControlsState(storeId: string, enabled: boolean) {
  const allIds: Record<string, boolean> = {};
  for (const def of CONTROL_DEFINITIONS) {
    allIds[def.id] = CORE_STORE_CONTROL_IDS.has(def.id) ? true : enabled;
  }
  if (storeId === 'ALL') {
    saveGlobalControls(allIds);
  } else {
    saveStoreControls(storeId, allIds);
  }
}

/**
 * Bulk toggle all controls in a specific category
 */
export function setCategoryControlsState(storeId: string, category: ControlCategory, enabled: boolean) {
  const current = storeId === 'ALL' ? getGlobalControls() : getStoreControls(storeId);
  const items = CONTROL_DEFINITIONS.filter((item) => item.category === category);
  for (const it of items) {
    current[it.id] = CORE_STORE_CONTROL_IDS.has(it.id) ? true : enabled;
  }
  if (storeId === 'ALL') {
    saveGlobalControls(current);
  } else {
    saveStoreControls(storeId, current);
  }
}

/**
 * Reset a store's controls back to the recommended defaults
 */
export function resetStoreControlsToDefaults(storeId: string) {
  const defaults = getDefaultControls();
  if (storeId === 'ALL') {
    saveGlobalControls(defaults);
  } else {
    saveStoreControls(storeId, defaults);
  }
}

/**
 * Apply the current control configuration across ALL given stores
 */
export function applyControlsToAllStores(
  controls: Record<string, boolean>,
  stores: { id: string }[]
) {
  saveGlobalControls(controls);
  for (const st of stores) {
    if (st.id) {
      saveStoreControls(st.id, controls);
    }
  }
}

/**
 * Copy control settings from one store to another
 */
export function copyStoreControls(fromStoreId: string, toStoreId: string) {
  const source = getStoreControls(fromStoreId);
  saveStoreControls(toStoreId, source);
}

/**
 * Export settings as formatted JSON string
 */
export function exportControlsAsJson(storeId: string): string {
  const data = storeId === 'ALL' ? getGlobalControls() : getStoreControls(storeId);
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      scope: storeId === 'ALL' ? 'GLOBAL_SAAS' : storeId,
      controls: data,
    },
    null,
    2
  );
}

/**
 * Import settings from JSON string
 */
export function importControlsFromJson(storeId: string, jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed.controls === 'object') {
      const merged = { ...getDefaultControls(), ...parsed.controls };
      if (storeId === 'ALL') {
        saveGlobalControls(merged);
      } else {
        saveStoreControls(storeId, merged);
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to import controls:', err);
    return false;
  }
}
