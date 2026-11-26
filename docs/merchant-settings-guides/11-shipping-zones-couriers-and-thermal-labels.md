---
title: "Shipping Logistics, Couriers & 4×6 Thermal Labels Guide | دليل الشحن والناقلين وبوالص الشحن الحرارية"
slug: "/guides/settings/shipping-logistics-carriers-labels"
category: "Merchant Settings"
languages: ["ar", "en"]
author: "Souq E-Commerce Platform Documentation Team"
last_updated: "2026-11-26"
seo:
  meta_title_en: "Setup Saudi Shipping Zones, Couriers & 4x6 Thermal Labels | Souq Platform"
  meta_title_ar: "دليل ضبط مناطق الشحن السعودية، الناقلين واستوديو بوالص 4×6 | منصة سوق"
  meta_description_en: "Learn how to configure Saudi shipping zones, integrate carriers (SMSA, Aramex, SPL, RedBox), print 4x6 thermal shipping labels, and manage local delivery drivers."
  meta_description_ar: "تعلم كيفية ضبط مناطق الشحن السعودية، ربط شركات الشحن (سمسا، أرامكس، سبل، ردبوكس)، طباعة بوالص الشحن الحرارية 4×6، وإدارة مناديب التوصيل."
  focus_keywords_en: ["saudi shipping zones ecommerce", "smsa aramex spl integration", "4x6 thermal shipping label studio", "free shipping over threshold saudi", "local delivery driver management"]
  focus_keywords_ar: ["مناطق وأسعار الشحن في السعودية", "ربط سمسا وأرامكس وسبل بالمتجر", "طباعة بوالص الشحن الحرارية 4x6", "الشحن المجاني فوق مبلغ محدد", "إدارة مناديب التوصيل للمتجر"]
---

# 🚚 Shipping Logistics, Couriers & 4×6 Thermal Labels Guide
# دليل الخدمات اللوجستية، شركات الشحن المعتمدة واستوديو بوالص الشحن الحرارية 4×6

---

## 📌 Introduction & Overview / مقدمة ونظرة عامة

### English
Rapid, cost-effective delivery is the backbone of customer satisfaction. The **Shipping & Logistics Engine** in **Souq Platform** provides Saudi merchants with enterprise-grade fulfillment capabilities: multi-zone shipping rates across all 13 Saudi provinces, seamless courier integrations (**SMSA Express**, **Aramex**, **Saudi Post / SPL**, **RedBox** smart lockers), an in-app **4×6 Thermal Shipping Label Studio** engineered for high-speed Zebra and Xprinter thermal label printers, automated reverse logistics (RMA), and dedicated in-house delivery fleet routing.

### العربية
تعد سرعة التوصيل ووضوح تكاليف الشحن من أهم العوامل التي تجعل العميل يكرر الشراء من متجرك. يوفر لك نظام **الشحن والخدمات اللوجستية (Store Shipping)** في **منصة سوق** بنية تحتية متكاملة مصممة خصيصاً للسوق السعودي: تحديد مناطق وأسعار الشحن لكافة مناطق ومدن المملكة، والربط المباشر مع كبرى شركات الشحن المعتمدة (**سمسا إكسبريس**، **أرامكس**، **البريد السعودي سبل SPL**، وخزائن **RedBox** الذكية)، مع **استوديو بوالص الشحن الحرارية 4×6** المتوافق مع طابعات زيبرا وإكس برينتر، وإدارة المرتجعات، وتوجيه مناديب التوصيل المحليين.

---

