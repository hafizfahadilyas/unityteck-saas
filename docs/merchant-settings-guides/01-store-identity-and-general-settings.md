---
title: "Store Identity & General Settings Guide | دليل إعدادات هوية المتجر والبيانات العامة"
slug: "/guides/settings/store-identity-general"
category: "Merchant Settings"
languages: ["ar", "en"]
author: "Souq E-Commerce Platform Documentation Team"
last_updated: "2026-11-26"
seo:
  meta_title_en: "How to Setup Store Identity, Logo & General Settings | Souq Merchant Guide"
  meta_title_ar: "دليل إعداد هوية المتجر، الشعار والإعدادات العامة | منصة سوق للتجارة الإلكترونية"
  meta_description_en: "Learn how to configure your bilingual store name, upload brand logos and favicons, set support contacts, and purge cache in Souq Multi-Store Platform."
  meta_description_ar: "تعلم كيفية ضبط اسم متجرك باللغتين العربية والإنجليزية، رفع الشعار والأيقونة المفضلة، تعيين بيانات التواصل ومسح الكاش في منصة سوق."
  focus_keywords_en: ["store identity settings", "upload store logo", "bilingual store name", "ecommerce favicon setup", "purge store cache"]
  focus_keywords_ar: ["إعداد هوية المتجر", "رفع لوجو المتجر", "اسم المتجر بالعربي والانجليزي", "أيقونة المتجر فافيكون", "مسح كاش المتجر"]
---

# 🏷️ Store Identity & General Settings Guide  
# دليل إعدادات هوية المتجر والبيانات العامة

---

## 📌 Introduction & Overview / مقدمة ونظرة عامة

### English
Your store identity is the foundation of your e-commerce brand. In the **Souq Platform**, the **General Settings** panel allows you to establish a professional, dual-language identity (Arabic & English), upload high-resolution brand assets (Logo & Favicon), define official customer contact lines, manage domain bindings, and ensure real-time synchronization between the central database and edge CDN nodes.

### العربية
تعتبر هوية المتجر الركيزة الأولى لبناء علامتك التجارية. تتيح لك شاشة **الإعدادات العامة (General Settings)** في **منصة سوق** ضبط الهوية الثنائية لمتجرك (باللغتين العربية والإنجليزية)، ورفع الأصول المرئية عالية الدقة (الشعار والأيقونة المفضلة Favicon)، وتحديد قنوات الاتصال الرسمية، بالإضافة إلى التحكم بالربط التقني ومسح الذاكرة المؤقتة (Cache Purge) لتحديث واجهة المتجر فوراً.

---

## 🖥️ Screen Layout & Visual Wireframe / المخطط البصري لشاشة الإعدادات العامة

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Store Settings (إعدادات المتجر)  [ 🌐 English / العربية ]  [ 💾 Save Changes / حفظ التعديلات ]│
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  ← All Settings (كل الإعدادات)                                                               │
│                                                                                              │
│  ┌──────────────────────────────┐ ┌────────────────────────────────────────────────────────┐  │
│  │ 🖼️ Store Logo & Favicon      │ │ 📝 Store Names & Taglines                              │  │
│  ├──────────────────────────────┤ ├────────────────────────────────────────────────────────┤  │
│  │ [ Store Logo Preview Box ]   │ │ Store Name (Arabic) *        Store Name (English) *    │  │
│  │ [ متجر النخبة للقهوة       ] │ │ [ متجر النخبة للقهوة المختصة ] [ Elite Coffee Boutique ]│  │
│  │ [ 📤 Upload Logo ] [ 🗑️ Del ]│ │                                                        │  │
│  │                              │ │ Tagline (Arabic)             Tagline (English)         │  │
│  │ [ Favicon 32x32 Preview ]    │ │ [ أجود أنواع البن المختص   ] [ Finest Specialty Beans ]│  │
│  │ [ 📤 Upload Favicon ]        │ └────────────────────────────────────────────────────────┘  │
│  └──────────────────────────────┘                                                            │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────┐ ┌──────────────────────────────┐  │
│  │ 📞 Contact Information (بيانات التواصل والدعم)         │ │ 🔗 Domain & Local Workspace  │  │
│  ├────────────────────────────────────────────────────────┤ ├──────────────────────────────┤  │
│  │ Support Email (البريد الإلكتروني للدعم)                │ │ Primary Subdomain            │  │
│  │ [ support@elite-coffee.sa                           ]  │ │ [ elite-coffee.souq-plus.sa] │  │
│  │                                                        │ │                              │  │
│  │ Official Phone (رقم الهاتف الموحد)                     │ │ Custom Domain (النطاق الخاص) │  │
│  │ [ +966 50 123 4567                                  ]  │ │ [ www.elitecoffee.sa       ] │  │
│  │                                                        │ │                              │  │
│  │ Official WhatsApp (واتساب خدمة العملاء)                │ │ Connected Workspace Path     │  │
│  │ [ +966 50 123 4567                                  ]  │ │ [ D:\souq\elite-store     ]  │  │
│  └────────────────────────────────────────────────────────┘ └──────────────────────────────┘  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚡ Performance & Cache Purge (إدارة الذاكرة المؤقتة وتزامن البيانات)                   │  │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤  │
│  │ [ 🔄 Purge Store Cache (تفريغ كاش المتجر) ]  [ ☁️ Sync Database (مزامنة قاعدة البيانات) ]│  │
│  │ Status: Cloudflare CDN Synced · MySQL Isolated DB Healthy                                │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Comprehensive Element Breakdown / تفصيل عناصر الشاشة وحقول الإدخال

