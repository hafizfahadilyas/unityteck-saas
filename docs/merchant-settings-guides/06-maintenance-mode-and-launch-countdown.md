---
title: "Maintenance Mode & Grand Launch Countdown Guide | دليل وضع الصيانة وصفحة الافتتاح المرتقب"
slug: "/guides/settings/maintenance-mode-countdown"
category: "Merchant Settings"
languages: ["ar", "en"]
author: "Souq E-Commerce Platform Documentation Team"
last_updated: "2026-11-26"
seo:
  meta_title_en: "Setup Store Maintenance Mode & Coming Soon Countdown | Souq Platform"
  meta_title_ar: "دليل تفعيل وضع الصيانة وصفحة الافتتاح والعداد التنازلي | منصة سوق"
  meta_description_en: "Learn how to activate maintenance mode, customize bilingual coming soon banners, configure launch countdown timers, and capture customer emails in Souq Platform."
  meta_description_ar: "تعلم كيفية تفعيل وضع الصيانة، تخصيص صفحة الافتتاح القريب باللغتين، ضبط العداد التنازلي لتاريخ التدشين، وجمع إيميلات العملاء في منصة سوق."
  focus_keywords_en: ["store maintenance mode", "ecommerce coming soon page", "launch countdown timer", "lead capture under construction", "saudi store maintenance"]
  focus_keywords_ar: ["وضع الصيانة للمتجر", "صفحة المتجر قيد الإنشاء", "عداد تنازلي لافتتاح المتجر", "جمع إيميلات العملاء قبل الإطلاق", "إغلاق المتجر مؤقتا للصيانة"]
---

# 🚧 Maintenance Mode & Grand Launch Countdown Guide
# دليل وضع الصيانة وصفحة الافتتاح المرتقب والعداد التنازلي

---

## 📌 Introduction & Overview / مقدمة ونظرة عامة

### English
When updating seasonal catalogs, executing design overhauls, or preparing for an official brand launch, merchants need full control over storefront visibility without breaking search engine rankings. The **Maintenance & Grand Launch Mode** module in **Souq Platform** provides a turnkey, high-converting "Coming Soon" splash page featuring bilingual headlines, a live target date countdown timer, an email subscription box to collect prospective customer leads, and a direct WhatsApp concierge button.

### العربية
عند تحديث المنتجات، أو تجديد هوية المتجر، أو التحضير لحملة التدشين الكبرى، يحتاج التاجر إلى إخفاء المتجر المباشر عن الزوار دون فقدان ثقة العملاء أو الإضرار بترتيب محركات البحث. توفر لك شاشة **وضع الصيانة والافتتاح القريب (Maintenance Mode)** في **منصة سوق** صفحة افتتاح فاخرة وثنائية اللغة، مزودة بعداد تنازلي دقيق حتى لحظة الإطلاق، ونموذج لجمع إيميلات الزوار المهتمين (Lead Capture)، مع زر للتواصل السريع عبر واتساب.

---

## 🖥️ Screen Layout & Visual Wireframe / المخطط البصري لشاشة وضع الصيانة

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Store Settings > 🚧 Maintenance Mode (وضع الصيانة وصفحة الافتتاح)                        │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  ← Back to All Settings (العودة لكل الإعدادات)                    [ 💾 Save Settings / حفظ ]   │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚡ Master Switch: [ Maintenance Mode / وضع الصيانة ]       [ Toggle: ● ENABLED / مفعل ] │  │
│  │ Status: Storefront locked for visitors · Admin logged-in preview remains fully active  │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────┐ ┌──────────────────────────────┐  │
│  │ 📝 Bilingual Headlines (العناوين والرسائل الترحيبية)   │ │ ⏱️ Launch Date & Toggles     │  │
│  ├────────────────────────────────────────────────────────┤ ├──────────────────────────────┤  │
│  │ Headline (Arabic) *                                    │ │ Target Launch Date & Time:   │  │
│  │ [ نعمل على تحديث وتطوير متجرك                        ] │ │ [ 📅 2026-12-01  🕒 20:00  ] │  │
│  │                                                        │ │                              │  │
│  │ Headline (English) *                                   │ │ Feature Switches (الخيارات): │  │
│  │ [ We are upgrading and enhancing your store          ] │ │ [✓] Show Countdown Timer     │  │
│  │                                                        │ │     (عرض العداد التنازلي)    │  │
│  │ Subtitle & Message (Arabic):                           │ │                              │  │
│  │ ┌────────────────────────────────────────────────────┐ │ │ [✓] WhatsApp Concierge Button │  │
│  │ │ نعمل على تحسين تجربة التسوق وخدمتكم بأعلى معايير   │ │ │     (زر محادثة واتساب)       │  │
│  │ │ الجودة. سنعود إليكم قريباً!                       │ │ │                              │  │
│  │ └────────────────────────────────────────────────────┘ │ │ [✓] Email Subscription Form   │  │
│  │                                                        │ │     (نموذج جمع الإيميلات)    │  │
│  │ Subtitle & Message (English):                          │ │                              │  │
│  │ ┌────────────────────────────────────────────────────┐ │ │ Support WhatsApp Number:     │  │
│  │ │ Upgrading our catalog to bring you the best items. │ │ │ [ +966501234567            ] │  │
│  │ └────────────────────────────────────────────────────┘ │ └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Comprehensive Elements Breakdown / تفصيل العناصر والوظائف

