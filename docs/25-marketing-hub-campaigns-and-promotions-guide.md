# 25 · Marketing Hub, Campaigns & Promotions Manual (Bilingual: EN / AR)
# دليل مركز التسويق والحملات الترويجية والعروض (باللغتين الإنجليزية والعربية)

**Canonical Reference:** `docs/00` · `docs/01` (Phase 3.7 / 4.7 / 5.4) · `docs/08`  
**Scope:** Store Marketing Hub · UTM Builder · Coupons & Discounts · Promos & Banners · Journey Funnel · WhatsApp & Pixels  
**Status:** Locked Specification & Standard Operating Procedure (SOP)  

---

## 1. Executive Overview / نظرة عامة تنفيذيـة

### 🇬🇧 English:
The Marketing Hub empowers multi-tenant store owners to run data-driven customer acquisition and retention campaigns. All marketing channels, coupon engines, promo banners, UTM tracking links, and third-party advertising pixels operate under strict multi-tenant isolation (`store_id`), allowing store admins to maximize sales without performance degradation.

### 🇸🇦 العربية:
يمنح "مركز التسويق" (Marketing Hub) أصحاب المتاجر في منصة Unityteck أدوات متطورة لجذب العملاء وزيادة المبيعات والاحتفاظ بالعملاء. تعمل كافة أدوات الحملات، وكوبونات الخصم، وبانرات العروض، وروابط التتبع الذكية (UTM)، وبكسلات المنصات الإعلانية بنظام عزل كامل لكل متجر (`store_id`)، مما يضمن أقصى كفاءة تسويقية وسرعة فائقة.

---

## 2. Marketing Hub Modules & Architecture / أقسام ومعمارية مركز التسويق

```
┌────────────────────────────────────────────────────────────────────────┐
│                   STORE MARKETING & GROWTH ENGINE                      │
├───────────────────────────────────┬────────────────────────────────────┤
│ 1. UTM Campaign Builder           │ 4. Promotional Banners & Popups    │
│ 2. Coupon & Discount Engine       │ 5. Ad Pixels (Meta/TikTok/Snap)    │
│ 3. Customer Journey Funnel (CRO)  │ 6. WhatsApp Direct Commerce        │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 3. UTM Campaign Builder & Link Tracking / صانع روابط التتبع وحملات UTM

### 🇬🇧 English:
Store managers can generate trackable links with standard UTM parameters to measure performance across external channels (Instagram Ads, TikTok, Google Ads, Influencers, WhatsApp broadcasts).

#### Standard UTM Parameters:
| Parameter | Description | Example |
|---|---|---|
| `utm_source` | Platform / Traffic source | `instagram`, `tiktok`, `google`, `whatsapp`, `newsletter` |
| `utm_medium` | Marketing medium | `cpc`, `influencer`, `story_ad`, `bio_link`, `broadcast` |
| `utm_campaign` | Specific campaign identifier | `ramadan_sale_2026`, `spring_collection`, `vip_offer` |
| `utm_term` | Paid search target / keyword | `flower_delivery_riyadh`, `luxury_gift_box` |
| `utm_content` | Creative variant / A/B test | `video_hero_banner`, `red_roses_carousel` |

*Resulting Link Format:*  
`https://store.unityteck.com/product/luxury-box?utm_source=instagram&utm_medium=story_ad&utm_campaign=ramadan_2026`

### 🇸🇦 العربية:
يتيح صانع روابط UTM إنشاء روابط تتبع احترافية ودقيقة لقياس عائد الاستثمار ومصادر الزيارات من منصات التواصل والمشاهير وإعلانات جوجل.