| Element Name / اسم العنصر | Type / النوع | Default / القيمة الافتراضية | Validation & Rules / الشروط والتحقق | Function & Impact / الأثر والوظيفة |
|--------------------------|--------------|-----------------------------|-------------------------------------|-----------------------------------|
| **Store Logo (شعار المتجر)** | Image Upload / CDN URL | Empty / Default Icon | PNG, SVG, WebP (Max 2MB). Ideal: 500×500px or 800×200px transparent | يعرض في ترويسة المتجر، الفواتير الإلكترونية ZATCA، وبوالص الشحن. |
| **Favicon (أيقونة المتجر)** | Image Upload / CDN URL | Default Souq Icon | PNG or ICO (16×16px or 32×32px) | تظهر في لسان المتصفح (Browser Tab) وقائمة المفضلة للمستخدم. |
| **Store Name (Arabic)** | Text Input | Tenant Arabic Name | Required. 2 to 60 characters | الاسم الأساسي للمتجر عند تصفح الواجهة باللغة العربية ومحركات البحث. |
| **Store Name (English)** | Text Input | Tenant English Name | Required. 2 to 60 characters | الاسم باللغة الإنجليزية في واجهة المتجر ورسائل البريد وبطاقات الدفع. |
| **Tagline (Arabic)** | Text Input | Empty | Optional. Max 120 characters | الشعار اللفظي أو الجملة الترويجية التي تظهر أسفل الشعار في الواجهة. |
| **Tagline (English)** | Text Input | Empty | Optional. Max 120 characters | English brand slogan displayed on storefront banners and social cards. |
| **Support Email** | Email Input | Merchant Registration Email | Valid Email Format | يستقبل استفسارات العملاء وإشعارات الطلبات الجديدة وتنبيهات النظام. |
| **Official Phone** | Tel Input | Empty | Saudi format: `+966 5X XXX XXXX` | رقم الدعم الهاتفي المعروض في تذييل المتجر (Footer) وصفحة اتصل بنا. |
| **WhatsApp Number** | Tel Input | Empty | Numeric with Country Code `+9665XXXXXXXX` | يغذي زر الواتساب العائم في المتجر وروابط التواصل المباشر. |
| **Custom Domain** | Text Input (Read/Edit) | `slug.saudi-stores.com` | FQDN format (e.g. `yourstore.com`) | النطاق الأساسي لمتجرك المرتبط بسجلات DNS وشهادة الأمان SSL. |
| **Workspace Path** | Text Input | Local Root Directory | File System Path | مسار تخزين الملفات وتزامن القوالب في بيئة العمل السحابية/المحلية. |
| **Purge Cache Button** | Action Button | Trigger Function | None | يقوم بمسح كاش CDN وإعادة تحميل آخر التعديلات فوراً للعملاء. |

---

## 🛠️ Step-by-Step Configuration Guide / خطوات التنفيذ خطوة بخطوة