| Element / العنصر | Type / النوع | Default / الافتراضي | Options & Rules / القواعد | Purpose & Impact / الوظيفة والأثر |
|-----------------|--------------|---------------------|---------------------------|----------------------------------|
| **Maintenance Master Toggle** | Switch Button | `false` (Disabled) | On / Off | يحول واجهة المتجر العامة إلى صفحة "قيد الافتتاح" ويقفل سلة الشراء والدفع. |
| **Headline (Arabic)** | Text Input | نصوص المنصة الافتراضية | Max 80 characters | العنوان البارز بالخط العريض أعلى شاشة الانتظار للزوار المتحدثين بالعربية. |
| **Headline (English)** | Text Input | Default Platform Text | Max 80 characters | English headline displayed for international visitors and crawlers. |
| **Subtitle (Arabic & English)**| Textarea | توضيح أسباب التحديث | Max 250 characters | فقرة تشرح للعميل سبب الإغلاق المؤقت وتبني التشويق لافتتاح المتجر. |
| **Target Launch Date** | Datetime Picker | Future ISO Timestamp | YYYY-MM-DDTHH:mm | التاريخ والساعة التي ينتهي عندها العداد التنازلي ويبدأ المتجر بالعمل. |
| **Show Countdown Toggle** | Checkbox Switch | `true` (Enabled) | Boolean | يظهر بطاقات الساعات والأيام والدقائق والثواني بحركة حية أنيقة. |
| **WhatsApp Support Toggle** | Checkbox Switch | `true` (Enabled) | Boolean | يتيح للعملاء إرسال استفسارات فورية للطلبات الخاصة أثناء الإغلاق. |
| **Email Subscribe Toggle** | Checkbox Switch | `true` (Enabled) | Boolean | يضيف خانة "أعلمني عند الافتتاح" لجمع قاعدة بيانات عملاء مستهدفين. |

---

## 🛠️ Step-by-Step Configuration Guide / خطوات الضبط بالتفصيل

### الخطوة 1: الدخول إلى وضع الصيانة
1. من لوحة تحكم التاجر، اختر **الإعدادات (Settings)**.
2. انقر على بطاقة **وضع الصيانة والافتتاح القريب (Maintenance)**.

### الخطوة 2: تفعيل مفتاح الصيانة وتحديد تاريخ الإطلاق
1. اضغط على زر **المفتاح العام (Master Toggle)** لتحويله إلى `مفعل / ENABLED`.
2. في حقل تاريخ الافتتاح (Target Launch Date)، حدد اليوم والساعة المرتقبة لتدشين متجرك.

### الخطوة 3: صياغة الرسائل التسويقية ثنائية اللغة
1. اكتب عنواناً جذاباً مثل: `انتظروا انطلاقة أحدث تشكيلة لعام 2027!`.
2. أضف رسالة مطمئنة لعملائك توضح أن الطلبات السابقة قيد التجهيز والشحن كالمعتاد.

### الخطوة 4: تفعيل قنوات التقاط العملاء (Leads Capture)
1. تأكد من تفعيل خيار **نموذج جمع الإيميلات (Email Subscription Form)** للاستفادة من زيارات الإعلانات الحالية.
2. تأكد من إدخال رقم الواتساب الرسمي في خانة الدعم المؤقت.

### الخطوة 5: الحفظ والفحص
1. اضغط على زر **حفظ الإعدادات (Save Settings)**.
2. افتح متجرك في متصفح خارجي أو نافذة تصفح خفي (Incognito) لمشاهدة صفحة الانتظار الحية.

---

## 💡 Pro-Tips / نصائح احترافية

> [!TIP]
> **معاينة التاجر المباشرة:**
> بصفتك التاجر المسجل دخوله في نفس المتصفح، يمكنك تصفح كامل المتجر والمنتجات بحرية لإجراء التجارب، بينما يرى الزوار العاديون صفحة الصيانة فقط.

---

## ❓ FAQ / الأسئلة الشائعة

#### س1: هل يؤثر وضع الصيانة على عمليات الزحف في Google وفهرسة المنتجات؟
**الجواب:** تُرجع صفحة الصيانة كود استجابة `HTTP 503 Service Unavailable` مع هيدر `Retry-After` لمحركات البحث، وهو المعيار الرسمي الموصى به من Google لإخبار عناكب البحث بالعودة لاحقاً دون إزالة صفحاتك من الفهرس.

#### Q2: Where do customer emails collected during maintenance go?
**Answer:** All submitted emails are automatically stored under your store's **Marketing > Customer Leads & Campaigns** database, ready for export or immediate launch-day broadcast campaigns.
