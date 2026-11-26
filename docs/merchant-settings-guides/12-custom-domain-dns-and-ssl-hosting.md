---
title: "Custom Domain, DNS Records & Free SSL Certificate Hosting Guide | دليل ربط النطاق الخاص وسجلات DNS وشهادة الأمان"
slug: "/guides/settings/custom-domain-dns-ssl-hosting"
category: "Merchant Settings"
languages: ["ar", "en"]
author: "Souq E-Commerce Platform Documentation Team"
last_updated: "2026-11-26"
seo:
  meta_title_en: "Setup Custom Domain (.sa / .com), DNS & Free SSL | Souq Platform"
  meta_title_ar: "دليل ربط النطاق الخاص (.sa / .com)، سجلات DNS وشهادة SSL المجانية | منصة سوق"
  meta_description_en: "Step-by-step guide to connecting your custom domain (.sa / .com), configuring CNAME and A records, provisioning free Let's Encrypt SSL, and Cloudflare CDN hosting."
  meta_description_ar: "دليل خطوة بخطوة لربط نطاقك الخاص السعودي والدولي (.sa / .com)، ضبط سجلات CNAME و A، تفعيل شهادة الأمان SSL المجانية، واستضافة Cloudflare السريعة."
  focus_keywords_en: ["custom domain ecommerce setup", "saudi domain .sa connection", "dns cname a record ecommerce", "free lets encrypt ssl certificate", "cloudflare cdn ecommerce hosting"]
  focus_keywords_ar: ["ربط دومين خاص بالمتجر", "حجز وربط النطاق السعودي sa", "إعدادات سجلات DNS للمتجر", "شهادة أمان مجانية SSL للمتجر", "استضافة سحابية سريعة كلاود فلير"]
---

# 🌐 Custom Domain, DNS Records & Free SSL Hosting Guide
# دليل ربط النطاق الخاص (.sa / .com)، سجلات الـ DNS وشهادة الأمان SSL المجانية

---

## 📌 Introduction & Overview / مقدمة ونظرة عامة

### English
A branded custom domain (e.g., `www.yourstore.sa` or `yourbrand.com`) is the single most vital element for customer credibility, high search engine authority, and social ad performance. The **Hosting & Domain Architecture** in **Souq Platform** provides a streamlined domain connection engine: automated DNS verification for **CNAME** and **A** records, instant free **Let's Encrypt SSL** certificate issuance with HTTP-to-HTTPS force redirect, and edge CDN acceleration powered by Cloudflare with zero-stale cache purging.

