import React, { useState } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';

export interface GuideStep {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  badge?: string;
  codeSnippet?: string;
}

export interface PageDocsGuideProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: 'brands' | 'reports' | 'analytics' | 'marketing' | 'whatsapp' | 'seo' | 'hosting' | 'payments' | 'backup';
}

const PAGE_GUIDE_DATA: Record<
  string,
  {
    titleEn: string;
    titleAr: string;
    subtitleEn: string;
    subtitleAr: string;
    mockScreenshotType: string;
    steps: GuideStep[];
    tipsEn: string[];
    tipsAr: string[];
  }
> = {
  brands: {
    titleEn: 'Brands & Custom Fields Guide',
    titleAr: 'دليل العلامات التجارية والحقول المخصصة',
    subtitleEn: 'Learn how to manage brand logos, channel visibility, and dynamic product specifications.',
    subtitleAr: 'تعرف على كيفية إدارة شعارات العلامات التجارية، ظهور القنوات، ومواصفات المنتجات المخصصة.',
    mockScreenshotType: 'brands',
    steps: [
      {
        title: '1. Add or Edit Brands with High-Res Logo',
        titleAr: '١. إضافة أو تعديل العلامات التجارية مع شعار عالي الدقة',
        description: 'Upload PNG/SVG/WEBP logo directly from your device or paste an image URL. Preview appears instantly.',
        descriptionAr: 'قم برفع شعار PNG/SVG/WEBP مباشرة من جهازك أو الصق رابط الصورة، وتظهر المعاينة فوراً.',
        badge: 'Media Upload',
      },
      {
        title: '2. Toggle Sales Channel Visibility',
        titleAr: '٢. تفعيل أو إيقاف الظهور في قنوات البيع',
        description: 'Enable or disable brand display in mobile storefront, social channels, and product filters with 1 click.',
        descriptionAr: 'تفعيل أو تعطيل عرض العلامة التجارية في المتجر الإلكتروني وقنوات التواصل وفلاتر المنتجات بنقرة واحدة.',
        badge: 'Instant Sync',
      },
      {
        title: '3. Create Custom Fields for Products',
        titleAr: '٣. إنشاء حقول مخصصة للمنتجات',
        description: 'Define custom attributes like Fabric Material, Warranty Years, Expiration Date, or Size Guide PDF.',
        descriptionAr: 'حدد سمات إضافية مثل نوع القماش، سنوات الضمان، تاريخ الانتهاء، أو ملف دليل المقاسات.',
        badge: 'Attributes',
      },
      {
        title: '4. Assign Custom Fields to Specific Categories',
        titleAr: '٤. ربط الحقول المخصصة بأقسام معينة',
        description: 'Assign fields to All Products or target specific collections (e.g. Flowers, Luxury Boxes, Electronics).',
        descriptionAr: 'تطبيق الحقول على جميع المنتجات أو تخصيصها لأقسام محددة (مثل الزهور، الهدايا، الإلكترونيات).',
        badge: 'Categorization',
      },
    ],
    tipsEn: [
      'Recommended brand logo size: 400x400 px with transparent background.',
      'Inactive brands automatically hide from customer filters without deleting products.',
      'Custom fields with "Show to Customer" enabled appear directly on the product detail page.',
    ],
    tipsAr: [
      'الحجم المفضل لشعار العلامة التجارية هو 400x400 بكسل بخلفية شفافة.',
      'العلامات غير النشطة تختفي تلقائياً من فلاتر العملاء دون حذف المنتجات.',
      'الحقول المخصصة المفعلة للعميل تظهر مباشرة في صفحة تفاصيل المنتج بالمتجر.',
    ],
  },
  reports: {
    titleEn: 'Financial Reports & Accounting Guide',
    titleAr: 'دليل التقارير المالية والمحاسبية',
    subtitleEn: 'Comprehensive insights into gross revenue, VAT compliance, order lifecycle, and CSV exports.',
    subtitleAr: 'نظرة شاملة على الإيرادات، ضريبة القيمة المضافة، دورة الطلبات، وتصدير ملفات CSV.',
    mockScreenshotType: 'reports',
    steps: [
      {
        title: '1. Filter Reports by Dynamic Date Range',
        titleAr: '١. تصفية التقارير حسب النطاق الزمني',
        description: 'Select Today, Last 7 Days, This Month, or custom date range to update all charts in real-time.',
        descriptionAr: 'اختر اليوم، آخر 7 أيام، هذا الشهر، أو فترة مخصصة لتحديث كافة الرسوم البيانية فورياً.',
        badge: 'Date Range',
      },
      {
        title: '2. Drill Down into Specialized Categories',
        titleAr: '٢. استعراض تقارير الأقسام التخصصية',
        description: 'Switch between Sales Summary, Product Sales, Payment Gateways, Taxes & VAT, and Customer Segments.',
        descriptionAr: 'التنقل بين ملخص المبيعات، مبيعات المنتجات، بوابات الدفع، الضريبة، وشرائح العملاء.',
        badge: 'Categories',
      },
      {
        title: '3. 1-Click Export to CSV / Excel (UTF-8 BOM)',
        titleAr: '٣. تصدير فوري إلى CSV / Excel باللغة العربية',
        description: 'Download full spreadsheets with UTF-8 BOM encoding for seamless Arabic text viewing in Excel.',
        descriptionAr: 'تحميل جداول البيانات المجهزة بترميز UTF-8 لفتح النصوص العربية بشكل سليم في Excel.',
        badge: 'Export',
      },
      {
        title: '4. Print Professional PDF Invoices & Reports',
        titleAr: '٤. طباعة تقارير وفواتير رسمية بصيغة PDF',
        description: 'Click "Print Report" to generate clean, printable paper-ready layouts for accounting and ZATCA tax audits.',
        descriptionAr: 'انقر على "طباعة التقرير" لإنشاء مستند منسق وجاهز للطباعة للمحاسب وهيئة الزكاة والضريبة.',
        badge: 'Print',
      },
    ],
    tipsEn: [
      'All tax calculations conform to Saudi ZATCA 15% standard rate.',
      'You can schedule automatic daily/weekly report emails from the reports dashboard.',
      'Compare net revenue against gross sales to track discount coupon efficiency.',
    ],
    tipsAr: [
      'جميع حسابات الضريبة مطابقة لمعايير هيئة الزكاة والضريبة والجمارك (15%).',
      'يمكنك جدولة إرسال التقارير التلقائية يومياً أو أسبوعياً عبر البريد الإلكتروني.',
      'قارن صافي الإيرادات مع إجمالي المبيعات لمراقبة تأثير كوبونات الخصم.',
    ],
  },
  analytics: {
    titleEn: 'Visitor Traffic & Customer Analytics Guide',
    titleAr: 'دليل تحليلات الزوار وسلوك العملاء',
    subtitleEn: 'Track store visitors, conversion funnels, top devices, and highest-grossing products.',
    subtitleAr: 'تتبع زوار المتجر، قمع التحويل، الأجهزة الأكثر استخداماً، والمنتجات الأكثر مبيعاً.',
    mockScreenshotType: 'analytics',
    steps: [
      {
        title: '1. Monitor Real-Time Traffic & Active Carts',
        titleAr: '١. مراقبة حركة الزوار والسلات النشطة في الوقت الفعلي',
        description: 'Check active visitors, mobile vs desktop breakdown, and geographical distribution across Saudi regions.',
        descriptionAr: 'متابعة الزوار النشطين، نسبة الجوال مقابل الكمبيوتر، والتوزيع الجغرافي عبر مناطق المملكة.',
        badge: 'Real-Time',
      },
      {
        title: '2. Analyze Best-Selling Products',
        titleAr: '٢. تحليل المنتجات الأكثر مبيعاً',
        description: 'Identify high-margin products, stock velocity, and items that trigger the highest cart-to-checkout rate.',
        descriptionAr: 'التعرف على المنتجات الأعلى ربحاً وسرعة دوران المخزون والمنتجات المحفزة للشراء.',
        badge: 'Top Products',
      },
      {
        title: '3. Customer Retention & Repeat Purchase Rate',
        titleAr: '٣. معدل عودة العملاء والولاء',
        description: 'Distinguish between first-time shoppers, repeat customers, and VIP loyal buyers.',
        descriptionAr: 'التمييز بين المشترين لأول مرة، العملاء المتكررين، وعملاء VIP الدائمين.',
        badge: 'Retention',
      },
    ],
    tipsEn: [
      'Mobile traffic typically accounts for 70%+ of Saudi e-commerce purchases.',
      'Use top products insight to formulate bundle discounts in the Marketing Hub.',
    ],
    tipsAr: [
      'حركة المرور عبر الجوال تشكل أكثر من 70% من المبيعات في السوق السعودي.',
      'استفد من المنتجات الأكثر طلباً لإنشاء عروض حزم ترويجية في مركز التسويق.',
    ],
  },
  marketing: {
    titleEn: 'Marketing Hub & Campaign Management Guide',
    titleAr: 'دليل مركز التسويق والحملات الترويجية',
    subtitleEn: 'Run discount coupons, recover abandoned carts, launch loyalty rewards, and upsell products.',
    subtitleAr: 'إطلاق كوبونات الخصم، استعادة السلات المتروكة، برامج الولاء، والعروض الذكية.',
    mockScreenshotType: 'marketing',
    steps: [
      {
        title: '1. Create Discount Codes & Free Shipping Coupons',
        titleAr: '١. إنشاء أكواد الخصم وكوبونات الشحن المجاني',
        description: 'Set percentage, fixed SAR discounts, minimum cart values, usage limits, and expiration dates.',
        descriptionAr: 'تحديد خصم بنسبة مئوية أو مبلغ ثابت، والحد الأدنى للطلب، وعدد مرات الاستخدام.',
        badge: 'Discounts',
      },
      {
        title: '2. Automated Abandoned Cart Recovery',
        titleAr: '٢. الاسترداد التلقائي للسلات المتروكة',
        description: 'Trigger WhatsApp and SMS recovery reminders with custom discount incentives to complete orders.',
        descriptionAr: 'إرسال تذكيرات عبر الواتساب والرسائل القصيرة مع حافز خصم لتشجيع العميل على إتمام الشراء.',
        badge: 'Recovery',
      },
      {
        title: '3. Cart Offers & Smart Upsells',
        titleAr: '٣. عروض السلة والبيع المتقاطع الذكي',
        description: 'Offer complementary items (e.g. chocolates or cards with flower bouquet) directly at the cart stage.',
        descriptionAr: 'عرض منتجات مكملة (مثل الشوكولاتة وبطاقات الإهداء مع باقات الورد) مباشرة في السلة.',
        badge: 'Upsell',
      },
    ],
    tipsEn: [
      'Coupons with a clear deadline (e.g. 24 hours) have a 3x higher redemption rate.',
      'Sending an abandoned cart reminder within 2 hours yields up to 34% recovery.',
    ],
    tipsAr: [
      'الكوبونات ذات المهلة المحددة (مثل 24 ساعة) تحقق نسبة استخدام أعلى بثلاثة أضعاف.',
      'إرسال تذكير السلة المتروكة خلال ساعتين يرفع نسبة الاسترداد إلى 34%.',
    ],
  },
  whatsapp: {
    titleEn: 'WhatsApp Business Hub & Meta Cloud Guide',
    titleAr: 'دليل الواتساب التجاري والربط السحابي مع Meta',
    subtitleEn: 'Direct WhatsApp messaging, message templates, customer notifications, and media attachments.',
    subtitleAr: 'المراسلة المباشرة عبر الواتساب، قوالب الرسائل الجاهزة، إشعارات العملاء، وإرفاق الصور.',
    mockScreenshotType: 'whatsapp',
    steps: [
      {
        title: '1. Send 1-Click WhatsApp Messages to Customers',
        titleAr: '١. إرسال رسائل واتساب بنقرة واحدة للعملاء',
        description: 'Select any customer from your store database. Phone number and name populate automatically.',
        descriptionAr: 'اختر أي عميل من قاعدة بيانات متجرك، وسيتم تعبئة الاسم ورقم الهاتف تلقائياً.',
        badge: '1-Click',
      },
      {
        title: '2. Attach Media (Brochure, Receipt, Product Photo)',
        titleAr: '٢. إرفاق الوسائط (بروشور، فاتورة، صورة منتج)',
        description: 'Upload an image or document directly in the message composer with live preview before sending.',
        descriptionAr: 'ارفع صورة أو ملفاً مباشرة في محرر الرسائل مع معاينة فورية قبل الإرسال.',
        badge: 'Attachment',
      },
      {
        title: '3. Pre-Approved WhatsApp Templates',
        titleAr: '٣. قوالب رسائل معتمدة وجاهزة',
        description: 'Pick Order Confirmed, Out for Delivery, or Abandoned Cart templates with dynamic {{store_name}} tags.',
        descriptionAr: 'استخدم قوالب تأكيد الطلب، خروج التوصيل، أو السلات المتروكة مع وسوم المتجر والعميل التلقائية.',
        badge: 'Templates',
      },
      {
        title: '4. Daily Quota & Meta Session Monitoring',
        titleAr: '٤. متابعة الحصة اليومية وحالة جلسة Meta',
        description: 'Monitor daily quota (20 free messages included) and re-sync Cloud API credentials on demand.',
        descriptionAr: 'تابع رصيدك اليومي (يشمل 20 رسالة مجانية يومياً) وجدد جلسة Meta Cloud API عند الحاجة.',
        badge: 'Quota',
      },
    ],
    tipsEn: [
      'Include customer name and order number in the template to personalize messages and avoid spam flags.',
      'Images under 2MB are delivered instantly via Meta WhatsApp Cloud API.',
    ],
    tipsAr: [
      'ضمّن اسم العميل ورقم الطلب في القالب لإضفاء طابع شخصي وتفادي تصنيف الرسالة كإزعاج.',
      'الصور بحجم أقل من 2 ميغابايت تُسلّم فوراً عبر واجهة Meta Cloud API.',
    ],
  },
  seo: {
    titleEn: 'Search Engine Optimization & Google Search Console Guide',
    titleAr: 'دليل تحسين محركات البحث و Google Search Console',
    subtitleEn: 'Boost Google rankings, submit XML sitemaps, verify meta tags, and configure OpenGraph social cards.',
    subtitleAr: 'رفع ترتيب متجرك في Google، إرسال خرائط XML، وضبط وسوم OpenGraph للمشاركة.',
    mockScreenshotType: 'seo',
    steps: [
      {
        title: '1. Connect Google Search Console with OAuth',
        titleAr: '١. ربط Google Search Console بحسابك',
        description: 'Authorize Google Search Console to index store URLs and fetch real search impressions and keywords.',
        descriptionAr: 'توثيق حسابك في Google لفهرسة روابط المتجر وجلب مرات الظهور والكلمات المفتاحية الحقيقية.',
        badge: 'OAuth',
      },
      {
        title: '2. Optimize Meta Title, Description & Social Share Image',
        titleAr: '٢. تخصيص عنوان الميتا والوصف وصورة المشاركة (OG)',
        description: 'Customize search snippets and upload custom Open Graph image for WhatsApp & Twitter link previews.',
        descriptionAr: 'خصص نص الميتا وصورة المعاينة الاجتماعية (OG) التي تظهر عند مشاركة الرابط في واتساب وتويتر.',
        badge: 'Meta & OG',
      },
      {
        title: '3. Instant Google URL Indexing Dispatch',
        titleAr: '٣. إرسال فوري لفهرسة الروابط في Google',
        description: 'Submit newly created product URLs directly to Google Indexing API without waiting for scheduled crawls.',
        descriptionAr: 'إرسال روابط المنتجات الجديدة مباشرة إلى واجهة Google Indexing دون انتظار الزحف التلقائي.',
        badge: 'Indexing',
      },
      {
        title: '4. Audit Core Web Vitals & PageSpeed Insights',
        titleAr: '٤. فحص سرعة المتجر ومؤشرات أداء الويب',
        description: 'Run live Google Lighthouse audits for Mobile & Desktop (LCP, FID, CLS) to ensure 90+ score.',
        descriptionAr: 'إجراء فحص سرعة Google المباشر للجوال والكمبيوتر لضمان تحقيق درجات أداء تفوق 90+.',
        badge: 'Lighthouse',
      },
    ],
    tipsEn: [
      'Keep meta titles between 50-60 characters and descriptions between 140-160 characters for best Google display.',
      'Open Graph share images should be 1200x630 px for sharp display on social networks.',
    ],
    tipsAr: [
      'اجعل عنوان الميتا بين 50-60 حرفاً والوصف بين 140-160 حرفاً لعرض مثالي في نتائج بحث Google.',
      'المقاس الأمثل لصورة المشاركة (OG Image) هو 1200x630 بكسل لتبدو واضحة على منصات التواصل.',
    ],
  },
  hosting: {
    titleEn: 'Hostinger Shared Hosting & Custom Domain Guide',
    titleAr: 'دليل استضافة Hostinger المشتركة والنطاق المخصص',
    subtitleEn: 'Link your custom domain, verify DNS A-records, auto-provision SSL, and deploy storefront.',
    subtitleAr: 'ربط النطاق الخاص بك، التحقق من سجلات DNS، تفعيل SSL التلقائي، ونشر المتجر.',
    mockScreenshotType: 'hosting',
    steps: [
      {
        title: '1. Connect Custom Domain (e.g. mystore.sa)',
        titleAr: '١. إدخال النطاق المخصص (مثل mystore.sa)',
        description: 'Enter your domain purchased from Hostinger, SaudiNIC, or GoDaddy and select hosting tier.',
        descriptionAr: 'أدخل نطاقك المشترى من Hostinger أو المركز السعودي لمعلومات الشبكة أو GoDaddy.',
        badge: 'Domain',
      },
      {
        title: '2. Point DNS Records in Hostinger DNS Zone',
        titleAr: '٢. توجيه سجلات DNS في لوحة Hostinger',
        description: 'Add an A record pointing to Hostinger IP (195.35.40.22) and CNAME for www subdomain.',
        descriptionAr: 'أضف سجل A يشير إلى IP استضافة Hostinger وسجل CNAME للنطاق الفرعي www.',
        badge: 'DNS Zone',
      },
      {
        title: '3. Verify DNS & Auto-Issue Let\'s Encrypt SSL',
        titleAr: '٣. التحقق من DNS وتفعيل شهادة الأمان SSL',
        description: 'Click "Verify DNS". Once validated, free wildcard SSL is issued and HTTPS enforced.',
        descriptionAr: 'انقر على "تحقق من DNS". فور التحقق، تصدر شهادة SSL المجانية ويتم تفعيل التشفير HTTPS.',
        badge: 'SSL Certificate',
      },
      {
        title: '4. 1-Click Storefront Deployment',
        titleAr: '٤. نشر المتجر المباشر بنقرة واحدة',
        description: 'Deploy latest store build directly to Hostinger public_html with zero downtime.',
        descriptionAr: 'نشر أحدث إصدار من المتجر مباشرة إلى مجلد public_html في Hostinger دون أي انقطاع.',
        badge: 'Deploy Live',
      },
    ],
    tipsEn: [
      'DNS propagation usually takes 5 to 30 minutes on Hostinger Cloud nameservers.',
      'Always test your custom domain in an incognito window after deployment.',
    ],
    tipsAr: [
      'انتشار سجلات DNS يستغرق عادة بين 5 إلى 30 دقيقة على خوادم أسماء Hostinger.',
      'احرص دائماً على فحص النطاق في نافذة تصفح خفي بعد اكتمال النشر.',
    ],
  },
  payments: {
    titleEn: 'Payment Gateways & Payout Settlement Guide',
    titleAr: 'دليل بوابات الدفع والتحويلات البنكية',
    subtitleEn: 'Enable Mada, Apple Pay, Visa, STC Pay, and submit bank/tax verification documents.',
    subtitleAr: 'تفعيل مدى، Apple Pay، فيزا، STC Pay، ورفع وثائق التحقق البنكي والضريبي.',
    mockScreenshotType: 'payments',
    steps: [
      {
        title: '1. Toggle Payment Channels (Mada, Apple Pay, Visa)',
        titleAr: '١. تفعيل قنوات الدفع (مدى، Apple Pay، فيزا)',
        description: 'Enable or disable checkout payment rails with instant toggle switches.',
        descriptionAr: 'تفعيل أو تعطيل طرق الدفع عند إتمام الطلب بنقرة مفتاحية سريعة.',
        badge: 'Rails',
      },
      {
        title: '2. Configure Bank Settlement Accounts (Saudi / Global)',
        titleAr: '٢. ضبط الحسابات البنكية للتحويل (السعودية / دولي)',
        description: 'Enter your verified IBAN, Bank Name, and Account Title for automated weekly merchant payouts.',
        descriptionAr: 'أدخل رقم الآيبان المعتمد، اسم البنك، واسم صاحب الحساب لاستلام المستحقات الأسبوعية.',
        badge: 'Bank Accounts',
      },
      {
        title: '3. Upload Tax & Bank Verification Documents',
        titleAr: '٣. إرفاق مستندات التحقق البنكي والضريبي',
        description: 'Upload your Commercial Registration (CR), VAT Certificate, and Bank IBAN Confirmation letter.',
        descriptionAr: 'ارفع صورة السجل التجاري، شهادة ضريبة القيمة المضافة، وخطاب تأكيد الآيبان البنكي.',
        badge: 'Compliance',
      },
      {
        title: '4. Download Settlement Slips & Invoices',
        titleAr: '٤. تحميل إيصالات التحويل والفواتير المحاسبية',
        description: 'Export all payout receipts as CSV and print official SAMA settlement statements.',
        descriptionAr: 'تصدير كافة إيصالات التحويل بصيغة CSV وطباعة كشوفات التسوية الرسمية.',
        badge: 'Payouts',
      },
    ],
    tipsEn: [
      'Mada and Apple Pay cover over 88% of domestic Saudi e-commerce transactions.',
      'Ensure bank account title matches your Commercial Registration for rapid approval.',
    ],
    tipsAr: [
      'طريقتا "مدى" و"Apple Pay" تغطيان أكثر من 88% من مدفوعات التجارة الإلكترونية في السعودية.',
      'تأكد من تطابق اسم الحساب البنكي مع اسم السجل التجاري لتسريع الموافقة.',
    ],
  },
  backup: {
    titleEn: 'Hostinger Backup, Restore & Migration Center Guide',
    titleAr: 'دليل مركز النسخ الاحتياطي والاستعادة ونقل المتاجر في Hostinger',
    subtitleEn: 'Download full ZIP backups, manage automated daily/weekly snapshots, and migrate stores between Hostinger accounts.',
    subtitleAr: 'تحميل حزمة المتجر الكاملة ZIP، إدارة النسخ الاحتياطية اليومية والأسبوعية، ونقل المتجر بين استضافات Hostinger.',
    mockScreenshotType: 'backup',
    steps: [
      {
        title: '1. One-Click Full Store ZIP Export',
        titleAr: '١. تصدير حزمة المتجر الكاملة ZIP بنقرة واحدة',
        description: 'Download full archive containing MySQL SQL dump, public_html files, media manifests, themes, and .env config.',
        descriptionAr: 'تحميل حزمة شاملة تحوي قاعدة بيانات MySQL، ملفات المتجر، وسائط التخزين، القوالب، وملف .env.',
        badge: 'Full ZIP',
      },
      {
        title: '2. Automated Daily / Weekly / Monthly Snapshots',
        titleAr: '٢. النسخ الاحتياطية المجدولة (يومياً، أسبوعياً، شهرياً)',
        description: 'Browse timestamped restore points. 1-click restore to rollback database or download isolated .sql table dumps.',
        descriptionAr: 'استعرض نقاط الاستعادة الزمنية واستعد قاعدة بياناتك بنقرة واحدة أو حمل ملف SQL منفصلاً.',
        badge: 'Snapshots',
      },
      {
        title: '3. Restore from Backup Archive (.zip / .sql)',
        titleAr: '٣. الاستعادة من ملف خارجي (.zip / .sql)',
        description: 'Drag and drop your backup ZIP or SQL file to initiate safe restore with relational table validation.',
        descriptionAr: 'اسحب وأفلت ملف النسخة الاحتياطية لبدء عملية الاستعادة الآمنة مع فحص ترابط الجداول.',
        badge: 'Restore File',
      },
      {
        title: '4. All-in-One Migration to 2nd Hostinger Account',
        titleAr: '٤. النقل الكامل إلى حساب Hostinger ثانٍ',
        description: 'Migrate entire store from Server A to Server B with 5-stage live animated progress bar, domain re-binding, and SSL.',
        descriptionAr: 'نقل المتجر بالكامل من الخادم القديم إلى الجديد مع شريط تقدم تفاعلي من 5 مراحل وإعادة ربط النطاق وSSL.',
        badge: 'Migration',
      },
    ],
    tipsEn: [
      'Always download a fresh full backup before updating theme files or running bulk database migrations.',
      'Hostinger hPanel MySQL 8.0 handles schema imports directly through phpMyAdmin or SSH.',
      'Migration mode preserves store products, orders, categories, customer accounts, and settings intact.',
    ],
    tipsAr: [
      'احرص دائماً على تنزيل نسخة احتياطية جديدة قبل تعديل القوالب أو تشغيل تعديلات كبرى على البيانات.',
      'استضافة Hostinger تدعم استيراد قواعد MySQL 8.0 مباشرة عبر phpMyAdmin أو طرفية SSH.',
      'وضع النقل يحافظ على كافة المنتجات والطلبات والتصنيفات وحسابات العملاء والإعدادات دون أي فقد.',
    ],
  },
};

