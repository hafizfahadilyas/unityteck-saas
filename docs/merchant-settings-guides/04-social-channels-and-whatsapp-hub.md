---
title: "Social Media Channels & WhatsApp Live Hub Guide | دليل قنوات التواصل الاجتماعي والواتساب العائم"
slug: "/guides/settings/social-channels-whatsapp-hub"
category: "Merchant Settings"
languages: ["ar", "en"]
author: "Souq E-Commerce Platform Documentation Team"
last_updated: "2026-11-26"
seo:
  meta_title_en: "Setup WhatsApp Floating Chat & Social Media Channels | Souq Platform"
  meta_title_ar: "دليل ضبط محادثة الواتساب العائمة وقنوات التواصل الاجتماعي | منصة سوق"
  meta_description_en: "Step-by-step guide to configuring a floating WhatsApp chat bubble, automated greeting text (+966), and connecting Instagram, TikTok, X, and Facebook."
  meta_description_ar: "دليل خطوة بخطوة لتفعيل أيقونة الواتساب العائمة في متجرك، كتابة رسالة الترحيب التلقائية، وربط حسابات انستغرام، تيك توك، إكس، وفيسبوك."
  focus_keywords_en: ["whatsapp chat widget ecommerce", "connect instagram store", "saudi whatsapp customer service", "storefront social media links", "floating whatsapp button"]
  focus_keywords_ar: ["زر الواتساب العائم للمتجر", "ربط انستغرام بالمتجر", "خدمة عملاء واتساب السعودية", "روابط التواصل في تذييل المتجر", "محادثة واتساب المباشرة"]
---

# 💬 Social Media Channels & WhatsApp Live Hub Guide
# دليل قنوات التواصل الاجتماعي وأيقونة الواتساب العائمة

---

## 📌 Introduction & Overview / مقدمة ونظرة عامة

### English
Direct communication and social proof are the primary drivers of e-commerce conversions in Saudi Arabia and the GCC. The **Social & WhatsApp Settings** panel in **Souq Platform** allows you to enable a floating WhatsApp customer support widget on all public pages, write pre-filled greeting messages that launch directly into a chat window, and link your verified brand profiles across Instagram, TikTok, X (Twitter), Facebook, and YouTube.

### العربية
يعد التواصل المباشر وقنوات التواصل الاجتماعي شريان التجارة الإلكترونية في السوق السعودي والخليجي. تتيح لك شاشة **قنوات التواصل والواتساب (Social & WhatsApp)** في **منصة سوق** تفعيل زر الواتساب العائم الذكي في جميع صفحات المتجر مع رسالة ترحيب مسبقة تفتح نافذة المحادثة فوراً، إلى جانب ربط وتفعيل حسابات متجرك الرسمية على انستغرام، تيك توك، إكس (تويتر)، فيسبوك، ويوتيوب لتظهر في ترويسة وتذييل المتجر.

---