#### معلمات تتبع UTM الأساسية:
| المعلمة | الوصف | مثال تطبيقي |
|---|---|---|
| `utm_source` | منصة أو مصدر الزيارة | `instagram`, `tiktok`, `google`, `whatsapp`, `snapchat` |
| `utm_medium` | نوع الوسيط الإعلاني | `cpc` (إعلان ممول), `influencer` (مشهور), `story_ad`, `bio_link` |
| `utm_campaign` | اسم أو معرف الحملة | `ramadan_sale_2026` (تخفيضات رمضان), `summer_offers` |
| `utm_term` | الكلمة المفتاحية المستهدفة | `توصيل_ورد_الرياض`, `هدايا_فاخرة_مكة` |
| `utm_content` | التمييز بين الإعلانات المتعددة (A/B) | `video_ad_1`, `carousel_blue_flowers` |

---

## 4. Coupons & Promotional Discount Engine / نظام كوبونات الخصم والعروض الترويجية

### 🇬🇧 English:
The coupon engine validates promotional rules in real-time without reloading the checkout page:

1. **Discount Types:**
   - **Percentage Discount:** e.g., `20% OFF` (with optional Maximum Discount Cap).
   - **Fixed Amount Discount:** e.g., `50 SAR OFF`.
   - **Free Shipping Coupon:** Waives shipping fees if criteria match.
2. **Usage Rules & Governance:**
   - **Minimum Order Subtotal:** Coupon triggers only if subtotal exceeds threshold (e.g., Min 200 SAR).
   - **Usage Limits:** Total usage count (e.g., first 100 customers) and per-user limit (e.g., 1 time per customer email/phone).
   - **Date Window:** Start date and Auto-expiry timestamp.
   - **Category / Product Scope:** Apply store-wide or restrict to specific categories (e.g., "Flowers Only").

### 🇸🇦 العربية:
يوفر نظام الكوبونات محركاً فورياً لتطبيق الخصومات أثناء الدفع دون الحاجة لإعادة تحميل الصفحة:

1. **أنواع الخصومات:**
   - **خصم بنسبة مئوية:** مثل `خصم 20%` (مع إمكانية تحديد سقف أقصى للخصم بالريال).
   - **خصم بمبلغ ثابت:** مثل `خصم 50 ريال`.
   - **شحن مجاني:** إلغاء رسوم الشحن عند توفر شروط الطلب.
2. **شروط وضوابط الاستخدام:**
   - **الحد الأدنى لقيمة الطلب:** يشترط وصول السلة لمبلغ معين (مثلاً: حد أدنى 200 ريال).
   - **حدود الاستخدام:** عدد مرات الاستخدام الإجمالي (أول 100 عميل) وعدد مرات الاستخدام لكل عميل (مرة واحدة لكل رقم/بريد).
   - **فترة الصلاحية:** تحديد تاريخ البداية وتاريخ الانتهاء التلقائي.
   - **النطاق والتصنيف:** تطبيق الكوبون على المتجر كاملاً أو تقييده بمنتجات/أقسام محددة.

---

## 5. Promotional Banners, Sticky Bars & Popups / بانرات العروض والشريط الإعلاني والنوافذ المنبثقة

### 🇬🇧 English:
- **Top Announcement Bar:** Sticky banner displaying free shipping announcements or flash sale alerts (`"Free Shipping on orders above 250 SAR - Use code FREESHIP"`).
- **Hero Promo Sliders:** High-impact visual carousels with direct links to promotional landing pages.
- **Exit-Intent / Welcome Popups:** Timed overlay modal offering instant discount codes for first-time visitors or before leaving.

### 🇸🇦 العربية:
- **شريط الإعلانات العلوي الثابت:** شريط علوي بارز لإعلانات الشحن المجاني أو عروض التخفيضات الكبرى (`"شحن مجاني للطلبات فوق 250 ريال - كود: FREESHIP"`).
- **بانرات الواجهة الترويجية المتحركة:** عروض بصرية جذابة مع أزرار مباشرة لصفحات العروض الخاصة.
- **نوافذ العروض المنبثقة (Popups):** نوافذ ترحيبية أو عند محاولة مغادرة الموقع تقدم كود خصم فوري للزوار الجدد لرفع نسبة الشراء.

