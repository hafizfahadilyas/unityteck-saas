---
title: "Inventory Thresholds & Low Stock Alerts Guide | دليل عتبات التنبيهات ومخزون المنتجات"
slug: "/guides/settings/inventory-thresholds-stock-alerts"
category: "Merchant Settings"
languages: ["ar", "en"]
author: "Souq E-Commerce Platform Documentation Team"
last_updated: "2026-11-26"
seo:
  meta_title_en: "Configure Low Stock Alerts & Inventory Thresholds | Souq Platform"
  meta_title_ar: "دليل ضبط عتبات تنبيهات نفاد المخزون وحدود الأمان | منصة سوق"
  meta_description_en: "Master inventory threshold settings in Souq Platform: set low-stock trigger levels, configure urgency badges for storefront shoppers, and automate reorder alerts."
  meta_description_ar: "تعلم كيفية ضبط عتبات تنبيهات نفاد المخزون، تفعيل شارات الاستعجال للمشترين (تبقت قطع معدودة)، وتنبيهات إعادة الطلب التلقائية في منصة سوق."
  focus_keywords_en: ["low stock alert ecommerce", "inventory threshold settings", "stock safety buffer", "out of stock storefront behavior", "warehouse reorder trigger"]
  focus_keywords_ar: ["تنبيه نفاد المخزون للمتجر", "عتبة تنبيه كمية المنتج", "إدارة المخزون الحرج", "شارة كمية محدودة في المتجر", "إعادة طلب البضاعة للمستودع"]
---

# ⚖️ Inventory Thresholds & Low Stock Alerts Guide
# دليل عتبات تنبيهات المخزون وحدود الأمان التشغيلية

---

## 📌 Introduction & Overview / مقدمة ونظرة عامة

### English
Stockouts lead directly to lost sales, while overselling damages customer trust. The **Alert Thresholds & Integrations** panel in **Souq Platform** gives merchants precise operational control over inventory triggers. Store managers can define global safety margins, configure real-time low-stock alerts across dashboard and communication channels, and dynamically display high-urgency stock badges (e.g., "Only 3 items left!") on product pages to drive faster conversions.

### العربية
يؤدي نفاد المخزون المفاجئ إلى ضياع فرص بيعية ثمينة، بينما يتسبب البيع بالزيادة في إحباط العملاء. تمنحك شاشة **عتبات التنبيهات والربط (Alert Thresholds)** في **منصة سوق** تحكماً تشغيلياً استباقياً في حركة المنتجات والمستودعات. يمكنك ضبط حدود الأمان للمخزون، وتفعيل التنبيهات الفورية عند اقتراب الكمية من النفاد، إلى جانب إظهار شارات التحفيز الشرائي في صفحة المنتج (مثل: "متبقي 3 قطع فقط!") لرفع معدل الشراء الفوري.

---

