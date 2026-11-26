# 📖 دليل إعدادات التاجر الشامل | Master Merchant Settings Knowledge Base & SEO Blog Series
**Brand:** منصة سوق / Souq Platform · Unityteck KSA Multi-Store E-Commerce SaaS  
**Audience:** Merchants, E-Commerce Store Owners, Operations Managers, Digital Marketers  
**Languages:** Dual-Language (العربية Arabic & English)  
**Target Region:** Kingdom of Saudi Arabia (KSA) & GCC  

---

## 🌟 Overview & Architecture / نظرة عامة وهيكلية النظام

يقدم هذا الدليل الشامل مرجعاً تفصيلياً وموثقاً لجميع إعدادات لوحة تحكم التاجر (Merchant Dashboard Settings) في منصة **سوق (Souq Platform)**. تم تصميم هذا المرجع ليكون متوافقاً تماماً مع معايير محركات البحث (SEO Optimized)، ومزوداً بمخططات واجهات مرئية (UI Screenshots & Wireframes)، وشروحات خطوة بخطوة لكل عنصر وزر وحقل في النظام باللغتين العربية والإنجليزية.

This master documentation series provides an end-to-end, SEO-optimized merchant handbook covering every page, tab, modal, switch, field, and button inside the **Souq Platform** merchant settings architecture.

---

## 📑 Knowledge Base Directory / فهرس المقالات والأدلة

| # | Article Title / عنوان المقال | Primary Slug | Key Elements Covered / أهم العناصر | Language |
|---|-----------------------------|--------------|-----------------------------------|----------|
| **01** | [Store Identity & General Settings](./01-store-identity-and-general-settings.md) | `/guides/settings/store-identity` | Store Name (AR/EN), Logo, Favicon, Taglines, Contact Info, Cache Purge | AR & EN |
| **02** | [Localization, Currencies & Timezones](./02-localization-currencies-and-timezones.md) | `/guides/settings/localization-currency` | Riyadh Timezone, SAR/Multi-Currency, Dual RTL/LTR Switcher | AR & EN |
| **03** | [Appearance, Colors & Arabic Typography](./03-appearance-colors-fonts-and-chrome.md) | `/guides/settings/theme-appearance-fonts` | 15 Palettes, Glass Wallpaper, Blur/Opacity, 15 Google Arabic Fonts | AR & EN |
| **04** | [Social Channels & WhatsApp Live Hub](./04-social-channels-and-whatsapp-hub.md) | `/guides/settings/social-whatsapp-integration` | WhatsApp Chat Bubble, Welcome Greeting, Instagram, X, TikTok, Facebook | AR & EN |
| **05** | [Subscription Plans & Workspace Quotas](./05-subscription-plans-and-workspace.md) | `/guides/settings/subscription-billing` | Starter, Pro, Premium, Limits, Billing Cycles, Hostinger Invoicing | AR & EN |
| **06** | [Maintenance Mode & Launch Countdown](./06-maintenance-mode-and-launch-countdown.md) | `/guides/settings/maintenance-mode-coming-soon` | Store Lock/Unlock, Bilingual Headings, Countdown Timer, Lead Capture | AR & EN |
| **07** | [Google Search Console, SEO & Analytics](./07-google-search-console-seo-and-tag-manager.md) | `/guides/settings/google-search-console-seo` | Google OAuth, Sitemap Ping, Robots.txt, GA4 & GTM Containers | AR & EN |
| **08** | [Inventory Thresholds & Low Stock Alerts](./08-inventory-thresholds-and-stock-alerts.md) | `/guides/settings/inventory-alert-thresholds` | Low-Stock Warnings, Safety Stock, Out-of-Stock Storefront Rules | AR & EN |
| **09** | [WhatsApp & SMS Saudi Notification Gateway](./09-whatsapp-sms-notifications-and-saudi-gateway.md) | `/guides/settings/sms-whatsapp-saudi-gateway` | +966 Gateways (Taqnyat/Unifonic), Order Dispatch SMS, Tracking Links | AR & EN |
| **10** | [Payment Gateways: Mada, Apple Pay & BNPL](./10-payment-gateways-mada-apple-pay-and-bnpl.md) | `/guides/settings/payments-mada-applepay-tamara` | Mada, Visa/MC, Apple Pay, STC Pay, Tabby, Tamara BNPL, IBAN Transfer | AR & EN |
| **11** | [Shipping Logistics, Couriers & 4×6 Labels](./11-shipping-zones-couriers-and-thermal-labels.md) | `/guides/settings/shipping-logistics-carriers` | Saudi Zones, SMSA, Aramex, SPL, 4×6 Thermal Label Studio, Reverse RMA | AR & EN |
| **12** | [Custom Domains, DNS Records & Free SSL](./12-custom-domain-dns-and-ssl-hosting.md) | `/guides/settings/custom-domain-dns-ssl` | `.sa` / `.com` Setup, CNAME / A Records, Let's Encrypt SSL, DNS Checker | AR & EN |

