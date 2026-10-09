# 24 · SEO Architecture & Store Operations Manual (Bilingual: EN / AR)
# دليل بنية تحسين محركات البحث (SEO) والعمليات للمتاجر (باللغتين الإنجليزية والعربية)

**Canonical Reference:** `docs/00` · `docs/01` (Phase 4.4 / 7.6) · `docs/08` · `docs/10`  
**Scope:** Master SEO · Store SEO · Storefront SSR/ISR · Multi-tenant Schema · Sitemap · Robots · Hreflang (EN/AR)  
**Status:** Locked Specification & Standard Operating Procedure (SOP)  

---

## 1. Executive Overview / نظرة عامة تنفيذيـة

### 🇬🇧 English:
Search Engine Optimization (SEO) in Unityteck Multi-Store SaaS is multi-tenant and store-isolated. Every tenant (`store_id`) controls its unique search identity, metadata, canonical routing, structured data schemas, and analytics pipelines without leaking data or inheriting duplicate penalties from neighboring stores.

### 🇸🇦 العربية:
يعد نظام تحسين محركات البحث (SEO) في منصة Unityteck متعددة المتاجر نظاماً معزولاً ومتعدد المستأجرين (`store_id`). يمتلك كل متجر هويته المستقلة تماماً في محركات البحث، بما يشمل البيانات الوصفية (Meta Tags)، الروابط القياسية (Canonical URLs)، بيانات المخطط الهيكلي (JSON-LD Schemas)، وتتبع التحليلات، دون أي تداخل في البيانات أو عقوبات تكرار المحتوى مع المتاجر الأخرى.

---

