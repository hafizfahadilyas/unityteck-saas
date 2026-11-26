---
title: "Payment Gateways: Mada, Apple Pay, BNPL & Bank Transfer Guide | دليل بوابات الدفع، مدى، أبل باي والتقسيط"
slug: "/guides/settings/payment-gateways-mada-applepay-tamara"
category: "Merchant Settings"
languages: ["ar", "en"]
author: "Souq E-Commerce Platform Documentation Team"
last_updated: "2026-11-26"
seo:
  meta_title_en: "Setup Mada, Apple Pay, Tabby, Tamara & Bank Transfer | Souq Platform"
  meta_title_ar: "دليل تفعيل مدى، أبل باي، تمارا، تابي والتحويل البنكي | منصة سوق"
  meta_description_en: "Complete guide to setting up Saudi payment gateways in Souq Platform: Mada debit cards, Apple Pay, STC Pay, Tamara BNPL, Saudi IBAN wire transfer, and COD."
  meta_description_ar: "دليل شامل لتفعيل بوابات الدفع الإلكتروني في منصة سوق: بطاقات مدى، أبل باي، STC Pay، تقسيط تمارا وتابي، الحسابات البنكية والآيبان والدفع عند الاستلام."
  focus_keywords_en: ["mada debit card payment gateway", "apple pay saudi ecommerce", "tamara installment setup", "saudi iban bank transfer ecommerce", "tabby pay later integration"]
  focus_keywords_ar: ["بوابة دفع مدى للمتاجر", "تفعيل ابل باي في المتجر", "ربط تمارا للتقسيط", "التحويل البنكي بالآيبان السعودي", "الدفع عند الاستلام للمتجر"]
---

# 💳 Payment Gateways: Mada, Apple Pay, BNPL & Bank Transfer Guide
# دليل بوابات الدفع الإلكتروني، مدى، أبل باي، التقسيط والتحويل البنكي

---

## 📌 Introduction & Overview / مقدمة ونظرة عامة

### English
Payment flexibility directly dictates checkout completion rates in the Kingdom of Saudi Arabia. The **Payments & Banking** module in **Souq Platform** provides a native, unified payment orchestration engine supporting all major Saudi payment schemes: **Mada** debit cards, **Apple Pay** one-touch checkout, **Visa / MasterCard**, **STC Pay** digital wallets, Buy-Now-Pay-Later (BNPL) split installments via **Tamara** and **Tabby**, verified **Saudi Bank Wire Transfers** with automated IBAN receipts auditing, and **Cash on Delivery (COD)**.

### العربية
تعد مرونة خيارات الدفع العامل الأكثر حسماً في زيادة مبيعات المتاجر الإلكترونية في المملكة العربية السعودية. توفر لك شاشة **المدفوعات والحسابات البنكية (Store Payments)** في **منصة سوق** محرك مدفوعات متكامل يدعم كافة وسائل الدفع السعودية الرسمية: بطاقات **مدى (Mada)**، والدفع السريع بلمسة واحدة عبر **Apple Pay**، والبطاقات الائتمانية، ومحفظة **STC Pay**، وحلول التقسيط والدفع الآجل عبر **تمارا (Tamara)** و**تابي (Tabby)**، والتحويل البنكي المباشر مع الآيبان السعودي ومراجعة الإيصالات، بالإضافة إلى خيار الدفع عند الاستلام (COD).

---

## 🖥️ Screen Layout & Visual Wireframe / المخطط البصري لشاشة المدفوعات

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Store Settings > 💳 Payments & Banking (المدفوعات والحسابات البنكية)                     │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  ← Back to All Settings (العودة لكل الإعدادات)                    [ ⚙️ Gateway Credentials ]  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚡ Active Payment Methods (طرق الدفع المفعلة في سلة الشراء والدفع السريع)              │  │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                        │  │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐ │  │
│  │  │ [💳 Mada / مدى ]        │  │ [🍏 Apple Pay / أبل باي]│  │ [📱 STC Pay / إس تي سي ] │ │  │
│  │  │ Status: [ ● ACTIVE ]    │  │ Status: [ ● ACTIVE ]    │  │ Status: [ ● ACTIVE ]    │ │  │
│  │  │ Fee: 1.0% + 1 SAR       │  │ Fee: Standard Mada/Visa │  │ Fee: 1.5%               │ │  │
│  │  │ [ ⚙️ Configure Settings ]│  │ [ ⚙️ Domain Certificate ]│  │ [ ⚙️ API Credentials ]  │ │  │
│  │  └─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘ │  │
│  │                                                                                        │  │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐ │  │
│  │  │ [🛍️ Tamara / تمارا ]     │  │ [✨ Tabby / تابي ]       │  │ [🏦 Saudi IBAN / البنك ]│ │  │
│  │  │ Split in 4 Installments │  │ Pay in 4 Interest-Free  │  │ Al Rajhi / SNB Verified │ │  │
│  │  │ Status: [ ● ACTIVE ]    │  │ Status: [ ● ACTIVE ]    │  │ Status: [ ● ACTIVE ]    │ │  │
│  │  │ [ ⚙️ Tamara Setup Modal ]│  │ [ ⚙️ Merchant Token ]   │  │ [ ➕ Add Bank Account ] │ │  │
│  │  └─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📑 Bank Transfer Proofs Verification (مراجعة واعتماد إيصالات التحويل البنكي)            │  │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤  │
│  │ Order #1042 · Customer: سارة العتيبي · Bank: الراجحي · Amount: 450.00 ر.س · [ 👁️ Receipt]│  │
│  │ Actions: [ ✓ Approve & Mark Paid (اعتماد وتأكيد الدفع) ]  [ ✕ Reject Proof (رفض الإيصال) ]│
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Comprehensive Payment Methods Breakdown / تفصيل طرق الدفع