export const PageDocsGuideModal: React.FC<PageDocsGuideProps> = ({
  isOpen,
  onClose,
  pageId,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'steps' | 'visual' | 'tips'>('steps');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const data = PAGE_GUIDE_DATA[pageId] || PAGE_GUIDE_DATA.brands;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-5 border-b flex items-start justify-between gap-4 shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ background: 'var(--portal-cta)', color: '#ffffff' }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                  style={{
                    background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                    color: 'var(--accent)',
                  }}
                >
                  {isAr ? 'دليل الاستخدام والتوثيق' : 'Documentation & Visual Guide'}
                </span>
                <span className="text-[10px] opacity-40 font-mono">#{pageId.toUpperCase()}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                {isAr ? data.titleAr : data.titleEn}
              </h2>
              <p className="text-xs opacity-70 mt-0.5 max-w-xl">
                {isAr ? data.subtitleAr : data.subtitleEn}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className="px-5 py-2.5 border-b flex items-center gap-2 text-xs font-bold shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('steps')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'steps'
                ? 'text-white shadow-xs'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-70'
            }`}
            style={activeTab === 'steps' ? { background: 'var(--portal-cta)' } : {}}
          >
            <span>{isAr ? 'خطوات العمل خطوة بخطوة' : 'Step-by-Step Walkthrough'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'visual'
                ? 'text-white shadow-xs'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-70'
            }`}
            style={activeTab === 'visual' ? { background: 'var(--portal-cta)' } : {}}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'معاينة الواجهة والشرح المصور' : 'Visual UI Mockup & Diagram'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tips')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tips'
                ? 'text-white shadow-xs'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-70'
            }`}
            style={activeTab === 'tips' ? { background: 'var(--portal-cta)' } : {}}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isAr ? 'أفضل الممارسات والنصائح' : 'Best Practices & Tips'}</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === 'steps' && (
            <div className="space-y-4">
              {data.steps.map((st, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl border flex flex-col sm:flex-row items-start gap-4 transition-all hover:border-blue-400/40"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0"
                    style={{
                      background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                      color: 'var(--accent)',
                    }}
                  >
                    0{i + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {isAr ? st.titleAr : st.title}
                      </h4>
                      {st.badge && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            background: 'color-mix(in srgb, var(--portal-cta) 12%, transparent)',
                            color: 'var(--portal-cta)',
                          }}
                        >
                          {st.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs opacity-80 leading-relaxed">
                      {isAr ? st.descriptionAr : st.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'visual' && (
            <div className="space-y-5">
              {/* Visual Mock Diagram / Screenshot Simulation */}
              <div
                className="p-5 rounded-2xl border space-y-4"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="font-mono opacity-60">unityteck://{pageId}-module/visual-preview</span>
                  </div>
                  <span className="text-[10px] font-bold opacity-60 uppercase">Interactive Layout</span>
                </div>

                {/* Simulated UI Diagram Component depending on page */}
                <div className="p-4 rounded-xl border bg-slate-950 text-slate-100 font-sans space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-blue-400">● LIVE MODULE</span>
                      <span className="text-[11px] text-slate-400">/{pageId}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                      Fully Synced
                    </span>
                  </div>

                  {/* Flow Diagram */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 block">STEP 1</span>
                      <span className="font-bold text-white block">Input / Select Data</span>
                      <p className="text-[10px] text-slate-400">Media upload or parameter entry</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 block">STEP 2</span>
                      <span className="font-bold text-emerald-400 block">Instant Validation</span>
                      <p className="text-[10px] text-slate-400">Database & API live check</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 block">STEP 3</span>
                      <span className="font-bold text-blue-400 block">Execution / Export</span>
                      <p className="text-[10px] text-slate-400">Save to store & public view</p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>💡 Quick Shortcut: Use Ctrl/Cmd+S to save modifications directly.</span>
                    <span className="text-emerald-400 font-mono text-[10px]">Response: 18ms</span>
                  </div>
                </div>

                {/* Hostinger Database or Migration Code Snippet if applicable */}
                {(pageId === 'hosting' || pageId === 'backup') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Hostinger Terminal / CLI Command Quick Reference:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy('mysql -u u123456789_unity -p u123456789_db < hostinger_backup.sql')}
                        className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copied' : 'Copy Command'}</span>
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 font-mono text-xs text-emerald-400 overflow-x-auto">
                      <code>mysql -u u123456789_unity -p u123456789_db &lt; hostinger_backup.sql</code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="space-y-3">
              {(isAr ? data.tipsAr : data.tipsEn).map((tip, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border flex items-start gap-3"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed opacity-90">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          <span className="text-[11px] opacity-60">
            {isAr ? 'مركز مساعدة منصة UnityTeck SaaS' : 'UnityTeck Multi-Store SaaS Documentation'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-white font-bold text-xs shadow-xs cursor-pointer"
            style={{ background: 'var(--portal-cta)' }}
          >
            {isAr ? 'فهمت، العودة للصفحة' : 'Got it, Return to Page'}
          </button>
        </div>
      </div>
    </div>
  );
};