## 2. Architecture & Core Principles / المعمارية والمبادئ الأساسية

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MASTER ADMIN SEO ENGINE                         │
│  - Global Default Meta & Schemas                                       │
│  - Master Robots.txt & Platform Sitemap Index                          │
│  - Per-Store SEO Quotas & Pro Feature Gates (Schema Builder / Sitemaps)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│     STORE A (store_id = 101)      │ │     STORE B (store_id = 102)      │
│ - Brand Name: Flower Palace       │ │ - Brand Name: Mecca Gifts         │
│ - Domain: flowers.unityteck.com   │ │ - Domain: meccagifts.sa           │
│ - Lang: Arabic (ar-SA) + RTL      │ │ - Lang: English (en-US) + LTR     │
│ - Independent Sitemap & Robots    │ │ - Independent Sitemap & Robots    │
│ - JSON-LD Product & Store Schemas │ │ - JSON-LD Product & Store Schemas │
└───────────────────────────────────┘ └───────────────────────────────────┘
```

### 🇬🇧 Key Golden Rules for SEO:
1. **Server-Side Rendering (SSR / ISR):** Public storefront pages MUST render meta tags and structured data into the initial HTML response (Next.js SSR/ISR). Client-side-only rendering is prohibited for crawlable pages.
2. **Strict Store Isolation (`store_id`):** Slugs, sitemaps, and canonical links for Store A must never reference Store B assets or URLs.
3. **No Stale Metadata (Zero Cache Invalidation):** When a store admin updates product title, description, or OG image, cache tags (`revalidateTag('seo')`) must invalidate instantaneously.
4. **Hreflang & RTL Compliance:** Clean bilingual switching (`en`, `ar`, `x-default`) with matching directional attributes (`dir="ltr"` and `dir="rtl"`).
5. **No False Promises or Black-Hat SEO:** Keyword stuffing, hidden text, and fake indexing claims are strictly prohibited.

### 🇸🇦 القواعد الذهبية للـ SEO:
1. **التقديم من جهة الخادم (SSR / ISR):** يجب تقديم كافة وسوم الميتا والمخططات الهيكلية مباشرة في كود HTML الأولي للصفحة عبر Next.js. يُمنع الاعتماد على الرندرة من جهة العميل فقط للصفحات العامة.
2. **العزل التام للمتاجر (`store_id`):** لا يجوز بأي حال أن تشير الروابط أو خرائط المواقع للمتجر (أ) إلى روابط أو أصول المتجر (ب).
3. **التحديث الفوري وإبطال الكاش (Zero Stale Cache):** عند تعديل عنوان المنتج أو وصفه أو صورة المعاينة، يتم تفريغ الكاش فوراً عبر (`revalidateTag`) لضمان ظهور التعديل الفوري للزواحف ومحركات البحث.
4. **دعم تعدد اللغات ووسوم Hreflang و RTL:** تكامل احترافي للغتين العربية والإنجليزية مع توجيه الصفحة الصحيح (`dir="rtl"` و `dir="ltr"`).
5. **منع الأساليب المضللة (No Black-Hat SEO):** يُحظر حشو الكلمات المفتاحية أو النصوص المخفية أو تقديم وعود كاذبة بالأرشفة الفورية.

---

## 3. SEO Meta Tags & OpenGraph Configuration / إعدادات وسوم الميتا ومعاينة التواصل الاجتماعي

### 🇬🇧 Meta Tags Matrix:
| Field | Recommended Length | Description / Purpose |
|---|---|---|
| **Meta Title** | 50 – 60 Characters | Unique page title containing primary keyword + brand name. |
| **Meta Description** | 140 – 160 Characters | Compelling summary for search snippets with clear Call-to-Action. |
| **Meta Keywords** | 5 – 8 Focused Keywords | Comma-separated tags relevant to catalog / category. |
| **Canonical URL** | Absolute URL | Self-referencing or target authoritative URL to eliminate duplicate content issues. |
| **OG Title & Description** | Synchronized with Meta | Optimized for social sharing (WhatsApp, Facebook, Twitter/X, LinkedIn). |
| **OG Image** | 1200 x 630 px (1.91:1) | High-res WebP/PNG image with cache-busting timestamp versioning `?v={updated_at}`. |
| **Twitter Card** | `summary_large_image` | Card layout for X/Twitter previews. |

### 🇸🇦 مصفوفة وسوم الميتا:
| الحقل | الطول الموصى به | الوصف والهدف |
|---|---|---|
| **عنوان الميتا (Meta Title)** | 50 - 60 حرف | عنوان فريد يتضمن الكلمة المفتاحية الرئيسية واسم المتجر. |
| **وصف الميتا (Meta Description)** | 140 - 160 حرف | ملخص جذاب يظهر في نتائج البحث ويشجع على النقر (CTA). |
| **الكلمات المفتاحية (Keywords)** | 5 - 8 كلمات مركزة | كلمات ذات صلة مباشرة بمحتوى الصفحة أو القسم. |
| **الرابط القياسي (Canonical URL)** | رابط كامل (Absolute) | يمنع مشاكل تكرار المحتوى عبر تحديد المصدر الأساسي للصفحة. |
| **وسوم OpenGraph (OG Tags)** | مطابقة لوسوم الميتا | تضمن ظهور معاينة احترافية للمتجر والمنتجات على واتساب وفيسبوك وإكس. |
| **صورة المشاركة (OG Image)** | 1200 × 630 بكسل | صورة عالية الجودة بصيغة WebP/PNG مع رقم إصدار الكاش `?v={updated_at}`. |
| **بطاقات تويتر (Twitter Card)** | `summary_large_image` | تنسيق العرض الكبير لبطاقات المشاركة على منصة X/تويتر. |

---

## 4. Structured Data Schemas (JSON-LD) / بيانات المخطط المنظمة (JSON-LD)

### 🇬🇧 JSON-LD Implementation Rules:
The platform injects dynamic schema tags inside `<head>` for every public entity:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://store.unityteck.com/#organization",
      "name": "Flower Palace Store",
      "url": "https://store.unityteck.com",
      "logo": "https://cdn.unityteck.com/stores/101/logo.webp",
      "sameAs": [
        "https://instagram.com/flowerpalace",
        "https://twitter.com/flowerpalace"
      ]
    },
    {
      "@type": "Product",
      "@id": "https://store.unityteck.com/product/red-roses-luxury-box#product",
      "name": "Luxury Red Roses Box / صندوق ورود حمراء فاخر",
      "image": ["https://cdn.unityteck.com/stores/101/products/roses-1.webp"],
      "description": "Premium fresh natural red roses box with ribbon.",
      "sku": "FP-ROSE-001",
      "offers": {
        "@type": "Offer",
        "url": "https://store.unityteck.com/product/red-roses-luxury-box",
        "priceCurrency": "SAR",
        "price": "299.00",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "Flower Palace Store"
        }
      }
    }
  ]
}
```

### 🇸🇦 قواعد تنفيذ المخططات الهيكلية (JSON-LD):
يقوم النظام بحقن المخططات الهيكلية برمجياً في رأس الصفحة لكل متجر ومنتج:
1. **مخطط المنظمة (Organization):** يحدد اسم المتجر، الشعار، وروابط قنوات التواصل الاجتماعي.
2. **مخطط المتجر المحلي (LocalBusiness):** يتضمن العنوان، أرقام الهاتف، ساعات العمل، والعملة المستخدمة (SAR / USD).
3. **مخطط المنتج (Product & Offer):** يوضح اسم المنتج، السعر، العملة، حالة المخزون (InStock / OutOfStock)، وتقييمات العملاء.
4. **مخطط مسار التنقل (BreadcrumbList):** يسهل تتبع الهيكل الهرمي من الصفحة الرئيسية إلى الأقسام ثم المنتجات.

