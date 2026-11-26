---
title: "WhatsApp & SMS Saudi Notification Gateway Guide | دليل إشعارات الواتساب والرسائل النصية"
slug: "/guides/settings/whatsapp-sms-saudi-notifications"
category: "Merchant Settings"
languages: ["ar", "en"]
author: "Souq E-Commerce Platform Documentation Team"
last_updated: "2026-11-26"
seo:
  meta_title_en: "Setup WhatsApp & Saudi SMS Gateway Notifications | Souq Platform"
  meta_title_ar: "دليل إعداد إشعارات الواتساب وبوابات الرسائل النصية السعودية | منصة سوق"
  meta_description_en: "Learn how to configure automated customer SMS (+966) and WhatsApp order notifications (Order Placed, Shipped, Delivered) via Unifonic and WhatsApp Cloud API."
  meta_description_ar: "تعلم كيفية تفعيل إشعارات العملاء التلقائية عبر الواتساب والرسائل النصية السعودية (+966) لحالات الطلب والشحن والتوصيل مع بوابات يوني فونك وسوق."
  focus_keywords_en: ["saudi sms gateway ecommerce", "whatsapp automated order notification", "unifonic ksa sms setup", "order dispatch tracking sms", "ecommerce customer notification templates"]
  focus_keywords_ar: ["بوابة الرسائل النصية السعودية", "إشعارات الواتساب للطلبات", "ربط يوني فونك للرسائل القصيرة", "رسالة تم شحن طلبك برابط التتبع", "قوالب رسائل المتجر التلقائية"]
---

# 📲 WhatsApp & SMS Saudi Notification Gateway Guide
# دليل إعدادات إشعارات الواتساب وبوابات الرسائل النصية السعودية (+966)

---

## 📌 Introduction & Overview / مقدمة ونظرة عامة

### English
Keeping shoppers informed at every step of their journey drastically lowers customer support tickets and builds premium brand authority. The **Notifications & Messaging Channels** module in **Souq Platform** automates transactional communication across official Saudi SMS gateways (Unifonic, Taqnyat) and official **WhatsApp Cloud API** channels. Store owners can configure automated alerts for order confirmations, shipment tracking links with live waybill numbers (AWB), delivery updates, and administrative low-stock alerts.

### العربية
إن إشعار العميل بكل مرحلة من مراحل طلبه يقلل من استفسارات الدعم الفني ويعزز احترافية علامتك التجارية في السوق السعودي. تتيح لك شاشة **إشعارات الواتساب والرسائل النصية (WhatsApp & SMS Notifications)** في **منصة سوق** أتمتة إرسال رسائل المعاملات عبر بوابات الرسائل النصية المعتمدة في المملكة (مثل Unifonic و Taqnyat) وحسابات **WhatsApp Cloud API** الرسمية. يمكنك تخصيص قوالب رسائل تأكيد الطلب، وإرسال رابط وبوليصة الشحن فور تسليم الشحنة للناقل، وتنبيه العميل عند اكتمال التوصيل.

---

## 🖥️ Screen Layout & Visual Wireframe / المخطط البصري لشاشة الإشعارات

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Store Settings > 📲 WhatsApp & SMS Notifications (إشعارات الرسائل والواتساب)              │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  ← Back to All Settings (العودة لكل الإعدادات)                    [ 💾 Save Settings / حفظ ]   │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────┐ ┌──────────────────────────────┐  │
│  │ 🟢 WhatsApp Business Gateway (بوابة الواتساب السحابية) │ │ ✉️ Saudi SMS Gateway (SMS)   │  │
│  ├────────────────────────────────────────────────────────┤ ├──────────────────────────────┤  │
│  │ Channel Status: [ Enabled / مفعل ]   [ Toggle: ● ON ]  │ │ Channel Status: [ ● ON ]     │  │
│  │ Provider: [ WhatsApp Cloud API (Meta Official)       ] │ │ Provider: [ Unifonic KSA  ▼] │  │
│  │ Verified Sender Number: [ +966 50 123 4567           ] │ │ Approved Sender ID (اسم المرسل)│
│  │ [✓] Auto-Notify Customer  [✓] Auto-Notify Merchant     │ │ [ SOUQ-STORE               ] │  │
│  └────────────────────────────────────────────────────────┘ └──────────────────────────────┘  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📑 Automated Notification Templates (قوالب الرسائل التلقائية المتغيرة)                  │  │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤  │
│  │ [ 1. Order Placed (تأكيد الطلب) ]  [ 2. Order Shipped (الشحن والتتبع) ]  [ 3. Delivered] │  │
│  │                                                                                        │  │
│  │ Event: order_shipped (تم تسليم الطلب لشركة الشحن)                                      │  │
│  │ ┌────────────────────────────────────────────────────────────────────────────────────┐ │  │
│  │ │ 🚚 طلبك في الطريق إليك!                                                            │ │  │
│  │ │ عزيزي {{customer_name}}، تم تسليم طلبك #{{order_number}} لشركة {{courier_name}}.    │ │  │
│  │ │ رقم التتبع (AWB): {{tracking_number}}                                              │ │  │
│  │ │ رابط التتبع المباشر: {{tracking_url}}                                              │ │  │
│  │ └────────────────────────────────────────────────────────────────────────────────────┘ │  │
│  │ Available Variables: {{customer_name}}, {{order_number}}, {{order_total}}, {{courier}} │  │
│  │ [ 🧪 Send Test Notification to My Phone (إرسال رسالة تجريبية لهاتفي) ]                  │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Comprehensive Elements Breakdown / تفصيل العناصر والقوالب