### الخطوة 1: الوصول إلى الإعدادات العامة
1. سجّل الدخول إلى لوحة تحكم التاجر (`Merchant Dashboard`).
2. من الشريط الجانبي الأيمن، اضغط على **الإعدادات (Settings)**.
3. ستفتح لك لوحة محاور الإعدادات (Settings Hub)؛ اضغط على بطاقة **عام والهوية (General & Identity)**.

### الخطوة 2: رفع الشعار والأيقونة المفضلة (Logo & Favicon)
1. في بطاقة **شعار المتجر (Store Logo)**، اضغط على زر **رفع ملف (Upload)** أو ضع رابط الصورة المباشر.
2. احرص على أن تكون خلفية الشعار شفافة (Transparent PNG أو SVG) لتبدو متناسقة مع ألوان القالب.
3. في حقل **أيقونة المتجر (Favicon)**، ارفع صورة مربعة بدقة `32×32` أو `64×64` بكسل.
4. يقوم النظام تلقائياً بتطبيق ميزة `bustMediaUrl` لتفادي كاش المتصفح القديم.

### الخطوة 3: تخصيص الأسماء والشعارات اللفظية ثنائية اللغة
1. اكتب اسم متجرك بالعربية في حقل **Store Name (Arabic)** (مثال: `متجر النخبة للقهوة`).
2. اكتب الاسم المكافئ بالإنجليزية في حقل **Store Name (English)** (مثال: `Elite Coffee Boutique`).
3. أدخل وصفاً ترويجياً موجزاً (Tagline) يصف طبيعة منتجاتك لكل لغة.

### الخطوة 4: تحديث بيانات التواصل المعتمدة
1. أدخل بريد الدعم المعتمد لاستلام رسائل العملاء وفواتير المبيعات.
2. أدخل رقم الهاتف والواتساب بصيغة الكود الدولي السعودي `+966`.

### الخطوة 5: حفظ التعديلات وتفريغ الكاش
1. اضغط على زر **حفظ التغييرات (Save Changes)** الموجود في أعلى أو أسفل الصفحة.
2. ستظهر لك رسالة تأكيد خضراء (Toast Notification): `تم حفظ هوية هذا المتجر بنجاح`.
3. اضغط على زر **تفريغ كاش المتجر (Purge Store Cache)** للتأكد من أن جميع الزوار يشاهدون الشعار والاسم الجديد فوراً.

---

## 💡 Pro-Tips & Best Practices / نصائح احترافية

> [!TIP]
> **التوافق مع الفاتورة الإلكترونية (ZATCA):**
> احرص على أن يكون اسم المتجر باللغة العربية مطابقاً تماماً للسجل التجاري أو وثيقة العمل الحر، لأن نظام الفواتير يسحب هذا الاسم لطباعته على الفاتورة الضريبية المبسطة وكود الـ QR.

> [!IMPORTANT]
> **شفافية الشعار (Transparent PNG):**
> تجنب رفع شعارات بخلفيات بيضاء صلبة إذا كان قالب متجرك يعتمد على خلفيات زجاجية (Glassmorphic) أو ألوان داكنة، لضمان مظهر احترافي فائق الجودة.

---

## ❓ Frequently Asked Questions (FAQ) / الأسئلة الشائعة

#### س1: قمت بتغيير الشعار ولكن المتجر ما زال يظهر الشعار القديم، ما الحل؟
**الجواب:** قم بالضغط على زر **تفريغ كاش المتجر (Purge Store Cache)** في صفحة الإعدادات العامة، ثم افتح متجرك في نافذة تصفح خفي (Incognito) أو اضغط `Ctrl + F5` في متصفحك لمسح الكاش المحلي.

#### Q2: Why is it important to fill both Arabic and English store names?
**Answer:** The Souq Platform dynamically serves customers based on their selected storefront language. If an English name is not provided, English-speaking visitors and global search engines will default to the Arabic string, impacting user experience and international SEO rankings.

#### س3: هل يؤثر تغيير اسم المتجر على رابط النطاق أو الروابط المؤرشفة؟
**الجواب:** لا، تغيير اسم العرض (Display Name) لا يغير عنوان الدومين (Domain Slug)، وبالتالي تظل جميع روابط المنتجات وصفحات المتجر المؤرشفة في Google تعمل دون أي خلل أو أخطاء 404.