### العربية
النطاق الخاص الموثق (مثل: `www.yourstore.sa` أو `yourbrand.com`) هو حجر الزاوية لبناء الثقة مع المتسوق، وتصدر نتائج محركات البحث، ونجاح الحملات الإعلانية على سناب شات وتيك توك. توفر لك شاشة **الاستضافة والنطاق (Hosting & Domain)** في **منصة سوق** تجربة ربط فنية مبسطة وسريعة: فحص تلقائي لسجلات **DNS** (سجلات CNAME و A)، وإصدار فوري لشهادة الأمان المشفرة **SSL المجانية (Let's Encrypt)** مع التحويل التلقائي لبروتوكول HTTPS الآمن، وتسريع استجابة المتجر عبر شبكة التوزيع السحابية العالمية Cloudflare.

---

## 🖥️ Screen Layout & Visual Wireframe / المخطط البصري لشاشة الاستضافة والنطاق

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Store Settings > 🌐 Hosting & Domain (إدارة النطاق والاستضافة السحابية)                  │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  ← Back to All Settings (العودة لكل الإعدادات)                    [ 🚀 Deploy Live / إطلاق ] │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏷️ Domain Lifecycle Status: [ 🟢 LIVE / متجرك يعمل بنجاح على النطاق الخاص ]             │  │
│  │ Lifecycle: Demo ➔ Domain Linked ➔ DNS Verified ➔ SSL Active ➔ [ LIVE ]                  │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────┐ ┌──────────────────────────────┐  │
│  │ 🌐 Custom Domain Setup (ربط النطاق المخصص)             │ │ 🔒 Free SSL Certificate      │  │
│  ├────────────────────────────────────────────────────────┤ ├──────────────────────────────┤  │
│  │ Enter Your Domain (أدخل نطاق متجرك):                   │ │ Status: [ 🟢 Active & Secure]│  │
│  │ [ www.elitecoffee.sa                                 ] │ │ Provider: Let's Encrypt 2048 │  │
│  │                                                        │ │ Auto-Renewal: [✓] Enabled    │  │
│  │ Current Active URL (الرابط النشط حالياً):              │ │ HTTPS Force Redirect: [✓] ON │  │
│  │ https://www.elitecoffee.sa                             │ │                              │  │
│  │                                                        │ │ ⚡ Cloudflare Edge CDN:      │  │
│  │ [ 🔍 Verify DNS Records (فحص سجلات النطاق الآن) ]       │ │ Edge Caching: [ 99.8% Hit ]  │  │
│  │ [ 🔄 Instant Purge CDN Cache (مسح كاش الاستضافة) ]     │ │ DDoS Attack Protection: [✓]  │  │
│  └────────────────────────────────────────────────────────┘ └──────────────────────────────┘  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📋 Required DNS Records Table (جدول سجلات الـ DNS المطلوبة في مزود النطاقات)            │  │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤  │
│  │ Type (النوع)  | Name (الاسم) | Target Value (القيمة المستهدفة)        | TTL    | Status │  │
│  │ CNAME         | www          | hostinger.souq-plus.sa                 | 300    | [✓] OK │  │
│  │ A             | @            | 185.199.108.153                        | 300    | [✓] OK │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Comprehensive DNS & Hosting Breakdown / تفصيل السجلات والاستضافة

| Record / السجل | Host / الاسم | Target Value / القيمة المستهدفة | TTL | Purpose & Function / الوظيفة والأثر |
|----------------|--------------|---------------------------------|-----|-----------------------------------|
| **CNAME Record** | `www` | `hostinger.souq-plus.sa` | 300 (Auto) | يوجه زوار عنوان `www` إلى السيرفر المركزي السحابي لمنصة سوق. |
| **A Record** | `@` (Root) | Dedicated Platform IPv4 | 300 (Auto) | يوجه النطاق المباشر (Apex Domain) بدون www إلى السيرفر المخصص. |
| **SSL Certificate** | `*` Wildcard | Let's Encrypt 2048-bit | Auto-renew 90d | يشفر بيانات الدفع وبطاقات الائتمان ويظهر علامة القفل الأخضر في المتصفح. |
| **Cloudflare CDN** | Global Edge | Edge Static Assets | Dynamic | يخزن صور المنتجات والملفات في أقرب خادم جغرافي للعميل لسرعة تصفح فائقة. |
| **Purge CDN Cache** | Action API | Real-time Cache Purge | Instant | يمسح كاش الصفحات فوراً عند إجراء أي تعديل كبير في الأسعار أو المنتجات. |

---

## 🛠️ Step-by-Step Domain Connection Guide / خطوات ربط النطاق خطوة بخطوة

### الخطوة 1: الدخول إلى إعدادات الاستضافة والنطاق
1. من الشريط الجانبي للوحة التاجر، اختر **الاستضافة والنطاق (Hosting & Domain)** (أو من قائمة الإعدادات الفرعية).

### الخطوة 2: إدخال اسم النطاق الخاص بك
1. في حقل **Custom Domain**، اكتب نطاق متجرك المحجوز (مثال: `www.yourbrand.sa` أو `yourstore.com`).
2. اضغط على زر **حفظ النطاق**.

### الخطوة 3: إضافة سجلات الـ DNS في لوحة مزود النطاق
1. افتح لوحة التحكم الخاصة بالجهة التي قمت بحجز النطاق منها (مثل: المركز السعودي لمعلومات الشبكة SaudiNIC، أو GoDaddy، أو Namecheap).
2. توجه إلى إدارة سجلات الـ **DNS Management**:
   - أضف سجل من نوع **CNAME**:
     - الاسم (Host/Name): `www`
     - القيمة (Target/Points to): الرابط المعروض في لوحة تحكم سوق (مثل: `hostinger.souq-plus.sa`).
   - أضف سجل من نوع **A Record**:
     - الاسم (Host/Name): `@`
     - القيمة: الآي بي المعروض في الجدول.

### الخطوة 4: التحقق من انتشار السجلات وإصدار شهادة الأمان (SSL)
1. ارجع إلى لوحة تحكم سوق، واضغط على زر **فحص سجلات النطاق (Verify DNS Records)**.
2. عند تطابق السجلات، ستتحول الشارة إلى اللون الأخضر `[DNS Verified]`.
3. يقوم النظام تلقائياً بتوليد شهادة الأمان المشفرة المجانية (Let's Encrypt SSL) وتفعيل التحويل الآمن `HTTPS` خلال دقائق معدودة.

### الخطوة 5: إطلاق المتجر (Deploy Live)
1. اضغط على زر **إطلاق المتجر (Deploy Live)**.
2. يصبح متجرك متاحاً رسمياً لجميع الزوار حول العالم عبر نطاقك الخاص وبأعلى معايير الحماية والسرعة.

---

## 💡 Pro-Tips / نصائح احترافية للنطاقات السعودية

> [!TIP]
> **قوة النطاق السعودي (.sa):**
> تمنح النطاقات السعودية المعتمدة ثقة لا تضاهى لدى المستهلك المحلي، وتتمتع بأفضلية ترتيب طبيعية في نتائج بحث Google للمستخدمين داخل المملكة العربية السعودية.

---

## ❓ FAQ / الأسئلة الشائعة

#### س1: كم يستغرق تفعيل النطاق وظهوره بعد تحديث سجلات الـ DNS؟
**الجواب:** بفضل استخدام TTL منخفض (300 ثانية)، يستغرق انتشار السجلات في معظم الحالات ما بين 15 دقيقة إلى ساعتين كحد أقصى حول العالم.

#### Q2: Is the SSL security certificate really free forever?
**Answer:** Yes, the 2048-bit Let's Encrypt SSL certificate is completely free and automatically renews in the background every 90 days with zero merchant maintenance required.