## 🖥️ Screen Layout & Visual Wireframe / المخطط البصري للشاشة

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Store Settings > 💬 Social & WhatsApp Hub (قنوات التواصل والواتساب)                     │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  ← Back to All Settings (العودة لكل الإعدادات)                                               │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────┐ ┌──────────────────────────────┐  │
│  │ 🟢 WhatsApp Live Chat Widget (أيقونة الواتساب العائمة) │ │ 🌐 Store Social Channels     │  │
│  ├────────────────────────────────────────────────────────┤ ├──────────────────────────────┤  │
│  │ Status: [ Active / مفعل ]           [ Toggle: ● ON ]   │ │ Instagram (انستغرام):        │  │
│  │                                                        │ │ [ https://instagram.com/my..]│  │
│  │ WhatsApp Business Number (رقم واتساب للأعمال):         │ │ [ Toggle: ● ON ]             │  │
│  │ [ +966501234567                                      ] │ │                              │  │
│  │ * Format with country code (صيغة الكود الدولي)         │ │ TikTok (تيك توك):            │  │
│  │                                                        │ │ [ https://tiktok.com/@mysto..]│  │
│  │ Default Greeting Message (رسالة الترحيب المسبقة):      │ │ [ Toggle: ● ON ]             │  │
│  │ ┌────────────────────────────────────────────────────┐ │ │                              │  │
│  │ │ مرحباً، أود الاستفسار عن تفاصيل المنتجات والطلبات! │ │ │ X / Twitter (إكس / تويتر):   │  │
│  │ └────────────────────────────────────────────────────┘ │ │ [ https://x.com/mystore       ]│  │
│  │                                                        │ │ [ Toggle: ● ON ]             │  │
│  │ ┌────────────────────────────────────────────────────┐ │ │                              │  │
│  │ │ 📱 Storefront Preview: Floating green bubble with  │ │ │ Facebook / YouTube           │  │
│  │ │ official WhatsApp icon positioned at bottom-corner │ │ │ [ Optional Links         ]   │  │
│  │ └────────────────────────────────────────────────────┘ │ └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Comprehensive Elements Breakdown / تفصيل الحقول والعناصر

| Element / العنصر | Type / النوع | Default / الافتراضي | Validation / التحقق | Function & Impact / الوظيفة والأثر |
|-----------------|--------------|---------------------|---------------------|-----------------------------------|
| **WhatsApp Widget Toggle** | On/Off Switch | `true` (Enabled) | Boolean | يظهر أو يخفي أيقونة الواتساب العائمة في الركن السفلي لمتجرك للزوار. |
| **WhatsApp Number** | Tel Input | Empty / Store Phone | Saudi format `+9665XXXXXXXX` | الرقم الذي يتم توجيه محادثة العميل إليه عند النقر على الزر. |
| **Default Greeting** | Textarea | Pre-filled Friendly Text | Max 200 characters | نص الرسالة التلقائي الذي يظهر في خانة كتابة العميل عند فتح محادثة WhatsApp. |
| **Instagram Toggle & URL** | Switch + URL Input | Disabled / Empty | Valid Profile URL | ينشئ أيقونة انستغرام في شريط التذييل (Footer) وصفحة الروابط. |
| **TikTok Toggle & URL** | Switch + URL Input | Disabled / Empty | Valid Profile URL | يربط حساب تيك توك لزيادة المتابعين واستعراض مقاطع الفيديو. |
| **X (Twitter) Toggle & URL** | Switch + URL Input | Disabled / Empty | Valid Profile URL | يربط حساب المتجر على منصة X لخدمة العملاء والتحديثات. |
| **Facebook & YouTube** | Switch + URL Inputs | Disabled / Empty | Valid Profile URLs | قنوات الفيديو والمجتمع التابعة للمتجر. |

---

## 🛠️ Step-by-Step Configuration Guide / خطوات التفعيل خطوة بخطوة

### الخطوة 1: الدخول إلى تبويب قنوات التواصل والواتساب
1. من لوحة التاجر، انتقل إلى **الإعدادات (Settings)**.
2. اضغط على بطاقة **قنوات التواصل والواتساب (Social & WhatsApp)**.

### الخطوة 2: تفعيل وضبط زر الواتساب العائم
1. تأكد من تفعيل مفتاح التبديل (Toggle Switch) إلى وضع **مفعل (ON)**.
2. أدخل رقم واتساب للأعمال مسبوقاً بالكود الدولي السعودي (مثال: `+966501234567` دون فراغات).
3. اكتب رسالة ترحيبية ذكية مثل:  
   `مرحباً، أود الاستفسار عن كود الخصم وطرق الدفع المتاحة في المتجر!`
4. اضغط حفظ؛ سيظهر الزر فوراً في الزاوية المناسبة لواجهة متجرك (أسفل اليسار في الواجهة العربية، أو أسفل اليمين في الإنجليزية).

### الخطوة 3: ربط حسابات التواصل الاجتماعي
1. الصق رابط حسابك الكامل على انستغرام وتيك توك وإكس في الحقول المخصصة.
2. فعّل مفتاح التبديل بجانب كل قناة ترغب في إظهارها لعملائك.
3. يقوم النظام تلقائياً بفحص سلامة الروابط وإظهار الأيقونات الرسمية الملونة في تذييل متجرك.

---

## 💡 Pro-Tips / نصائح احترافية لزيادة المبيعات

> [!TIP]
> **رسالة الواتساب التلقائية الذكية:**
> صياغة رسالة واضحة في خانة الترحيب تقلل من تردد العميل وتجعله يرسل رسالته بنقرة زر واحدة، مما يزيد من معدل التحويل (Conversion Rate) بنسبة تصل إلى 28%.

---

## ❓ FAQ / الأسئلة الشائعة

#### س1: هل يمكن استخدام رقم واتساب شخصي عادي بدلاً من واتساب للأعمال؟
**الجواب:** نعم، يعمل الرابط مع أي رقم واتساب نشط، ولكن يُنصح بشدة باستخدام تطبيق WhatsApp Business للاستفادة من الردود السريعة وأوقات العمل وكتالوج المنتجات المصغر.

#### Q2: Can customers click the WhatsApp button from desktop computers?
**Answer:** Yes, clicking the button on a desktop computer automatically redirects the customer to WhatsApp Web or the WhatsApp Desktop application with the greeting text pre-populated.
