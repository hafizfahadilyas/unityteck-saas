---
title: "Store Appearance, Color Palettes & Arabic Typography Guide | دليل مظهر المتجر، الألوان والخطوط العربية"
slug: "/guides/settings/store-appearance-colors-fonts"
category: "Merchant Settings"
languages: ["ar", "en"]
author: "Souq E-Commerce Platform Documentation Team"
last_updated: "2026-11-26"
seo:
  meta_title_en: "Customize Store Appearance, 15 Palettes & Arabic Fonts | Souq Platform"
  meta_title_ar: "تخصيص مظهر المتجر، 15 لوحة ألوان وأرقى الخطوط العربية | منصة سوق"
  meta_description_en: "Complete guide to customizing your store visual identity: choose from 15 curated color palettes, glassmorphic wallpapers, blur/opacity sliders, and 15 Google Arabic fonts."
  meta_description_ar: "دليل شامل لتخصيص الهوية المرئية لمتجرك: اختيار لوحات الألوان الـ 15، الخلفيات الزجاجية، التحكم بالضبابية والشفافية، وضبط 15 خطاً عربياً احترافياً."
  focus_keywords_en: ["store theme appearance", "arabic fonts ecommerce", "glassmorphic dashboard wallpaper", "custom color palette souq", "store chrome customizer"]
  focus_keywords_ar: ["تخصيص مظهر المتجر", "خطوط عربية للمتاجر", "خلفية لوحة التحكم الزجاجية", "لوحات ألوان المتجر", "تخصيص ثيم سوق"]
---

# 🎨 Store Appearance, Color Palettes & Arabic Typography Guide
# دليل تخصيص مظهر المتجر، لوحات الألوان والخطوط العربية

---

## 📌 Introduction & Overview / مقدمة ونظرة عامة

### English
Visual branding sets top-tier e-commerce experiences apart. In the **Souq Platform**, the **Appearance Settings** (Store Chrome) engine delivers an advanced visual customization layer. Merchants can select from 15 curated luxury color palettes, configure glassmorphic wallpapers with live blur and opacity sliders, choose between 15 premium Google Arabic fonts with exact typographic weights, or inject custom CSS WebFonts for bespoke corporate identity.

### العربية
الهوية البصرية المتقنة هي الفارق الحقيقي بين المتاجر العادية والمتاجر الاحترافية الكبرى. توفر لك شاشة **مظهر المتجر والألوان والخطوط (Appearance & Store Chrome)** في **منصة سوق** تجربة تصميم متقدمة تتيح لك الاختيار من بين 15 لوحة ألوان منسقة بعناية، وتعيين خلفيات زجاجية (Glassmorphic) مع التحكم الكامل بدرجة الضبابية والعتامة، واختيار أرقى الخطوط العربية المعتمدة من Google Fonts مع أوزانها الطباعية الدقيقة، بالإضافة إلى إمكانية رفع خطوط مخصصة لعلامتك التجارية.

---

