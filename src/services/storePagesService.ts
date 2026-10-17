/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Central Store Pages & Policies Service (SaaS Multi-Store)
 * Manages Master Default Pages (Privacy Policy, Return Policy, Terms, Order Tracking, Store Locator, etc.)
 * Allows per-store customization, editing, creating new custom pages, and resetting to defaults.
 */

import { Store } from '../types';

export interface StoreCustomPage {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  contentEn: string;
  contentAr: string;
  category: 'legal' | 'information' | 'support' | 'custom';
  isSystemDefault?: boolean;
  isPublished: boolean;
  metaDescriptionEn?: string;
  metaDescriptionAr?: string;
  updatedAt: string;
}

export const MASTER_DEFAULT_PAGES: StoreCustomPage[] = [
  {
    id: 'page_privacy_policy',
    slug: 'privacy-policy',
    titleEn: 'Privacy Policy',
    titleAr: 'سياسة الخصوصية وسرية المعلومات',
    category: 'legal',
    isSystemDefault: true,
    isPublished: true,
    metaDescriptionEn: 'Official privacy policy and customer data protection principles.',
    metaDescriptionAr: 'سياسة حماية البيانات وخصوصية عملاء المتجر وفق الأنظمة السعودية.',
    updatedAt: '2026-10-16',
    contentEn: `### 1. Introduction & Scope
At {STORE_NAME}, we value your privacy and are committed to safeguarding your personal data in full compliance with the Saudi Personal Data Protection Law (PDPL) and National Cybersecurity Authority (NCA) standards.

### 2. Information We Collect
- **Personal Information:** Name, email address, national identity or residency (when mandated for customs/invoicing), shipping address, and mobile phone number (+966).
- **Order & Payment Details:** Transaction records, purchased items, and payment reference numbers. We NEVER store full credit card or CVV details; payments are processed through PCI-DSS Level 1 compliant gateways (Mada, Apple Pay, Tabby, Tamara).
- **Technical & Browsing Data:** IP address, device fingerprints, browser version, and session interaction timestamps.

### 3. How We Use Your Data
1. Order processing, fulfillment, and doorstep delivery across Saudi Arabia.
2. Generating official ZATCA (Fatoora) tax invoices with verifiable QR codes.
3. Sending transactional SMS and WhatsApp notifications regarding order confirmation and dispatch.
4. Enhancing customer support and personalized product recommendations.

### 4. Data Sharing & Third Parties
We do not sell, rent, or trade your personal data. We share necessary operational data only with:
- Licensed logistics partners (SMSA Express, Aramex, SPL) for parcel delivery.
- Licensed payment providers for authenticating transactions.
- Official regulatory authorities when mandated under Saudi legal statutes.

### 5. Customer Rights & Contact
Under Saudi PDPL regulations, you hold the right to request access, rectification, or deletion of your personal records. For inquiries, contact our Data Protection Concierge at **{SUPPORT_EMAIL}** or call **{PHONE}**.`,
    contentAr: `### ١. المقدمة ونطاق السياسة
نولي في {STORE_NAME} بالغ الاهتمام لسرية وخصوصية بياناتكم الشخصية، ونلتزم التزاماً كاملاً بنظام حماية البيانات الشخصية السعودي (PDPL) الصادر بالمرسوم الملكي الكريم، والضوابط الصادرة عن الهيئة الوطنية للأمن السيبراني.

### ٢. البيانات التي نقوم بجمعها
- **البيانات الشخصية الأساسية:** الاسم الكامل، البريد الإلكتروني، رقم الجوال السعودي (+966)، وعنوان التوصيل التفصيلي (المدينة، الحي، اسم الشارع، الرمز البريدي).
- **بيانات الطلبات والمدفوعات:** سجل المنتجات المشتراة، تواريخ الطلبات، وتأكيدات الدفع. نؤكد أننا لا نحفظ بيانات البطاقات الائتمانية أو رموز CVV إطلاقاً؛ حيث تتم كافة المعاملات عبر بوابات دفع معتمدة ومطابقة لمعيار PCI-DSS (مدى، Apple Pay، تابي، تمارا).
- **البيانات الفنية:** عنوان البروتوكول (IP)، نوع المتصفح، وسجلات زيارة وتصفح المتجر لتحسين تجربة المستخدم.

### ٣. أوجه استخدام البيانات الشخصية
١. معالجة وتأكيد الطلبات وتوصيلها إلى باب منزلك في كافة مدن ومحافظات المملكة.
٢. إصدار الفواتير الضريبية الإلكترونية المعتمدة والمتوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك (زاتكا).
٣. إرسال إشعارات التتبع وحالة الشحنات عبر الرسائل النصية القصيرة (SMS) والواتساب.
٤. تقديم خدمات الدعم الفني وخدمات الضمان المعتمد.

### ٤. مشاركة البيانات مع أطراف ثالثة
لا نقوم ببيع أو تأجير بياناتكم لأي طرف تجاري ثالث. نشارك فقط البيانات اللازمة تشغيلياً مع:
- شركات الشحن والخدمات اللوجستية المرخصة (سمسا إكسبريس، أرامكس، سبل البريد السعودي) لإيصال الطلبات.
- مزودي بوابات الدفع الإلكتروني المعتمدة من البنك المركزي السعودي (ساما).

### ٥. حقوق العميل ووسائل التواصل
يحق لكم نظاماً طلب الاطلاع على بياناتكم، أو تحديثها، أو طلب حذفها وفق الضوابط النظامية. لأي استفسار يرجى مراسلة مسؤول حماية البيانات عبر البريد الإلكتروني **{SUPPORT_EMAIL}** أو الاتصال على الرقم المجاني **{PHONE}**.`
  },
  {
    id: 'page_return_policy',
    slug: 'return-policy',
    titleEn: 'Return & Exchange Policy',
    titleAr: 'سياسة الاستبدال والاسترجاع والضمان',
    category: 'legal',
    isSystemDefault: true,
    isPublished: true,
    metaDescriptionEn: 'Hassle-free 7-day return and 14-day exchange policy under Saudi Ministry of Commerce regulations.',
    metaDescriptionAr: 'سياسة الاستبدال والاسترجاع وضمان الجودة المعتمدة من وزارة التجارة السعودية.',
    updatedAt: '2026-10-16',
    contentEn: `### 1. General Principles
At {STORE_NAME}, customer satisfaction is our prime commitment. In accordance with the regulations of the Saudi Ministry of Commerce and the E-Commerce Law, we offer a transparent and hassle-free return and exchange framework.

### 2. Eligibility & Timeframes
- **Return for Refund:** Within **7 days** from the parcel delivery date.
- **Product Exchange:** Within **14 days** from the parcel delivery date.
- **Defective / Damaged on Arrival:** Instant replacement or full refund within **30 days**.

### 3. Conditions for Return
To be eligible for return:
1. Product must remain brand-new, unused, unwashed, and completely intact with original factory packaging and seals.
2. All complimentary bundle items, accessories, user manuals, and warranty cards must be returned in the original box.
3. Original purchase invoice or order confirmation number must be provided.
4. Consumables (such as opened specialty coffee beans, cleaning powders, hygiene-sensitive contact parts) cannot be returned once unsealed unless defective.

### 4. Refund Processing & Timelines
- Returned items are inspected by our quality assurance team within 24-48 hours of receipt at our Riyadh fulfillment center.
- Approved refunds are credited back to the original payment source:
  - **Mada & Credit Cards:** 3 to 7 business days (depending on your issuing bank).
  - **Apple Pay:** 1 to 3 business days.
  - **Tabby / Tamara:** Automatically credited and installment schedules adjusted instantly.
  - **Cash on Delivery (COD):** Direct bank transfer to the customer's verified Saudi IBAN.

### 5. Return Logistics & Costs
- If the return is due to product defect or shipping error, {STORE_NAME} covers 100% of the return courier fees.
- If the return is due to customer remorse, a standardized courier handling fee of SAR 25 will be deducted from the refund total.`,
    contentAr: `### ١. المبادئ العامة
نحرص في {STORE_NAME} على تقديم أعلى معايير الرضا والثقة لعملائنا الكرام. وبما يتوافق مع أنظمة وزارة التجارة السعودية ونظام التجارة الإلكترونية، نضع بين أيديكم سياسة استبدال واسترجاع مرنة وسريعة.

### ٢. الفترات الزمنية المعتمدة
- **طلب الاسترجاع واسترداد المبلغ:** خلال **٧ أيام** من تاريخ استلام الشحنة.
- **طلب الاستبدال بمنتج آخر:** خلال **١٤ يوماً** من تاريخ استلام الشحنة.
- **العيوب المصنعية أو التلف أثناء النقل:** استبدال فوري أو استرداد كامل خلال **٣٠ يوماً** من الاستلام.

### ٣. شروط قبول الاسترجاع والاستبدال
١. أن يكون المنتج بحالته الأصلية الجديدة، غير مستخدم، وبكامل ملحقاته ومغلفاً بالكرتون الأصلي وجميع بطاقات الضمان والكتالوجات.
٢. توفر الفاتورة الأصلية أو رقم الطلب المسجل بالمتجر.
٣. لا يمكن استرجاع المواد الاستهلاكية (مثل أكياس حبوب القهوة المفتوحة، مساحيق التنظيف، كبسولات القهوة المستعملة) لدواعي الصحة والسلامة، إلا إذا تبين وجود عيب مصنعي.

### ٤. آلية ومدة استرداد الأموال
- يتم فحص المنتج فور وصوله لمستودعاتنا المركزية بالرياض خلال ٢٤ إلى ٤٨ ساعة عمل.
- تتم إعادة المبالغ المستحقة بذات طريقة الدفع الأصلية:
  - **مدى والبطاقات الائتمانية:** خلال ٣ إلى ٧ أيام عمل (بحسب البنك المصدر للبطاقة).
  - **Apple Pay:** خلال ١ إلى ٣ أيام عمل.
  - **تابي وتمارا:** تسوية فورية وتعديل جدول الأقساط تلقائياً.
  - **الدفع عند الاستلام:** تحويل بنكي مباشر إلى الآيبان (IBAN) السعودي المعتمد باسم العميل.

### ٥. تكاليف الشحن
- في حال كان الاسترجاع ناتجاً عن خلل بالمنتج أو خطأ في التجهيز، يتحمل {STORE_NAME} كامل تكاليف بوليصة الشحن بنسبة 100%.
- في حال رغبة العميل بالاسترجاع دون وجود عيب بالمنتج، يتم خصم رسوم الشحن الرمزي وقدرها ٢٥ ر.س فقط من إجمالي المبلغ المسترد.`
  },
  {
    id: 'page_terms_conditions',
    slug: 'terms-and-conditions',
    titleEn: 'Terms and Conditions',
    titleAr: 'الشروط والأحكام واتفاقية الاستخدام',
    category: 'legal',
    isSystemDefault: true,
    isPublished: true,
    metaDescriptionEn: 'Official user agreement, purchase terms, and warranty coverage governed by Saudi law.',
    metaDescriptionAr: 'الشروط والأحكام الرسمية للشراء والتعاقد الخاضعة للأنظمة التجارية بالمملكة العربية السعودية.',
    updatedAt: '2026-10-16',
    contentEn: `### 1. Agreement to Terms
By browsing, registering, or placing an order through {STORE_NAME}, you represent and agree to be bound by these official Terms and Conditions in accordance with the laws and regulations of the Kingdom of Saudi Arabia.

### 2. Commercial Registration & VAT
- **Merchant:** {STORE_NAME}
- **Commercial Registration (CR):** {CR_NUMBER}
- **Tax Identification Number (VAT):** {VAT_NUMBER}
- All product prices displayed on the store are inclusive of 15% Value Added Tax (VAT) as per Saudi ZATCA guidelines.

### 3. Orders, Pricing & Product Availability
- We strive to ensure absolute accuracy of technical specifications, photos, and prices. In the rare event of a clerical typographical error on pricing or inventory, we reserve the right to notify the customer and cancel or adjust the order before dispatch.
- Orders are confirmed once payment authorization is completed or COD verification SMS is acknowledged.

### 4. Warranty & After-Sales Services
- All electrical coffee machines and electric grinders come with an official **2-Year Comprehensive Warranty** against manufacturing defects, compliant with the Saudi Ministry of Commerce warranty framework.
- Warranty coverage does not include accidental drops, commercial misuse of domestic appliances, power surge damage without surge protection, or limescale buildup caused by unpurified water.

### 5. Governing Law & Jurisdiction
These Terms and Conditions shall be governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia. Any dispute arising out of or related to these terms shall be settled exclusively by the competent commercial courts in Saudi Arabia.`,
    contentAr: `### ١. اتفاقية الاستخدام
يعد استخدامك لمتجر {STORE_NAME} أو قيامك بطلب أي من المنتجات إقراراً وموافقة صريحة على الالتزام بهذه الشروط والأحكام، الخاضعة للأنظمة واللوائح المعمول بها في المملكة العربية السعودية.

### ٢. بيانات التوثيق والسجل التجاري
- **اسم المتجر:** {STORE_NAME}
- **السجل التجاري:** {CR_NUMBER}
- **الرقم الضريبي المعتمد:** {VAT_NUMBER}
- تشمل كافة الأسعار المعروضة في المتجر ضريبة القيمة المضافة بنسبة 15% وتصدر فواتير إلكترونية معتمدة من هيئة الزكاة والضريبة والجمارك (زاتكا).

### ٣. الطلبات وتوفر المنتجات والأسعار
- نسعى دائماً لضمان دقة مواصفات المنتجات، الصور، والأسعار. في حالات نادرة جداً قد يقع خطأ تسعيري غير مقصود أو نفاد غير متوقع للمخزون؛ وفي هذه الحالة يحتفظ المتجر بحق التواصل مع العميل وتصحيح الطلب أو إلغائه مع استرداد المبلغ كاملاً فوراً.
- يعتبر الطلب مؤكداً ونافذاً بمجرد إتمام عملية الدفع الإلكتروني بنجاح أو تأكيد رمز التحقق لطلبات الدفع عند الاستلام.

### ٤. الضمان وخدمات ما بعد البيع
- تتمتع كافة مكائن القهوة والمطاحن الكهربائية بضمان رسمي شامل لمدة **سنتين (24 شهراً)** ضد العيوب المصنعية، طبقاً للائحة الضمان الصادرة عن وزارة التجارة بالمملكة.
- لا يشمل الضمان الأعطال الناتجة عن الكسر، سوء الاستخدام، تذبذب الجهد الكهربائي، أو ترسبات الأملاح والتكلسات الناتجة عن استخدام مياه غير مفلترة دون تنظيف دوري.

### ٥. النظام الحاكم والاختصاص القضائي
تخضع هذه الاتفاقية وتفسر وفقاً لأنظمة المملكة العربية السعودية، وتختص المحاكم التجارية بالمملكة بنظر أي نزاع قد ينشأ عن تفسير أو تنفيذ بنود هذه الاتفاقية.`
  },
  {
    id: 'page_shipping_policy',
    slug: 'shipping-policy',
    titleEn: 'Shipping & Delivery Policy',
    titleAr: 'سياسة الشحن والتوصيل السريع',
    category: 'support',
    isSystemDefault: true,
    isPublished: true,
    metaDescriptionEn: 'Fast doorstep delivery across all Saudi cities within 24 to 72 hours.',
    metaDescriptionAr: 'خدمة التوصيل السريع لكافة مدن المملكة خلال ٢٤ إلى ٧٢ ساعة عبر كبرى الشركات اللوجستية.',
    updatedAt: '2026-10-16',
    contentEn: `### 1. Delivery Coverage
{STORE_NAME} delivers to all cities, provinces, and regions across the Kingdom of Saudi Arabia via our premier logistics partners (SMSA Express, Aramex, and local rapid couriers).

### 2. Delivery Timeframes
- **Riyadh & Central Region:** 24 to 48 hours. Express same-day delivery available for orders placed before 1:00 PM.
- **Jeddah, Makkah, Madinah, Dammam, Khobar:** 24 to 72 hours.
- **All Other Regions & Remote Areas:** 2 to 4 business days.

### 3. Shipping Fees
- **Free Shipping:** On all orders with a cart total of **SAR 299 or more**.
- **Standard Flat-Rate Shipping:** SAR 19 - 25 for orders below SAR 299.
- **Cash on Delivery (COD) Surcharge:** SAR 15 collection fee applied by courier companies.

### 4. Parcel Tracking
Once your package is dispatched from our fulfillment hub, an SMS and WhatsApp message will be sent with your live tracking number (AWB) and direct courier track link.`,
    contentAr: `### ١. نطاق التغطية الجغرافية
يقدم {STORE_NAME} خدمات الشحن والتوصيل المباشر إلى باب المنزل في كافة مدن ومحافظات وقرى المملكة العربية السعودية، بالتعاون مع كبرى الشركات اللوجستية المعتمدة (سمسا إكسبريس، أرامكس، ومناديب التوصيل الفوري).

### ٢. مدد التوصيل المعتمدة
- **مدينة الرياض والمنطقة الوسطى:** خلال ٢٤ إلى ٤٨ ساعة (توصيل فوري خلال نفس اليوم متاح للطلبات المسجلة قبل الساعة ١ ظهراً).
- **جدة، مكة المكرمة، المدينة المنورة، الدمام، والخبر:** خلال ٢٤ إلى ٧٢ ساعة.
- **باقي مدن ومناطق المملكة والمحافظات:** خلال ٢ إلى ٤ أيام عمل.

### ٣. تكلفة ورسوم الشحن
- **الشحن المجاني:** متاح لكافة الطلبات التي تتجاوز قيمتها **٢٩٩ ر.س**.
- **رسوم الشحن المخفض:** تتراوح بين ١٩ إلى ٢٥ ر.س للطلبات الأقل من الحد الأدنى.
- **رسوم الدفع عند الاستلام:** رسوم تحصيل لوجستية تبلغ ١٥ ر.س تفرضها شركة الشحن عند اختيار الدفع نقداً عند الباب.

### ٤. تتبع حالة الشحنة
فور تجهيز الشحنة وانطلاقها من مستودعنا، ستصلكم رسالة نصية (SMS) ورسالة واتساب تتضمن رقم بوليصة التتبع ورابط المتابعة المباشرة لحظة بلحظة.`
  },
  {
    id: 'page_warranty_policy',
    slug: 'warranty-policy',
    titleEn: 'Official 2-Year Warranty',
    titleAr: 'الضمان الذهبي سنتين وخدمات الصيانة',
    category: 'support',
    isSystemDefault: true,
    isPublished: true,
    metaDescriptionEn: 'Official 24-month comprehensive warranty on all electrical coffee equipment.',
    metaDescriptionAr: 'الضمان الذهبي المعتمد سنتين على مكائن القهوة والمطاحن وتوفر قطع الغيار الأصلية.',
    updatedAt: '2026-10-16',
    contentEn: `### 1. Warranty Scope
All electrical machines purchased from {STORE_NAME} carry an official **2-Year Golden Warranty** against manufacturing defects, under the supervision of the Saudi Ministry of Commerce.

### 2. What Is Covered?
- Dual boilers, thermoblocks, and heating elements.
- Italian ULKA 20-bar & 15-bar water pumps.
- Digital PID temperature controllers, PCBs, and touch displays.
- Burr motor assembly and electronic control sensors.

### 3. Authorized Service Centers
We operate certified maintenance laboratories in **Riyadh** and **Jeddah** with 100% genuine replacement parts and certified technicians. Free doorstep pickup and return is provided for warranty claims within the first year!`,
    contentAr: `### ١. نطاق الضمان المعتمد
تتمتع كافة المكائن والمطاحن الكهربائية المباعة عبر {STORE_NAME} بـ **الضمان الذهبي لمدة سنتين (24 شهراً)** ضد العيوب المصنعية، وفقاً للائحة الفنية لوزارة التجارة بالمملكة.

### ٢. ما يشمله الضمان
- البويلرات المزدوجة وسخانات الثيرموبلوك وأنظمة التبخير.
- مضخات الضغط الإيطالية ULKA الأصلية (ضغط 15 و20 بار).
- لوحات التحكم الإلكترونية الذكية PID، شاشات اللمس، وحساسات الحرارة والضغط.
- محركات طحن البن ومجموعات التروس التيتانيوم والمخروطية.

### ٣. مراكز الصيانة وقطع الغيار
نمتلك مراكز صيانة متخصصة ومجهزة بالكامل في **الرياض** و**جدة**، مع التزامنا بتوفير قطع الغيار الأصلية بنسبة 100%. كما نوفر خدمة استلام وتسليم الماكينة من باب منزلك مجاناً خلال السنة الأولى من الضمان!`
  },
  {
    id: 'page_order_tracking',
    slug: 'order-tracking',
    titleEn: 'Track Your Order',
    titleAr: 'تتبع الشحنات وحالة الطلبات',
    category: 'support',
    isSystemDefault: true,
    isPublished: true,
    metaDescriptionEn: 'Live tracking portal for your orders and shipments.',
    metaDescriptionAr: 'بوابة المتابعة والتتبع المباشر لحالة طلباتك وشحناتك خطوة بخطوة.',
    updatedAt: '2026-10-16',
    contentEn: `### Live Order Tracking
Enter your Order Number (e.g., HB-892104) and your registered mobile phone number to check live processing, roasting, dispatch, and courier tracking details.

Our customer logistics team is available on WhatsApp at **{PHONE}** from 9:00 AM to 11:00 PM daily.`,
    contentAr: `### بوابة التتبع المباشر للشحنات
أدخل رقم طلبك (مثال: HB-892104) ورقم الجوال المسجل للتحقق الفوري من حالة تجهيز الماكينة، الفحص الفني، وبوليصة الشحن مع شركة النقل.

فريق المتابعة والخدمات اللوجستية مستعد لخدمتكم يومياً عبر الواتساب على الرقم **{PHONE}** من ٩ صباحاً وحتى ١١ مساءً.`
  },
  {
    id: 'page_store_locator',
    slug: 'store-locator',
    titleEn: 'Store Locator & Showrooms',
    titleAr: 'فروعنا ومعارض البيع والتجربة',
    category: 'information',
    isSystemDefault: true,
    isPublished: true,
    metaDescriptionEn: 'Visit our flagship coffee showrooms in Riyadh and Jeddah.',
    metaDescriptionAr: 'تفضل بزيارة معارضنا الرئيسية في الرياض وجدة لتجربة المكائن وتذوق الإسبريسو.',
    updatedAt: '2026-10-16',
    contentEn: `### Flagship Showrooms & Experience Centers

#### 1. Riyadh Flagship Showroom
- **Location:** Anas Ibn Malik Road, Al-Narjis District, Riyadh 13324, Saudi Arabia.
- **Operating Hours:** Saturday – Thursday: 9:00 AM – 11:00 PM | Friday: 2:00 PM – 11:00 PM.
- **Features:** Live Espresso Bar, Custom Corner Design Studio, Certified Barista Consultation.
- **Phone:** {PHONE}

#### 2. Jeddah Flagship Experience Center
- **Location:** King Abdulaziz Road, Al-Zahra District, Jeddah 23424, Saudi Arabia.
- **Operating Hours:** Saturday – Thursday: 10:00 AM – 11:00 PM | Friday: 3:00 PM – 11:00 PM.
- **Features:** Commercial Machine Demos, Titanium Grinder Tuning, Tasting Lounge.
- **Phone:** {PHONE}`,
    contentAr: `### معارضنا الرئيسية ومراكز تجربة مكائن القهوة

#### ١. فرع ومعرض الرياض الرئيسي
- **العنوان:** طريق أنس بن مالك، حي النرجس، الرياض 13324، المملكة العربية السعودية.
- **أوقات العمل:** السبت إلى الخميس: ٩:٠٠ صباحاً – ١١:٠٠ مساءً | الجمعة: ٢:٠٠ ظهراً – ١١:٠٠ مساءً.
- **المميزات:** ركن إسبريسو حي لتجربة المكائن، استوديو تفصيل أركان القهوة الفاخرة، استشارات باريستا محترفين.
- **رقم الهاتف:** {PHONE}

#### ٢. فرع ومعرض جدة الرئيسي
- **العنوان:** طريق الملك عبدالعزيز، حي الزهراء، جدة 23424، المملكة العربية السعودية.
- **أوقات العمل:** السبت إلى الخميس: ١٠:٠٠ صباحاً – ١١:٠٠ مساءً | الجمعة: ٣:٠٠ عصراً – ١١:٠٠ مساءً.
- **المميزات:** تجربة مكائن الكبسولات والمكائن الاحترافية، ضبط مطاحن التيتانيوم، صالة ضيافة القهوة المختصة.
- **رقم الهاتف:** {PHONE}`
  },
  {
    id: 'page_about_us',
    slug: 'about-us',
    titleEn: 'About Us & Brand Story',
    titleAr: 'قصة علامتنا التجارية ومن نحن',
    category: 'information',
    isSystemDefault: true,
    isPublished: true,
    metaDescriptionEn: 'The story behind our specialty coffee equipment and commitment to perfection.',
    metaDescriptionAr: 'تعرف على قصة شغفنا بمكائن القهوة الفاخرة وتوفير أحدث التقنيات لعشاق الإسبريسو.',
    updatedAt: '2026-10-16',
    contentEn: `### Who We Are
{STORE_NAME} is Saudi Arabia's premier destination for professional domestic and commercial espresso machines, titanium conical grinders, artisan accessories, and custom-crafted luxury coffee corners.

### Our Mission
To empower every coffee enthusiast and barista across the Kingdom to brew golden, barista-grade espresso right from the comfort of their home or workplace, backed by authentic warranty and exceptional customer service.`,
    contentAr: `### من نحن
انطلق {STORE_NAME} في المملكة العربية السعودية ليكون الوجهة الأولى الرائدة لعشاق ومحترفي القهوة المختصة؛ حيث نوفر أحدث مكائن الإسبريسو بنظام الدبل بويلر وضغط 20 بار، المطاحن التيتانيوم الدقيقة، مستلزمات الباريستا الاحترافية، ودواليب وأركان القهوة المصنوعة حسب الطلب.

### رسالتنا
تمكين كل عاشق للقهوة في المملكة من استخلاص إسبريسو ذهبي مثالي وتبخير حليب مخملي بجودة المقاهي العالمية من راحة منزله، مدعوماً بضمان سنتين حقيقي وخدمة عملاء استثنائية تفوق التوقعات.`
  },
  {
    id: 'page_contact_us',
    slug: 'contact-us',
    titleEn: 'Contact Us & Support',
    titleAr: 'اتصل بنا وفريق خدمة العملاء',
    category: 'support',
    isSystemDefault: true,
    isPublished: true,
    metaDescriptionEn: 'Get in touch with our customer care and barista support specialists.',
    metaDescriptionAr: 'تواصل مع فريق الدعم الفني واستشارات الباريستا على مدار الساعة.',
    updatedAt: '2026-10-16',
    contentEn: `### We Are Here to Assist You 7 Days a Week

- **Customer Hotline:** 8008440443 (Toll Free)
- **Direct Phone & WhatsApp:** {PHONE}
- **Email:** {SUPPORT_EMAIL}
- **Operating Hours:** Daily, 9:00 AM – 11:00 PM Saudi Time (AST)
- **Live Assistance:** Click the WhatsApp or Help bubble at the bottom right corner of any page.`,
    contentAr: `### نسعد بخدمتكم والإجابة على استفساراتكم طوال أيام الأسبوع

- **الرقم المجاني الموحد:** 8008440443
- **الهاتف المباشر والواتساب:** {PHONE}
- **البريد الإلكتروني:** {SUPPORT_EMAIL}
- **أوقات العمل:** يومياً من ٩:٠٠ صباحاً وحتى ١١:٠٠ مساءً بتوقيت مكة المكرمة.
- **المساعدة الفورية:** يمكنكم الضغط على أيقونة الواتساب أو ويدجت المساعدة أسفل الشاشة للمحادثة المباشرة.`
  },
  {
    id: 'page_faq',
    slug: 'faq',
    titleEn: 'Frequently Asked Questions (FAQ)',
    titleAr: 'الأسئلة الشائعة والأجوبة الفنية',
    category: 'information',
    isSystemDefault: true,
    isPublished: true,
    metaDescriptionEn: 'Answers to the most common questions regarding machines, warranties, and payments.',
    metaDescriptionAr: 'إجابات شاملة لأكثر الأسئلة تكراراً حول مكائن القهوة، الضمان، وطرق الدفع والتقسيط.',
    updatedAt: '2026-10-16',
    contentEn: `### Frequently Asked Questions

#### Q1: Are the machines 220V with a Saudi 3-Pin British Plug?
**Yes.** All machines supplied by {STORE_NAME} are 220-240V / 50-60Hz with certified SASO 3-pin British plugs compatible with Saudi sockets.

#### Q2: Can I pay in interest-free installments?
**Yes.** We support 4 interest-free split payments via Tabby and Tamara with zero extra fees and instant approval at checkout.

#### Q3: Does the machine come with an official warranty?
**Yes.** Every electrical machine comes with a 2-Year Official Comprehensive Warranty against manufacturing defects.`,
    contentAr: `### الأسئلة الشائعة

#### س١: هل المكائن والمطاحن متوافقة مع الكهرباء والمقابس السعودية؟
**نعم بالتأكيد.** كافة الأجهزة متوافقة مع الجهد الكهربائي السعودي ٢٢٠–٢٤٠ فولت بتردد ٥٠/٦٠ هرتز، ومزودة برأس ثلاثي معتمد مطابق للمواصفات والمقاييس السعودية (SASO).

#### س٢: هل يمكن الشراء بالأقساط الميسرة بدون فوائد؟
**نعم.** نوفر خيار تقسيط المشتريات على ٤ دفعات شهرية ميسرة بدون أي فوائد أو رسوم إضافية عبر تابي (Tabby) وتمارا (Tamara) مع موافقة فورية.

#### س٣: هل يتوفر ضمان وصيانة محلية للمنتجات؟
**نعم.** تتمتع كافة المكائن بضمان ذهبي لمدة سنتين لدى مراكز صيانتنا المعتمدة مع توفر كامل قطع الغيار الأصلية.`
  }
];