## 🖥️ Screen Layout & Visual Wireframe / المخطط البصري لشاشة عتبات التنبيهات

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Store Settings > ⚖️ Alert Thresholds (عتبات التنبيهات والربط التشغيلي)                  │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  ← Back to All Settings (العودة لكل الإعدادات)                    [ 💾 Save Thresholds / حفظ ]│
│                                                                                              │
│  ┌────────────────────────────────────────────────────────┐ ┌──────────────────────────────┐  │
│  │ 📦 Stock Depletion Triggers (مستويات التنبيه الحرج)    │ │ 🛒 Storefront Behavior       │  │
│  ├────────────────────────────────────────────────────────┤ ├──────────────────────────────┤  │
│  │ Low Stock Alert Threshold (الحد الأدنى للتنبيه):       │ │ Out-of-Stock Products:       │  │
│  │ [ 5 Units / قطع                                      ] │ │ (●) Mark as "Sold Out"       │  │
│  │ * Triggers warning badge when quantity drops to 5      │ │     (وضع علامة نفدت الكمية)  │  │
│  │                                                        │ │ ( ) Hide Completely from Shop│  │
│  │ Critical Stock Threshold (الحد الحرج للإيقاف):         │ │     (إخفاء المنتج تماماً)    │  │
│  │ [ 1 Unit / قطعة واحدة                                ] │ │ ( ) Allow Backorders         │  │
│  │                                                        │ │     (السماح بالطلب المسبق)   │  │
│  │ Safety Margin Buffer (مخزون الأمان الإضافي):           │ │                              │  │
│  │ [ 2 Units / قطعتان احتياط                              │ │ Urgency Counter Badge:       │  │
│  │                                                        │ │ [✓] Show "Only X left!"      │  │
│  │ Sound & Visual Alerts:                                 │ │     (إظهار عداد القطع الباقية│  │
│  │ [✓] Audio chime on new order  [✓] Red Dashboard Badge  │ │      لتحفيز الزبون على الشراء)│  │
│  └────────────────────────────────────────────────────────┘ └──────────────────────────────┘  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚡ Automatic Reset: [ 🔄 Reset to Platform Default Thresholds (استعادة الإعدادات) ]       │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Comprehensive Elements Breakdown / تفصيل العناصر والخيارات

| Element / العنصر | Type / النوع | Default / الافتراضي | Options / الخيارات | Purpose & Impact / الوظيفة والأثر |
|-----------------|--------------|---------------------|--------------------|----------------------------------|
| **Low Stock Threshold** | Numeric Input | `5` Units | 1 to 50 Units | يطلق شارة التنبيه الصفراء في جدول المنتجات ويرسل إشعاراً لفريق المبيعات. |
| **Critical Threshold** | Numeric Input | `1` Unit | 0 to 5 Units | المستوى الحرج الذي يتطلب تدخلاً فورياً لإعادة التوريد قبل الإغلاق التلقائي. |
| **Safety Margin Buffer** | Numeric Input | `0` Units | 0 to 10 Units | كمية احتياطية محجوزة لا تظهر للعملاء لحساب المنتجات التالفة أو طلبات الفروع. |
| **Out-of-Stock Behavior** | Radio Selection | `Sold Out Badge` | Sold Out, Hide, Allow Backorder | يحدد الإجراء المتبع عند وصول الكمية إلى صفر في الواجهة الأمامية للمتجر. |
| **Urgency Badge Switch** | Checkbox Switch | `true` (Enabled) | Boolean | يظهر نصاً تسويقياً أحمر في بطاقة المنتج: "سارع بالشراء! تبقت 3 قطع فقط". |
| **Reset Defaults Button** | Action Button | Trigger | Confirmation Toast | يعيد ضبط العتبات إلى توصيات منصة سوق القياسية للتجارة الإلكترونية. |

---

## 🛠️ Step-by-Step Configuration Guide / خطوات الضبط العملية

### الخطوة 1: الدخول إلى شاشة عتبات التنبيهات
1. من لوحة التاجر، اختر **الإعدادات (Settings)**.
2. انقر على بطاقة **عتبات التنبيهات والربط (Thresholds)**.

### الخطوة 2: تحديد كمية التنبيه لمخزون المنتجات
1. في حقل **الحد الأدنى للتنبيه (Low Stock Threshold)**، أدخل الرقم المناسب لسرعة توريد بضاعتك (مثلاً: `5` قطع).
2. في حقل **مخزون الأمان (Safety Buffer)**، ضع قطعتين إذا كنت تبيع عبر منافذ متعددة أو فروع فعلية لتجنب التعارض.

### الخطوة 3: تحديد سلوك عرض المنتجات المنتهية
1. اختر **عرض شارة نفدت الكمية (Mark as Sold Out)** إذا كنت ترغب في إبقاء صفحة المنتج مفهرسة في Google مع إتاحة زر "أعلمني عند التوفر".
2. اختر **إخفاء المنتج تماماً (Hide Completely)** للمنتجات الموسمية المؤقتة التي لن تتوفر مجدداً.

### الخطوة 4: تفعيل شارة الحث على الشراء
1. تأكد من تفعيل خيار **Show Only X Left** لإشعال روح الشراء السريع لدى الزوار.
2. اضغط على زر **حفظ الإعدادات (Save Thresholds)**.

---

## 💡 Pro-Tips / نصائح تشغيلية للمخزون

> [!TIP]
> **قوة شارة الكمية المتبقية (FOMO):**
> إظهار عبارة "متبقي قطعتان فقط" يزيد من سرعة إتمام عمليات الشراء بنسبة تتجاوز 35% بالمقارنة مع الصفحات التي لا تعرض تنبيهات المخزون المتبقي.

---

## ❓ FAQ / الأسئلة الشائعة

#### س1: هل يمكن تحديد عتبة مخزون مختلفة لكل منتج على حدة؟
**الجواب:** نعم، القيمة المحددة هنا هي العتبة العامة للمتجر، ولكن يمكنك الدخول لأي منتج محدد في صفحة المنتجات وتخصيص عتبة تنبيه خاصة به (Override).

#### Q2: What happens if a customer attempts to buy more than the available stock?
**Answer:** The checkout engine prevents placing orders exceeding real inventory balances, showing a friendly prompt: "Maximum available quantity for this product is X items."
