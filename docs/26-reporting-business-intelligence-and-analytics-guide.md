# 26 · Reporting, Business Intelligence & Analytics Manual (Bilingual: EN / AR)
# دليل التقارير والتحليلات وذكاء الأعمال (باللغتين الإنجليزية والعربية)

**Canonical Reference:** `docs/00` · `docs/01` (Phase 3.11 / 5.4 / 6.8) · `docs/04`  
**Scope:** Master Platform Reports · Store Business Reports · Sales & Tax Analytics · Inventory · Customers · Channel Attribution  
**Status:** Locked Specification & Standard Operating Procedure (SOP)  

---

## 1. Executive Overview / نظرة عامة تنفيذيـة

### 🇬🇧 English:
The Reporting and Business Intelligence engine delivers mission-critical insights across the multi-tenant SaaS ecosystem. Master Administrators oversee platform-wide subscription health, transaction volumes, and aggregate GMV (Gross Merchandise Value), while Store Administrators access fine-grained reports for sales, products, inventory valuation, customer cohorts, and tax compliance (including Saudi ZATCA VAT 15% breakdown).

### 🇸🇦 العربية:
يوفر محرك التقارير وذكاء الأعمال (BI & Analytics) رؤى تحليلية دقيقة وشاملة لمنظومة SaaS متعددة المتاجر. يتيح النظام لـ "المشرف العام" (Master Admin) مراقبة نمو الاشتراكات وحجم المعاملات المالية الإجمالي (GMV)، بينما يمنح "أصحاب المتاجر" (Store Admins) تقارير تفصيلية للمبيعات، والأرباح، والضرائب (بما يتوافق مع هيئة الزكاة والضريبة والجمارك ZATCA بنسبة 15%)، وحركة المخزون، وسلوك العملاء.

---