function getStorageKey(storeId: string): string {
  return `unityteck_store_pages_${storeId}`;
}

export function replacePlaceholders(text: string, store?: Partial<Store>): string {
  if (!text) return '';
  const storeName = store?.nameAr || store?.name || 'HiBrew KSA | متجر مكائن القهوة';
  const phone = store?.contactPhone || store?.phone || '0501234567';
  const email = store?.email || store?.ownerEmail || 'sa.support@hibrew.com';
  const cr = store?.crNumber || '1010754462';
  const vat = store?.taxNumber || '311123479500003';
  const city = 'الرياض (المملكة العربية السعودية)';

  return text
    .replace(/{STORE_NAME}/g, storeName)
    .replace(/{PHONE}/g, phone)
    .replace(/{SUPPORT_EMAIL}/g, email)
    .replace(/{CR_NUMBER}/g, cr)
    .replace(/{VAT_NUMBER}/g, vat)
    .replace(/{CITY}/g, city);
}

/**
 * Retrieve all pages for a store (customized + master defaults)
 */
export function getStorePages(storeId: string, store?: Partial<Store>): StoreCustomPage[] {
  if (typeof window === 'undefined') {
    return MASTER_DEFAULT_PAGES.map((p) => ({
      ...p,
      contentEn: replacePlaceholders(p.contentEn, store),
      contentAr: replacePlaceholders(p.contentAr, store),
    }));
  }

  try {
    const raw = localStorage.getItem(getStorageKey(storeId));
    if (raw) {
      const parsed: StoreCustomPage[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => ({
          ...p,
          contentEn: replacePlaceholders(p.contentEn, store),
          contentAr: replacePlaceholders(p.contentAr, store),
        }));
      }
    }
  } catch (err) {
    console.error('Failed to read store pages from storage:', err);
  }

  // Initialize with master defaults
  const initial = MASTER_DEFAULT_PAGES.map((p) => ({
    ...p,
    contentEn: replacePlaceholders(p.contentEn, store),
    contentAr: replacePlaceholders(p.contentAr, store),
  }));

  try {
    localStorage.setItem(getStorageKey(storeId), JSON.stringify(initial));
  } catch (e) {
    /* ignore storage quota */
  }

  return initial;
}

