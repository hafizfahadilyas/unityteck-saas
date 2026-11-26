---
title: "Subscription Plans & Workspace Quotas Guide | دليل باقات الاشتراك وترخيص المتجر"
slug: "/guides/settings/subscription-plans-quotas"
category: "Merchant Settings"
languages: ["ar", "en"]
author: "Souq E-Commerce Platform Documentation Team"
last_updated: "2026-11-26"
seo:
  meta_title_en: "Manage Store Subscription, Plan Tiers & Quotas | Souq Platform"
  meta_title_ar: "دليل باقات اشتراك المتجر، الترخيص وحدود الموارد | منصة سوق"
  meta_description_en: "Learn how to manage your SaaS subscription plan (Free, Pro, Premium), check product quotas, active license status, and database synchronization in Souq Platform."
  meta_description_ar: "تعلم كيفية إدارة باقة اشتراك متجرك (المجانية، الاحترافية، المميزة)، التحقق من رصيد المنتجات، حالة الترخيص، ومزامنة قاعدة البيانات في منصة سوق."
  focus_keywords_en: ["store subscription plans", "saas merchant tier upgrade", "ecommerce plan quotas", "active license status", "database tenant synchronization"]
  focus_keywords_ar: ["باقات اشتراك المتجر", "ترقية باقة التاجر", "حدود المنتجات في الباقة", "حالة الترخيص التجاري", "مزامنة قاعدة بيانات المتجر"]
---

# 💎 Subscription Plans & Workspace Quotas Guide
# دليل باقات الاشتراك وترخيص المتجر وإدارة الموارد

---

## 📌 Introduction & Overview / مقدمة ونظرة عامة

### English
Scalability and operational transparency are at the core of the **Souq Platform**. The **Subscription & Plan Tier** settings module provides merchants with a real-time view of their commercial agreement, active license status (Active, Trial, Grace Period, or Expired), resource allowances (product limits, staff seats, custom domain privileges, and 0% transaction fees), as well as multi-tenant database partitioning and zero-stale cache synchronization tools.

### العربية
تعتمد استمرارية نمو متجرك على وضوح حدود الموارد والترخيص التجاري. توفر لك شاشة **خطة الاشتراك وترخيص المتجر (Subscription & Plans)** في **منصة سوق** نظرة حية وفورية على باقتك الحالية (المجانية، الاحترافية، المميزة)، وحالة الترخيص الفعلية (نشط، تجريبي، فترة سماح، منتهي الصلاحية)، وحدود الموارد التشغيلية كعدد المنتجات وحسابات فريق العمل، إلى جانب بطاقة إدارة تزامن قاعدة البيانات المستقلة (Tenant DB Sync) وتفريغ الكاش اللحظي.

---

## 🖥️ Screen Layout & Visual Wireframe / المخطط البصري لشاشة الاشتراكات

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Store Settings > 💎 Subscription & Workspace (خطة الاشتراك وترخيص المتجر)               │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  ← Back to All Settings (العودة لكل الإعدادات)                                               │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ☁️ Tenant Database & Cache Health (مزامنة قاعدة البيانات السحابية)                     │  │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤  │
│  │ Status: Isolated MySQL Schema Active · Hostinger Central DB Connected · CDN Zero-Stale │  │
│  │ [ 🔄 Purge Cache & Sync DB (تفريغ الكاش والمزامنة الآن) ]                              │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🛡️ Active Plan: [ PRO · الاحترافية ]    License Status: [ 🟢 ACTIVE / نشط ]             │  │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                        │  │
│  │  ┌───────────────────────┐  ┌───────────────────────┐  ┌────────────────────────────┐  │  │
│  │  │ ⚪ Free Starter        │  │ 🟢 Pro Store (٣٠٠ ر.س)│  │ 👑 Premium VIP (٥٠٠ ر.س)   │  │  │
│  │  │ (الباقة المجانية)     │  │ (الباقة الاحترافية)   │  │ (الباقة المميزة)           │  │  │
│  │  ├───────────────────────┤  ├───────────────────────┤  ├────────────────────────────┤  │  │
│  │  │ • 25 Products Catalog │  │ • 500 Products Catalog│  │ • Unlimited Products       │  │  │
│  │  │ • Manual Orders Only  │  │ • Custom Domain (.sa) │  │ • Custom Domain + Subdomains│  │
│  │  │ • Default Subdomain   │  │ • SEO & Analytics     │  │ • ZATCA Phase 2 Invoicing  │  │  │
│  │  │ • Basic Themes        │  │ • Premium Themes      │  │ • AI Tools & Auto Studio   │  │  │
│  │  │ • No Custom Domain    │  │ • 0% Transaction Fee  │  │ • Priority VIP 24/7 Support│  │  │
│  │  │                       │  │                       │  │                            │  │  │
│  │  │ [ Downgrade / اختيار ]│  │ [ ✓ Current / مفعلة ] │  │ [ 🚀 Upgrade / ترقية ]     │  │  │
│  │  └───────────────────────┘  └───────────────────────┘  └────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Plan Comparison & Resource Limits / مقارنة الباقات وحدود الموارد