## 2. Reporting Architecture & Data Scope / هيكلية التقارير ونطاق البيانات

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MASTER ADMIN INTELLIGENCE                       │
│  - Multi-Store GMV & Platform Revenue                                  │
│  - Active Stores, Growth Rate, Plan Subscriptions & Churn               │
│  - Global Payment Gateway Volumes & Server Resource Health             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│     STORE A REPORTS (store_id)    │ │     STORE B REPORTS (store_id)    │
│ - Sales & Revenue (Net, VAT, Ship)│ │ - Sales & Revenue (Net, VAT, Ship)│
│ - Orders & Fulfillment Status     │ │ - Orders & Fulfillment Status     │
│ - Product Performance & Inventory │ │ - Product Performance & Inventory │
│ - Customer Lifetime Value (CLV)   │ │ - Customer Lifetime Value (CLV)   │
│ - Traffic & Channel Attribution   │ │ - Traffic & Channel Attribution   │
└───────────────────────────────────┘ └───────────────────────────────────┘
```

---

## 3. Core Report Types / أنواع التقارير الأساسية

### 🇬🇧 Report Types Catalog:
| Report Type | Key Metrics Included | Business Purpose |
|---|---|---|
| **1. Sales & Revenue** | Gross Sales, Net Sales, Discounts Applied, VAT (15%), Shipping Fees, Refunds, Net Profit. | Financial reconciliation, bookkeeping, and tax reporting. |
| **2. Orders & Fulfillment** | Total Orders, Pending, Processing, Shipped, Delivered, Cancelled, Return Rate. | Operations monitoring, courier SLAs, and delivery efficiency. |
| **3. Inventory & Products** | Current Stock Value, Low Stock Alerts, Out-of-Stock Items, Best Sellers, Dead Stock. | Supply chain forecasting, procurement, and stock replenishment. |
| **4. Customer Intelligence** | New vs Returning Customers, Average Order Value (AOV), Customer Lifetime Value (CLV), Top Spenders. | Retention strategies, loyalty programs, and VIP segmentation. |
| **5. Channel Performance** | Traffic by Channel (Direct, Organic, Social, Paid, WhatsApp, Referral), Conversion Rate. | Marketing budget allocation and ROAS calculation. |

### 🇸🇦 دليل أنواع التقارير:
| نوع التقرير | المؤشرات والمقاييس الرئيسية | الهدف التشغيلي والمالي |
|---|---|---|
| **1. المبيعات والإيرادات** | إجمالي المبيعات، صافي المبيعات، الخصومات المطبقة، ضريبة القيمة المضافة (15%)، رسوم الشحن، المبالغ المسترجعة، صافي الربح. | التدقيق المالي، مسك الدفاتر، والإقرارات الضريبية. |
| **2. الطلبات والشحن** | إجمالي الطلبات، قيد الانتظار، جاري التجهيز، تم الشحن، تم التوصيل، الطلبات الملغاة، نسبة المرتجعات. | مراقبة العمليات وكفاءة شركات الشحن والتوصيل. |
| **3. المنتجات والمخزون** | إجمالي قيمة المخزون، تنبيهات المنتجات منخفضة المخزون، المنتجات النافذة، الأكثر مبيعاً، المنتجات الراكدة. | تخطيط التوريد وإعادة طلب المنتجات في الوقت المناسب. |
| **4. سلوك وتحليلات العملاء** | العملاء الجدد مقابل العائدين، متوسط قيمة الطلب (AOV)، القيمة الدائمة للعميل (CLV)، كبار المشترين. | خطط الولاء، العروض المخصصة، والحفاظ على العملاء. |
| **5. أداء القنوات التسويقية** | مصادر الزيارات (مباشر، محركات بحث، تواصل اجتماعي، إعلانات ممولة، واتساب)، معدل التحويل. | تقييم كفاءة الميزانيات الإعلانية وعائد الإنفاق (ROAS). |

---

## 4. Sales & Tax Financial Breakdown (ZATCA VAT 15%) / تفصيل المبيعات وضريبة القيمة المضافة

### 🇬🇧 Sales Calculation Formulas:
$$\text{Gross Sales} = \sum (\text{Product Price} \times \text{Quantity})$$
$$\text{Net Sales} = \text{Gross Sales} - \text{Discounts} - \text{Refunds}$$
$$\text{VAT (15\%)} = \text{Taxable Subtotal} \times 0.15$$
$$\text{Grand Total (Cash Inflow)} = \text{Net Sales} + \text{VAT} + \text{Shipping Charge}$$

### 🇸🇦 معادلات الاحتساب المالي والضريبي:
$$\text{إجمالي المبيعات} = \sum (\text{سعر المنتج} \times \text{الكمية})$$
$$\text{صافي المبيعات} = \text{إجمالي المبيعات} - \text{الخصومات} - \text{المرتجعات}$$
$$\text{ضريبة القيمة المضافة (15\%)} = \text{المبلغ الخاضع للضريبة} \times 0.15$$
$$\text{المبلغ الإجمالي النهائي} = \text{صافي المبيعات} + \text{الضريبة} + \text{تكلفة الشحن}$$

---

## 5. Date Range Filters & Comparison / فلاتر الفترات الزمنية والمقارنة

### 🇬🇧 English:
All analytics widgets support rapid multi-range filtering without full-page reloads:
- **Today** / **Yesterday**
- **Last 7 Days** / **Last 30 Days**
- **This Month** / **Previous Month**
- **Year to Date (YTD)**
- **Custom Range Selector** (with Datepicker `From Date` → `To Date`)
- **Period-over-Period Comparison:** Compare current period with previous equivalent period to display growth badges (`+14.2%` / `-3.5%`).

### 🇸🇦 العربية:
تدعم لوحات التقارير والرسوم البيانية فلترة زمنية سريعة ولحظية دون الحاجة لإعادة تحميل الصفحة:
- **اليوم** / **الأمس**
- **آخر 7 أيام** / **آخر 30 يوماً**
- **هذا الشهر** / **الشهر السابق**
- **من بداية العام وحتى تاريخه (YTD)**
- **تحديد فترة مخصصة** (اختيار تاريخ البداية والنهاية عبر التقويم)
- **مقارنة الفترات الزمنية:** مقارنة نتائج الفترة الحالية بالفترة السابقة لتوضيح نسب النمو والتراجع (`+14.2%` / `-3.5%`).

---

## 6. Exporting & Scheduled Reports / تصدير التقارير والجدولة الآلية

### 🇬🇧 Supported Export Formats:
1. **Excel Workbook (`.xlsx`):** Multi-tab formatted spreadsheet containing Raw Data, Pivot Summaries, and Category Breakdown.
2. **Comma-Separated Values (`.csv`):** Optimized for database imports, ERPs, or accounting tools (e.g., QuickBooks, Zoho Books, Odoo).
3. **Printable PDF Summary (`.pdf`):** Formal report containing branded header, executive charts, tax summary, and signature block.

### 🇸🇦 صيغ التصدير المدعومة:
1. **ملف إكسيل مرمز (`.xlsx`):** مصنف تفاعلي يتضمن البيانات الخام والجداول المحورية وتحليل الأقسام.
2. **ملف مفصول بفواصل (`.csv`):** مهيأ للربط مع برامج المحاسبة وأنظمة ERP (مثل قيود، ودفترة، وأودو، وQuickBooks).
3. **تقرير PDF رسمي للطباعة (`.pdf`):** وثيقة رسمية تتضمن شعار المتجر، والرسوم البيانية، وتفاصيل الضرائب والإقرارات المالية.

---

## 7. Operational Best Practices / أفضل الممارسات التشغيلية

### 🇬🇧 English:
- **Daily Reconciliation:** Store Managers should reconcile daily orders with payment gateway settlements at the close of every business day.
- **Weekly Stock Audit:** Review low-stock reports every Sunday to maintain optimal reorder points.
- **Monthly Tax Filing:** Export the 15% VAT breakdown report on the 1st of each calendar month for ZATCA tax submissions.

### 🇸🇦 العربية:
- **المطابقة اليومية:** مراجعة إجمالي الطلبات اليومية ومطابقتها مع دفعات بوابات الدفع الإلكتروني بنهاية كل يوم عمل.
- **الجرد الأسبوعي للمخزون:** مراجعة تقرير المنتجات منخفضة الكمية كل بداية أسبوع لجدولة التوريد والشراء.
- **الإقرار الضريبي الشهري:** تصدير كشف ضريبة القيمة المضافة (15%) في أول كل شهر ميلادي لتقديمه في إقرار هيئة الزكاة والضريبة.