/**
 * Find page by slug or ID
 */
export function getStorePageBySlug(
  storeId: string,
  slugOrId: string,
  store?: Partial<Store>
): StoreCustomPage | undefined {
  const all = getStorePages(storeId, store);
  const normalized = slugOrId.toLowerCase().trim();
  return all.find(
    (p) =>
      p.slug.toLowerCase() === normalized ||
      p.id.toLowerCase() === normalized ||
      p.slug.toLowerCase().replace(/-/g, '') === normalized.replace(/-/g, '')
  );
}

/**
 * Save / Update a page
 */
export function saveStorePage(storeId: string, page: StoreCustomPage): void {
  try {
    const current = getStorePages(storeId);
    const existingIndex = current.findIndex((p) => p.id === page.id || p.slug === page.slug);
    const updated = [...current];

    const toSave: StoreCustomPage = {
      ...page,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    if (existingIndex >= 0) {
      updated[existingIndex] = toSave;
    } else {
      updated.push(toSave);
    }

    localStorage.setItem(getStorageKey(storeId), JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('unityteck-pages-changed', { detail: { storeId } }));
  } catch (err) {
    console.error('Failed to save store page:', err);
  }
}

/**
 * Create a new custom page
 */
export function createStorePage(
  storeId: string,
  data: Omit<StoreCustomPage, 'id' | 'updatedAt'>
): StoreCustomPage {
  const newPage: StoreCustomPage = {
    ...data,
    id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    slug: data.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-'),
    updatedAt: new Date().toISOString().split('T')[0],
  };

  saveStorePage(storeId, newPage);
  return newPage;
}

/**
 * Delete a custom page (system default pages cannot be deleted, only unpublished)
 */
export function deleteStorePage(storeId: string, pageId: string): boolean {
  try {
    const current = getStorePages(storeId);
    const target = current.find((p) => p.id === pageId);
    if (!target) return false;
    if (target.isSystemDefault) {
      // System defaults can only be unpublished
      saveStorePage(storeId, { ...target, isPublished: false });
      return true;
    }

    const filtered = current.filter((p) => p.id !== pageId);
    localStorage.setItem(getStorageKey(storeId), JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('unityteck-pages-changed', { detail: { storeId } }));
    return true;
  } catch (err) {
    console.error('Failed to delete store page:', err);
    return false;
  }
}

/**
 * Reset all pages of a store back to master defaults
 */
export function resetStorePagesToDefault(storeId: string): void {
  try {
    localStorage.setItem(getStorageKey(storeId), JSON.stringify(MASTER_DEFAULT_PAGES));
    window.dispatchEvent(new CustomEvent('unityteck-pages-changed', { detail: { storeId } }));
  } catch (err) {
    console.error('Failed to reset store pages:', err);
  }
}