| Element / العنصر | Type / النوع | Default / الافتراضي | Rules & Formats / الشروط | Purpose & Impact / الوظيفة والأثر |
|-----------------|--------------|---------------------|--------------------------|----------------------------------|
| **WhatsApp Channel Toggle** | Switch | `true` (Enabled) | Active WhatsApp API | تفعيل إرسال رسائل التحديثات المنسقة مع الإيموجي عبر تطبيق WhatsApp. |
| **SMS Channel Toggle** | Switch | `true` (Enabled) | Saudi Licensed Provider | تفعيل إرسال الرسائل النصية القصيرة SMS لأرقام الجوالات (+966). |
| **Approved Sender ID** | Text Input | Platform Brand | CITC / CST Approved Name | اسم المتجر الذي يظهر كمرسل في رسائل الـ SMS للعميل داخل المملكة. |
| **Order Placed Template** | Dynamic Template | Pre-filled Arabic/English | Supports Dynamic Variables | يرسل للعميل فور إتمام عملية الدفع ملخص السلة ورقم الطلب والمبلغ. |
| **Order Shipped Template** | Dynamic Template | Pre-filled Arabic/English | Injects Courier & Tracking Link | يرسل رقم البوليصة والرابط الحي لتتبع مسار الشحنة فور إصدارها. |
| **Order Delivered Template** | Dynamic Template | Pre-filled Arabic/English | Satisfaction & Review Request | يرسل للعميل رسالة شكر وطلب تقييم بعد استلام الشحنة بنجاح. |
| **Test Notification Trigger** | Action Button | Function | Sends to Store Phone | يتحقق من صحة الربط واستهلاك الرصيد دون الحاجة لإنشاء طلب حقيقي. |

---

## 🛠️ Step-by-Step Configuration Guide / خطوات التفعيل والإعداد

### الخطوة 1: الدخول إلى تبويب الإشعارات
1. من لوحة التاجر، افتح **الإعدادات (Settings)**.
2. اختر بطاقة **إشعارات الواتساب والرسائل النصية (Notifications)**.

### الخطوة 2: تفعيل قنوات الإرسال وتحديد اسم المرسل (Sender ID)
1. فعّل زر قناة الـ SMS وتأكد من كتابة **اسم المرسل المعتمد** لدى هيئة الاتصالات والفضاء والتقنية (مثل: `MYSTORE`).
2. فعّل خيار الواتساب وتأكد من مطابقة رقم الإرسال لحسابك السحابي.

### الخطوة 3: مراجعة وتخصيص قوالب الرسائل
1. تصفح التبويبات الثلاثة: (تأكيد الطلب، تم الشحن، تم التوصيل).
2. يمكنك تعديل الصياغة مع الحفاظ على الأكواد الديناميكية مثل:
   - `{{customer_name}}`: اسم العميل.
   - `{{order_number}}`: رقم الطلب.
   - `{{courier_name}}`: شركة الشحن (أرامكس، سمسا، سبل).
   - `{{tracking_url}}`: الرابط المباشر للتتبع.

### الخطوة 4: إجراء اختبار إرسال تجريبي
1. اضغط على زر **Send Test Notification**.
2. ستصلك رسالة اختبارية على هاتفك المسجل للتأكد من وصول الرسائل وتنسيق النصوص.
3. اضغط **حفظ الإعدادات (Save Settings)**.

---

## 💡 Pro-Tips / نصائح احترافية لرسائل العملاء

> [!TIP]
> **شفافية التتبع المباشر (AWB URL):**
> تزويد العميل برابط التتبع المباشر فور خروج الشحنة يخفض اتصالات الاستفسار عن موعد التوصيل بنسبة تزيد عن 60%.

---

## ❓ FAQ / الأسئلة الشائعة

#### س1: هل يتم خصم تكلفة الرسائل من التاجر أم هي مشمولة في الباقة؟
**الجواب:** يحصل مشتركو الباقة الاحترافية والمميزة على باقة رسائل شهرية مجانية، مع إمكانية شحن رصيد إضافي بسهولة من خلال لوحة التاجر عند الحاجة.

#### Q2: What happens if a customer inputs an invalid mobile number?
**Answer:** The gateway logs a delivery exception badge in the order details view and attempts delivery via email fallback to guarantee the customer receives their order confirmation.
