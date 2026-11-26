---
title: "Google Search Console, GA4 & Tag Manager Settings Guide | دليل مشرفي محركات البحث والتحليلات"
slug: "/guides/settings/google-search-console-seo-analytics"
category: "Merchant Settings"
languages: ["ar", "en"]
author: "Souq E-Commerce Platform Documentation Team"
last_updated: "2026-11-26"
seo:
  meta_title_en: "Setup Google Search Console, GA4 & Tag Manager | Souq Merchant Guide"
  meta_title_ar: "دليل ربط أدوات مشرفي المواقع جوجل، GA4 ومدير العلامات | منصة سوق"
  meta_description_en: "Learn how to connect Google Search Console, submit automated XML sitemaps, integrate Google Analytics 4 (GA4), and inject Google Tag Manager (GTM) in Souq Platform."
  meta_description_ar: "تعلم كيفية ربط متجرك بجوجل سيرش كونسول، إرسال خريطة الموقع sitemap.xml تلقائياً، تفعيل تحليلات جوجل GA4 وإدخال حاوية Google Tag Manager."
  focus_keywords_en: ["google search console ecommerce", "ga4 measurement id setup", "google tag manager saudi store", "ecommerce xml sitemap ping", "store seo indexing verification"]
  focus_keywords_ar: ["ربط جوجل سيرش كونسول بالمتجر", "إعداد كود تحليلات جوجل GA4", "مدير العلامات جوجل تاج مانجر", "خريطة الموقع لمتجر إلكتروني", "فهرسة صفحات المتجر في جوجل"]
---

# 🔍 Google Search Console, GA4 & Tag Manager Guide
# دليل أدوات مشرفي المواقع وفهرسة محركات البحث وتحليلات جوجل

---

## 📌 Introduction & Overview / مقدمة ونظرة عامة

### English
Organic search engine optimization (SEO) is the most sustainable source of high-margin e-commerce revenue. The **Search Console & Analytics** module in **Souq Platform** simplifies technical SEO for merchants. Through a single interface, store owners can authenticate via one-click Google OAuth, automatically generate and submit dynamic XML sitemaps (`/sitemap.xml`), verify site ownership, and install tracking scripts for **Google Analytics 4 (GA4)** and **Google Tag Manager (GTM)** without touching raw code.

### العربية
تعتبر تهيئة المتجر لمحركات البحث (SEO) المصدر الأهم للحصول على مبيعات متكررة دون تكاليف إعلانية باهظة. توفر لك شاشة **أدوات مشرفي المواقع والتحليلات (Search Console & Indexing)** في **منصة سوق** منصة ربط تقنية فائقة السهولة. يمكنك من خلالها ربط حساب جوجل الرسمي بضغطة زر واحدة (OAuth)، وتوليد وإرسال خريطة الموقع التفاعلية (`/sitemap.xml`)، وإثبات ملكية النطاق، وربط كود **تحليلات جوجل (GA4)** و**مدير العلامات (Google Tag Manager)** بنظام العزل الآمن للمتاجر.

---

## 🖥️ Screen Layout & Visual Wireframe / المخطط البصري لشاشة السيو والتحليلات

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Store Settings > 🔍 Search Console & Analytics (أدوات مشرفي المواقع والفهرسة)             │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  ← Back to All Settings (العودة لكل الإعدادات)                                               │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚡ Google Cloud Integration Status (حالة الربط مع جوجل)                                  │  │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤  │
│  │ Domain: elitecoffee.sa · Owner Email: owner@elitecoffee.sa · Status: [ 🟢 READY ]       │  │
│  │ [ ⚡ Connect Google Account (ربط حساب جوجل السحابي) ]  [ 🔄 Refresh SEO Indexing ]        │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                              │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────────────────────┐  │
│  │ 🔵 Google Search Con. │  │ 🟣 Google Tag Manager │  │ 🟡 Google Analytics 4 (GA4)     │  │
│  ├───────────────────────┤  ├───────────────────────┤  ├─────────────────────────────────┤  │
│  │ Status: [ Connected ] │  │ Status: [ Saved ]     │  │ Status: [ Active Tracking ]     │  │
│  │                       │  │                       │  │                                 │  │
│  │ Total Organic Clicks: │  │ Container ID:         │  │ GA4 Measurement ID:             │  │
│  │ [ 1,480 Clicks / نقرة]│  │ [ GTM-M8X9Q2P       ] │  │ [ G-9R7B42W8XYZ               ] │  │
│  │                       │  │                       │  │                                 │  │
│  │ Sitemap Status:       │  │ Strict Isolation:     │  │ E-Commerce Events:              │  │
│  │ [✓] /sitemap.xml 200OK│  │ Dedicated to this store│  │ [✓] purchase [✓] add_to_cart    │  │
│  └───────────────────────┘  └───────────────────────┘  └─────────────────────────────────┘  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🤖 Robots.txt & Crawling Directives (توجيه عناكب البحث)                                 │  │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤  │
│  │ User-agent: *  |  Allow: /  |  Disallow: /checkout/  |  Sitemap: https://.../sitemap.xml│  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Comprehensive Elements Breakdown / تفصيل العناصر التقنية