| Feature / الميزة التشغيلية | Free Starter (المجانية) | Pro Store (الاحترافية - 300 ر.س) | Premium VIP (المميزة - 500 ر.س) |
|----------------------------|-------------------------|-----------------------------------|-----------------------------------|
| **Monthly Cost / السعر** | 0 SAR / مجاناً | 300 SAR / شهرياً | 500 SAR / شهرياً |
| **Product Limit / المنتجات** | Up to 25 items | Up to 500 items | Unlimited (غير محدود) |
| **Custom Domain / النطاق الخاص** | ❌ (Subdomain only) | ✅ Included (`.sa` / `.com`) | ✅ Included + SSL CDN |
| **Platform Commission / العمولة** | 2% Platform Fee | **0% Platform Fee** | **0% Platform Fee** |
| **Themes & Customizer** | 2 Basic Themes | Full Visual Theme Studio | All Premium Themes + Elements |
| **SEO & Google Search Console**| Basic Meta | Full Automated Indexing | Real-time Search Console + GA4 |
| **ZATCA Tax E-Invoicing** | Manual Invoices | Standard QR Invoicing | Full ZATCA Phase 2 Integration |
| **AI Partner & Media Studio**| ❌ Disabled | 50 AI Credits / month | Unlimited AI Engine & Canva Hub |
| **Staff Accounts / حسابات الموظفين** | 1 Admin | 3 Staff Accounts | 10 Staff Accounts + Permissions |

---

## 🛠️ Step-by-Step Plan Management / خطوات إدارة الباقة والترقية

### الخطوة 1: الدخول إلى تبويب الاشتراك
1. افتح **الإعدادات (Settings)** من الشريط الجانبي.
2. انقر على بطاقة **خطة الاشتراك والترخيص (Subscription)**.

### الخطوة 2: فحص حالة الترخيص والاستهلاك
1. اطلع على الشارة العلوية للتأكد من حالة حسابك (`Active` أو `Trial`).
2. راجع عدد المنتجات المضافة والحد الأقصى المتاح لك.

### الخطوة 3: الترقية إلى باقة أعلى (Pro أو Premium)
1. في بطاقة الباقة المستهدفة (مثلاً **Premium VIP**)، اضغط على زر **اختيار المميزة (Choose Premium)**.
2. يتم توجيهك لصفحة الدفع الآمن لاختيار وسيلة الدفع (مدى، أبل باي، أو بطاقة الائتمان).
3. فور إتمام العملية، تُفتح جميع الميزات والحدود تلقائياً دون أي توقف للمتجر.

### الخطوة 4: مزامنة قاعدة البيانات وتحديث الصلاحيات
1. اضغط على زر **Purge Cache & Sync DB**.
2. يقوم النظام بتحديث جلسة العمل وصلاحيات التاجر في جميع خوادم المنصة.

---

## 💡 Pro-Tips / نصائح تشغيلية

> [!TIP]
> **منحة الإدارة (Master Grant):**
> إذا تم تفعيل باقتك كمنحة ترويجية من إدارة المنصة، ستظهر شارة برتقالية مميزة `[منحة الإدارة / Master grant]`، مما يعني إعفاء متجرك من رسوم التجديد خلال الفترة المتفق عليها.

---

## ❓ FAQ / الأسئلة الشائعة

#### س1: ماذا يحدث عند انتهاء فترة الاشتراك (Expired)؟
**الجواب:** يدخل المتجر أولاً في **فترة سماح (Grace Period)** لمدة 7 أيام تظل فيها المبيعات تعمل بصورة طبيعية، مع ظهور تنبيه تذكيري في لوحة التاجر لتجديد الاشتراك قبل إيقاف الواجهة العامة مؤقتاً.

#### Q2: Can I downgrade my plan from Premium to Pro?
**Answer:** Yes, downgrades can be selected at the end of the current billing cycle, provided your current catalog size does not exceed the lower tier's product limit (500 items).