---

## 6. Customer Journey Funnel & Conversion Optimization / قمع رحلة العميل وتحسين معدل التحويل (CRO)

### 🇬🇧 Journey Stages & Funnel Metrics:
```
[ 1. Store Visits (100%) ]
           │
           ▼
[ 2. Product Views (68%) ]  ──> Drop-off: Optimize Product Images, Price & Reviews
           │
           ▼
[ 3. Added to Cart (32%) ]  ──> Drop-off: Optimize "Add to Cart" CTA & Instant Cart Drawer
           │
           ▼
[ 4. Checkout Initiated (18%) ] ──> Drop-off: Streamline 1-Step Checkout & Show Payment Trust Badges
           │
           ▼
[ 5. Order Completed (8.5%) ]  ──> Thank You Page + WhatsApp Order Confirmation
```

### 🇸🇦 مراحل قمع المبيعات وتحسين التحويل:
1. **زيارات المتجر (Store Visits):** قياس إجمالي الزوار من مختلف القنوات الإعلانية.
2. **استعراض المنتجات (Product Views):** تحسين سرعة الصفحة، جودة الصور، ووصف المنتج.
3. **الإضافة إلى السلة (Add to Cart):** تسهيل زر الشراء الفوري وعرض السلة الجانبية السريعة.
4. **بدء عملية الدفع (Checkout Initiated):** توفير دفع بخطوة واحدة ودعم طرق دفع سريعة (مدى / Apple Pay / تابي / تمارا / الدفع عند الاستلام).
5. **إتمام الطلب بنجاح (Order Completed):** إظهار صفحة الشكر وإرسال رسالة تأكيد فورية عبر الواتساب.

---

## 7. Direct Social Commerce (WhatsApp Orders) / التجارة الاجتماعية المباشرة عبر واتساب

### 🇬🇧 English:
For customers who prefer immediate communication or cash orders:
- **"Order via WhatsApp" button on Product Details Page:** Pre-populates a structured message:
  ```text
  Hello [Store Name], I would like to order:
  - Product: Luxury Red Roses Box
  - SKU: FP-ROSE-001
  - Price: 299 SAR
  - Quantity: 1
  - Product Link: https://store.unityteck.com/product/red-roses-luxury-box
  ```

### 🇸🇦 العربية:
للعملاء الذين يفضلون الطلب والتواصل المباشر:
- **زر "اطلب عبر الواتساب" في صفحة المنتج:** يُنشئ رسالة منسقة تلقائياً تتضمن اسم المنتج، كود SKU، السعر، الكمية، ورابط المنتج ليتمكن فريق المبيعات من إتمام الطلب فوراً.

---

## 8. Pixels & Third-Party Advertising Integrations / وحدات البكسل والتكامل الإعلاني

### 🇬🇧 Supported Tracking Integrations:
1. **Meta Pixel (Facebook & Instagram):** Standard events `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`.
2. **TikTok Pixel:** Direct event tracking for TikTok Shop & Spark Ads campaigns.
3. **Snapchat Pixel:** Snap Pixel ID integration for GCC audience targeting.
4. **Google Ads Conversion Tracking:** Direct event firing on the `/thank-you` order completion page.

### 🇸🇦 وحدات البكسل المدعومة:
1. **بكسل ميتا (Meta Pixel):** تتبع أحداث فيسبوك وإنستغرام بدقة (تصفح، سلة، شراء).
2. **بكسل تيك توك (TikTok Pixel):** تتبع حملات الإعلانات الممولة على تيك توك.
3. **بكسل سناب شات (Snapchat Pixel):** ربط مباشر باستهداف إعلانات سناب شات في دول الخليج.
4. **تتبع تحويلات إعلانات جوجل (Google Ads):** إطلاق حدث التحويل فور الوصول لصفحة الشكر وإتمام الطلب.
