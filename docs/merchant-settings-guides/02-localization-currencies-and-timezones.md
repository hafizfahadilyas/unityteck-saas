---
title: "Localization, Currencies & Timezone Settings Guide | دليل إعدادات اللغة، العملات والتوقيت"
slug: "/guides/settings/localization-currencies-timezones"
category: "Merchant Settings"
languages: ["ar", "en"]
author: "Souq E-Commerce Platform Documentation Team"
last_updated: "2026-11-26"
seo:
  meta_title_en: "Configure Currency, Timezone & Store Language | Souq Platform Guide"
  meta_title_ar: "دليل ضبط العملة، المنطقة الزمنية ولغة المتجر | منصة سوق"
  meta_description_en: "Master store localization in Souq Platform: set primary currency (SAR, USD, EUR), configure Riyadh Timezone (GMT+3), and switch between Arabic RTL and English LTR."
  meta_description_ar: "دليل شامل لضبط إعدادات التوطين في منصة سوق: تحديد العملة الأساسية (الريال السعودي، الدولار)، توقيت الرياض (GMT+3)، والتبديل الفوري بين العربية والإنجليزية."
  focus_keywords_en: ["store currency settings", "Riyadh timezone ecommerce", "bilingual admin switch", "SAR currency display", "multi-currency saudi ecommerce"]
  focus_keywords_ar: ["إعدادات عملة المتجر", "توقيت الرياض للمتاجر", "تبديل لغة لوحة التحكم", "عرض الريال السعودي", "تعدد العملات للمتاجر السعودية"]
---

# 🌐 Localization, Currencies & Regional Timezone Guide
# دليل إعدادات اللغة، العملات والمنطقة الزمنية

---

## 📌 Introduction & Overview / مقدمة ونظرة عامة

### English
Localizing your e-commerce operations is critical for consumer trust and precise financial reporting. The **Localization Settings** panel in **Souq Platform** empowers merchants to control their active display currency (SAR, USD, EUR, etc.), select regional timezones for accurate order timestamps (defaulting to `Asia/Riyadh` GMT+3), and instantly toggle between complete Arabic (RTL) and English (LTR) administrative environments without page reloads.

### العربية
يعد التوطين الدقيق للعمليات التشغيلية عنصراً جوهرياً لبناء ثقة المستهلك وسلامة التقارير المالية. تتيح لك شاشة **اللغة والعملات (Localization)** في **منصة سوق** تحديد العملة الافتراضية لعرض الأسعار والكتالوج (مثل الريال السعودي، الدولار، اليورو)، وضبط المنطقة الزمنية المعتمدة لتوثيق تواريخ وأوقات الطلبات وفواتير ZATCA (الافتراضي: توقيت الرياض `Asia/Riyadh` GMT+3)، إلى جانب التبديل الفوري بين واجهتي الإدارة العربية (RTL) والإنجليزية (LTR).

---

## 🖥️ Screen Layout & Visual Wireframe / المخطط البصري لشاشة اللغة والعملات

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Store Settings > 🌐 Localization & Regional Settings (اللغة والعملات والتوقيت)           │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  ← Back to All Settings (العودة لكل الإعدادات)                                               │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────┐ ┌──────────────────────────────┐  │
│  │ 🪙 Currency & Pricing Display (العملة وطريقة العرض)    │ │ 🌐 Language & Timezone       │  │
│  ├────────────────────────────────────────────────────────┤ ├──────────────────────────────┤  │
│  │ Active Currency: [ SAR · ر.س ]                         │ │ Interface Language (اللغة)   │  │
│  │                                                        │ │ ┌──────────────┬───────────┐ │  │
│  │ [✓] 🇸🇦 SAR (ر.س) · Saudi Riyal (الريال السعودي)        │ │ │ [✓] العربية  │  English  │ │  │
│  │ [ ] 🇺🇸 USD ($)   · US Dollar (الدولار الأمريكي)        │ │ │ عربي بالكامل │ 100% EN   │ │  │
│  │ [ ] 🇪🇺 EUR (€)   · Euro (اليورو الأوروبي)              │ │ └──────────────┴───────────┘ │  │
│  │ [ ] 🇦🇪 AED (د.إ) · UAE Dirham (الدرهم الإماراتي)       │ │                              │  │
│  │ [ ] 🇰🇼 KWD (د.ك) · Kuwaiti Dinar (الدينار الكويتي)     │ │ Regional Timezone (التوقيت)  │  │
│  │ [ ] 🇧🇭 BHD (د.ب) · Bahraini Dinar (الدينار البحريني)   │ │ [ 🕒 Asia/Riyadh (GMT+3)  ▼] │  │
│  │                                                        │ │   • Asia/Riyadh (KSA)        │  │
│  │ ┌────────────────────────────────────────────────────┐ │ │   • Asia/Dubai (UAE)         │  │
│  │ │ Live Price Preview (معاينة السعر الحي):            │ │ │   • Africa/Cairo (Egypt)     │  │
│  │ │ Standard Display: 1,610.00 ر.س                    │ │ │   • Europe/London (GMT+0)    │  │
│  │ └────────────────────────────────────────────────────┘ │ └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Elements Breakdown / تفصيل العناصر والخيارات