---

## 🧭 Navigation Hierarchy / خريطة الوصول في لوحة التاجر

```text
Merchant Dashboard (لوحة التاجر)
│
├── ⚙️ Settings (الإعدادات) [/store/settings]
│   ├── 🏷️ General (عام والهوية): الاسم، الشعار، الأيقونة، الدومين، كاش النظام
│   ├── 🌐 Localization (اللغة والعملات): التوقيت (الرياض)، الريال السعودي، اللغات
│   ├── 🎨 Appearance (الألوان والخطوط): 15 لوحة ألوان، خلفية زجاجية، 15 خط عربي
│   ├── 💬 Social (قنوات التواصل والواتساب): واتساب عائم، انستغرام، إكس، تيك توك
│   ├── 💎 Subscription (الباقة والاشتراك): باقة المتجر، الحدود، تجديد الفواتير
│   ├── 🚧 Maintenance (وضع الصيانة): إغلاق المتجر، عداد الإطلاق، جمع الإيميلات
│   ├── 🔍 Search Console (أدوات البحث والـ SEO): خريطة الموقع، جوجل أناليتكس، GTM
│   ├── ⚖️ Thresholds (عتبات التنبيهات): تنبيه نفاد المخزون، حدود السلامة
│   └── 📲 Notifications (إشعارات الرسائل والواتساب): بوابات SMS السعودية (+966)
│
├── 💳 Payments (المدفوعات) [/store/settings?view=payments]
│   ├── بوابات الدفع الإلكتروني (مدى، فيزا، أبل باي، STC Pay)
│   ├── خدمات التقسيط (تمارا، تابي)
│   ├── الحسابات البنكية والآيبان (IBAN) ومراجعة إيصالات التحويل
│   └── الدفع عند الاستلام (COD)
│
├── 🚚 Shipping (الشحن والتوصيل) [/store/shipping]
│   ├── تتبع الشحنات المباشرة (Shipments Tracking)
│   ├── استوديو بوالص الشحن الحرارية 4×6 (Shipping Labels Studio)
│   ├── مناطق وأسعار الشحن (Shipping Zones & Rates)
│   ├── شركات الشحن المعتمدة (SMSA, Aramex, SPL, RedBox)
│   └── مناديب التوصيل المحلي (Local Delivery Drivers)
│
└── 🌐 Hosting & Domain (الاستضافة والنطاق) [/store/hosting]
    ├── ربط النطاق المخصص (Custom Domain Setup)
    ├── إعدادات سجلات DNS (CNAME & A Records)
    └── شهادة الأمان المجانية (SSL Certificate)
```

---

## 🔍 SEO Strategy & Metadata Structure / استراتيجية السيو المتبعة في الأدلة

كل مقال في هذه السلسلة مُجهز بالبنية التالية لضمان تصدر محركات البحث:
1. **Title Tag**: صياغة ثنائية اللغة تركز على نية البحث التجارية والتعليمية (Transactional & Informational Search Intent).
2. **Meta Description**: وصف جذاب يحتوي على الكلمات المفتاحية الأساسية وحل المشكلة في أقل من 160 حرف.
3. **Structured Schema**: كود JSON-LD متوافق مع `HowTo` و `FAQPage` للحصول على Rich Snippets في نتائج Google.
4. **Visual UI Screen Layout**: تمثيل رسومي دقيق لكل شاشة وحقل بالرموز والحالات لتسهيل الفهم البصري.
5. **Step-by-Step Procedure**: خطوات متسلسلة ومرقمة للمبتدئين والمحترفين.
6. **Saudi Market Compliance**: التوافق مع متطلبات السوق السعودي (الفوترة الإلكترونية زاتكا، نطاق `.sa`، بوابات مدى وأبل باي، أرقام +966).