---

## 5. Multi-lingual Hreflang & Arabic RTL SEO / توجيه اللغات ووسوم Hreflang واللغة العربية

### 🇬🇧 English:
For bilingual stores (Arabic and English), every page MUST output accurate hreflang tags:
```html
<link rel="alternate" hreflang="ar" href="https://store.unityteck.com/ar/product/luxury-box" />
<link rel="alternate" hreflang="en" href="https://store.unityteck.com/en/product/luxury-box" />
<link rel="alternate" hreflang="x-default" href="https://store.unityteck.com/product/luxury-box" />
```

### 🇸🇦 العربية:
في المتاجر ثنائية اللغة (العربية والإنجليزية)، تلتزم المنصة بإنشاء وسوم `hreflang` التبادلية لمنع معاقبة محركات البحث للمحتوى المترجم ولضمان توجيه الزائر للغته المفضلة مع ضبط اتجاه الواجهة (`dir="rtl"` للغة العربية و `dir="ltr"` للغة الإنجليزية).

---

## 6. XML Sitemaps & Robots.txt Directives / خرائط المواقع وملف Robots.txt

### 🇬🇧 English:
- **Dynamic XML Sitemap:** Automatically generated per store at `/sitemap.xml` listing all active products, categories, pages, and blog posts with their `lastmod` and `changefreq`.
- **Robots.txt Control:**
```text
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /cart
Disallow: /checkout
Disallow: /api/
Sitemap: https://store.unityteck.com/sitemap.xml
```

### 🇸🇦 العربية:
- **خريطة الموقع التلقائية (XML Sitemap):** يتم توليد خريطة مخصصة لكل متجر عند الرابط `/sitemap.xml` تتضمن المنتجات والأقسام والصفحات النشطة وتاريخ آخر تعديل.
- **ملف توجيه الروبوتات (Robots.txt):** يُسمح لكافة محركات البحث بفهرسة واجهة المتجر العامة، مع حظر مجلدات لوحة الإدارة ومسارات سلة الشراء والدفع لحماية الخصوصية والأداء.

---

## 7. Google Services Integration / تكامل خدمات جوجل

### 🇬🇧 English:
1. **Google Analytics 4 (GA4):** Connect via Measurement ID (`G-XXXXXXXXXX`). Sends e-commerce events (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`).
2. **Google Tag Manager (GTM):** Container ID (`GTM-XXXXXXX`) for dynamic tracking pixels without code deployment.
3. **Google Search Console Verification:** HTML tag or DNS TXT verification stored securely per tenant.

### 🇸🇦 العربية:
1. **تحليلات جوجل (Google Analytics 4):** الربط برقم التتبع (`G-XXXXXXXXXX`) لإرسال أحداث التجارة الإلكترونية (عرض المنتج، الإضافة للسلة، إتمام الطلب).
2. **مدير علامات جوجل (Google Tag Manager):** معرف الحاوية (`GTM-XXXXXXX`) لإدارة وحدات البكسل التسويقية بمرونة.
3. **إثبات ملكية Google Search Console:** عبر وسم HTML الميتا أو سجل DNS دون أي مخاطر برمجية.

---

## 8. Store Owner Checklist / قائمة تحقق صاحب المتجر

- [ ] **🇬🇧 Meta Info:** Fill Meta Title and Description for store homepage and all main categories.  
      **🇸🇦 معلومات الميتا:** تعبئة عنوان ووصف الميتا للصفحة الرئيسية ولجميع الأقسام الرئيسية.
- [ ] **🇬🇧 Social Sharing Image:** Upload a 1200x630px store banner for WhatsApp / Twitter previews.  
      **🇸🇦 صورة المعاينة الاجتماعية:** رفع بانر بأبعاد 1200×630 بكسل للمعاينة على وسائل التواصل الاجتماعي.
- [ ] **🇬🇧 Product Alt Text:** Ensure every uploaded product image contains descriptive Alt text in Arabic and English.  
      **🇸🇦 النص البديل للصور:** التأكد من كتابة النص البديل (Alt Text) لجميع صور المنتجات بالعربية والإنجليزية.
- [ ] **🇬🇧 Search Console:** Submit `/sitemap.xml` inside Google Search Console dashboard.  
      **🇸🇦 خريطة الموقع:** إرسال رابط `/sitemap.xml` في لوحة تحكم Google Search Console.