| Element / العنصر | Type / النوع | Default / الافتراضي | Options / الخيارات | Function & Technical Impact / الأثر الفني |
|-----------------|--------------|---------------------|--------------------|------------------------------------------|
| **Active Currency Selector** | Interactive Card Grid | `SAR` (ر.س) | SAR, USD, EUR, AED, KWD, BHD, OMR, QAR, EGP | يحدد رمز العملة وتنسيق المنازل العشرية في المتجر وكتالوج المنتجات وسلة الشراء. |
| **Live Price Preview** | Real-time Visualizer | `1,610.00 ر.س` | Dynamic Based on Currency | يعرض كيف يرى العميل الأسعار بالأرقام العربية والرمز الرسمي فوراً دون الحاجة لتحديث الصفحة. |
| **Interface Language** | Segmented Toggle Buttons | `ar` (العربية) | `ar` (Arabic RTL), `en` (English LTR) | يبدل اتجاه اللوحة بالكامل ومصطلحات التجارة (Commerce Terms) وتنسيق القوائم فورياً. |
| **Store Timezone** | Dropdown Selector | `Asia/Riyadh` | Major World & GCC Timezones | يضبط توقيت تسجيل الطلبات، تقارير المبيعات، ومواعيد انتهاء الكوبونات والعروض الترويجية. |

---

## 🛠️ Step-by-Step Instructions / خطوات الضبط العملية

### الخطوة 1: الدخول إلى تبويب اللغة والعملات
1. من لوحة تحكم المتجر، توجه إلى **الإعدادات (Settings)**.
2. اضغط على بطاقة **اللغة والعملات (Localization)**.

### الخطوة 2: تحديد عملة المتجر الافتراضية
1. ستظهر لك قائمة العملات المدعومة في بطاقات تفاعلية.
2. اضغط على العملة المرغوبة (مثلاً: **SAR · الريال السعودي**).
3. ستلاحظ ظهور علامة الصح الخضراء `[✓]` على البطاقة وتغير معاينة السعر الحي فوراً إلى الرمز المختار.

### الخطوة 3: تبديل لغة لوحة التحكم
1. اختر بين زر **العربية** أو **English**.
2. يقوم النظام بتحديث سياق اللغة (PrefsContext) فوراً وضبط اتجاه الشاشة (`dir="rtl"` أو `dir="ltr"`).

### الخطوة 4: ضبط المنطقة الزمنية (Timezone)
1. من القائمة المنسدلة للمنطقة الزمنية، تأكد من اختيار **Asia/Riyadh (GMT+3)** إذا كان متجرك يعمل في المملكة العربية السعودية.
2. يضمن ذلك توافق تواريخ الفواتير مع توقيت هيئة الزكاة والضريبة والجمارك (ZATCA).

---

## 💡 Pro-Tips / نصائح احترافية للمتاجر السعودية

> [!NOTE]
> **التوافق المالي:**
> تغيير عملة العرض لا يقوم بتحويل أسعار المنتجات في قاعدة البيانات تلقائياً بسعر الصرف، بل يغير رمز العملة المعتمد في الحسابات والمعاملات الجديدة. تأكد من مراجعة أسعار المنتجات عند الانتقال بين العملات.

---

## ❓ FAQ / الأسئلة الشائعة

#### س1: هل يؤدي تغيير لغة لوحة التحكم إلى تغيير لغة واجهة المتجر للعملاء؟
**الجواب:** لا، تبديل لغة لوحة التحكم يغير الواجهة الإدارية للتاجر فقط. واجهة المتجر تتبع لغة الزائر أو اللغة التي يختارها الزائر من شريط المتجر العلوي.

#### Q2: What happens to existing invoice timestamps if I change the timezone?
**Answer:** Historic database records store timestamps in UTC ISO format. Adjusting the timezone updates how those dates are rendered in dashboard tables and export sheets to match your new local business hours.