## 🖥️ Screen Layout & Visual Wireframe / المخطط البصري لشاشة المظهر والألوان

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Store Settings > 🎨 Appearance & Chrome (تخصيص الهوية والألوان والخطوط)                  │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  ← Back to All Settings (العودة لكل الإعدادات)                    [ 💾 Save Appearance / حفظ ] │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🎨 Curated Brand Color Palettes (لوحات الألوان المعتمدة - 15 لوحة جاهزة)                │  │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤  │
│  │ [ 🟩 Emerald Royal ]  [ ☕ Specialty Coffee ]  [ 💎 Sapphire Blue ]  [ 🌸 Rose Elegance ] │  │
│  │ [ 🟨 Imperial Gold ]  [ 🟪 Luxury Velvet  ]  [ ⬛ Minimal Dark  ]  [ 🩵 Teal Modern   ] │  │
│  │                                                                                        │  │
│  │ Custom Brand Tint (اللون المخصص): [ #1D8B94  ■ ]   Accent Ring: [ #4FB8B4 ■ ]           │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────┐ ┌──────────────────────────────┐  │
│  │ 🪟 Shell Wallpaper & Glassmorphism (الخلفية الزجاجية)  │ │ 🔤 Arabic Typography (الخطوط)│  │
│  ├────────────────────────────────────────────────────────┤ ├──────────────────────────────┤  │
│  │ Wallpaper: [ Default Platform Shell / Custom Upload  ] │ │ Primary Arabic Font (الخط)   │  │
│  │ [ 📤 Upload Image ]  [ 🔄 Reset to Platform Default  ] │ │ [ Tajawal (تجوال)        ▼] │  │
│  │                                                        │ │   • Tajawal (تجوال)          │  │
│  │ Background Blur (درجة الضبابية): [ 10px ━━━━●━━━━━━ ]  │ │   • Cairo (القاهرة)          │  │
│  │ Background Opacity (الشفافية):   [ 92%   ━━━━━━━●━━ ]  │ │   • Almarai (المراعي)        │  │
│  │                                                        │ │   • IBM Plex Arabic          │  │
│  │ Sidebar Style (مظهر الشريط الجانبي):                   │ │                              │  │
│  │ (●) Dark Glass   ( ) Pure White   ( ) Accent Flat      │ │ Font Weight (وزن الخط):      │  │
│  │                                                        │ │ [ 700 Bold (عريض)         ▼] │  │
│  │ Text Contrast Mode: [ Auto (from wallpaper luma)     ▼]│ │   • 400 Regular · 600 Semi   │  │
│  └────────────────────────────────────────────────────────┘ └──────────────────────────────┘  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ℹ️ Status: Live Real-Time Preview Active · Click "Save Appearance" to sync MySQL DB     │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Comprehensive Element Breakdown / تفصيل العناصر والخيارات

| Element / العنصر | Type / النوع | Default / الافتراضي | Options / الخيارات المتاحة | Technical Function & Live Behavior / الأثر الفني |
|-----------------|--------------|---------------------|---------------------------|------------------------------------------------|
| **Curated Palettes** | 15 Interactive Color Tiles | Platform Teal | 15 Curated Themes (Coffee, Flowers, Luxury, Tech, etc.) | يعيد ضبط المتغيرات اللونية الأساسية (`--accent`, `--active-bg`, `--ring`) في واجهة التاجر والمتجر. |
| **Custom Hex Color** | Hex Color Picker | `#1D8B94` | Valid 6-digit Hex (`#RRGGBB`) | يسمح بإدخال كود لون علامتك التجارية الخاص بدقة تامة. |
| **Shell Wallpaper** | Image Upload / CDN URL | Cloudflare Shell | Image URL or Upload (Max 5MB) | يعين خلفية زجاجية غامرة للوحة التحكم وأشرطة المتجر. |
| **Wallpaper Blur Slider** | Numeric Range Slider | `10px` | `0px` (Sharp) to `30px` (Heavy Frosted Glass) | يتحكم في مرشح التغبيش الزجاجي (`backdrop-filter: blur(Xpx)`). |
| **Wallpaper Opacity** | Numeric Range Slider | `92%` (0.92) | `50%` to `100%` (Solid) | يضبط شفافية بطاقات البيانات فوق الخلفية لمنع تشتت القراءة. |
| **Sidebar Design** | Radio Option Cards | `Dark Glass` | Dark Glass, Pure White, Contrast Accent | يغير مظهر وتدرج الشريط الجانبي الأيمن. |
| **Arabic Font (FontAr)** | Dropdown Selector | `Tajawal` | 15 Google Arabic Fonts (Tajawal, Cairo, Almarai, etc.) | يطبق عائلة الخطوط على نصوص المتجر باللغة العربية. |
| **Font Weight** | Dropdown Selector | `700 Bold` | 400 (Regular), 600 (Semi-Bold), 700 (Bold), 900 (Black) | يضبط سماكة العناوين الرئيسية وأزرار الشراء. |
| **Save Appearance** | Action Button | Trigger Function | Active when changes are pending (`chromeDirty`) | يحفظ الإعدادات في جدول `store_chrome` بقاعدة بيانات MySQL السحابية. |

---

## 🛠️ Step-by-Step Configuration / خطوات الضبط بالتفصيل

### الخطوة 1: فتح تبويب المظهر والألوان
1. توجه إلى **الإعدادات (Settings)** من الشريط الجانبي.
2. اختر **الألوان والخطوط (Appearance & Chrome)**.

### الخطوة 2: اختيار لوحة الألوان أو إدخال لون مخصص
1. انقر على أيقونة اللوحة اللونية المناسبة لنشاطك التجاري.
2. إذا كان لديك لون معتمد، أدخل كود الـ Hex في مربع **Custom Brand Tint** (مثال: `#7C3AED`).
3. ستلاحظ تغير ألوان الأزرار والحدود فوراً في شاشة المعاينة الحية.

### الخطوة 3: تخصيص الخلفية الزجاجية والشفافية
1. ارفع صورة خلفية فخمة لمتجرك أو احتفظ بالخلفية السحابية الافتراضية.
2. حرك مؤشر **درجة الضبابية (Blur)** بين 8px إلى 14px للحصول على تأثير زجاجي ناعم (Frosted Glass).
3. حرك مؤشر **الشفافية (Opacity)** عند 90% إلى 95% لضمان وضوح قراءة النصوص والأرقام.

### الخطوة 4: اختيار الخط العربي المناسب
1. اختر الخط العربي الذي يمثل هوية متجرك من القائمة (مثال: خط **المراعي Almarai** للمتاجر الحديثة، أو خط **القاهرة Cairo** للمتاجر الكلاسيكية).
2. حدد وزن الخط الافتراضي للعناوين (يُفضل **700 Bold** لتعزيز وضوح المنتجات).

### الخطوة 5: حفظ التغييرات
1. راقب شريط التنبيه السفلي؛ إذا ظهر تنبيه `(غير محفوظ - Unsaved)`، اضغط على زر **حفظ المظهر (Save Appearance)**.
2. يتم تشفير وتخزين الإعدادات لجميع زوار المتجر فورياً.

---

## 💡 Pro-Tips / نصائح احترافية في التصميم

> [!TIP]
> **التدرج اللوني وراحة العين:**
> تجنب تعيين شفافية أقل من 80% مع خلفيات صور مليئة بالتفاصيل، حتى لا تصعب قراءة أسعار المنتجات وتفاصيل الفواتير على شاشات الجوال.

---

## ❓ FAQ / الأسئلة الشائعة

#### س1: هل يؤثر تغيير الخط في لوحة التحكم على سرعة تحميل المتجر؟
**الجواب:** الخطوط الـ 15 المعتمدة مخدومة مباشرة عبر شبكة Google Fonts العالمية ومخزنة مؤقتاً في كاش المتصفح، لذا يتم تحميلها بسرعة فائقة دون أي تأثير على سرعة المتجر أو تقييمات Google PageSpeed.

#### Q2: Can I reset my store appearance back to the factory defaults?
**Answer:** Yes, clicking the **Reset to Platform Defaults** button instantly restores the original brand palette, standard wallpaper, and system typography without touching any product or sales data.