| Payment Method / وسيلة الدفع | Type / النوع | Settlement / دورة التسوية | Requirement / المتطلبات | Impact on Sales / الأثر البيعي |
|-----------------------------|--------------|---------------------------|-------------------------|--------------------------------|
| **Mada (مدى)** | National Debit | T+1 Business Day | Commercial Register / Freelance Doc | يغطي أكثر من 70% من عمليات الشراء الإلكتروني في السعودية. |
| **Apple Pay** | Digital Wallet | Same as Card | HTTPS Domain + Apple Merchant Cert | يضاعف سرعة إتمام الطلب في ثوانٍ معدودة عبر الجوال وأجهزة Mac. |
| **Visa / MasterCard** | Credit Cards | T+2 Business Days | Payment Gateway Secret Key | يخدم المشترين الدوليين وحاملي البطاقات الائتمانية ومكافآت السفر. |
| **STC Pay** | Saudi e-Wallet | Instant to T+1 | STC Pay Merchant ID | وسيلة مفضلة لملايين مستخدمي الاتصالات السعودية ومحفظة STC. |
| **Tamara (تمارا)** | BNPL Installment | T+2 Business Days | Tamara Merchant API Key & Token | يقسم الفاتورة على 3 أو 4 دفعات بدون فوائد، ويرفع متوسط قيمة السلة بـ 45%. |
| **Tabby (تابي)** | BNPL Installment | T+2 Business Days | Tabby Secret & Public Keys | يتيح الدفع لاحقاً بدون رسوم إضافية على العميل ويزيد المبيعات. |
| **Bank Transfer (التحويل البنكي)**| Manual Wire | Direct to Bank | Saudi IBAN (SA...) + Bank Name | مثالي لطلبات الجملة والمبالغ الكبيرة مع رفع صورة إيصال التحويل. |
| **Cash on Delivery (COD)** | Cash Collection | Upon Courier Return | Courier COD Contract | خيار متاح للعملاء الذين يفضلون الدفع نقداً عند باب المنزل. |

---

## 🛠️ Step-by-Step Payment Integration / خطوات تفعيل بوابات الدفع

### الخطوة 1: الدخول إلى إدارة المدفوعات
1. من لوحة التاجر، اذهب إلى **الإعدادات (Settings)** > واضغط على بطاقة **المدفوعات والحساب البنكي (Payments & Bank Account)**.

### الخطوة 2: تفعيل بوابات الدفع الإلكتروني (مدى وأبل باي)
1. اختر بوابة الدفع المعتمدة لمتجرك (مثل مويسر Moyasar أو Tap أو Geidea).
2. أدخل المفتاح السري (Secret Key) والمفتاح العام (Publishable Key).
3. فعّل مفتاح **مدى** ومفتاح **Apple Pay**.
4. يقوم النظام تلقائياً بتوثيق ملف النطاق لشركة أبل (`/.well-known/apple-developer-merchantid-domain-association`).

### الخطوة 3: تفعيل خدمة التقسيط عبر تمارا (Tamara Setup)
1. في بطاقة تمارا، اضغط على زر **إعدادات تمارا (Tamara Gateway Modal)**.
2. أدخل مفتاح الربط (`Tamara Merchant Token`) وبيئة العمل (`Live` أو `Sandbox`).
3. حدد الحد الأدنى للتقسيط (مثال: `100 ر.س`) والحد الأقصى (مثال: `3000 ر.س`).
4. اضغط حفظ؛ ستظهر شارة تمارا الترويجية فوراً أسفل أسعار المنتجات في متجرك.

### الخطوة 4: إضافة الحساب البنكي الرسمي وتعيين الآيبان (IBAN)
1. اضغط على زر **إضافة حساب بنكي (Add Bank Account)**.
2. اختر اسم البنك (مثل: مصرف الراجحي، البنك الأهلي السعودي، بنك الرياض).
3. أدخل رقم الآيبان الكامل بصيغة: `SA0000000000000000000000`.
4. اكتب اسم المستفيد كما هو مسجل في البنك، وفعّل خيار الحساب الافتراضي.

### الخطوة 5: مراجعة واعتماد إيصالات التحويل البنكي
1. عند اختيار العميل للتحويل البنكي، يدخل الطلب في حالة `بانتظار مراجعة التحويل`.
2. من جدول مراجعة الإيصالات، اضغط على أيقونة **معاينة الإيصال (Receipt)** لفحص صورة الحوالة.
3. اضغط على **اعتماد (Approve)** ليتحول الطلب فورياً إلى حالة `مدفوع` وتبدأ عملية التجهيز والشحن، أو اضغط **رفض (Reject)** مع ذكر السبب في حال عدم وصول المبلغ.

---

## 💡 Pro-Tips / نصائح احترافية للمدفوعات

> [!TIP]
> **تفعيل أبل باي وتمارا معاً:**
> توفير خيار أبل باي مع خدمة تمارا يغطي رغبات 92% من المتسوقين في السعودية، ويقلل من نسبة السلات المتروكة (Abandoned Carts) إلى أدنى معدلاتها.

---

## ❓ FAQ / الأسئلة الشائعة

#### س1: أين تذهب أموال مبيعات المتجر عند الدفع عبر مدى أو أبل باي؟
**الجواب:** يتم إيداع الأموال مباشرة في حسابك البنكي التجاري المسجل لدى بوابة الدفع (وفق دورة التسوية اليومية أو الأسبوعية الخاصة بالبوابة) دون أي تدخل أو احتجاز من المنصة.

#### Q2: Can I test payments without using real money?
**Answer:** Yes, you can toggle the gateway environment to **Sandbox / Test Mode** and simulate transactions using official test cards for Mada, Visa, and Tamara before switching to Live mode.