## 🖥️ Screen Layout & Visual Wireframe / المخطط البصري لشاشة الشحن واللوجستيات

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Store Shipping > 🚚 Logistics & Courier Hub (إدارة الشحن والتوصيل)                       │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  [ 📦 الشحنات والتتبع ] [ 🏷️ استوديو بوالص 4×6 ] [ 🗺️ مناطق وأسعار الشحن ] [ 🤝 الناقلون ] │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  ┌────────────────────────────────────────────────────────┐ ┌──────────────────────────────┐  │
│  │ 🗺️ Saudi Shipping Zones & Rates (مناطق الشحن والأسعار) │ │ 🚚 Courier Partners (الشركات)│  │
│  ├────────────────────────────────────────────────────────┤ ├──────────────────────────────┤  │
│  │ Zone 1: منطقة الرياض (Riyadh & Suburbs)                │ │ [🟧 SMSA Express / سمسا   ]  │  │
│  │ Rate: 23.00 ر.س · Delivery: 24-48 Hours                │ │ Status: [ ● Connected ]      │  │
│  │                                                        │ │                              │  │
│  │ Zone 2: منطقة مكة المكرمة وجدة (Makkah & Jeddah)       │ │ [🔴 Aramex / أرامكس       ]  │  │
│  │ Rate: 26.00 ر.س · Delivery: 1-3 Business Days          │ │ Status: [ ● Connected ]      │  │
│  │                                                        │ │                              │  │
│  │ Zone 3: المنطقة الشرقية وباقي المناطق                  │ │ [🔵 Saudi Post / سبل SPL  ]  │  │
│  │ Rate: 28.00 ر.س · Free above: 250.00 ر.س               │ │ Status: [ ● Connected ]      │  │
│  │                                                        │ │                              │  │
│  │ [ ➕ Add Custom Zone / إضافة منطقة شحن جديدة ]         │ │ [📦 RedBox Lockers / ردبوكس] │  │
│  │ [ 🎁 Enable Free Shipping Rule (شحن مجاني للطلبات الكبيرة)│ Status: [ ● Connected ]      │  │
│  └────────────────────────────────────────────────────────┘ └──────────────────────────────┘  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏷️ 4×6 Thermal Shipping Label Studio (استوديو معاينة وطباعة بوالص الشحن الحرارية)      │  │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤  │
│  │ Size: Standard 4×6 Inches (100×150mm) · High-Contrast Vector Barcodes (Code 128 / QR)  │  │
│  │ [ 🖨️ Direct Thermal Print (طباعة حرارية) ]  [ 📥 Download Bulk PDF (تحميل البوالص) ]    │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Comprehensive Logistics Breakdown / تفصيل المناطق والناقلين

| Feature / العنصر | Type / النوع | Supported Couriers / الخيارات | Capabilities & Specifications / المواصفات |
|-----------------|--------------|-------------------------------|------------------------------------------|
| **Saudi Shipping Zones** | Geographic Regions | All 13 Saudi Provinces | تسعير مخصص لكل منطقة (الرياض، مكة، المدينة، الشرقية، عسير، تبوك، إلخ). |
| **Free Shipping Rule** | Basket Value Trigger | e.g. Free on orders ≥ 250 SAR | حافز تسويقي قوي يرفع قيمة السلة من خلال منح شحن مجاني عند حد معين. |
| **Courier Integrations** | API Integration | SMSA, Aramex, SPL, RedBox, DHL | توليد رقم التتبع (AWB) تلقائياً بمجرد نقر زر "تجهيز الشحنة". |
| **4×6 Label Studio** | Thermal Print Engine | Zebra, Xprinter, Honeywell | تنسيق قياسي بحجم 4×6 بوصة (100×150 مم) مع باركود واضح عالي التباين. |
| **Delivery Drivers** | Fleet Management | Local Couriers / Store Vans | تخصيص الطلبات لمناديب المتجر مع ربط خرائط وتحديد أحياء التوصيل. |
| **Returns / RMA Hub** | Reverse Logistics | Customer Return Portal | إدارة طلبات الاسترجاع، فحص حالة البضاعة المرتجعة، وإصدار بوليصة عكسية. |

---

## 🛠️ Step-by-Step Logistics Configuration / خطوات ضبط الشحن والطباعة

### الخطوة 1: الدخول إلى إدارة الشحن والتوصيل
1. من الشريط الجانبي للوحة التاجر، اضغط على **الشحن (Shipping)**.
2. يمكنك التبديل بين التبويبات العلوية: الشحنات، البوالص، المناطق والأسعار، والناقلين.

### الخطوة 2: تحديد مناطق وأسعار الشحن
1. في تبويب **مناطق وأسعار الشحن (Zones & Rates)**، اضغط على **إضافة منطقة جديدة**.
2. اختر اسم المنطقة (مثلاً: `منطقة الرياض`)، وحدد المدن التابعة لها.
3. حدد سعر الشحن الثابت (مثلاً: `23 ر.س`).
4. فعّل شرط **الشحن المجاني (Free Shipping)** وضع الحد الأدنى لقيمة السلة (مثلاً: `250 ر.س`).

### الخطوة 3: ربط حسابات شركات الشحن (Couriers)
1. في تبويب **شركات الشحن (Carriers)**، اضغط على شركة الشحن المعتمدة لديك (مثل: **SMSA Express** أو **Aramex**).
2. أدخل مفتاح الربط (`API Passkey` / `Account Number`) المستلم من شركة الشحن.
3. فعّل الخدمة؛ سيقوم النظام بطلب الاستلام (Pickup Request) وإصدار البوالص تلقائياً فور تجهيز أي طلب.

### الخطوة 4: طباعة بوليصة الشحن الحرارية 4×6
1. عند تجهيز الطلب، اضغط على زر **طباعة بوليصة الشحن (Print Shipping Label)**.
2. ستفتح نافذة استوديو البوالص الحرارية متوافقة تماماً مع مقاس `4×6 بوصة`.
3. اضغط على أيقونة الطابعة لطباعة الملصق فوراً ولصقه على صندوق الطلب دون الحاجة لقص الورق.

---

## 💡 Pro-Tips / نصائح احترافية للعمليات اللوجستية

> [!TIP]
> **طابعات البوالص الحرارية (Direct Thermal):**
> استخدام طابعات البوالص الحرارية مقاس 4×6 يلغي الحاجة إلى أحبار الطباعة ويمنع تلف الباركود عند تعرض الشحنة للحرارة أو الرطوبة أثناء النقل.

---

## ❓ FAQ / الأسئلة الشائعة

#### س1: هل يمكنني تشغيل مناديب توصيل خاصين بمتجري بالتوازي مع شركات الشحن الكبرى؟
**الجواب:** نعم، تتيح لك المنصة تخصيص طلبات نفس المدينة لمناديبك المحليين لتسليمها في نفس اليوم، مع تحويل طلبات باقي مدن المملكة تلقائياً لشركات الشحن (أرامكس أو سمسا).

#### Q2: How does the customer track their parcel?
**Answer:** Once a shipping label is generated, an automated SMS and WhatsApp update containing the live tracking link is instantly dispatched to the customer's mobile number.