| Element / العنصر | Type / النوع | Example / مثال | Verification & Rules / القواعد | Function & SEO Impact / الأثر التقني |
|-----------------|--------------|----------------|--------------------------------|-------------------------------------|
| **Connect Google Button** | OAuth Modal Trigger | Action | Authorized Google Account | يفتح نافذة ربط حساب جوجل لمنح صلاحيات Search Console تلقائياً. |
| **Search Console Badge** | Status Indicator | `Connected` | Real OAuth Verification | يثبت ملكية المتجر ويظهر عدد النقرات العضوية الحقيقية فقط. |
| **GTM Container ID** | Text Input | `GTM-XXXXXXX` | Valid GTM Format | يحقن أكواد مدير العلامات وسنابات سناب شات وتيك توك بكسل بأمان. |
| **GA4 Measurement ID** | Text Input | `G-XXXXXXXXXX` | Valid GA4 Format | يرسل أحداث التجارة الإلكترونية المعيارية (عرض المنتج، الشراء، القيمة). |
| **Automated Sitemap** | Dynamic System Route | `/sitemap.xml` | Generated Automatically | فهرسة حية لجميع المنتجات والتصنيفات والصفحات مع تحديثات لحظية. |
| **Robots.txt Engine** | System Configuration | Standard Preset | Valid Robots Directives | يمنع عناكب البحث من الزحف لصفحات الدفع والسلة لحماية الخصوصية وميزانية الزحف. |

---

## 🛠️ Step-by-Step Integration Guide / خطوات الربط خطوة بخطوة

### الخطوة 1: الدخول إلى إعدادات مشرفي المواقع
1. من لوحة التحكم، ادخل إلى **الإعدادات (Settings)**.
2. انقر على بطاقة **أدوات مشرفي المواقع والفهرسة (Search Console & Indexing)**.

### الخطوة 2: ربط حساب جوجل بضغطة واحدة
1. تأكد من أن بريدك الرسمي ونطاقك الخاص مسجلان في النظام.
2. اضغط على زر **ربط حساب جوجل (Connect Google account)**.
3. اختر حساب Google الخاص بمتجرك ووافق على منح صلاحيات الفهرسة.
4. سيتم إثبات ملكية المتجر تلقائياً وإرسال خريطة الموقع `sitemap.xml` إلى Google دون أي خطوات يدوية معقدة.

### الخطوة 3: إدخال معرّف Google Analytics 4 (GA4)
1. افتح حسابك في منصة Google Analytics.
2. انسخ معرّف القياس الذي يبدأ بـ `G-` (Measurement ID).
3. الصقه في خانة **تحليلات جوجل (GA4)** واضغط حفظ؛ يبدأ تتبع الزوار ومصادر الحركة فوراً.

### الخطوة 4: إدخال معرّف Google Tag Manager (GTM)
1. إذا كنت تستخدم حاوية علامات متقدمة، انسخ كود الحاوية `GTM-XXXXXXX`.
2. الصقه في خانة **مدير العلامات (Tag Manager)** واضغط حفظ.

---

## 💡 Pro-Tips / نصائح احترافية لتصدر نتائج البحث

> [!TIP]
> **العزل الأمني لمعرفات التتبع (Strict Tenant Isolation):**
> تطبق منصة سوق عزلاً برمجياً صارماً، بحيث لا يمكن تسريب معرّف GTM أو GA4 بين متجر وآخر داخل النظام، مما يضمن دقة تحليلاتك الإعلانية 100%.

---

## ❓ FAQ / الأسئلة الشائعة

#### س1: كم يستغرق ظهور منتجاتي في نتائج بحث Google بعد إتمام الربط؟
**الجواب:** بفضل الإرسال اللحظي لخريطة الموقع عبر الـ API، تبدأ عناكب Google بالزحف خلال 24 إلى 48 ساعة، وتبدأ الكلمات المفتاحية بالظهور في تقرير النقرات خلال بضعة أيام.

#### Q2: Do I need to insert verification HTML tags into my theme code?
**Answer:** No. Souq Platform handles meta verification and automated DNS record checks in the background, eliminating the need to edit header templates or theme code files.
